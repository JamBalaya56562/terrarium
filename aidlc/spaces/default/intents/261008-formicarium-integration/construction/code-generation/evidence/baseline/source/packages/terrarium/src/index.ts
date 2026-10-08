// @aletheia-works/terrarium: a terminal that runs a CLI compiled to
// WebAssembly in the browser. Importing this module defines the
// <terrarium-terminal> element; `@aletheia-works/terrarium/session` has the
// DOM-free Session alone, for Node.js or Bun.

export {
  type BuildInfo,
  type Catalog,
  type Choice,
  catalog,
  choose,
  describe,
  type ToolInfo,
} from './catalog.ts';
export {
  type DiskEntry,
  type EmscriptenFS,
  Session,
  type SessionOptions,
  splitArgs,
  type Tool,
  type ToolInstance,
} from './session.ts';
export {
  chooseBuild,
  DEFAULT_BASE,
  type ErrorDetail,
  type ExitDetail,
  type ReadyDetail,
  TerrariumTerminal,
} from './terminal.ts';
