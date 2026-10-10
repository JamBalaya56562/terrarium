# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: terminal.spec.ts >> the iframe on another origin >> talks to its parent with postMessage
- Location: e2e/terminal.spec.ts:102:3

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=1222
[pid=1222][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:  1229 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=1222
  - [pid=1222][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:  1229 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=1222] <gracefully close start>
  - [pid=1222] <kill>
  - [pid=1222] <will force kill>
  - [pid=1222] exception while trying to kill process: Error: kill ESRCH
  - [pid=1222] <process did exit: exitCode=134, signal=null>
  - [pid=1222] starting temporary directories cleanup
  - [pid=1222] finished temporary directories cleanup
  - [pid=1222] <gracefully close end>

```