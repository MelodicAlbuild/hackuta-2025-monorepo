'use strict';

require('dotenv').config({ path: './.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TABLE_NAME = 'interest-form';
const DEFAULT_BATCH_SIZE = 1000;
const PRIVILEGED_ROLES = ['volunteer', 'admin', 'super-admin'];
const COLUMNS = [
  'id',
  'created_at',
  'firstName',
  'lastName',
  'age',
  'phoneNumber',
  'email',
  'school',
  'levelOfStudy',
  'countryOfResidence',
  'linkedInUrl',
  'dietaryRestrictions',
  'underRepresentedGroup',
  'genderIdentity',
  'pronouns',
  'raceOrEthnicity',
  'lgbtqiaPlus',
  'completedEducation',
  'tShirtSize',
  'shippingAddress',
  'majorFieldOfStudy',
  'codeOfConduct',
  'mlhDataHandling',
  'mlhPromotionalEmails',
  'status',
  'resume',
];

function parseArgs(argv) {
  const args = {
    outFile: '',
    stdout: false,
    batch: DEFAULT_BATCH_SIZE,
    help: false,
    exclude: '',
    excludeFile: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--out':
      case '--outfile':
      case '-o': {
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          args.outFile = next;
          i += 1;
        }
        break;
      }
      case '--stdout':
        args.stdout = true;
        break;
      case '--batch': {
        const next = Number(argv[i + 1]);
        if (!Number.isNaN(next) && next > 0) {
          args.batch = Math.min(next, 2000);
        }
        i += 1;
        break;
      }
      case '--exclude': {
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          args.exclude = next;
          i += 1;
        }
        break;
      }
      case '--exclude-file': {
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          args.excludeFile = next;
          i += 1;
        }
        break;
      }
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        break;
    }
  }

  return args;
}

function printHelp() {
  const lines = [
    `Export all rows from the "${TABLE_NAME}" table to CSV.`,
    '',
    'Usage:',
    '  pnpm run interest-form:export [-- --out ./path/to/file.csv] [--stdout] [--batch 1000]',
    '',
    'Options:',
    '  --out, --outfile, -o   Destination file path. Defaults to ./exports/interest-form-<timestamp>.csv',
    '  --stdout               Print CSV to stdout instead of writing a file',
    `  --batch                Fetch batch size (default ${DEFAULT_BATCH_SIZE}, max 2000)`,
    '  --exclude              Comma-separated list of emails to skip',
    '  --exclude-file         Path to newline-delimited email list (defaults to scripts/exclusions.txt if present)',
    '  --help                 Show this message',
    '',
    'Environment:',
    '  SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL',
    '  SUPABASE_SERVICE_ROLE_KEY',
    '  INTEREST_FORM_EXCLUDE_EMAILS  Optional comma-separated exclusion list',
    '',
    'The script reads variables from .env.local if present.',
  ];
  console.log(lines.join('\n'));
}

function resolveOutputPath(outFile) {
  if (!outFile) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..*/, '');
    return path.join(
      process.cwd(),
      'exports',
      `interest-form-${timestamp}.csv`,
    );
  }
  return path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile);
}

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function buildExclusionSet(args) {
  const set = new Set();
  const sources = [];
  const addEmail = (value) => {
    const email = normalizeEmail(value);
    if (email) set.add(email);
  };

  const fromEnv = process.env.INTEREST_FORM_EXCLUDE_EMAILS || '';
  const fromArgs = args.exclude || '';
  const defaultFile = path.join(process.cwd(), 'scripts', 'exclusions.txt');
  const suppliedFile = args.excludeFile
    ? path.isAbsolute(args.excludeFile)
      ? args.excludeFile
      : path.join(process.cwd(), args.excludeFile)
    : '';

  if (fromEnv) fromEnv.split(',').forEach(addEmail);
  if (fromArgs) fromArgs.split(',').forEach(addEmail);

  const candidates = [];
  if (suppliedFile) candidates.push(suppliedFile);
  candidates.push(defaultFile);

  for (const filePath of candidates) {
    if (!filePath || !fs.existsSync(filePath)) continue;
    sources.push(filePath);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      content
        .split(/\r?\n/g)
        .map((line) => line.split('#')[0])
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach(addEmail);
    } catch (err) {
      console.error(
        'Warning: failed to read exclusion file:',
        filePath,
        err.message,
      );
    }
  }

  return { set, sources };
}

