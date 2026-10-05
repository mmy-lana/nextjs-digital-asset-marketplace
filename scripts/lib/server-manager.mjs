/**
 * Verification server lifecycle manager.
 *
 * Removes the `ECONNREFUSED 127.0.0.1:3100` failure mode by making the test
 * harnesses self-sufficient: before any browser suite runs, the target URL is
 * probed; if nothing is listening, a production server is spawned and polled
 * until it answers HTTP 200.
 *
 * The spawned child is always torn down on normal exit, thrown errors, SIGINT
 * and SIGTERM so no orphaned process is ever left holding the port.
 */

import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';

/** Default port for the verification server. */
export const DEFAULT_VERIFY_PORT = 3100;

/** Per-request timeout when probing readiness. */
const PROBE_TIMEOUT_MS = 5000;

/** Maximum time to wait for a freshly spawned server to become ready. */
const BOOT_TIMEOUT_MS = 120000;

/** Delay between readiness probes. */
const POLL_INTERVAL_MS = 400;

/**
 * Resolves a single HTTP probe against the candidate server.
 * Returns true only for a 2xx/3xx response.
 */
async function probeOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual',
    });
    // Consume the body so the socket is released promptly.
    if (response.body) await response.arrayBuffer().catch(() => undefined);
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** True when something is already serving the URL. */
export async function isServerReachable(url) {
  return probeOnce(url);
}

/** Polls until the URL answers 200 or the timeout elapses. */
export async function waitForServer(url, timeoutMs = BOOT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeOnce(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return false;
}

/** True when a production build already exists on disk. */
async function hasProductionBuild(cwd) {
  try {
    await access(path.join(cwd, '.next', 'BUILD_ID'));
    return true;
  } catch {
    return false;
  }
}

/** Runs a command to completion, inheriting stdio. Throws on non-zero exit. */
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

/**
 * Ensures a production build is present, building on demand.
 * @returns {Promise<boolean>} true when a build was executed by this call.
 */
export async function ensureProductionBuild({ cwd, log = console.log } = {}) {
  const projectDir = cwd ?? process.cwd();
  if (await hasProductionBuild(projectDir)) return false;
  log('[verify] No production build found; running "pnpm build" first.');
  await runCommand('pnpm', ['run', 'build'], projectDir);
  return true;
}

/**
 * Spawns the production server as a detached-trackable child process.
 * @returns {import('node:child_process').ChildProcess}
 */
function spawnServer({ cwd, port, log, isStopping }) {
  log(`[verify] Spawning production server on port ${port}...`);
  const child = spawn('pnpm', ['run', 'start', '--port', String(port)], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    // Own process group so signals do not leak into the harness shell.
    detached: false,
  });

  const prefix = (stream, label) => {
    stream.setEncoding('utf8');
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim().length === 0) continue;
        // pnpm reports the SIGTERM we send during teardown as an ELIFECYCLE
        // failure. That is our own shutdown, not a server fault, so it is
        // suppressed to keep the verification output unambiguous.
        if (isStopping() && /ELIFECYCLE|Command failed with exit code 143/.test(line)) continue;
        log(`[server:${label}] ${line}`);
      }
    });
  };

  prefix(child.stdout, 'out');
  prefix(child.stderr, 'err');

  child.on('error', (error) => {
    log(`[verify] Failed to spawn server: ${error.message}`);
  });

  return child;
}

/**
 * Guarantees a reachable server for the verification run.
 *
 * - If the URL already answers, the existing server is reused and no child is
 *   spawned (so an externally managed server is never killed).
 * - Otherwise a build is ensured and a server is spawned, polled to readiness,
 *   and registered for guaranteed teardown.
 *
 * @returns {Promise<{ url: string, spawned: boolean, stop: () => Promise<void> }>}
 */
export async function ensureServer({
  url = `http://127.0.0.1:${DEFAULT_VERIFY_PORT}`,
  port = DEFAULT_VERIFY_PORT,
  cwd = process.cwd(),
  log = console.log,
  autoBuild = true,
} = {}) {
  if (await isServerReachable(url)) {
    log(`[verify] Reusing the server already listening at ${url}`);
    return { url, spawned: false, stop: async () => undefined };
  }

  if (autoBuild) {
    await ensureProductionBuild({ cwd, log });
  }

  let stopping = false;
  const child = spawnServer({
    cwd,
    port,
    log,
    isStopping: () => stopping,
  });

  const stop = async () => {
    if (stopping) return;
    stopping = true;
    if (child.exitCode !== null || child.signalCode !== null) return;

    log('[verify] Stopping the verification server...');
    await new Promise((resolve) => {
      const forceKill = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }, 5000);

      child.once('exit', () => {
        clearTimeout(forceKill);
        resolve();
      });

      child.kill('SIGTERM');
    });
  };

  // Register teardown on every exit path. `exit` cannot await, so the kill is
  // issued synchronously and the event loop is allowed to drain via SIGTERM.
  const registerTeardown = () => {
    if (stopping) return;
    if (child.exitCode !== null || child.signalCode !== null) return;
    try {
      child.kill('SIGTERM');
    } catch {
      /* Process already gone. */
    }
  };
  process.on('exit', registerTeardown);
  process.on('SIGINT', () => {
    registerTeardown();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    registerTeardown();
    process.exit(143);
  });

  const ready = await waitForServer(url);
  if (!ready) {
    registerTeardown();
    throw new Error(
      `Verification server did not become ready at ${url} within ${BOOT_TIMEOUT_MS}ms.`
    );
  }

  log(`[verify] Server ready at ${url}`);
  return { url, spawned: true, stop };
}