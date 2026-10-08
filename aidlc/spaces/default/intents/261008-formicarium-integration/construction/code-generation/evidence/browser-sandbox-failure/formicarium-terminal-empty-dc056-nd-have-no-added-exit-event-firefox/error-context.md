# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> empty fixture and empty command have no added exit event
- Location: e2e/formicarium-terminal.spec.ts:42:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-lAbBeB -juggler-pipe -silent
<launched> pid=40956
[pid=40956][err] *** You are running in headless mode.
[pid=40956] <process did exit: exitCode=null, signal=SIGABRT>
[pid=40956] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-lAbBeB -juggler-pipe -silent
  - <launched> pid=40956
  - [pid=40956][err] *** You are running in headless mode.
  - [pid=40956] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=40956] starting temporary directories cleanup
  - [pid=40956] <gracefully close start>
  - [pid=40956] <kill>
  - [pid=40956] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=40956] finished temporary directories cleanup
  - [pid=40956] <gracefully close end>

```