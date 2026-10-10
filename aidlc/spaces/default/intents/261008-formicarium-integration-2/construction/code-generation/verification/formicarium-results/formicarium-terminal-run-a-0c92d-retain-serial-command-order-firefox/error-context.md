# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> run attributes and concurrent calls retain serial command order
- Location: e2e/formicarium-terminal.spec.ts:129:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-kMhqdh -juggler-pipe -silent
<launched> pid=245
[pid=245][err] *** You are running in headless mode.
[pid=245] <process did exit: exitCode=null, signal=SIGABRT>
[pid=245] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-kMhqdh -juggler-pipe -silent
  - <launched> pid=245
  - [pid=245][err] *** You are running in headless mode.
  - [pid=245] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=245] starting temporary directories cleanup
  - [pid=245] <gracefully close start>
  - [pid=245] <kill>
  - [pid=245] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=245] finished temporary directories cleanup
  - [pid=245] <gracefully close end>

```