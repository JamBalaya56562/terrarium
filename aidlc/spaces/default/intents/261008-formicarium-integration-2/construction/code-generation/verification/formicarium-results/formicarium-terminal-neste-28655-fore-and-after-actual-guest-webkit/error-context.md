# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> nested cwd keeps /work sibling before and after actual guest
- Location: e2e/formicarium-terminal.spec.ts:75:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=1235
[pid=1235][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:  1241 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=1235
  - [pid=1235][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:  1241 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=1235] <gracefully close start>
  - [pid=1235] <kill>
  - [pid=1235] <will force kill>
  - [pid=1235] exception while trying to kill process: Error: kill ESRCH
  - [pid=1235] <process did exit: exitCode=134, signal=null>
  - [pid=1235] starting temporary directories cleanup
  - [pid=1235] finished temporary directories cleanup
  - [pid=1235] <gracefully close end>

```