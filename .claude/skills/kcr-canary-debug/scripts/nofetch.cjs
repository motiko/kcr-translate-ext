// tesseract.js 2.x in node: its emscripten loader uses fetch() when it exists, and Node 18+'s
// fetch can't load a local file path ("Failed to parse URL from .../tesseract-core.wasm").
// Preload with NODE_OPTIONS="--require <this file>" so the forked tesseract worker gets it too.
delete globalThis.fetch;
