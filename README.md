# Kindle Cloud Reader Translate

A Chrome extension that adds translation to [Kindle Cloud Reader](https://read.amazon.com/). Kindle Cloud Reader renders book pages as images, so the extension recognizes the selected text with OCR ([tesseract.js](https://github.com/naptha/tesseract.js)) and passes it to a translation engine: a Google Translate popup, the Google Translate extension, dict.cc, or a custom URL.

## Development

Requirements: Node 24 and yarn 1.

```sh
yarn install
yarn build        # production build into dist/
yarn dev          # watch build with auto-reload of the extension and the Kindle tab
yarn typecheck
yarn lint
```

Load `dist/` as an unpacked extension in `chrome://extensions` (with Developer mode on), then open a book in Kindle Cloud Reader.

Every pull request runs `typecheck`, `lint` and `build` in CI ([`ci.yml`](.github/workflows/ci.yml)). The built `dist/` is attached to the run as the `kcr-translate-dist` artifact, so you can load a PR build without building it yourself.

The Cypress e2e tests (`yarn test:cypress`) log in to a real Amazon account and run locally only; see `CLAUDE.md` for the details.

## Releasing

```sh
git checkout main && git pull
yarn version --minor    # or --patch / --major: bumps package.json, commits, tags vX.Y.Z
git push --follow-tags
```

Pushing the tag runs the [release workflow](.github/workflows/release.yml):

1. It checks that the tag matches the version in `package.json`.
2. It runs `typecheck`, `lint` and `build`, zips `dist/` and creates a GitHub release with generated notes and `kcr-translate-vX.Y.Z.zip` attached.
3. It uploads the zip to the Chrome Web Store and submits it for review ([`publish-chrome-web-store.yml`](.github/workflows/publish-chrome-web-store.yml)). The new version goes live automatically once the review passes.

The Chrome Web Store accepts no new upload while the previous version is still in review, so step 3 fails in that case. The GitHub release is created anyway. After the review finishes, publish the existing release again:

```sh
gh workflow run publish-chrome-web-store.yml -f tag=vX.Y.Z
```

The same command retries any other failed upload. Check the review state in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

If the Chrome Web Store isn't configured (see below), step 3 is skipped with a warning, and you upload the zip from the GitHub release in the dashboard by hand.

### One-time setup: Chrome Web Store publishing

The workflow authenticates without stored secrets. GitHub Actions gets an OIDC token, Google [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation) exchanges it for a short-lived access token of a service account, and that service account is registered as a publisher account in the Chrome Web Store. Only workflows from this repository can use it.

You need the [gcloud CLI](https://cloud.google.com/sdk/docs/install), a Google Cloud project, and access to the Chrome Web Store developer account.

1. Set up the Google Cloud side:

   ```sh
   gcloud auth login
   PROJECT_ID=kcr-translate-release          # any free project ID
   REPO=motiko/kcr-translate-ext
   REPO_ID=$(gh api repos/$REPO --jq .id)

   gcloud projects create $PROJECT_ID --name="KCR Translate release"
   gcloud config set project $PROJECT_ID
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

   gcloud services enable chromewebstore.googleapis.com iam.googleapis.com \
     iamcredentials.googleapis.com sts.googleapis.com

   gcloud iam service-accounts create cws-publisher --display-name="Chrome Web Store publisher"
   SERVICE_ACCOUNT=cws-publisher@$PROJECT_ID.iam.gserviceaccount.com

   gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions"
   gcloud iam workload-identity-pools providers create-oidc github \
     --location=global --workload-identity-pool=github \
     --issuer-uri=https://token.actions.githubusercontent.com \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id" \
     --attribute-condition="assertion.repository_id == '$REPO_ID'"

   gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
     --role=roles/iam.workloadIdentityUser \
     --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository_id/$REPO_ID"
   ```

   The condition uses the repository's numeric ID, not its name, so a renamed or recreated repository with the same name can't use the pool.

2. In the [Developer Dashboard](https://chrome.google.com/webstore/devconsole), open **Account** and add the service account email (`cws-publisher@<project-id>.iam.gserviceaccount.com`). A publisher can have only one service account.

3. Note the publisher ID (dashboard: **Publisher > Settings**) and the extension's item ID (the 32-letter ID in its store URL), then set the repository variables:

   ```sh
   gh variable set CWS_PUBLISHER_ID --body "<publisher id>"
   gh variable set CWS_EXTENSION_ID --body "<item id>"
   gh variable set GCP_SERVICE_ACCOUNT --body "$SERVICE_ACCOUNT"
   gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER \
     --body "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github"
   ```

   These are variables, not secrets: none of them grants access on its own.

4. Check the setup. This authenticates and reads the item's status from the store without uploading anything:

   ```sh
   gh workflow run publish-chrome-web-store.yml -f check_only=true
   gh run watch "$(gh run list --workflow=publish-chrome-web-store.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
   ```

   The run summary shows the published and the submitted version.

Publishing requires 2-step verification on the Google account that owns the developer account.

## Credits

[ACRExtensions](https://github.com/ccimpoi/ACRExtensions)  
[André Klein's bookmarklet](https://learnoutlive.com/apps/kindle_hack.js)

<div>Icons made by <a href="https://www.flaticon.com/authors/popcorns-arts" title="Icon Pond">Icon Pond</a> from <a href="https://www.flaticon.com/" 			    title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" 			    title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
