import type {
  FsEntry,
  RunResult,
  Session,
  SessionOptions,
} from '@aletheia-works/formicarium';
import { createSession } from '@aletheia-works/formicarium/browser';
import type { Choice } from './catalog.ts';
import { splitArgs } from './session.ts';

export interface SelectedGuest {
  build: {
    tool: string;
    ref: string;
    source: { commit: string };
    [key: string]: unknown;
  };
  guest: Uint8Array;
  entries: readonly FsEntry[];
  cwd: string;
}
export interface GuestRequest {
  base: string;
  tool: 'aube' | 'pitchfork';
  ref: string;
  fixture?: string;
}
export type GuestResolver = (request: GuestRequest) => Promise<SelectedGuest>;

export function usesFormicarium(tool: string): tool is 'aube' | 'pitchfork' {
  return tool === 'aube' || tool === 'pitchfork';
}

/** Legacy catalogues omit guest; declared guest formats must be recognized. */
export function isFormicariumBuild(
  tool: string,
  build: Choice['build'],
): boolean {
  if (!('guest' in build)) return false;
  if (!usesFormicarium(tool) || build.guest?.format !== 'static-musl-x86_64') {
    throw inputError('unsupported guest build format');
  }
  return true;
}

/** The three frozen C3 modules are served separately, without copying runtime internals. */
export async function resolveChoice(
  choice: Choice,
  input: { base: string; fixture?: string; cwd?: string },
  resolve?: GuestResolver,
): Promise<SelectedGuest> {
  if (!usesFormicarium(choice.toolName))
    throw inputError('tool has no formicarium distribution');
  const base = new URL(input.base);
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw inputError('distribution base must be a clean HTTP(S) URL');
  }
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  const resolver =
    resolve ??
    ((
      await import(
        new URL('formicarium-guest-distribution/resolver.js', base).href
      )
    ).resolveGuest as GuestResolver);
  const selected = await resolver({
    base: base.href,
    tool: choice.toolName,
    ref: choice.ref,
    fixture: input.fixture,
  });
  if (
    selected.build.tool !== choice.toolName ||
    selected.build.ref !== choice.ref ||
    selected.build.source.commit !== choice.build.source?.commit
  )
    throw inputError('selected catalogue and guest identity differ');
  return {
    ...selected,
    cwd:
      input.cwd === undefined ? selected.cwd : absolutePath('/work', input.cwd),
  };
}

export function formicariumAssets(
  base: string,
): NonNullable<SessionOptions['assets']> {
  const root = new URL('formicarium/', base);
  return {
    loaderURL: new URL('assets/blink.mjs', root),
    wasmURL: new URL('assets/blink.wasm', root),
    workerURL: new URL('runtime/web/package-worker.js', root),
    buildInfoURL: new URL('assets/build-info.json', root),
  };
}

export interface FormicariumSessionOptions {
  tool: string;
  guest: Uint8Array;
  entries: readonly FsEntry[];
  cwd?: string;
  assets?: SessionOptions['assets'];
  env?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  write: (text: string) => void;
  create?: (options: SessionOptions) => Promise<Session>;
}

export interface CommandResult {
  command: string;
  code: number;
  output: string;
}

function inputError(message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code: 'INVALID_INPUT' });
}

