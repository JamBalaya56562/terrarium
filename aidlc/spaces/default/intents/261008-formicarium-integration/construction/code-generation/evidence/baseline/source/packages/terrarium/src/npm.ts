// The npm entry point: everything index.ts exports, plus the global types
// that map <terrarium-terminal> and its events, so that
// document.querySelector('terrarium-terminal') is typed. JSR does not allow
// global augmentation, so its entry point is index.ts alone.

import type {
  ErrorDetail,
  ExitDetail,
  ReadyDetail,
  TerrariumTerminal,
} from './terminal.ts';

export * from './index.ts';

declare global {
  interface HTMLElementTagNameMap {
    'terrarium-terminal': TerrariumTerminal;
  }
  interface HTMLElementEventMap {
    'terrarium-ready': CustomEvent<ReadyDetail>;
    'terrarium-exit': CustomEvent<ExitDetail>;
    'terrarium-error': CustomEvent<ErrorDetail>;
  }
}
