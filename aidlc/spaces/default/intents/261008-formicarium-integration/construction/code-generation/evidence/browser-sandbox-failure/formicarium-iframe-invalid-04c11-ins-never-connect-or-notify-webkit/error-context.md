# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-iframe.spec.ts >> invalid opaque wildcard and unknown parent origins never connect or notify
- Location: e2e/formicarium-iframe.spec.ts:87:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=41673
[pid=41673][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7: 41679 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=41673
  - [pid=41673][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7: 41679 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=41673] <gracefully close start>
  - [pid=41673] <kill>
  - [pid=41673] <will force kill>
  - [pid=41673] exception while trying to kill process: Error: kill ESRCH
  - [pid=41673] <process did exit: exitCode=134, signal=null>
  - [pid=41673] starting temporary directories cleanup
  - [pid=41673] finished temporary directories cleanup
  - [pid=41673] <gracefully close end>

```