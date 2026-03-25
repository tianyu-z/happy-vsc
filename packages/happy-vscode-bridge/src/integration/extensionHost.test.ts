import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

type SmokeResult = {
  started: boolean;
  port: number;
  manifestPath: string;
  commands: string[];
};

const DEFAULT_SMOKE_OUTPUT_PATH = (() => {
  if (typeof __dirname === 'string') {
    return join(__dirname, 'smoke-output.json');
  }

  return '/tmp/happy-vscode-bridge-smoke-output.json';
})();

type ExtensionLike = {
  packageJSON?: {
    name?: string;
  };
  exports?: unknown;
  activate(): Promise<unknown>;
};

async function loadVscode() {
  const loader = new Function('return import("vscode")') as () => Promise<{
    commands: {
      executeCommand(command: string, ...args: unknown[]): Thenable<unknown>;
    };
    extensions: {
      all: ExtensionLike[];
    };
  }>;

  return loader();
}

function isSmokeResult(value: unknown): value is SmokeResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Partial<SmokeResult>;
  return (
    result.started === true &&
    typeof result.port === 'number' &&
    result.port > 0 &&
    typeof result.manifestPath === 'string' &&
    Array.isArray(result.commands)
  );
}

async function runSmoke() {
  const vscode = await loadVscode();
  const extension = vscode.extensions.all.find(
    (candidate) => candidate.packageJSON?.name === 'happy-vscode-bridge',
  );

  assert.ok(extension, 'happy-vscode-bridge extension was not discovered');

  const activated = await extension.activate();
  const result = extension.exports ?? activated;

  assert.ok(
    isSmokeResult(result),
    'extension activation did not return the expected smoke result',
  );

  const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8')) as {
    port?: number;
    token?: string;
  };

  assert.equal(manifest.port, result.port);
  assert.ok(typeof manifest.token === 'string' && manifest.token.length > 0);
  assert.ok(
    result.commands.includes('happyVscodeBridge.switchSessionMode'),
    'mode switch command was not registered',
  );

  const outputPath =
    process.env.HAPPY_VSCODE_BRIDGE_SMOKE_OUTPUT ?? DEFAULT_SMOKE_OUTPUT_PATH;
  if (outputPath) {
    await writeFile(
      outputPath,
      JSON.stringify(
        {
          port: result.port,
          manifestPath: result.manifestPath,
          commands: result.commands,
        },
        null,
        2,
      ),
      'utf8',
    );
  }

  await vscode.commands.executeCommand('workbench.action.closeWindow');
}

let runPromise: Promise<void> | null = null;

export async function run() {
  if (!runPromise) {
    runPromise = runSmoke();
  }

  return await runPromise;
}

void run();
