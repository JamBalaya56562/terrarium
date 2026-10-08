# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-iframe.spec.ts >> iframe condition same-origin: exact origins and guest marker oracle
- Location: e2e/formicarium-iframe.spec.ts:39:3

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-8slf6P -juggler-pipe -silent
<launched> pid=40895
[pid=40895][err] *** You are running in headless mode.
[pid=40895] <process did exit: exitCode=null, signal=SIGABRT>
[pid=40895] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-8slf6P -juggler-pipe -silent
  - <launched> pid=40895
  - [pid=40895][err] *** You are running in headless mode.
  - [pid=40895] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=40895] starting temporary directories cleanup
  - [pid=40895] <gracefully close start>
  - [pid=40895] <kill>
  - [pid=40895] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=40895] finished temporary directories cleanup
  - [pid=40895] <gracefully close end>

```