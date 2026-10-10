# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: terminal.spec.ts >> the element on another origin >> reports an error on a page that is not cross-origin isolated
- Location: e2e/terminal.spec.ts:86:3

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-ugdxxe -juggler-pipe -silent
<launched> pid=136
[pid=136][err] *** You are running in headless mode.
[pid=136] <process did exit: exitCode=null, signal=SIGABRT>
[pid=136] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-ugdxxe -juggler-pipe -silent
  - <launched> pid=136
  - [pid=136][err] *** You are running in headless mode.
  - [pid=136] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=136] starting temporary directories cleanup
  - [pid=136] <gracefully close start>
  - [pid=136] <kill>
  - [pid=136] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=136] finished temporary directories cleanup
  - [pid=136] <gracefully close end>

```