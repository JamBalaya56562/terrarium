// The tools terrarium serves and the builds published for them: tools.json and
// dist/builds.json next to the page. No DOM here, so it is testable anywhere.

/** An entry of tools.json. */
export interface ToolInfo {
  label?: string;
  repository?: string;
  /** The build used when none is asked for. */
  default?: string;
  /** The fixture preloaded into /work when none is asked for. */
  fixture?: string;
  /** The starting directory when the default fixture is loaded. */
  cwd?: string;
}

/** An entry of dist/builds.json. */
export interface BuildInfo {
  source?: {
    type?: string;
    url?: string;
    ref?: string;
    commit?: string | null;
  };
  upstream_pr?: string | null;
  built_at?: string;
}

export interface Catalog {
  tools: Record<string, ToolInfo>;
  builds: Record<string, Record<string, BuildInfo>>;
}

export interface Choice {
  toolName: string;
  tool: ToolInfo;
  ref: string;
  build: BuildInfo;
  builds: Record<string, BuildInfo>;
  /** The tool's builds, its default first. */
  names: string[];
}

/** `url` with `?v=<version>`, when there is a version. */
export function versioned(url: URL | string, version?: string | null): string {
  const u = new URL(url);
  if (version) u.searchParams.set('v', version);
  return u.href;
}

const jsonCache = new Map<string, Promise<unknown>>();

/** Fetch JSON once per URL. */
export function fetchJson<T>(url: string): Promise<T> {
  let pending = jsonCache.get(url);
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return response.json();
    });
    jsonCache.set(url, pending);
    pending.catch(() => jsonCache.delete(url));
  }
  return pending as Promise<T>;
}

/** The tools at `base` and the builds published for them. */
export async function catalog(
  base: string,
  version?: string | null,
): Promise<Catalog> {
  const [tools, manifest] = await Promise.all([
    fetchJson<Record<string, ToolInfo>>(
      versioned(new URL('tools.json', base), version),
    ),
    fetchJson<{ builds?: Catalog['builds'] }>(
      versioned(new URL('dist/builds.json', base), version),
    ),
  ]);
  return { tools, builds: manifest.builds ?? {} };
}

/** Pick a tool and a build from a catalog, falling back to the defaults. */
export function choose(
  { tools, builds: allBuilds }: Catalog,
  { tool: wanted, ref: wantedRef }: { tool?: string; ref?: string } = {},
): Choice {
  const toolName = wanted ?? Object.keys(tools)[0];
  const tool = toolName === undefined ? undefined : tools[toolName];
  if (toolName === undefined || !tool) {
    throw new Error(
      `unknown tool "${wanted}"; known: ${Object.keys(tools).join(', ')}`,
    );
  }
  const builds = allBuilds[toolName] ?? {};
  const names = Object.keys(builds).sort((a, b) =>
    a === tool.default ? -1 : b === tool.default ? 1 : a.localeCompare(b),
  );
  const ref = wantedRef ?? names[0];
  if (ref === undefined) {
    throw new Error(`no builds of ${toolName} are published yet`);
  }
  const build = builds[ref];
  if (!build) {
    throw new Error(
      `no build "${ref}" of ${toolName}; published: ${names.join(', ')}`,
    );
  }
  return { toolName, tool, ref, build, builds, names };
}

/** `main (259cd05f)`: a build's name and short commit. */
export function describe(name: string, build: BuildInfo): string {
  const commit = build.source?.commit?.slice(0, 8);
  return commit ? `${name} (${commit})` : name;
}
