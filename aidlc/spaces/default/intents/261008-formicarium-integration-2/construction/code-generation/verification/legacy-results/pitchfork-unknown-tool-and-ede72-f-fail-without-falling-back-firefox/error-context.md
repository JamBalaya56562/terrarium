# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pitchfork.spec.ts >> unknown tool and pitchfork ref fail without falling back
- Location: e2e/pitchfork.spec.ts:99:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-8stsj8 -juggler-pipe -silent
<launched> pid=99594
[pid=99594][err] *** You are running in headless mode.
[pid=99594] <process did exit: exitCode=null, signal=SIGABRT>
[pid=99594] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-8stsj8 -juggler-pipe -silent
  - <launched> pid=99594
  - [pid=99594][err] *** You are running in headless mode.
  - [pid=99594] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=99594] starting temporary directories cleanup
  - [pid=99594] <gracefully close start>
  - [pid=99594] <kill>
  - [pid=99594] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=99594] finished temporary directories cleanup
  - [pid=99594] <gracefully close end>

```