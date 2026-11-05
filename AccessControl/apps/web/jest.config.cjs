/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/polyfills.cjs'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          esModuleInterop: true,
          isolatedModules: true,
          types: ['jest', '@testing-library/jest-dom', 'w3c-web-serial'],
        },
      },
    ],
  },
  moduleNameMapper: {
    // import.meta.env não existe no Jest: usa uma configuração fixa nos testes.
    '^(\\.{1,2}/)+app-config$': '<rootDir>/tests/mocks/app-config.ts',
    // O Supabase Auth é simulado nos testes (sem rede).
    '^(\\.{1,2}/)+lib/supabase$': '<rootDir>/tests/mocks/supabase.ts',
    '\\.(css)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|svg|webp)$': '<rootDir>/tests/mocks/file.ts',
  },
  clearMocks: true,
};
