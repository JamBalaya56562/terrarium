// <terrarium-terminal>: a terminal running one build of a CLI, as an HTML
// element that any page can use without an iframe.
//
//   <script type="module" src="https://aletheia-works.github.io/terrarium/web/terrarium.mjs"></script>
//   <terrarium-terminal tool="aube" ref="pr-1645" run="aube install"></terrarium-terminal>
//
// Attributes, read when the element is connected:
//   tool     a key of tools.json (default: the first one)
//   ref      a build, a key of dist/builds.json (default: the tool's default)
//   fixture  the project preloaded into /work (default: the tool's; "" for none)
//   cwd      the starting directory (default: the tool's, or /work)
//   run      commands to type once ready, one per line
//   base     where terrarium is served from (default: next to this module)
//
// Properties and methods: `ready` (a promise of { tool, ref, commit }),
// `run(command)` (a promise of { command, code, output }), `transcript`.
// Events, which bubble out of shadow roots: `terrarium-ready`,
// `terrarium-exit` ({ command, code, output }) and `terrarium-error`
// ({ message }), all with the details in `event.detail`.
//
// The tool uses threads, so the page must be cross-origin isolated
// (COOP/COEP headers, or a service worker such as coi-serviceworker.js).

import { Terminal } from 'https://cdn.jsdelivr.net/npm/@xterm/xterm@6.0.0/lib/xterm.mjs';
import { FitAddon } from 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.11.0/lib/addon-fit.mjs';
import { Session } from '../runtime/session.mjs';

const XTERM_CSS = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@6.0.0/css/xterm.css';
const DEFAULT_BASE = new URL('./', import.meta.url).href;

// Set by scripts/assemble-pages.sh to the deploy's version. GitHub Pages lets
// browsers cache files for 10 minutes, so right after a deploy a page could
// mix new files with cached old ones; the version in each URL keeps the files
// of one deploy together. Null when serving web/ straight from the repository.
const VERSION = null;

// `url` with `?v=<version>`, when there is a version.
function versioned(url, version = VERSION) {
  const u = new URL(url);
  if (version) u.searchParams.set('v', version);
  return u.href;
}

const jsonCache = new Map();
function fetchJson(url) {
  if (!jsonCache.has(url)) {
    jsonCache.set(
      url,
      fetch(url).then((response) => {
        if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
        return response.json();
      }),
    );
  }
  return jsonCache.get(url);
}

// The tools terrarium knows and the builds published for them.
export async function catalog(base = DEFAULT_BASE) {
  const [tools, manifest] = await Promise.all([
    fetchJson(versioned(new URL('tools.json', base))),
    fetchJson(versioned(new URL('dist/builds.json', base))),
  ]);
  return { tools, builds: manifest.builds ?? {} };
}

// Pick a tool and a build, falling back to the defaults. `names` lists the
// tool's builds, its default first.
export async function chooseBuild({ base = DEFAULT_BASE, tool: toolName, ref } = {}) {
  const { tools, builds: allBuilds } = await catalog(base);
  toolName ??= Object.keys(tools)[0];
  const tool = tools[toolName];
  if (!tool) throw new Error(`unknown tool "${toolName}"; known: ${Object.keys(tools).join(', ')}`);
  const builds = allBuilds[toolName] ?? {};
  const names = Object.keys(builds).sort((a, b) =>
    a === tool.default ? -1 : b === tool.default ? 1 : a.localeCompare(b),
  );
  if (!names.length) throw new Error(`no builds of ${toolName} are published yet`);
  ref ??= names[0];
  if (!builds[ref]) throw new Error(`no build "${ref}" of ${toolName}; published: ${names.join(', ')}`);
  return { toolName, tool, ref, build: builds[ref], builds, names };
}

export function describe(name, build) {
  const commit = build.source?.commit?.slice(0, 8);
  return commit ? `${name} (${commit})` : name;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.append(script);
  });
}

// Every build's script assigns the same global, `Module`: load one at a time.
let scriptQueue = Promise.resolve();
const toolCache = new Map();

// The tool's script runs from a blob: URL. Its pthread workers load the URL
// the script was loaded from, and a worker cannot start from another origin's
// URL, so this keeps them same-origin when terrarium is served from elsewhere.
// The build's files are versioned by when it was built, not by the deploy, so
// a deploy that does not rebuild it keeps them cached, and a rebuild never
// pairs a new .wasm with an old .js.
function loadTool(base, toolName, ref, build) {
  const dir = new URL(`dist/${toolName}/${ref}/`, base);
  const version = build.built_at ?? build.source?.commit ?? VERSION;
  const key = versioned(dir, version);
  if (!toolCache.has(key)) {
    toolCache.set(
      key,
      (async () => {
        const [wasmModule, source] = await Promise.all([
          WebAssembly.compileStreaming(fetch(versioned(new URL(`${toolName}.wasm`, dir), version))),
          fetch(versioned(new URL(`${toolName}.js`, dir), version)).then((response) => {
            if (!response.ok) throw new Error(`${response.url}: HTTP ${response.status}`);
            return response.text();
          }),
        ]);
        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        const factory = scriptQueue.then(() => loadScript(url)).then(() => globalThis.Module);
        scriptQueue = factory.catch(() => {});
        return { name: toolName, factory: await factory, wasmModule };
      })(),
    );
  }
  return toolCache.get(key);
}

const STYLE = `
  :host { display: block; height: 24rem; background: #0d1117; }
  .term { height: 100%; box-sizing: border-box; overflow: hidden; padding: 8px 0 8px 12px; }
`;

