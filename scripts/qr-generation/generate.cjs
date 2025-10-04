'use strict';

require('dotenv').config({ path: './.env.local' });
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_COUNT = 500;
const ADMIN_ROLES = ['admin', 'super-admin'];
const VOLUNTEER_ROLE = 'volunteer';
const OUTPUT_ROOT = path.join(
  process.cwd(),
  'scripts',
  'qr-generation',
  'output',
);

function parseArgs(argv) {
  const args = {
    count: DEFAULT_COUNT,
    outputDir: '',
    includeGeneral: true,
    includeAdmins: true,
    includeVolunteers: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--count': {
        const next = Number(argv[i + 1]);
        if (!Number.isNaN(next) && next > 0) {
          args.count = Math.min(Math.trunc(next), 5000);
        }
        i += 1;
        break;
      }
      case '--output':
      case '--out':
      case '-o': {
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          args.outputDir = next;
          i += 1;
        }
        break;
      }
      case '--volunteers':
      case '--volunteers-file': {
        console.warn(
          '[DEPRECATED] --volunteers/--volunteers-file is no longer required; volunteers are now auto-discovered by role. Argument ignored.',
        );
        break;
      }
      case '--no-general':
        args.includeGeneral = false;
        break;
      case '--no-admins':
        args.includeAdmins = false;
        break;
      case '--no-volunteers':
        args.includeVolunteers = false;
        break;
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
  console.log(
    [
      'Generate QR code PNG files for general admission and staff roles.',
      '',
      'Usage:',
      '  pnpm run qr:generate -- [options]',
      '',
      'Options:',
      '  --count <n>              Number of general QR tokens to generate (default 500)',
      '  --out, --output <dir>    Output directory (defaults to scripts/qr-generation/output/<timestamp>)',
      '  (volunteers file no longer needed; volunteers auto-detected by role)',
      '  --no-general             Skip generating general PNGs',
      '  --no-admins              Skip admin / super-admin PNGs',
      '  --no-volunteers          Skip volunteer PNGs (even if file provided)',
      '  --help                   Show this help message',
      '',
      'Environment:',
      '  SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL',
      '  SUPABASE_SERVICE_ROLE_KEY',
      '',
      'The script saves PNGs and companion CSV/JSON exports into the output directory.',
    ].join('\n'),
  );
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toRelativePath(basePath, targetPath) {
  return path.relative(basePath, targetPath).split(path.sep).join('/');
}

function normalizeForFilename(value, options = {}) {
  const { allowAtDot = false, fallback = 'value' } = options;
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  const pattern = allowAtDot ? /[^a-z0-9@.\-]+/g : /[^a-z0-9\-]+/g;
  const sanitized = normalized
    .replace(pattern, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return sanitized || fallback;
}

function formatTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\..*/, '');
}

function resolveOutputDir(args) {
  if (args.outputDir) {
    return path.isAbsolute(args.outputDir)
      ? args.outputDir
      : path.join(process.cwd(), args.outputDir);
  }
  return path.join(OUTPUT_ROOT, `run-${formatTimestamp()}`);
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function loadEmailsFile(filePath) {
  if (!filePath) return [];
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.warn('Volunteer file not found, skipping:', resolved);
    return [];
  }
  const content = fs.readFileSync(resolved, 'utf8');
  const emails = new Set();
  content
    .split(/\r?\n/g)
    .map((line) => line.split('#')[0])
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const email = normalizeEmail(line);
      if (email) emails.add(email);
    });
  return Array.from(emails.values());
}

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

async function fetchProfilesByRoles(supabase, roles) {
  if (!roles?.length) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,role')
    .in('role', roles)
    .order('email', { ascending: true });
  if (error) {
    throw new Error(
      `Failed to load profiles for roles ${roles.join(', ')}: ${error.message}`,
    );
  }
  return (data || []).filter((row) => row?.id && row?.email);
}

async function fetchProfilesByEmails(supabase, emails) {
  if (!emails?.length) return [];
  const batches = chunkArray(emails, 100);
  const profiles = [];
  for (const batch of batches) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,role')
      .in('email', batch);
    if (error) {
      throw new Error(`Failed to load profiles by email: ${error.message}`);
    }
    profiles.push(...(data || []).filter((row) => row?.id && row?.email));
  }
  return profiles;
}

