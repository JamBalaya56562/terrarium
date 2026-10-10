# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pitchfork.spec.ts >> same-origin iframe works across browsers and rejects wrong source/origin
- Location: e2e/pitchfork.spec.ts:153:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=642
[pid=642][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:   656 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=642
  - [pid=642][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:   656 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=642] <gracefully close start>
  - [pid=642] <kill>
  - [pid=642] <will force kill>
  - [pid=642] exception while trying to kill process: Error: kill ESRCH
  - [pid=642] <process did exit: exitCode=134, signal=null>
  - [pid=642] starting temporary directories cleanup
  - [pid=642] finished temporary directories cleanup
  - [pid=642] <gracefully close end>

```