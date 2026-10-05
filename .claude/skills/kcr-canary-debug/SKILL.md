---
name: kcr-canary-debug
description: Debug the extension live in Kindle Cloud Reader with Chrome Canary - launch Canary with a persistent logged-in debug profile and the unpacked dist/ build, then drive KCR (switch themes, select text, read the OCR result, capture the OCR input image, screenshot, read/write extension settings). Use when reproducing a bug or verifying a fix in the real KCR page, or when the user asks to debug in Canary/Chrome.
---

# Debugging in KCR with Chrome Canary

**Requirements:** macOS with Chrome Canary at `/Applications/Google Chrome Canary.app` (the path is set
in `scripts/puppeteer.mjs`; change `CANARY` there for another OS or Chrome channel). The debug profile
and puppeteer-core live in `~/.kcr-debug/`, per user and outside the repo.

Scripts live in `.claude/skills/kcr-canary-debug/scripts/` (paths below are relative to it). They need
puppeteer-core in `~/.kcr-debug/node_modules`. The repo's own puppeteer-core is too old for loading
extensions, so the scripts print the install command if it's missing.

## Why it works this way

- **Separate profile `~/.kcr-debug/canary-profile`**: Chrome 136+ ignores remote debugging on the
  default profile, so the user's everyday Canary profile can't be driven. The debug profile is
  persistent: the Amazon login, developer mode and settings survive between sessions. If KCR redirects
  to the Amazon sign-in page, ask the user to log in in the Canary window and wait for them.
- **`--load-extension` no longer works** in branded Chrome. `launch.mjs` loads `dist/` over a CDP pipe
  (`enableExtensions`) and must keep running, because that pipe owns the extension.
- **Never call `chrome.runtime.reload()`** and don't use `yarn dev`: webpack-ext-reloader calls it too.
  It unloads a CDP-loaded extension, and it stays gone until Canary is relaunched. Use `yarn build`
  instead: `launch.mjs` watches `dist/`, reinstalls the extension and reloads KCR tabs automatically.
- Unpacked extensions are disabled while developer mode is off. `launch.mjs` turns it on and enables
  the extension.

## Workflow

1. `yarn build` (on the branch under test).
2. Start Canary in the background (Bash `run_in_background: true`), from the repo root:
   `node .claude/skills/kcr-canary-debug/scripts/launch.mjs . "https://read.amazon.com/?asin=<ASIN>"`
   Without an ASIN it opens the library; ask the user which book to open, or read the ASIN from `status`.
   CDP is at `http://localhost:9333`.
3. Drive it with `node .claude/skills/kcr-canary-debug/scripts/kcr.mjs <command>`:
   - `status`: open tabs, whether the content script mounted, KCR DOM hooks found (page image,
     `.kg-selection`, interaction-layer columns), current error text
   - `screenshot <file>`: always look at a screenshot before picking coordinates
   - `theme White|Dark|Sepia|Green`
   - `select x1 y1 x2 y2 [waitMs]`: drag-select in viewport coordinates, then print the recognized
     text (`#kcr-selection`) and error. The result span is cleared first, so a result is never stale.
   - `capture <file>`: the selection clipped from the page image like `transformSelected` does,
     before `normalizeForOcr`. Use it as an OCR fixture or to inspect what Tesseract gets.
   - `settings ['{"ocrLangs":"deu"}']`: print or merge `chrome.storage.sync`. Empty `{}` means defaults
     (`ocrLangs: "eng"`).
   - `eval '<js expression>'`, `close-popups` (the Google Translate popup opens as a new tab and lands on
     Google sign-in in this profile; that's expected)
4. After a code change: `yarn build`, wait about 3s for the "reinstalled" line in the launch output,
   then test again.
5. Stop: stop the background launch task, or `pkill -f "Chrome Canary.*kcr-debug/canary-profile"`.
   Leave Canary running only if the user wants to keep using it.

Put screenshots and captures in the scratchpad, not the repo.

## Running OCR outside the browser

To check Tesseract on a captured image (for example to compare `ocrLangs`), run tesseract.js 2.x from
`node_modules` in node. Preload `nofetch.cjs` through `NODE_OPTIONS`, so the forked worker gets it too:

```sh
NODE_OPTIONS="--require $PWD/.claude/skills/kcr-canary-debug/scripts/nofetch.cjs" node script.mjs
```

In the script, pass a `cachePath` in the scratchpad to `createWorker`, or the `.traineddata` files land
in the current directory. A `capture` image is from before normalization: to mirror the extension,
apply the same pixel steps as `normalizeForOcr` in `chrome/content/kindle/utils.ts` (grayscale, invert
dark pages, transparent to white) to the decoded PNG first (e.g. with `pngjs` in the scratchpad),
then `worker.recognize(buffer)`.

Wrong characters often mean the OCR language doesn't match the book. Check `ocrLangs` before suspecting
the image pipeline: `eng` turns "ö" into "é", and `eng+deu` behaves like `eng`.
