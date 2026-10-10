# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formicarium-terminal.spec.ts >> nested cwd keeps /work sibling before and after actual guest
- Location: e2e/formicarium-terminal.spec.ts:75:1

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-hLnLl7 -juggler-pipe -silent
<launched> pid=99961
[pid=99961][err] *** You are running in headless mode.
[pid=99961] <process did exit: exitCode=null, signal=SIGABRT>
[pid=99961] starting temporary directories cleanup
Call log:
  - <launching> /Users/mutoakio/Library/Caches/ms-playwright/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/fq/89xq0x2s2f1843g0pmptmxrr0000gn/T/playwright_firefoxdev_profile-hLnLl7 -juggler-pipe -silent
  - <launched> pid=99961
  - [pid=99961][err] *** You are running in headless mode.
  - [pid=99961] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=99961] starting temporary directories cleanup
  - [pid=99961] <gracefully close start>
  - [pid=99961] <kill>
  - [pid=99961] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=99961] finished temporary directories cleanup
  - [pid=99961] <gracefully close end>

```