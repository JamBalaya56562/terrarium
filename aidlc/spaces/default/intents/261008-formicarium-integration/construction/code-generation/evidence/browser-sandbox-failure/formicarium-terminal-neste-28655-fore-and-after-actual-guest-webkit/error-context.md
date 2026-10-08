# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> nested cwd keeps /work sibling before and after actual guest
- Location: e2e/formicarium-terminal.spec.ts:34:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=41725
[pid=41725][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7: 41731 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=41725
  - [pid=41725][err] /Users/mutoakio/Library/Caches/ms-playwright/webkit-2359/pw_run.sh: line 7: 41731 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
  - [pid=41725] <gracefully close start>
  - [pid=41725] <kill>
  - [pid=41725] <will force kill>
  - [pid=41725] exception while trying to kill process: Error: kill ESRCH
  - [pid=41725] <process did exit: exitCode=134, signal=null>
  - [pid=41725] starting temporary directories cleanup
  - [pid=41725] finished temporary directories cleanup
  - [pid=41725] <gracefully close end>

```