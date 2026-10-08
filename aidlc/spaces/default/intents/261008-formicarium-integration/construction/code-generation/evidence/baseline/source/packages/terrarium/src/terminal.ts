// <terrarium-terminal>: a terminal running one build of a CLI, as an HTML
// element that any page can use without an iframe.
//
//   <terrarium-terminal tool="aube" ref="pr-1645" run="aube install"></terrarium-terminal>
//
// Attributes, read when the element is connected:
//   tool     a key of tools.json (default: the first one)
//   ref      a build, a key of dist/builds.json (default: the tool's default)
//   fixture  the project preloaded into /work (default: the tool's; "" for none)
//   cwd      the starting directory (default: the tool's, or /work)
//   run      commands to type once ready, one per line
//   base     where terrarium's web/ directory is served from (default: the
//            GitHub Pages site, or next to this module when it is served there)
//
// The tool uses threads, so the page must be cross-origin isolated
// (COOP/COEP headers, or a service worker such as coi-serviceworker.js).

import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import {
  type BuildInfo,
  type Choice,
  catalog,
  choose,
  describe,
  fetchJson,
  versioned,
} from './catalog.ts';
import xtermCss from './generated/xterm-css.ts';
import { Session, type Tool } from './session.ts';
import { FormicariumSession, formicariumAssets, resolveChoice, usesFormicarium } from './formicarium-session.ts';

/** Where terrarium is published. */
export const DEFAULT_BASE = 'https://aletheia-works.github.io/terrarium/web/';

// Replaced with the deploy's version when the site's bundle is built (see
// scripts/assemble-pages.sh). GitHub Pages lets browsers cache files for 10
// minutes, so the version in each URL keeps the files of one deploy together.
declare const __TERRARIUM_VERSION__: string | undefined;
const VERSION =
  typeof __TERRARIUM_VERSION__ === 'string' ? __TERRARIUM_VERSION__ : null;

export interface ReadyDetail {
  tool: string;
  ref: string;
  commit: string | null;
  /** Seconds from connecting the element to the prompt. */
  seconds: number;
}

export interface ExitDetail {
  command: string;
  code: number;
  /** Everything the command printed. */
  output: string;
}

export interface ErrorDetail {
  message: string;
}

function defaultBase(): string {
  // The site's own bundle is served from terrarium's web/ directory.
  return VERSION ? new URL('./', import.meta.url).href : DEFAULT_BASE;
}

/** Pick a tool and a build at `base`, falling back to the defaults. */
export async function chooseBuild({
  base = defaultBase(),
  tool,
  ref,
}: {
  base?: string;
  tool?: string;
  ref?: string;
} = {}): Promise<Choice> {
  return choose(await catalog(base, VERSION), { tool, ref });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.append(script);
  });
}

// Every build's script assigns the same global, `Module`: load one at a time.
let scriptQueue: Promise<unknown> = Promise.resolve();
const toolCache = new Map<string, Promise<Tool>>();

// The tool's script runs from a blob: URL. Its pthread workers load the URL
// the script was loaded from, and a worker cannot start from another origin's
// URL, so this keeps them same-origin when terrarium is served from elsewhere.
// The build's files are versioned by when it was built, not by the deploy, so
// a deploy that does not rebuild it keeps them cached, and a rebuild never
// pairs a new .wasm with an old .js.
function loadTool(
  base: string,
  toolName: string,
  ref: string,
  build: BuildInfo,
): Promise<Tool> {
  const dir = new URL(`dist/${toolName}/${ref}/`, base);
  const version = build.built_at ?? build.source?.commit ?? VERSION;
  const key = versioned(dir, version);
  let pending = toolCache.get(key);
  if (!pending) {
    pending = (async () => {
      const [wasmModule, source] = await Promise.all([
        WebAssembly.compileStreaming(
          fetch(versioned(new URL(`${toolName}.wasm`, dir), version)),
        ),
        fetch(versioned(new URL(`${toolName}.js`, dir), version)).then(
          (response) => {
            if (!response.ok) {
              throw new Error(`${response.url}: HTTP ${response.status}`);
            }
            return response.text();
          },
        ),
      ]);
      const url = URL.createObjectURL(
        new Blob([source], { type: 'text/javascript' }),
      );
      const factory = scriptQueue
        .then(() => loadScript(url))
        .then(() => (globalThis as { Module?: Tool['factory'] }).Module);
      scriptQueue = factory.catch(() => {});
      const loaded = await factory;
      if (!loaded) throw new Error(`${toolName}.js did not define Module`);
      return { name: toolName, factory: loaded, wasmModule };
    })();
    toolCache.set(key, pending);
    pending.catch(() => toolCache.delete(key));
  }
  return pending;
}

const STYLE = `
  :host { display: block; height: 24rem; background: #0d1117; }
  .term { height: 100%; box-sizing: border-box; overflow: hidden; padding: 8px 0 8px 12px; }
`;

