# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: terminal.spec.ts >> the element on another origin >> loads the build, runs commands and reports them
- Location: e2e/terminal.spec.ts:56:3

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-oy2jsE -juggler-pipe -silent
<launched> pid=99995
[pid=99995][err] *** You are running in headless mode.
[pid=99995] <process did exit: exitCode=null, signal=SIGABRT>
[pid=99995] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-oy2jsE -juggler-pipe -silent
  - <launched> pid=99995
  - [pid=99995][err] *** You are running in headless mode.
  - [pid=99995] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=99995] starting temporary directories cleanup
  - [pid=99995] <gracefully close start>
  - [pid=99995] <kill>
  - [pid=99995] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=99995] finished temporary directories cleanup
  - [pid=99995] <gracefully close end>

```