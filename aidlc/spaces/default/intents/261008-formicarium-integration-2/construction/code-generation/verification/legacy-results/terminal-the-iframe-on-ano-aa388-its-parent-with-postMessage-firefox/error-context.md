# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: terminal.spec.ts >> the iframe on another origin >> talks to its parent with postMessage
- Location: e2e/terminal.spec.ts:102:3

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-UHOs3A -juggler-pipe -silent
<launched> pid=232
[pid=232][err] *** You are running in headless mode.
[pid=232] <process did exit: exitCode=null, signal=SIGABRT>
[pid=232] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-UHOs3A -juggler-pipe -silent
  - <launched> pid=232
  - [pid=232][err] *** You are running in headless mode.
  - [pid=232] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=232] starting temporary directories cleanup
  - [pid=232] <gracefully close start>
  - [pid=232] <kill>
  - [pid=232] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=232] finished temporary directories cleanup
  - [pid=232] <gracefully close end>

```