# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> nested cwd keeps /work sibling before and after actual guest
- Location: e2e/formicarium-terminal.spec.ts:34:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-P7jXEx -juggler-pipe -silent
<launched> pid=40946
[pid=40946][err] *** You are running in headless mode.
[pid=40946] <process did exit: exitCode=null, signal=SIGABRT>
[pid=40946] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-P7jXEx -juggler-pipe -silent
  - <launched> pid=40946
  - [pid=40946][err] *** You are running in headless mode.
  - [pid=40946] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=40946] starting temporary directories cleanup
  - [pid=40946] <gracefully close start>
  - [pid=40946] <kill>
  - [pid=40946] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=40946] finished temporary directories cleanup
  - [pid=40946] <gracefully close end>

```