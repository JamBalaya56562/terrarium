# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> disconnect invalidates old work and reconnect creates independent session
- Location: e2e/formicarium-terminal.spec.ts:100:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=41806
[pid=41806][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7: 41813 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=41806
  - [pid=41806][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7: 41813 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=41806] <gracefully close start>
  - [pid=41806] <kill>
  - [pid=41806] <will force kill>
  - [pid=41806] exception while trying to kill process: Error: kill EPERM
  - [pid=41806] <process did exit: exitCode=134, signal=null>
  - [pid=41806] starting temporary directories cleanup
  - [pid=41806] finished temporary directories cleanup
  - [pid=41806] <gracefully close end>

```