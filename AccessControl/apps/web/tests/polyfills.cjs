// O jsdom não expõe TextEncoder/TextDecoder, usados pelo react-router.
const { TextDecoder, TextEncoder } = require('node:util');
// Nem os streams, usados pela conexão serial com o Arduino.
const { ReadableStream, TextDecoderStream, WritableStream } = require('node:stream/web');

Object.assign(globalThis, { TextEncoder, TextDecoder, ReadableStream, TextDecoderStream, WritableStream });
