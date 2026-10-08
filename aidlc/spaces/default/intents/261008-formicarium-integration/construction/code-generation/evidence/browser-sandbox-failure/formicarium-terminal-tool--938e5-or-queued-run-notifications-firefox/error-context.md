# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> tool switch resets attributes and suppresses prior queued run notifications
- Location: e2e/formicarium-terminal.spec.ts:85:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-KmElxc -juggler-pipe -silent
<launched> pid=41100
[pid=41100][err] *** You are running in headless mode.
[pid=41100] <process did exit: exitCode=null, signal=SIGABRT>
[pid=41100] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-KmElxc -juggler-pipe -silent
  - <launched> pid=41100
  - [pid=41100][err] *** You are running in headless mode.
  - [pid=41100] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=41100] starting temporary directories cleanup
  - [pid=41100] <gracefully close start>
  - [pid=41100] <kill>
  - [pid=41100] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=41100] finished temporary directories cleanup
  - [pid=41100] <gracefully close end>

```