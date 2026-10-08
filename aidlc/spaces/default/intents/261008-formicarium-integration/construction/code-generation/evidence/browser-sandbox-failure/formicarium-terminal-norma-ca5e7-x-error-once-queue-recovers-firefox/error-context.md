# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> normal nonzero exit and unsupported syntax error once; queue recovers
- Location: e2e/formicarium-terminal.spec.ts:50:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-nsc4CJ -juggler-pipe -silent
<launched> pid=41020
[pid=41020][err] *** You are running in headless mode.
[pid=41020] <process did exit: exitCode=null, signal=SIGABRT>
[pid=41020] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-nsc4CJ -juggler-pipe -silent
  - <launched> pid=41020
  - [pid=41020][err] *** You are running in headless mode.
  - [pid=41020] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=41020] starting temporary directories cleanup
  - [pid=41020] <gracefully close start>
  - [pid=41020] <kill>
  - [pid=41020] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=41020] finished temporary directories cleanup
  - [pid=41020] <gracefully close end>

```