import { vi } from 'vitest';

// Mock NextAuth
export const mockSession = {
  user: { id: 'user-1', email: 'test@test.com', name: 'Test User', role: 'USER' as const },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

export const mockAdminSession = {
  user: { id: 'admin-1', email: 'admin@yogaflow.fr', name: 'Admin', role: 'ADMIN' as const },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

export const authMock = vi.fn().mockResolvedValue(mockSession);

vi.mock('@/lib/auth', () => ({
  auth: authMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

export function setSession(session: typeof mockSession | typeof mockAdminSession | null) {
  authMock.mockResolvedValue(session);
}
