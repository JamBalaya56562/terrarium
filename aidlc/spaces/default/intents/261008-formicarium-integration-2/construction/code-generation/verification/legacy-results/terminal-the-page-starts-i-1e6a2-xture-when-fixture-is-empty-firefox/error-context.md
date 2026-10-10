# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: terminal.spec.ts >> the page >> starts in /work with no fixture when ?fixture is empty
- Location: e2e/terminal.spec.ts:47:3

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-fWS7bw -juggler-pipe -silent
<launched> pid=99926
[pid=99926][err] *** You are running in headless mode.
[pid=99926] <process did exit: exitCode=null, signal=SIGABRT>
[pid=99926] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-fWS7bw -juggler-pipe -silent
  - <launched> pid=99926
  - [pid=99926][err] *** You are running in headless mode.
  - [pid=99926] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=99926] starting temporary directories cleanup
  - [pid=99926] <gracefully close start>
  - [pid=99926] <kill>
  - [pid=99926] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=99926] finished temporary directories cleanup
  - [pid=99926] <gracefully close end>

```