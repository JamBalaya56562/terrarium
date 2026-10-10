# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pitchfork.spec.ts >> tool switch clears pitchfork ref, fixture, cwd and queued commands
- Location: e2e/pitchfork.spec.ts:74:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=277
[pid=277][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:   283 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=277
  - [pid=277][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:   283 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=277] <gracefully close start>
  - [pid=277] <kill>
  - [pid=277] <will force kill>
  - [pid=277] exception while trying to kill process: Error: kill ESRCH
  - [pid=277] <process did exit: exitCode=134, signal=null>
  - [pid=277] starting temporary directories cleanup
  - [pid=277] finished temporary directories cleanup
  - [pid=277] <gracefully close end>

```