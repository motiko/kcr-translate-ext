# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Chrome extension (Manifest V3, Chrome 116+) that adds translation to Kindle Cloud Reader. KCR renders book pages as images, so selected text is extracted with OCR (tesseract.js) and then handed to a translation engine (Google Translate popup window, the Google Translate browser extension, dict.cc, or a custom URL).

## Commands

Package manager is yarn (`yarn.lock`).

- `yarn dev`: webpack watch build into `dist/` with `webpack-ext-reloader` (port 9090), which auto-reloads the extension and the KCR page on change. Load `dist/` as an unpacked extension in Chrome.
- `yarn build`: production build into `dist/` (cleans the folder first).
- `yarn zip`: packages the contents of `dist/` into `pack.zip` (with `manifest.json` at the zip root) for store upload.
- `yarn test:cypress`: runs Cypress e2e in headed Chrome. **Build `dist/` first**, because Cypress loads the extension from `./dist`. The tests log in to a real Amazon account and are skipped unless `email`, `password` and `bookId` are set (in the gitignored `cypress.env.json` or as `CYPRESS_*` env vars). To run one spec: `npx cypress run --browser chrome --headed --spec cypress/integration/kcr.spec.ts`.
- `yarn lint` (ESLint on `chrome/` and `cypress/`) and `yarn typecheck` (`tsc --noEmit`). Prettier runs through ESLint (`prettier/prettier` is a warning). Only errors fail CI.
- CI (`.github/workflows/ci.yml`) runs `typecheck`, `lint` and `build` on every PR and on pushes to `main`, and uploads `dist/` as the `kcr-translate-dist` artifact. Cypress is not run in CI. Dependabot (`.github/dependabot.yml`) opens grouped monthly PRs for npm and GitHub Actions; major updates of tesseract.js are ignored.

Babel (not `tsc`) compiles TS/TSX in webpack, so type errors do not break the build.

## Releasing

The user-facing process and the one-time Google Cloud setup are in the "Releasing" section of `README.md`. Summary:

- `yarn version --patch|--minor|--major` bumps `package.json`, commits and tags `vX.Y.Z`. `git push --follow-tags` triggers `.github/workflows/release.yml`: tag/version check, `typecheck`, `lint`, `build`, `yarn zip`, then a GitHub release with `kcr-translate-vX.Y.Z.zip` attached.
- release.yml then calls `.github/workflows/publish-chrome-web-store.yml`, which uploads that zip with the Chrome Web Store API v2 and submits it for review (`publishType: DEFAULT_PUBLISH`, so it goes live when approved).
- Auth is keyless: GitHub OIDC is exchanged through Workload Identity Federation for the `cws-publisher` service account, which is registered in the CWS dashboard. Configuration lives in repository variables (`CWS_PUBLISHER_ID`, `CWS_EXTENSION_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`), not secrets. Without them the publish job is skipped with a warning.
- The store rejects an upload while the previous version is in review. The GitHub release still exists, so retry later with `gh workflow run publish-chrome-web-store.yml -f tag=vX.Y.Z`. `-f check_only=true` tests auth and configuration and uploads nothing.

For agents: a pushed tag publishes to real users after review, so never run `yarn version`, push a tag or dispatch the publish workflow (except with `check_only=true`) unless the user explicitly asks for a release. Before a release, verify the `yarn build` output in KCR (e.g. with the `kcr-canary-debug` skill).

## Architecture

Five webpack entry points under `chrome/`, each emitted as `dist/<name>.js`:

