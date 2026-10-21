// Run a workspace's JavaScript CLI with Node instead of an executable .bin shim.
// Windows copies may lose executable permissions when transferred to Termux.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');

const [packageName, command, ...args] = process.argv.slice(2);
try {
  const workspaceRequire = createRequire(path.join(process.cwd(), 'package.json'));
  const manifestPath = workspaceRequire.resolve(`${packageName}/package.json`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[command];
  if (!bin) throw new Error(`CLI ${command} not found in ${packageName}`);
  const result = spawnSync(process.execPath, [path.resolve(path.dirname(manifestPath), bin), ...args], {
    stdio: 'inherit',
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.signal) {
    console.error(`${command} stopped by ${result.signal}`);
  }
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  console.error('Run npm ci --include=dev --include=optional from the project root.');
  process.exitCode = 1;
}