/**
 * A terminal running one build of a CLI. See the attributes above; use
 * `ready`, `run()` and `transcript`, or listen for `terrarium-ready`,
 * `terrarium-exit` and `terrarium-error`.
 */
export class TerrariumTerminal extends HTMLElement {
  #ready: Promise<ReadyDetail> | null = null;
  #term: Terminal | null = null;
  #session: Session | FormicariumSession | null = null;
  #generation = 0;
  #resize: ResizeObserver | null = null;
  #line = '';
  #busy = false;
  #chain: Promise<unknown> = Promise.resolve();
  #history: string[] = [];
  #historyIndex = 0;
  #transcript = '';
  #output = '';

  /** Resolves once the tool is loaded and the prompt is shown. */
  get ready(): Promise<ReadyDetail> {
    return (
      this.#ready ??
      Promise.reject(new Error('the element is not connected yet'))
    );
  }

  /** Everything printed so far. */
  get transcript(): string {
    return this.#transcript;
  }

  connectedCallback(): void {
    if (this.#ready) return;
    const generation = ++this.#generation;
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${xtermCss}${STYLE}</style><div class="term" data-testid="terrarium-terminal-surface"></div>`;
    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: 13,
      theme: { background: '#0d1117' },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    const container = root.querySelector('.term') as HTMLElement;
    term.open(container);
    this.#resize = new ResizeObserver(() => {
      if (container.clientWidth && container.clientHeight) fit.fit();
    });
    this.#resize.observe(container);
    term.onData((data) => {
      this.#onData(data);
    });
    this.#term = term;

    this.#ready = this.#boot(term, generation);
    this.#ready.catch(() => {});
  }

  static get observedAttributes(): string[] { return ['tool']; }

  attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
    if (name !== 'tool' || previous === next || !this.#ready || !this.isConnected) return;
    for (const attribute of ['ref', 'fixture', 'cwd', 'run']) this.removeAttribute(attribute);
    this.disconnectedCallback();
    this.connectedCallback();
  }

  disconnectedCallback(): void {
    ++this.#generation;
    const session = this.#session;
    this.#session = null;
    if (session instanceof FormicariumSession) void session.dispose().catch(() => {});
    this.#resize?.disconnect();
    this.#resize = null;
    this.#term?.dispose();
    this.#term = null;
    this.#ready = null;
    this.#chain = Promise.resolve();
    this.#busy = false;
    this.#line = '';
    this.#history = [];
    this.#historyIndex = 0;
    this.#transcript = this.#output = '';
  }

  /** Type one command after earlier runs; failures leave the queue reusable. */
  run(command: string): Promise<ExitDetail> {
    const generation = this.#generation;
    return this.ready.then(() => {
      this.#current(generation);
      const result = this.#chain.then(async () => {
        try {
          if (typeof command !== 'string') throw new Error('command must be a string');
          return await this.#type(command, generation);
        } catch (error) {
          if (generation === this.#generation) this.#emit<ErrorDetail>('terrarium-error', { message: String((error as Error)?.message ?? error) });
          throw error;
        }
      });
      this.#chain = result.catch(() => {});
      return result;
    });
  }

  #current(generation: number): void {
    if (generation !== this.#generation || !this.isConnected) throw new Error('terminal was disconnected or replaced');
  }

  override focus(): void {
    this.#term?.focus();
  }

  #emit<T>(type: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true }),
    );
  }

  async #boot(term: Terminal, generation: number): Promise<ReadyDetail> {
    try {
      if (!globalThis.crossOriginIsolated) {
        throw new Error(
          'this page is not cross-origin isolated (COOP/COEP), which the tool needs for its threads',
        );
      }
      const started = performance.now();
      const base = new URL(
        this.getAttribute('base') ?? defaultBase(),
        document.baseURI,
      ).href;
      const choice = await chooseBuild({
        base,
        tool: this.getAttribute('tool') ?? undefined,
        ref: this.getAttribute('ref') ?? undefined,
      });
      this.#current(generation);
      const { toolName, tool, ref, build } = choice;
      term.write(`\x1b[2mLoading ${toolName} ${describe(ref, build)}…\x1b[0m`);
      const fixture = this.hasAttribute('fixture')
        ? this.getAttribute('fixture')
        : tool.fixture;
      const write = (text: string) => {
        if (generation !== this.#generation) return;
        this.#transcript += text;
        this.#output += text;
        term.write(text);
      };
      let session: Session | FormicariumSession;
      let filesCount: number;
      if (usesFormicarium(toolName)) {
        const selected = await resolveChoice(choice, { base,
          fixture: this.hasAttribute('fixture') ? this.getAttribute('fixture') ?? '' : undefined,
          cwd: this.getAttribute('cwd') ?? undefined });
        this.#current(generation);
        session = await FormicariumSession.create({ tool: toolName, guest: selected.guest,
          entries: selected.entries, cwd: selected.cwd, assets: formicariumAssets(base), write });
        if (generation !== this.#generation || !this.isConnected) {
          await session.dispose();
          this.#current(generation);
        }
        filesCount = selected.entries.length;
      } else {
        const [loaded, files] = await Promise.all([
          loadTool(base, toolName, ref, build),
          fixture ? fetchJson<Record<string, string>>(versioned(new URL(`dist/fixtures/${fixture}.json`, base), VERSION)).then(Object.entries) : [],
        ]);
        this.#current(generation);
        session = new Session({ tool: loaded, write,
          cwd: this.getAttribute('cwd') ?? (fixture ? tool.cwd : null) ?? '/work' });
        session.seed(files);
        filesCount = files.length;
      }
      this.#session = session;

      term.write('\x1b[2K\r');
      term.writeln(
        `${toolName} ${describe(ref, build)}, compiled to WebAssembly and running in this tab.`,
      );
      if (filesCount) term.writeln(`A sample project is in ${session.cwd}.`);
      term.writeln('');
      this.#prompt();

      const info: ReadyDetail = {
        tool: toolName,
        ref,
        commit: build.source?.commit ?? null,
        seconds: (performance.now() - started) / 1000,
      };
      this.#emit('terrarium-ready', info);
      for (const command of (this.getAttribute('run') ?? '').split('\n')) {
        if (command.trim()) void this.run(command.trim()).catch(() => {});
      }
      return info;
    } catch (error) {
      if (generation !== this.#generation) throw error;
      const message = String((error as Error)?.message ?? error);
      term.write(`\x1b[2K\r\x1b[31m${message}\x1b[0m\r\n`);
      this.#emit<ErrorDetail>('terrarium-error', { message });
      throw error;
    }
  }

  #prompt(): void {
    this.#term?.write(
      `\x1b[32mweb_user\x1b[0m:\x1b[34m${this.#session?.cwd}\x1b[0m$ `,
    );
  }

  async #execute(command: string, generation = this.#generation): Promise<ExitDetail> {
    this.#current(generation);
    this.#busy = true;
    this.#term?.write('\r\n');
    try {
      if (!command.trim()) return { command, code: 0, output: '' };
      const session = this.#session;
      if (!session) throw new Error('terminal session is unavailable');
      this.#history.push(command);
      this.#historyIndex = this.#history.length;
      this.#output = '';
      const response = await session.run(command);
      this.#current(generation);
      const result = { command, code: typeof response === 'number' ? response : response.code,
        output: typeof response === 'number' ? this.#output : response.output };
      this.#emit('terrarium-exit', result);
      return result;
    } finally {
      if (generation === this.#generation) { this.#busy = false; this.#prompt(); }
    }
  }

  async #type(command: string, generation: number): Promise<ExitDetail> {
    while (this.#busy) { await new Promise((resolve) => setTimeout(resolve, 50)); this.#current(generation); }
    this.#current(generation);
    this.#busy = true;
    try {
      this.#replaceLine('');
      for (const character of command) {
        this.#current(generation);
        this.#term?.write(character);
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      return await this.#execute(command, generation);
    } finally {
      if (generation === this.#generation) this.#busy = false;
    }
  }

  #replaceLine(text: string): void {
    this.#term?.write('\b \b'.repeat(this.#line.length));
    this.#line = text;
    this.#term?.write(text);
  }

  async #onData(data: string): Promise<void> {
    const term = this.#term;
    if (this.#busy || !this.#session || !term) return;
    if (data === '\r') {
      const command = this.#line;
      this.#line = '';
      const generation = this.#generation;
      try { await this.#execute(command, generation); }
      catch (error) { if (generation === this.#generation) this.#emit<ErrorDetail>('terrarium-error', { message: String((error as Error)?.message ?? error) }); }
    } else if (data === '\x7f') {
      if (this.#line.length) {
        this.#line = this.#line.slice(0, -1);
        term.write('\b \b');
      }
    } else if (data === '\x1b[A') {
      if (this.#historyIndex > 0) {
        this.#replaceLine(this.#history[--this.#historyIndex] ?? '');
      }
    } else if (data === '\x1b[B') {
      if (this.#historyIndex < this.#history.length) {
        this.#replaceLine(this.#history[++this.#historyIndex] ?? '');
      }
    } else if (data === '\x03') {
      this.#line = '';
      term.write('^C\r\n');
      this.#prompt();
    } else if (!data.startsWith('\x1b')) {
      this.#line += data;
      term.write(data);
    }
  }
}

if (
  typeof customElements !== 'undefined' &&
  !customElements.get('terrarium-terminal')
) {
  customElements.define('terrarium-terminal', TerrariumTerminal);
}
