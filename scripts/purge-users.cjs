'use strict';

/*
 Purge all accounts with role 'user'.
 - Hard-deletes users from Supabase Auth (admin API)
 - Relies on ON DELETE CASCADE to remove dependent rows (profiles, points, qr_identities, point_history, temp passwords, vendor_scan_logs, notifications)
 - Proactively nulls vendor_codes.created_by to avoid FK constraint (no cascade on that FK)
 - Supports excluding specific emails from purge.

 Usage:
   pnpm run purge:users -- --dry-run                    # Show counts only
   pnpm run purge:users -- --yes                        # Execute destructive purge
   pnpm run purge:users -- --yes --batch 50             # Optional batch size (default 50)
   pnpm run purge:users -- --dry-run --exclude a@x.com,b@y.com
   pnpm run purge:users -- --yes --exclude-file ./exclusions.txt

 Env:
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   PURGE_CONFIRM=YES                 # optional alternative to --yes
   PURGE_EXCLUDE_EMAILS=a@x.com,b@y.com  # optional, comma separated
*/

require('dotenv').config({
  path: './.env.local',
});
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function parseArgs(argv) {
  const args = {
    dryRun: false,
    yes: false,
    batch: 50,
    exclude: '',
    excludeFile: '',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--yes') args.yes = true;
    else if (a === '--batch') {
      const v = Number(argv[i + 1]);
      if (!Number.isNaN(v) && v > 0) args.batch = v;
      i++;
    } else if (a === '--exclude') {
      args.exclude = String(argv[i + 1] || '');
      i++;
    } else if (a === '--exclude-file') {
      args.excludeFile = String(argv[i + 1] || '');
      i++;
    }
  }
  if (process.env.PURGE_CONFIRM === 'YES') args.yes = true;
  return args;
}

function buildExclusionSet(args) {
  const set = new Set();
  const addEmail = (e) => {
    const v = String(e || '')
      .trim()
      .toLowerCase();
    if (v) set.add(v);
  };
  const fromEnv = process.env.PURGE_EXCLUDE_EMAILS || '';
  const fromArg = args.exclude || '';
  const filePath = args.excludeFile || '';
  if (fromEnv) fromEnv.split(',').forEach(addEmail);
  if (fromArg) fromArg.split(',').forEach(addEmail);
  if (filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      content
        .split(/\r?\n/g)
        .map((l) => l.split('#')[0])
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach(addEmail);
    } catch (e) {
      console.error('Warning: failed to read --exclude-file:', e.message);
    }
  }
  return set;
}

async function listUserRoleUsers(supabase) {
  const pageSize = 1000;
  let from = 0;
  const users = [];
  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,role')
      .eq('role', 'user')
      .range(from, from + pageSize - 1);

    if (error) throw new Error('Failed to query profiles: ' + error.message);
    if (!data || data.length === 0) break;

    for (const row of data) {
      users.push({ id: row.id, email: row.email || '' });
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return users;
}

async function nullVendorCreators(supabase, ids) {
  if (ids.length === 0) return;
  // Avoid FK blockage on vendor_codes.created_by when deleting profiles
  const { error } = await supabase
    .from('vendor_codes')
    .update({ created_by: null })
    .in('created_by', ids);
  if (error)
    throw new Error('Failed to null vendor_codes.created_by: ' + error.message);
}

async function deleteUsersIndividually(supabase, ids, batch) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += batch)
    chunks.push(ids.slice(i, i + batch));
  let deleted = 0;
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (id) => {
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) {
          // Continue but report the failure; FK conflicts should be mitigated already
          console.error('Delete failed for', id, '-', error.message);
        } else {
          deleted += 1;
        }
      }),
    );
    console.log(`Progress: ${deleted}/${ids.length} users deleted...`);
  }
  return deleted;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const excludeSet = buildExclusionSet(args);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.',
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('Scanning for profiles with role = "user"...');
  const users = await listUserRoleUsers(supabase);
  console.log(`Found ${users.length} users with role 'user'.`);
  if (users.length > 0) {
    console.log('Sample (first 10 emails):');
    console.log(
      users
        .slice(0, 10)
        .map((u) => ` - ${u.email}`)
        .join('\n'),
    );
  }
  if (excludeSet.size > 0) {
    console.log(
      `Exclusions active: ${excludeSet.size} email(s) will be skipped.`,
    );
  }

  const filtered = users.filter(
    (u) =>
      !excludeSet.has(
        String(u.email || '')
          .trim()
          .toLowerCase(),
      ),
  );
  const excludedCount = users.length - filtered.length;
  if (excludedCount > 0) {
    console.log(`Excluding ${excludedCount} user(s) by email.`);
  }
  const ids = filtered.map((u) => u.id);

  if (args.dryRun) {
    console.log('Dry run complete. No deletions performed.');
    return;
  }

  if (!args.yes) {
    console.error(
      'Refusing to run without confirmation. Re-run with --yes or set PURGE_CONFIRM=YES',
    );
    process.exit(1);
  }

  if (ids.length === 0) {
    console.log('No users to delete.');
    return;
  }

  console.log(
    'Nulling vendor_codes.created_by for affected users (to avoid FK constraints)...',
  );
  await nullVendorCreators(supabase, ids);

  console.log('Deleting users via Supabase Auth admin API (hard delete)...');
  const deleted = await deleteUsersIndividually(supabase, ids, args.batch);
  console.log(`Done. Deleted ${deleted}/${ids.length} users.`);
}

main().catch((err) => {
  console.error('Purge failed:', err.message);
  process.exit(1);
});