export class TerrariumTerminal extends HTMLElement {
  #ready = null;
  #term = null;
  #session = null;
  #line = '';
  #busy = false;
  #chain = Promise.resolve();
  #history = [];
  #historyIndex = 0;
  #transcript = '';
  #output = '';

  get ready() {
    return this.#ready ?? Promise.reject(new Error('the element is not connected yet'));
  }

  get transcript() {
    return this.#transcript;
  }

  connectedCallback() {
    if (this.#ready) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<link rel="stylesheet" href="${XTERM_CSS}" crossorigin="anonymous"><style>${STYLE}</style><div class="term"></div>`;
    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: 13,
      theme: { background: '#0d1117' },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    const container = root.querySelector('.term');
    term.open(container);
    new ResizeObserver(() => {
      if (container.clientWidth && container.clientHeight) fit.fit();
    }).observe(container);
    term.onData((data) => this.#onData(data));
    this.#term = term;

    this.#ready = this.#boot();
    this.#ready.catch(() => {});
  }

  // Type a command into the terminal and run it, after the ones before it.
  run(command) {
    return this.ready.then(() => {
      const result = this.#chain.then(() => this.#type(command));
      this.#chain = result.catch(() => {});
      return result;
    });
  }

  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  async #boot() {
    const term = this.#term;
    try {
      if (!globalThis.crossOriginIsolated) {
        throw new Error('this page is not cross-origin isolated (COOP/COEP), which the tool needs for its threads');
      }
      const started = performance.now();
      const base = new URL(this.getAttribute('base') ?? DEFAULT_BASE, document.baseURI).href;
      const { toolName, tool, ref, build } = await chooseBuild({
        base,
        tool: this.getAttribute('tool') ?? undefined,
        ref: this.getAttribute('ref') ?? undefined,
      });
      term.write(`\x1b[2mLoading ${toolName} ${describe(ref, build)}…\x1b[0m`);
      const fixture = this.hasAttribute('fixture') ? this.getAttribute('fixture') : tool.fixture;
      const [loaded, files] = await Promise.all([
        loadTool(base, toolName, ref, build),
        fixture ? fetchJson(versioned(new URL(`dist/fixtures/${fixture}.json`, base))).then(Object.entries) : [],
      ]);
      const cwd = this.getAttribute('cwd') ?? (fixture ? tool.cwd : null) ?? '/work';
      this.#session = new Session({
        tool: loaded,
        write: (text) => {
          this.#transcript += text;
          this.#output += text;
          term.write(text);
        },
        cwd,
      });
      this.#session.seed(files);

      term.write('\x1b[2K\r');
      term.writeln(`${toolName} ${describe(ref, build)}, compiled to WebAssembly and running in this tab.`);
      if (files.length) term.writeln(`A sample project is in ${cwd}.`);
      term.writeln('');
      this.#prompt();

      const info = {
        tool: toolName,
        ref,
        commit: build.source?.commit ?? null,
        seconds: (performance.now() - started) / 1000,
      };
      this.#emit('terrarium-ready', info);
      for (const command of (this.getAttribute('run') ?? '').split('\n')) {
        if (command.trim()) this.run(command.trim());
      }
      return info;
    } catch (error) {
      const message = String(error?.message ?? error);
      term.write(`\x1b[2K\r\x1b[31m${message}\x1b[0m\r\n`);
      this.#emit('terrarium-error', { message });
      throw error;
    }
  }

  #prompt() {
    this.#term.write(`\x1b[32mweb_user\x1b[0m:\x1b[34m${this.#session.cwd}\x1b[0m$ `);
  }

  async #execute(command) {
    this.#busy = true;
    this.#term.write('\r\n');
    let result = { command, code: 0, output: '' };
    if (command.trim()) {
      this.#history.push(command);
      this.#historyIndex = this.#history.length;
      this.#output = '';
      const code = await this.#session.run(command);
      result = { command, code, output: this.#output };
      this.#emit('terrarium-exit', result);
    }
    this.#busy = false;
    this.#prompt();
    return result;
  }

  async #type(command) {
    while (this.#busy) await new Promise((r) => setTimeout(r, 50));
    this.#busy = true;
    this.#replaceLine('');
    for (const ch of command) {
      this.#term.write(ch);
      await new Promise((r) => setTimeout(r, 25));
    }
    return this.#execute(command);
  }

  #replaceLine(text) {
    this.#term.write('\b \b'.repeat(this.#line.length));
    this.#line = text;
    this.#term.write(text);
  }

  async #onData(data) {
    if (this.#busy || !this.#session) return;
    if (data === '\r') {
      const command = this.#line;
      this.#line = '';
      await this.#execute(command);
    } else if (data === '\x7f') {
      if (this.#line.length) {
        this.#line = this.#line.slice(0, -1);
        this.#term.write('\b \b');
      }
    } else if (data === '\x1b[A') {
      if (this.#historyIndex > 0) this.#replaceLine(this.#history[--this.#historyIndex]);
    } else if (data === '\x1b[B') {
      if (this.#historyIndex < this.#history.length) this.#replaceLine(this.#history[++this.#historyIndex] ?? '');
    } else if (data === '\x03') {
      this.#line = '';
      this.#term.write('^C\r\n');
      this.#prompt();
    } else if (!data.startsWith('\x1b')) {
      this.#line += data;
      this.#term.write(data);
    }
  }

  focus() {
    this.#term?.focus();
  }
}

if (!customElements.get('terrarium-terminal')) {
  customElements.define('terrarium-terminal', TerrariumTerminal);
}
