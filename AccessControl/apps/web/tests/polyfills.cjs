// O jsdom não expõe TextEncoder/TextDecoder, usados pelo react-router.
const { TextDecoder, TextEncoder } = require('node:util');

Object.assign(globalThis, { TextEncoder, TextDecoder });

// Nem as Web Streams, usadas pela conexão serial (leitor de digital simulado nos testes).
const { ReadableStream, WritableStream, TextDecoderStream } = require('node:stream/web');

Object.assign(globalThis, { ReadableStream, WritableStream, TextDecoderStream });