function filterRows(rows, exclusionSet) {
  if (!rows?.length || exclusionSet.size === 0) return rows;

  return rows.filter((row) => !exclusionSet.has(normalizeEmail(row?.email)));
}

async function fetchPrivilegedEmails(supabase) {
  const emails = new Set();
  const pageSize = 1000;
  let from = 0;

  const addEmail = (value) => {
    const normalized = normalizeEmail(value);
    if (normalized) emails.add(normalized);
  };

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('profiles')
      .select('email,role')
      .in('role', PRIVILEGED_ROLES)
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to load privileged profiles: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    data.forEach((row) => addEmail(row?.email));

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return emails;
}

function formatCell(column, raw) {
  if (raw === null || raw === undefined) return '';

  let value = raw;
  if (column === 'created_at') {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!Number.isNaN(date?.getTime?.())) {
      value = date.toISOString();
    }
  } else if (value instanceof Date) {
    value = value.toISOString();
  } else if (typeof value === 'boolean') {
    value = value ? 'true' : 'false';
  } else if (typeof value === 'number') {
    value = String(value);
  } else {
    value = String(value);
  }

  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

function rowToCsv(row) {
  return COLUMNS.map((column) =>
    formatCell(column, row ? row[column] : undefined),
  ).join(',');
}

function rowsToCsv(rows) {
  const lines = [];
  lines.push(COLUMNS.map((column) => `"${column}"`).join(','));
  rows.forEach((row) => {
    lines.push(rowToCsv(row));
  });
  return lines.join('\n');
}

async function fetchAllRows(supabase, batchSize) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + batchSize - 1;
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch rows: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  return rows;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.error(
      'Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.',
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false },
  });

  console.log(`Fetching rows from \"${TABLE_NAME}\"...`);
  const rows = await fetchAllRows(supabase, args.batch);
  console.log(`Fetched ${rows.length} row(s).`);

  const { set: exclusions, sources: exclusionSources } =
    buildExclusionSet(args);
  const manualExclusionCount = exclusions.size;
  if (manualExclusionCount > 0) {
    console.log(`Loaded ${manualExclusionCount} email exclusion(s).`);
    if (exclusionSources.length > 0) {
      console.log('  Sources:');
      exclusionSources.forEach((src) => console.log(`   - ${src}`));
    }
  }

  const privilegedEmails = await fetchPrivilegedEmails(supabase);
  const privilegedCount = privilegedEmails.size;
  if (privilegedCount > 0) {
    console.log(
      `Auto-excluding ${privilegedCount} email(s) with roles: ${PRIVILEGED_ROLES.join(', ')}`,
    );
  }
  const beforeMerge = exclusions.size;
  privilegedEmails.forEach((email) => exclusions.add(email));
  const newlyAddedPrivileged = exclusions.size - beforeMerge;
  if (privilegedCount > 0 && newlyAddedPrivileged < privilegedCount) {
    console.log(
      `  (${privilegedCount - newlyAddedPrivileged} already covered by manual exclusions)`,
    );
  }

  const filteredRows = filterRows(rows, exclusions);
  const excludedCount = rows.length - filteredRows.length;
  if (excludedCount > 0) {
    console.log(`Filtered out ${excludedCount} row(s) via exclusions.`);
  }

  const csv = rowsToCsv(filteredRows);

  if (args.stdout) {
    process.stdout.write(csv);
    if (!csv.endsWith('\n')) process.stdout.write('\n');
    return;
  }

  const destination = resolveOutputPath(args.outFile);
  ensureDirectory(destination);
  fs.writeFileSync(destination, csv, 'utf8');
  console.log(`CSV written to ${destination}`);
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
