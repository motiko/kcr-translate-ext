const commonManifest = require("./manifest.json");

const makeUrl = (str) => `https://${str}/*`;
// const makeKindleUrl = (str) => `https://${str}/KindleReaderApp`; // kindle book iframe

const kindleCloudReaderMatches = [
  "lesen.amazon.de",
  "leer.amazon.es",
  "leer.amazon.com.mx",
  "read.amazon.ca",
  "read.amazon.com",
  "read.amazon.co.jp",
  "read.amazon.in",
  "read.amazon.com.au",
  "ler.amazon.com.br",
  "lire.amazon.fr",
  "leggi.amazon.it",
  "read.amazon.co.uk",
];

const autoplayMatches = ["translate.google.com"];

module.exports = {
  ...commonManifest,
  manifest_version: 3,
  minimum_chrome_version: "116", // chrome.offscreen + chrome.runtime.getContexts
  background: {
    service_worker: "background.js",
  },
  host_permissions: kindleCloudReaderMatches.map(makeUrl),
  options_ui: {
    page: "options.html",
  },
  action: {
    default_icon: "img/book_16.png",
    default_popup: "options.html",
  },
  content_scripts: [
    {
      matches: autoplayMatches.map(makeUrl),
      js: ["autoplay.js"],
      run_at: "document_end",
    },
    {
      // reads the book language from KCR's own requests, so it has to run in the page's world
      // before KCR starts
      matches: kindleCloudReaderMatches.map(makeUrl),
      js: ["bookLang.js"],
      run_at: "document_start",
      all_frames: true,
      world: "MAIN",
    },
    {
      matches: kindleCloudReaderMatches.map(makeUrl),
      js: ["index.js"],
      run_at: "document_end",
      all_frames: true, // allowed running extension for iframe
    },
  ],
};
