# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> latest aube ready fields, events and actual Worker version
- Location: e2e/formicarium-terminal.spec.ts:37:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=1098
[pid=1098][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:  1110 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=1098
  - [pid=1098][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7:  1110 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=1098] <gracefully close start>
  - [pid=1098] <kill>
  - [pid=1098] <will force kill>
  - [pid=1098] exception while trying to kill process: Error: kill ESRCH
  - [pid=1098] <process did exit: exitCode=134, signal=null>
  - [pid=1098] starting temporary directories cleanup
  - [pid=1098] finished temporary directories cleanup
  - [pid=1098] <gracefully close end>

```