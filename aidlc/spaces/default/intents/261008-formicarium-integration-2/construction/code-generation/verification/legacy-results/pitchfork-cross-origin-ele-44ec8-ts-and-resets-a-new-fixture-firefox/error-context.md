# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pitchfork.spec.ts >> cross-origin element returns all exit events and resets a new fixture
- Location: e2e/pitchfork.spec.ts:110:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-mmCBLf -juggler-pipe -silent
<launched> pid=99641
[pid=99641][err] *** You are running in headless mode.
[pid=99641] <process did exit: exitCode=null, signal=SIGABRT>
[pid=99641] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-mmCBLf -juggler-pipe -silent
  - <launched> pid=99641
  - [pid=99641][err] *** You are running in headless mode.
  - [pid=99641] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=99641] starting temporary directories cleanup
  - [pid=99641] <gracefully close start>
  - [pid=99641] <kill>
  - [pid=99641] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=99641] finished temporary directories cleanup
  - [pid=99641] <gracefully close end>

```