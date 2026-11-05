// O jsdom não expõe TextEncoder/TextDecoder, usados pelo react-router.
const { TextDecoder, TextEncoder } = require('node:util');

Object.assign(globalThis, { TextEncoder, TextDecoder });