async function fetchQrTokensByUserIds(supabase, userIds) {
  const map = new Map();
  if (!userIds?.length) return map;
  const batches = chunkArray(userIds, 100);
  for (const batch of batches) {
    const { data, error } = await supabase
      .from('qr_identities')
      .select('user_id,qr_token,sign_up_token')
      .in('user_id', batch);
    if (error) {
      throw new Error(`Failed to load qr_identities: ${error.message}`);
    }
    (data || []).forEach((row) => {
      if (!row?.user_id) return;
      if (!map.has(row.user_id)) {
        map.set(row.user_id, {
          qr_token: row.qr_token ?? null,
          sign_up_token: row.sign_up_token ?? null,
        });
      }
    });
  }
  return map;
}

function chunkArray(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function writeCsv(filePath, rows, header) {
  const lines = [];
  if (header?.length) {
    lines.push(header.join(','));
  }
  rows.forEach((row) => {
    lines.push(row.map((value) => JSON.stringify(value ?? '')).join(','));
  });
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

async function buildQrBuffers(values, options = {}) {
  const { errorCorrection = 'M', qrPixelSize = 512, margin = 1 } = options;
  const results = [];
  for (const value of values) {
    const buffer = await QRCode.toBuffer(value, {
      errorCorrectionLevel: errorCorrection,
      type: 'png',
      margin,
      width: qrPixelSize,
    });
    results.push({ value, buffer });
  }
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const outputDir = resolveOutputDir(args);
  const generalDir = path.join(outputDir, 'general');
  const adminsDir = path.join(outputDir, 'admins');
  const volunteersDir = path.join(outputDir, 'volunteers');
  ensureDir(outputDir);
  ensureDir(generalDir);
  ensureDir(adminsDir);
  ensureDir(volunteersDir);

  const supabase = createSupabaseClient();
  console.log('Output directory:', outputDir);

  const summary = {
    general: { count: 0, csv: '', json: '', imagesDir: '', images: [] },
    admins: { count: 0, files: [], entries: [], directory: '' },
    volunteers: [],
  };

  if (args.includeGeneral && args.count > 0) {
    console.log(`Generating ${args.count} general QR tokens...`);
    const tokens = Array.from({ length: args.count }, () => randomUUID());
    const qrEntries = await buildQrBuffers(tokens, { qrPixelSize: 512 });

    const csvPath = path.join(generalDir, 'general-tokens.csv');
    const jsonPath = path.join(generalDir, 'general-tokens.json');
    const imagesDir = path.join(generalDir, 'png');
    ensureDir(imagesDir);
    const imagePaths = [];

    writeCsv(
      csvPath,
      qrEntries.map((entry, index) => [index + 1, entry.value]),
      ['index', 'token'],
    );
    writeJson(
      jsonPath,
      qrEntries.map((entry) => entry.value),
    );

    qrEntries.forEach((entry) => {
      const fileName = `${entry.value}-qr.png`;
      const destPath = path.join(imagesDir, fileName);
      fs.writeFileSync(destPath, entry.buffer);
      imagePaths.push(toRelativePath(outputDir, destPath));
    });

    summary.general = {
      count: qrEntries.length,
      csv: toRelativePath(outputDir, csvPath),
      json: toRelativePath(outputDir, jsonPath),
      images: imagePaths,
      imagesDir: toRelativePath(outputDir, imagesDir),
    };
    console.log(`General token PNGs written to ${imagesDir}`);
  } else {
    console.log('Skipping general token generation.');
  }

  if (args.includeAdmins) {
    console.log('Fetching admin and super-admin QR tokens...');
    const profiles = await fetchProfilesByRoles(supabase, ADMIN_ROLES);
    const tokensMap = await fetchQrTokensByUserIds(
      supabase,
      profiles.map((p) => p.id),
    );

    const adminEntries = [];
    for (const profile of profiles) {
      const tokenRecord = tokensMap.get(profile.id);
      const tokenValue = tokenRecord?.sign_up_token || tokenRecord?.qr_token;
      if (!tokenValue) {
        console.warn(
          'No QR token/sign_up_token found for admin:',
          profile.email,
        );
        continue;
      }
      adminEntries.push({
        email: profile.email,
        role: profile.role,
        tokenValue,
        tokenSource: tokenRecord?.sign_up_token ? 'sign_up_token' : 'qr_token',
      });
    }

    if (adminEntries.length > 0) {
      const qrBuffers = await buildQrBuffers(
        adminEntries.map((entry) => entry.tokenValue),
      );
      qrBuffers.forEach((bufferEntry, index) => {
        adminEntries[index].buffer = bufferEntry.buffer;
        adminEntries[index].value = bufferEntry.value;
      });

      const imagePaths = [];
      adminEntries.forEach((entry) => {
        const emailSegment = normalizeForFilename(entry.email, {
          allowAtDot: true,
          fallback: 'admin',
        });
        const roleSegment = normalizeForFilename(entry.role || 'admin', {
          fallback: 'admin',
        });
        const fileName = `${emailSegment}-${roleSegment}-qr.png`;
        const destPath = path.join(adminsDir, fileName);
        fs.writeFileSync(destPath, entry.buffer);
        const relativePath = toRelativePath(outputDir, destPath);
        imagePaths.push(relativePath);
        summary.admins.entries.push({
          email: entry.email,
          role: entry.role,
          file: relativePath,
          tokenSource: entry.tokenSource,
        });
      });

      summary.admins.count = imagePaths.length;
      summary.admins.files = imagePaths;
      summary.admins.directory = toRelativePath(outputDir, adminsDir);
      console.log(`Created ${summary.admins.count} admin/super-admin PNG(s).`);
    } else {
      console.log('No admin QR codes generated.');
    }
  }

  if (args.includeVolunteers) {
    console.log('Fetching volunteer QR tokens by role...');
    const volunteerProfiles = await fetchProfilesByRoles(supabase, [
      VOLUNTEER_ROLE,
    ]);
    if (!volunteerProfiles.length) {
      console.log('No volunteer profiles found.');
    } else {
      const tokensMap = await fetchQrTokensByUserIds(
        supabase,
        volunteerProfiles.map((p) => p.id),
      );
      const volunteerEntries = [];
      for (const profile of volunteerProfiles) {
        const tokenRecord = tokensMap.get(profile.id);
        const tokenValue =
          tokenRecord?.sign_up_token || tokenRecord?.qr_token || null;
        if (!tokenValue) {
          console.warn(
            'No QR token/sign_up_token found for volunteer:',
            profile.email,
          );
          continue;
        }
        volunteerEntries.push({
          email: profile.email,
          role: profile.role || VOLUNTEER_ROLE,
          tokenValue,
          tokenSource: tokenRecord?.sign_up_token
            ? 'sign_up_token'
            : 'qr_token',
        });
      }

      const qrBuffers = await buildQrBuffers(
        volunteerEntries.map((entry) => entry.tokenValue),
      );

      qrBuffers.forEach((bufferEntry, index) => {
        volunteerEntries[index].buffer = bufferEntry.buffer;
        volunteerEntries[index].value = bufferEntry.value;
      });

      volunteerEntries.forEach((entry) => {
        const emailSegment = normalizeForFilename(entry.email, {
          allowAtDot: true,
          fallback: 'volunteer',
        });
        const roleSegment = normalizeForFilename(entry.role || VOLUNTEER_ROLE, {
          fallback: VOLUNTEER_ROLE,
        });
        const fileName = `${emailSegment}-${roleSegment}-qr.png`;
        const destPath = path.join(volunteersDir, fileName);
        fs.writeFileSync(destPath, entry.buffer);
        const relativePath = toRelativePath(outputDir, destPath);
        summary.volunteers.push({
          email: entry.email,
          role: entry.role,
          file: relativePath,
          tokenSource: entry.tokenSource,
        });
      });
      console.log(`Created ${volunteerEntries.length} volunteer PNG(s).`);
    }
  } else {
    console.log('Skipping volunteer PNGs by request.');
  }

  const summaryPath = path.join(outputDir, 'summary.json');
  writeJson(summaryPath, summary);
  console.log('Summary saved to', summaryPath);
  console.log('QR generation complete.');
}

main().catch((err) => {
  console.error('QR generation failed:', err);
  process.exit(1);
});
