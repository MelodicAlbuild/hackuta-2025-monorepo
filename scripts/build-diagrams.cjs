'use strict';

// Windows-friendly diagram build script
// Renders all .mmd files in docs/diagrams to PNG and SVG using Mermaid CLI (mmdc)

const { execFile } = require('child_process');
const { promisify } = require('util');
const { readdir, mkdir } = require('fs/promises');
const { join, basename } = require('path');

const execFileAsync = promisify(execFile);

const DIAGRAMS_DIR = join(__dirname, '..', 'docs', 'diagrams');
const OUT_DIR = join(DIAGRAMS_DIR, 'dist');

async function ensureOutDir() {
  try {
    await mkdir(OUT_DIR, { recursive: true });
  } catch (_) {}
}

function resolveMmdcPath() {
  const bin = join(process.cwd(), 'node_modules', '.bin');
  // Prefer explicit shim paths created by the package manager
  if (process.platform === 'win32') {
    return join(bin, 'mmdc.cmd');
  }
  return join(bin, 'mmdc');
}

async function renderDiagram(inputPath, type) {
  const name = basename(inputPath, '.mmd');
  const outPath = join(OUT_DIR, `${name}.${type}`);

  const args = [
    '-i',
    inputPath,
    '-o',
    outPath,
    '--backgroundColor',
    'transparent',
    '--quiet',
  ];

  // mermaid-cli installs an executable named `mmdc` into node_modules/.bin
  const mmdcPath = resolveMmdcPath();

  // On Windows, invoke through cmd.exe to avoid spawn EINVAL on .cmd
  if (process.platform === 'win32') {
    try {
      await execFileAsync('cmd.exe', ['/c', mmdcPath, ...args], {
        windowsHide: true,
      });
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      throw new Error(
        `mmdc failed (Windows): ${msg}\ncmd: cmd.exe /c ${mmdcPath} ${args.join(' ')}`,
      );
    }
  } else {
    try {
      await execFileAsync(mmdcPath, args, { windowsHide: true });
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      throw new Error(
        `mmdc failed: ${msg}\ncmd: ${mmdcPath} ${args.join(' ')}`,
      );
    }
  }
  return outPath;
}

async function main() {
  await ensureOutDir();
  const files = await readdir(DIAGRAMS_DIR);
  const mmdFiles = files.filter((f) => f.endsWith('.mmd'));

  if (mmdFiles.length === 0) {
    console.log('No .mmd files found in', DIAGRAMS_DIR);
    return;
  }

  console.log(`Rendering ${mmdFiles.length} Mermaid diagrams...`);

  for (const file of mmdFiles) {
    const inputPath = join(DIAGRAMS_DIR, file);
    // Render both PNG and SVG
    await renderDiagram(inputPath, 'png');
    await renderDiagram(inputPath, 'svg');
    console.log('Rendered:', file);
  }

  console.log('All diagrams rendered to', OUT_DIR);
}

main().catch((err) => {
  console.error('Failed to build diagrams:', err.message);
  process.exit(1);
});
