# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> latest aube ready fields, events and actual Worker version
- Location: e2e/formicarium-terminal.spec.ts:17:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-vRuT7w -juggler-pipe -silent
<launched> pid=40941
[pid=40941][err] *** You are running in headless mode.
[pid=40941] <process did exit: exitCode=null, signal=SIGABRT>
[pid=40941] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-vRuT7w -juggler-pipe -silent
  - <launched> pid=40941
  - [pid=40941][err] *** You are running in headless mode.
  - [pid=40941] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=40941] starting temporary directories cleanup
  - [pid=40941] <gracefully close start>
  - [pid=40941] <kill>
  - [pid=40941] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=40941] finished temporary directories cleanup
  - [pid=40941] <gracefully close end>

```