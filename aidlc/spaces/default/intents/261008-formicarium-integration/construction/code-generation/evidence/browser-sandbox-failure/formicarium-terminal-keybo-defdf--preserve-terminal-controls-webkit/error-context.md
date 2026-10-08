# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> keyboard focus deletion arrows history and Ctrl-C preserve terminal controls
- Location: e2e/formicarium-terminal.spec.ts:71:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=41781
[pid=41781][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7: 41787 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=41781
  - [pid=41781][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7: 41787 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=41781] <gracefully close start>
  - [pid=41781] <kill>
  - [pid=41781] <will force kill>
  - [pid=41781] exception while trying to kill process: Error: kill ESRCH
  - [pid=41781] <process did exit: exitCode=134, signal=null>
  - [pid=41781] starting temporary directories cleanup
  - [pid=41781] finished temporary directories cleanup
  - [pid=41781] <gracefully close end>

```