/** Literal arguments only: quoting is supported, shell evaluation is not. */
export function commandArgs(line: string): string[] {
  if (typeof line !== 'string' || line.includes('\0'))
    throw inputError('invalid command');
  let quote = '';
  for (const character of line) {
    if (quote) {
      if (character === quote) quote = '';
      else if (quote === '"' && /[$`\\]/u.test(character))
        throw inputError('shell expansion is unsupported');
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (/[|&;<>$`\\*?(){}]/u.test(character)) {
      throw inputError('shell syntax is unsupported');
    }
  }
  if (quote) throw inputError('unterminated quote');
  // Keep the existing literal token boundaries, including adjacent quoted words.
  // Validation above prevents interpreting tokens as shell syntax.
  return splitArgs(line);
}

function absolutePath(cwd: string, path: string): string {
  if (typeof path !== 'string' || path.includes('\0') || path.includes('\\'))
    throw inputError('invalid path');
  const parts: string[] = [];
  for (const part of (path.startsWith('/') ? path : `${cwd}/${path}`).split(
    '/',
  )) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

/** Command translation through the C1 public Session; no runtime state access. */
export class FormicariumSession {
  readonly tool: string;
  readonly runtime: Session;
  cwd: string;
  lastResult: RunResult | undefined;
  #options: FormicariumSessionOptions;
  #guest: Uint8Array;
  #initialCwd: string;
  #queue: Promise<unknown> = Promise.resolve();
  #disposed = false;
  #active: AbortController | undefined;

  private constructor(
    options: FormicariumSessionOptions,
    runtime: Session,
    cwd: string,
  ) {
    this.#options = options;
    this.#guest = new Uint8Array(options.guest);
    this.tool = options.tool;
    this.runtime = runtime;
    this.cwd = this.#initialCwd = cwd;
  }

  static async create(
    options: FormicariumSessionOptions,
  ): Promise<FormicariumSession> {
    const cwd = absolutePath('/work', options.cwd ?? '/work');
    // Seed at /work before switching cwd, preserving siblings of nested cwd.
    const runtime = await (options.create ?? createSession)({
      assets: options.assets,
      cwd: '/work',
      home: '/root',
      entries: options.entries,
    });
    try {
      await runtime.setCwd(cwd);
      return new FormicariumSession(options, runtime, cwd);
    } catch (error) {
      await runtime.dispose();
      throw error;
    }
  }

  run(command: string, signal?: AbortSignal): Promise<CommandResult> {
    const pending = this.#queue.then(() => this.#execute(command, signal));
    this.#queue = pending.catch(() => {});
    return pending;
  }

  async #execute(
    command: string,
    signal?: AbortSignal,
  ): Promise<CommandResult> {
    if (this.#disposed)
      throw Object.assign(new Error('Session has been disposed'), {
        code: 'DISPOSED',
      });
    const [name, ...args] = commandArgs(command);
    let output = '';
    const write = (text: string) => {
      output += text;
      this.#options.write(text);
    };
    if (!name) return { command, code: 0, output };
    const code =
      name === this.tool
        ? await this.#runGuest(args, write, signal)
        : await this.#builtin(name, args, write);
    return { command, code, output };
  }

  async #runGuest(
    args: string[],
    write: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<number> {
    const controller = new AbortController();
    this.#active = controller;
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const decoders = { stdout: new TextDecoder(), stderr: new TextDecoder() };
    let previous = -1;
    this.lastResult = undefined;
    try {
      this.lastResult = await this.runtime.run({
        guest: new Uint8Array(this.#guest),
        args,
        env: this.#options.env,
        timeoutMs: this.#options.timeoutMs ?? 600_000,
        signal: controller.signal,
        onOutput: (chunk) => {
          if (chunk.sequence <= previous)
            throw inputError('output sequence is not increasing');
          previous = chunk.sequence;
          write(decoders[chunk.stream].decode(chunk.bytes, { stream: true }));
        },
      });
      return this.lastResult.exitCode;
    } finally {
      // The callback is the sole display source, including failed-run partial output.
      write(decoders.stdout.decode());
      write(decoders.stderr.decode());
      signal?.removeEventListener('abort', abort);
      this.#active = undefined;
    }
  }

  async #builtin(
    name: string,
    args: string[],
    write: (text: string) => void,
  ): Promise<number> {
    const at = (path: string) => absolutePath(this.cwd, path);
    switch (name) {
      case 'pwd':
        write(`${this.cwd}\n`);
        return 0;
      case 'cd': {
        try {
          await this.runtime.setCwd(at(args[0] ?? '/work'));
        } catch (error) {
          if (!hasCode(error, 'NOT_FOUND') && !hasCode(error, 'NOT_FILE'))
            throw error;
          write(`cd: ${args[0]}: no such directory\n`);
          return 1;
        }
        this.cwd = at(args[0] ?? '/work');
        return 0;
      }
      case 'cat': {
        try {
          write(
            new TextDecoder().decode(
              await this.runtime.readFile(at(args[0] ?? '')),
            ),
          );
        } catch (error) {
          if (!hasCode(error, 'NOT_FOUND') && !hasCode(error, 'NOT_FILE'))
            throw error;
          write(`cat: ${args[0]}: no such file\n`);
          return 1;
        }
        return 0;
      }
      case 'ls': {
        let entries: readonly FsEntry[];
        try {
          entries = await this.runtime.listEntries(
            at(args.find((arg) => !arg.startsWith('-')) ?? '.'),
          );
        } catch (error) {
          if (!hasCode(error, 'NOT_FOUND')) throw error;
          return 0;
        }
        const names = entries
          .map((entry) => {
            const name = entry.path.slice(entry.path.lastIndexOf('/') + 1);
            return entry.type === 'dir'
              ? `${name}/`
              : entry.type === 'symlink'
                ? `${name} -> ${entry.target}`
                : name;
          })
          .sort();
        if (names.length) write(`${names.join('\n')}\n`);
        return 0;
      }
      case 'rm':
        for (const path of args.filter((arg) => !arg.startsWith('-')))
          await this.runtime.remove(at(path));
        return 0;
      default:
        write(
          `${name}: command not found — this terminal runs ${this.tool} and cd, ls, cat, rm, pwd\n`,
        );
        return 127;
    }
  }

  async reset(): Promise<void> {
    await this.#queue;
    await this.runtime.reset();
    await this.runtime.setCwd(this.#initialCwd);
    this.cwd = this.#initialCwd;
    this.lastResult = undefined;
  }

  async dispose(): Promise<void> {
    this.#disposed = true;
    this.#active?.abort();
    await this.runtime.dispose();
  }
}
