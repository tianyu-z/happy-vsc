import { spawn } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const repoRoot = resolve(packageRoot, '..', '..');
const sourceTestPath = resolve(packageRoot, 'src/integration/extensionHost.test.ts');
const extensionEntryPath = resolve(packageRoot, 'src/extension.ts');
const extensionOutfilePath = resolve(packageRoot, 'dist/extension.cjs');

async function resolveCodeExecutable() {
  const candidates = [
    process.env.HAPPY_VSCODE_SMOKE_CODE_BIN,
    process.env.VSCODE_CWD
      ? join(process.env.VSCODE_CWD, 'Code.exe')
      : undefined,
    '/mnt/c/Program Files/VSCodium/VSCodium.exe',
    '/mnt/c/Program Files/VSCodium/bin/codium',
    'codium',
    'code',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.startsWith('/')) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    const resolved = await runCommand('bash', [
      '-lc',
      `command -v ${JSON.stringify(candidate)}`,
    ]);
    if (resolved.exitCode === 0) {
      const path = resolved.stdout.trim();
      if (path) {
        return path;
      }
    }
  }

  throw new Error(
    'Unable to find a VS Code executable. Set HAPPY_VSCODE_SMOKE_CODE_BIN to override.',
  );
}

async function toExecutablePath(rawPath, translateToWindowsPath) {
  if (!translateToWindowsPath || !rawPath.startsWith('/')) {
    return rawPath;
  }

  const result = await runCommand('wslpath', ['-w', rawPath]);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to convert WSL path: ${rawPath}`);
  }

  return result.stdout.trim();
}

async function runCommand(command, args, options = {}) {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.once('error', reject);
    child.once('close', (exitCode) => {
      resolvePromise({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function main() {
  const tempRoot = await mkdtemp(join(tmpdir(), 'happy-vscode-bridge-smoke-'));
  const compiledTestPath = join(tempRoot, 'extensionHost.test.cjs');
  const userDataDir = join(tempRoot, 'user-data');
  const extensionsDir = join(tempRoot, 'extensions');
  const smokeOutputPath = join(tempRoot, 'smoke-output.json');
  const workspaceDir = join(tempRoot, 'workspace');

  try {
    await rm(smokeOutputPath, { force: true });
    await mkdir(userDataDir, { recursive: true });
    await mkdir(extensionsDir, { recursive: true });
    await mkdir(workspaceDir, { recursive: true });

    await build({
      entryPoints: [extensionEntryPath],
      outfile: extensionOutfilePath,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: ['node20'],
      external: ['vscode'],
      sourcemap: true,
      sourcesContent: false,
    });

    await build({
      entryPoints: [sourceTestPath],
      outfile: compiledTestPath,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: ['node20'],
      external: ['vscode'],
      sourcemap: false,
    });

    const codeExecutable = await resolveCodeExecutable();
    const translateToWindowsPath =
      codeExecutable.endsWith('.exe') || codeExecutable.startsWith('/mnt/');
    const env = {
      ...process.env,
    };

    const extensionDevelopmentPath = await toExecutablePath(
      packageRoot,
      translateToWindowsPath,
    );
    const extensionTestsPath = await toExecutablePath(
      compiledTestPath,
      translateToWindowsPath,
    );
    const translatedUserDataDir = await toExecutablePath(
      userDataDir,
      translateToWindowsPath,
    );
    const translatedExtensionsDir = await toExecutablePath(
      extensionsDir,
      translateToWindowsPath,
    );
    const translatedWorkspaceDir = await toExecutablePath(
      workspaceDir,
      translateToWindowsPath,
    );

    delete env.ELECTRON_RUN_AS_NODE;
    for (const key of Object.keys(env)) {
      if (key.startsWith('VSCODE_') || key.startsWith('ELECTRON_')) {
        delete env[key];
      }
    }

    const args = [
      `--extensionDevelopmentPath=${extensionDevelopmentPath}`,
      `--extensionTestsPath=${extensionTestsPath}`,
      `--user-data-dir=${translatedUserDataDir}`,
      `--extensions-dir=${translatedExtensionsDir}`,
      '--disable-extensions',
      '--disable-workspace-trust',
      '--skip-welcome',
      '--skip-release-notes',
      translatedWorkspaceDir,
    ];

    const exitCode = await new Promise((resolvePromise, reject) => {
      const child = spawn(codeExecutable, args, {
        cwd: repoRoot,
        env,
        stdio: 'inherit',
      });

      child.once('error', reject);
      child.once('close', (code) => resolvePromise(code ?? 1));
    });

    const output = await readSmokeOutput(smokeOutputPath);

    if (exitCode !== 0 && !output) {
      throw new Error(`Extension host smoke test failed with exit code ${exitCode}`);
    }

    if (!output || !(output.port > 0)) {
      throw new Error('Smoke output did not include a broker port');
    }

    console.log(JSON.stringify(output, null, 2));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function readSmokeOutput(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

await main();
