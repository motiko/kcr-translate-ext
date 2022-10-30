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
  manifest_version: 2,
  background: {
    scripts: ["background.js"],
    persistent: false,
  },
  options_ui: {
    page: "options.html",
  },
  page_action: {
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
      matches: kindleCloudReaderMatches.map(makeUrl),
      js: ["index.js"],
      run_at: "document_end",
      all_frames: true, // allowed running extension for iframe
    },
  ],
};
