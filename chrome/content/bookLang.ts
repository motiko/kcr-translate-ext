import { bookLangDataKey } from "../const";

// Runs in the page's MAIN world at document_start. KCR renders pages as images and doesn't put
// the book language in the DOM, but its `/renderer/render` response (a TAR archive) contains the
// book metadata with `"lang":"de"`. Requests to that endpoint need tokens only KCR has, so read
// KCR's own responses and expose the language on <html> for the isolated-world content script.

const rendererPath = "/renderer/render";
const langPattern = /"lang":"([A-Za-z]{2,3}(?:[-_][A-Za-z0-9]+)*)"/;

let lastAsin: string | null = null;

const readBookLang = async (response: Response, asin: string | null) => {
  // the metadata is the same in every render response of a book, read it once per book
  if (asin && asin === lastAsin) {
    return;
  }
  if (asin !== lastAsin) {
    // another book was opened, don't keep the previous book's language
    delete document.documentElement.dataset[bookLangDataKey];
  }
  const buffer = await response.arrayBuffer();
  // latin1 maps bytes 1:1, so binary entries in the archive can't break decoding
  const match = new TextDecoder("latin1").decode(buffer).match(langPattern);
  lastAsin = asin;
  if (match) {
    document.documentElement.dataset[bookLangDataKey] = match[1];
  }
};

const originalFetch = window.fetch;
window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
  const response = await originalFetch.apply(this, args);
  try {
    const [input] = args;
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.pathname === rendererPath && response.ok) {
      readBookLang(response.clone(), url.searchParams.get("asin")).catch(() => undefined);
    }
  } catch (e) {
    // never break KCR's own request
  }
  return response;
};

export {};
