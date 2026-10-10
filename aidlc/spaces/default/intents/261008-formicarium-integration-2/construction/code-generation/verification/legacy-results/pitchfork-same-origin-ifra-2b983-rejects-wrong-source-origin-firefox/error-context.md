# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pitchfork.spec.ts >> same-origin iframe works across browsers and rejects wrong source/origin
- Location: e2e/pitchfork.spec.ts:153:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-aBJ2Yi -juggler-pipe -silent
<launched> pid=99661
[pid=99661][err] *** You are running in headless mode.
[pid=99661] <process did exit: exitCode=null, signal=SIGABRT>
[pid=99661] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-aBJ2Yi -juggler-pipe -silent
  - <launched> pid=99661
  - [pid=99661][err] *** You are running in headless mode.
  - [pid=99661] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=99661] starting temporary directories cleanup
  - [pid=99661] <gracefully close start>
  - [pid=99661] <kill>
  - [pid=99661] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=99661] finished temporary directories cleanup
  - [pid=99661] <gracefully close end>

```