- **`index`** (`content/kindle/`): the main content script. It is injected with `all_frames: true` into every KCR domain listed in `chrome/manifest/baseManifestV3.js`. It runs inside the KCR book iframe but mounts its React root into the **parent** document (`#kindleContentScript`). `waitForKindleCenter()` polls for the KCR DOM and returns `kindleElements` (iframe document and content area), which is then passed everywhere.
- **`background`** (`background/background.ts`): the MV3 service worker. Chrome terminates it when idle, so it keeps no state. It routes messages: it creates the offscreen document on demand (`ensureOffscreenDocument`), forwards OCR requests there along with the tab ID and the current `ocrLangs`, and relays `SET_PROGRESS` back to the tab with `chrome.tabs.sendMessage`.
- **`offscreen`** (`offscreen/`): an offscreen document (reason `WORKERS`) that owns the single tesseract worker. A service worker can't spawn web workers. Only one OCR request runs at a time (`lock`), and a new request cancels the previous one by terminating the worker. The worker is recreated when `ocrLangs` changes and terminated after 5 idle minutes. Offscreen documents only have `chrome.runtime`, so they can't read `chrome.storage` or message tabs; anything that needs those goes through the service worker.
- **`options`** (`options/`): a React options page, also used as the page-action popup. It writes settings to `chrome.storage.sync`.
- **`autoplay`** (`content/autoplay.js`): a content script on translate.google.com that auto-clicks text-to-speech when the selected engine has `autoread` enabled.

### Content script flow

`kindle.tsx` loads the settings, then renders `KindleCloudReaderListener`. This component holds a `useReducer` state machine (`KCRListener/reducer.ts`: `TranslationStatus`, selected areas, detected text, full-page mode) and exposes it through `ContentContext`. It attaches mouseup/dblclick/mousedown listeners to the KCR content area. Two children consume the context:

- `OCR.tsx`: when the status becomes STARTED, `transformSelected()` (`content/kindle/utils.ts`) draws the page image onto a canvas, computes column rectangles from the KCR interaction layer, and sends `{dataUrl, columns}` with `START_RECOGNITION`. The flow is content script → service worker → offscreen document, and the result comes back the same way.
- `DetectedTextContainer.tsx`: portals a span holding the recognized text into the KCR content area. Then it either opens a Google Translate popup window, or, for the `google-ext` engine, programmatically selects the span and dispatches a mouseup so the Google Translate extension's popover fires. Full-page mode (only for `google-ext`) is detected by observing the classes that the Google Translate page translation adds (`KCRListener/utils.ts`). In that mode, the OCR text is shown in place of the page image.

The content script depends on KCR's DOM class names and IDs (`kg-client-dictionary`, `.kg-full-page-img`, `kr-fullpage-app`, etc.). When Amazon changes its markup, these selectors are what break; recent commits such as "fix element finder" are fixes of this kind.

### Shared code

- `chrome/const.ts`: `Commands` (message types), `Engines`, the default engine list, tesseract language codes, and the fixed `chromeExtensionId`. That ID comes from the `key` in `manifest/manifest.json`, and the Cypress puppeteer helpers use it to open the options page.
- `chrome/services/messaging.ts`: typed `Message` union plus promise wrappers around `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage`. Add new message types here and to `Commands`. A runtime message from a content script reaches **every** extension context, including the offscreen document. Messages between the service worker and the offscreen document therefore carry `target: "offscreen" | "background"`. Each `onMessage` listener must ignore messages that aren't addressed to it, and return `true` only for messages it answers asynchronously; otherwise it can swallow another context's response.
- `chrome/services/settings.ts`: the `chrome.storage.sync` wrapper. Every write broadcasts `SETTINGS_UPDATED`, and the service worker reacts by re-injecting `index.js` into the active tab with `chrome.scripting`. This works only on KCR tabs, which are the only ones covered by `host_permissions`.

### Manifest

The manifest is generated at build time by `webpack-extension-manifest-plugin`: `baseManifestV3.js` spreads `manifest.json` and adds the service worker, action, `host_permissions` and content scripts, and `version`/`description` come from `package.json`. Bump the version with `yarn version` (see Release above). Tesseract's `worker.min.js` and `tesseract-core.asm.js` are copied from `node_modules` into `dist/lib/tesseract/` and loaded by the offscreen document with `chrome.runtime.getURL`. tesseract.js stays on 2.1.5 with the asm.js core. Switching to the wasm core (e.g. tesseract.js v5) requires adding `'wasm-unsafe-eval'` to `content_security_policy.extension_pages`.

### E2E tests

`cypress/plugins/index.ts` adds `./dist` as a browser extension, opens a remote-debugging port, and connects puppeteer-core (`cypress/plugins/puppeteer.ts`) to drive the extension's options page, which Cypress cannot reach. Custom commands such as `cy.setExtensionSettings` and `cy.openBook` live in `cypress/support/commands.ts`.
