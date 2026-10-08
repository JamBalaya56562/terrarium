# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> boot error rejects ready once without creating any guest Worker
- Location: e2e/formicarium-terminal.spec.ts:111:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-mKeB8W -juggler-pipe -silent
<launched> pid=41106
[pid=41106][err] *** You are running in headless mode.
[pid=41106] <process did exit: exitCode=null, signal=SIGABRT>
[pid=41106] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-mKeB8W -juggler-pipe -silent
  - <launched> pid=41106
  - [pid=41106][err] *** You are running in headless mode.
  - [pid=41106] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=41106] starting temporary directories cleanup
  - [pid=41106] <gracefully close start>
  - [pid=41106] <kill>
  - [pid=41106] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=41106] finished temporary directories cleanup
  - [pid=41106] <gracefully close end>

```