# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> boot error rejects ready once without creating any guest Worker
- Location: e2e/formicarium-terminal.spec.ts:248:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-syXgPM -juggler-pipe -silent
<launched> pid=433
[pid=433][err] *** You are running in headless mode.
[pid=433] <process did exit: exitCode=null, signal=SIGABRT>
[pid=433] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-syXgPM -juggler-pipe -silent
  - <launched> pid=433
  - [pid=433][err] *** You are running in headless mode.
  - [pid=433] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=433] starting temporary directories cleanup
  - [pid=433] <gracefully close start>
  - [pid=433] <kill>
  - [pid=433] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=433] finished temporary directories cleanup
  - [pid=433] <gracefully close end>

```