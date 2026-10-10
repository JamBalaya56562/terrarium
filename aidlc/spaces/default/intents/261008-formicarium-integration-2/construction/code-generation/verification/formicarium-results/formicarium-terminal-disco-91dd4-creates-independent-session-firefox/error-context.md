# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> disconnect invalidates old work and reconnect creates independent session
- Location: e2e/formicarium-terminal.spec.ts:224:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-ppcvIl -juggler-pipe -silent
<launched> pid=322
[pid=322][err] *** You are running in headless mode.
[pid=322] <process did exit: exitCode=null, signal=SIGABRT>
[pid=322] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-ppcvIl -juggler-pipe -silent
  - <launched> pid=322
  - [pid=322][err] *** You are running in headless mode.
  - [pid=322] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=322] starting temporary directories cleanup
  - [pid=322] <gracefully close start>
  - [pid=322] <kill>
  - [pid=322] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=322] finished temporary directories cleanup
  - [pid=322] <gracefully close end>

```