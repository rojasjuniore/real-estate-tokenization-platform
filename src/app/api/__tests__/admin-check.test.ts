/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../admin/check/route';

// Mock isAdmin function
jest.mock('@/lib/auth/admin', () => ({
  isAdmin: jest.fn(),
}));

import { isAdmin } from '@/lib/auth/admin';
const mockIsAdmin = isAdmin as jest.MockedFunction<typeof isAdmin>;

describe('GET /api/admin/check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when wallet address is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/check', {
      headers: {},
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
    expect(data.error.message).toBe('Wallet address required');
  });

  it('should return isAdmin true for admin wallet', async () => {
    mockIsAdmin.mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/admin/check', {
      headers: {
        'x-wallet-address': '0xAdminWallet123',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isAdmin).toBe(true);
    expect(mockIsAdmin).toHaveBeenCalledWith('0xAdminWallet123');
  });

  it('should return isAdmin false for non-admin wallet', async () => {
    mockIsAdmin.mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/admin/check', {
      headers: {
        'x-wallet-address': '0xRegularUser456',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isAdmin).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    mockIsAdmin.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/admin/check', {
      headers: {
        'x-wallet-address': '0xTestWallet789',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INTERNAL_ERROR');
    expect(data.error.message).toBe('Error checking admin status');
  });
});
