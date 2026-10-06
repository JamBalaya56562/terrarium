import { chooseBuild, describe } from './terrarium.mjs';

// The standalone page: one <terrarium-terminal>, configured from the URL, so
// a link or an iframe can pick the build:
//
//   ?tool=aube      the tool, a key of tools.json (default: the first one)
//   ?ref=pr-1645    the build, a key of dist/builds.json (default: the tool's
//                   default build, `main` for aube)
//   ?fixture=name   the project preloaded into /work, from dist/fixtures/
//                   (default: the tool's fixture; `?fixture=` for none)
//   ?cwd=/work/app  the starting directory (default: the tool's)
//   ?run=command    typed once the terminal is ready; repeat it for several
//   ?embed          hide the header, for an iframe
//   ?origin=https://example.org
//                   the embedding page's origin (default: the parent's, when
//                   the browser tells it)
//
// In an iframe, the page posts `terrarium:ready`, `terrarium:exit`
// ({ command, code, output }) and `terrarium:error` to its parent, and runs
// the command in a `terrarium:run` message ({ command }) from its parent. It
// talks only to the parent's origin, never to `*`.

const params = new URLSearchParams(location.search);
if (params.has('embed')) document.body.classList.add('embed');

const statusEl = document.getElementById('status');
const status = (text) => {
  statusEl.textContent = text;
};

const embedded = window.parent !== window;
function parentOrigin() {
  if (params.has('origin')) return params.get('origin');
  if (location.ancestorOrigins?.length) return location.ancestorOrigins[0];
  try {
    return document.referrer ? new URL(document.referrer).origin : null;
  } catch {
    return null;
  }
}
const targetOrigin = embedded ? parentOrigin() : null;
if (embedded && !targetOrigin)
  console.warn(
    '[terrarium] parent origin unknown; pass ?origin= to talk to it',
  );
const notifyParent = (message) => {
  if (targetOrigin) window.parent.postMessage(message, targetOrigin);
};

function showHeader({ catalog, toolName, tool, ref, build, builds, names }) {
  document.title = `terrarium · ${toolName} ${ref}`;
  document.getElementById('title').textContent =
    `terrarium · ${tool.label ?? toolName}`;

  // The tools with a published build; another one starts at its default.
  const tools = document.getElementById('tool');
  for (const [name, info] of Object.entries(catalog.tools)) {
    if (!Object.keys(catalog.builds[name] ?? {}).length) continue;
    tools.append(
      new Option(info.label ?? name, name, false, name === toolName),
    );
  }
  tools.hidden = tools.options.length < 2;
  tools.addEventListener('change', () => {
    params.set('tool', tools.value);
    for (const name of ['ref', 'fixture', 'cwd', 'run']) params.delete(name);
    location.search = params.toString();
  });

  const select = document.getElementById('build');
  for (const name of names)
    select.append(
      new Option(describe(name, builds[name]), name, false, name === ref),
    );
  select.hidden = false;
  select.addEventListener('change', () => {
    params.set('ref', select.value);
    location.search = params.toString();
  });

  const link = document.getElementById('source');
  const repo = build.source?.url ?? tool.repository;
  link.href =
    build.upstream_pr ??
    (build.source?.commit ? `${repo}/commit/${build.source.commit}` : repo);
  link.textContent = build.upstream_pr
    ? `PR #${build.upstream_pr.split('/').pop()}`
    : 'source';
  link.hidden = false;
}

const terminal = document.createElement('terrarium-terminal');
for (const name of ['tool', 'ref', 'fixture', 'cwd']) {
  if (params.has(name)) terminal.setAttribute(name, params.get(name));
}
if (params.has('run'))
  terminal.setAttribute('run', params.getAll('run').join('\n'));

// Everything the session prints, for tests that read it back.
Object.defineProperty(globalThis, 'terrariumTranscript', {
  get: () => terminal.transcript,
});

terminal.addEventListener('terrarium-ready', (event) => {
  const { tool, ref, commit, seconds } = event.detail;
  status(`Ready in ${seconds.toFixed(2)} s`);
  console.info(`[terrarium] ready: ${seconds.toFixed(2)} s`);
  notifyParent({ type: 'terrarium:ready', tool, ref, commit });
  terminal.focus();
});
terminal.addEventListener('terrarium-exit', (event) => {
  console.info(
    `[terrarium] ${event.detail.command}: exit ${event.detail.code}`,
  );
  notifyParent({ type: 'terrarium:exit', ...event.detail });
});
terminal.addEventListener('terrarium-error', (event) => {
  status(event.detail.message);
  notifyParent({ type: 'terrarium:error', message: event.detail.message });
});
addEventListener('message', (event) => {
  if (
    !targetOrigin ||
    event.source !== window.parent ||
    event.origin !== targetOrigin
  )
    return;
  if (
    event.data?.type === 'terrarium:run' &&
    typeof event.data.command === 'string'
  ) {
    terminal.run(event.data.command);
  }
});

if (!crossOriginIsolated) {
  // coi-serviceworker reloads the page once it controls it.
  status(
    'Not cross-origin isolated yet — waiting for the service worker to reload the page…',
  );
} else {
  status('Downloading and compiling…');
  chooseBuild({
    tool: params.get('tool') ?? undefined,
    ref: params.get('ref') ?? undefined,
  })
    .then(showHeader)
    .catch(() => {}); // the terminal reports the same error
  document.getElementById('term').append(terminal);
}
