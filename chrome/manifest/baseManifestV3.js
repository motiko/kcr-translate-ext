const commonManifest = require("./manifest.json");

const makeUrl = (str) => `https://${str}/*`;

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

// Convert matches arrays to host permissions
const hostPermissions = [
  ...kindleCloudReaderMatches.map(makeUrl),
  ...autoplayMatches.map(makeUrl)
];

module.exports = {
  ...commonManifest,
  manifest_version: 3,
  background: {
    service_worker: "background.js",
    type: "module"
  },
  options_ui: {
    page: "options.html",
    open_in_tab: false
  },
  action: {
    default_icon: "img/book_16.png",
    default_popup: "options.html"
  },
  host_permissions: hostPermissions,
  permissions: [
    "storage",
    "activeTab",
    "scripting",
    "offscreen"
  ],
  content_scripts: [
    {
      matches: autoplayMatches.map(makeUrl),
      js: ["autoplay.js"],
      run_at: "document_idle"
    },
    {
      matches: kindleCloudReaderMatches.map(makeUrl),
      js: ["index.js"],
      run_at: "document_idle",
      all_frames: true // allowed running extension for iframe
    }
  ]
};
