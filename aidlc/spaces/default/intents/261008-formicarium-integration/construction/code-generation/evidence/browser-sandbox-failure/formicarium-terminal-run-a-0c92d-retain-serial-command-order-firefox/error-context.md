# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> run attributes and concurrent calls retain serial command order
- Location: e2e/formicarium-terminal.spec.ts:62:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-qsd9Tf -juggler-pipe -silent
<launched> pid=41082
[pid=41082][err] *** You are running in headless mode.
[pid=41082] <process did exit: exitCode=null, signal=SIGABRT>
[pid=41082] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-qsd9Tf -juggler-pipe -silent
  - <launched> pid=41082
  - [pid=41082][err] *** You are running in headless mode.
  - [pid=41082] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=41082] starting temporary directories cleanup
  - [pid=41082] <gracefully close start>
  - [pid=41082] <kill>
  - [pid=41082] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=41082] finished temporary directories cleanup
  - [pid=41082] <gracefully close end>

```