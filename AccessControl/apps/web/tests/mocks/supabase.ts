/** Supabase Auth simulado: cada teste define as respostas com mockResolvedValue. */
type MockSession = { access_token: string } | null;

let session: MockSession = null;

export const AUTH_STORAGE_KEY = 'helpus.auth';

export const setMockSession = (value: MockSession) => {
  session = value;
};

export const authError = (code: string, status = 400) => ({
  __isAuthError: true,
  name: 'AuthApiError',
  code,
  status,
  message: code,
});

const ok = { data: {}, error: null };

export const supabase = {
  auth: {
    getSession: jest.fn(async () => ({ data: { session }, error: null })),
    signInWithPassword: jest.fn(async () => ok),
    signUp: jest.fn(async () => ok),
    verifyOtp: jest.fn(async () => ok),
    resend: jest.fn(async () => ok),
    resetPasswordForEmail: jest.fn(async () => ok),
    updateUser: jest.fn(async () => ok),
    signOut: jest.fn(async () => {
      session = null;
      return { error: null };
    }),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
};
