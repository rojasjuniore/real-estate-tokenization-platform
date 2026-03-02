import { render, screen, waitFor } from '@testing-library/react';
import AdminPropertiesPage from '../page';

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock useWeb3Auth
const mockUseWeb3Auth = jest.fn();
jest.mock('@/lib/web3auth', () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AdminPropertiesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWeb3Auth.mockReturnValue({
      address: '0xAdminWallet',
      isLoading: false,
      provider: null,
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching properties', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<AdminPropertiesPage />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no properties exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { properties: [] },
        }),
      });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText('No hay propiedades')).toBeInTheDocument();
      });

      expect(screen.getByText('Crear Primera Propiedad')).toBeInTheDocument();
    });
  });

  describe('Properties List', () => {
    const mockProperties = [
      {
        id: 'prop-1',
        tokenId: 1,
        name: 'Casa del Sol',
        location: 'Miami, FL',
        propertyType: 'RESIDENTIAL',
        status: 'ACTIVE',
        totalFractions: 1000,
        availableFractions: 250,
        pricePerFraction: '150.00',
      },
      {
        id: 'prop-2',
        tokenId: 2,
        name: 'Torre Comercial',
        location: 'New York, NY',
        propertyType: 'COMMERCIAL',
        status: 'DRAFT',
        totalFractions: 5000,
        availableFractions: 5000,
        pricePerFraction: '200.00',
      },
    ];

    it('should display properties in table format', async () => {
      // First call for properties, then listing calls
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { properties: mockProperties },
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: false }),
        });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Casa del Sol')).toBeInTheDocument();
      });

      expect(screen.getByText('Torre Comercial')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('should show property location', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { properties: mockProperties },
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: false }),
        });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Miami, FL')).toBeInTheDocument();
      });

      expect(screen.getByText('New York, NY')).toBeInTheDocument();
    });

    it('should display status badges correctly translated', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { properties: mockProperties },
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: false }),
        });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        // Status are translated: ACTIVE -> Activo, DRAFT -> Borrador
        expect(screen.getByText('Activo')).toBeInTheDocument();
      });

      expect(screen.getByText('Borrador')).toBeInTheDocument();
    });

    it('should calculate and display sold percentage', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { properties: mockProperties },
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: false }),
        });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        // Casa del Sol: (1000-250)/1000 = 75%
        expect(screen.getByText('75%')).toBeInTheDocument();
      });

      // Torre Comercial: (5000-5000)/5000 = 0%
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show price per fraction', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { properties: mockProperties },
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: false }),
        });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText('$150.00')).toBeInTheDocument();
      });

      expect(screen.getByText('$200.00')).toBeInTheDocument();
    });

    it('should have edit links for each property', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { properties: mockProperties },
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: false }),
        });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        // Button text is just "Editar" not "Editar →"
        const editLinks = screen.getAllByText('Editar');
        expect(editLinks).toHaveLength(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: {
            message: 'Database connection failed',
          },
        }),
      });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });
    });

    it('should show error when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Header and Actions', () => {
    it('should display page title', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { properties: [] },
        }),
      });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Propiedades')).toBeInTheDocument();
      });
    });

    it('should have link to create new property', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { properties: [] },
        }),
      });

      render(<AdminPropertiesPage />);

      await waitFor(() => {
        const link = screen.getByText('+ Nueva Propiedad');
        expect(link.closest('a')).toHaveAttribute('href', '/admin/properties/new');
      });
    });
  });
});
