import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditPropertyPage from '../[id]/page';

// Mock hooks
const mockUseWeb3Auth = jest.fn();
const mockUseRouter = jest.fn();
const mockUseParams = jest.fn();

jest.mock('@/lib/web3auth', () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  useParams: () => mockUseParams(),
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: React.ComponentProps<'img'>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('EditPropertyPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  const mockProperty = {
    id: 'prop-123',
    tokenId: 1,
    name: 'Casa del Sol',
    location: 'Miami, FL',
    mapUrl: null,
    propertyType: 'RESIDENTIAL',
    status: 'ACTIVE',
    totalFractions: 1000,
    availableFractions: 750,
    pricePerFraction: '150.00',
    description: 'Beautiful property',
    metadataUri: 'ipfs://hash123',
    estimatedROI: 8.5,
    timeline: 'SHORT_TERM',
    images: ['https://example.com/image1.jpg'],
    documents: [],
    mintTxHash: null,
    approveTxHash: null,
    listingTxHash: null,
    mintBlockNumber: null,
    contractAddress: null,
    chainId: null,
    mintedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    mockUseParams.mockReturnValue({ id: 'prop-123' });
  });

  describe('Authentication', () => {
    it('should redirect to home if not connected', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: false,
      });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/#home');
      });
    });

    it('should show form if admin is authenticated', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText('Editar Propiedad')).toBeInTheDocument();
      });
    });
  });

  describe('Loading Property Data', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should load and display existing property data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Casa del Sol')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Miami, FL')).toBeInTheDocument();
    });

    it('should show error when property not found', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: false,
            error: { message: 'Property not found' }
          }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText('Property not found')).toBeInTheDocument();
      });
    });
  });

  describe('Status Management', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should display current status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        const statusSelect = screen.getByLabelText(/Estado/i) as HTMLSelectElement;
        expect(statusSelect.value).toBe('ACTIVE');
      });
    });

    it('should have status options', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Borrador' })).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: 'Activo' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pausado' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Agotado' })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should call PATCH API with updated data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { ...mockProperty, name: 'Updated Name' } }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Casa del Sol')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Nombre \*/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Name');

      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/properties/prop-123',
          expect.objectContaining({
            method: 'PATCH',
          })
        );
      });
    });

    it('should redirect to properties list on success', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Casa del Sol')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/properties');
      });
    });

    it('should show error message on API failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: false,
            error: { message: 'Update failed' }
          }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Casa del Sol')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Guardar Cambios'));

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Action', () => {
    it('should have cancel button that navigates back', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        });

      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });

      const cancelLink = screen.getByText('Cancelar').closest('a');
      expect(cancelLink).toHaveAttribute('href', '/admin/properties');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner during auth check', () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: true,
      });

      render(<EditPropertyPage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });
  });

  describe('Images Section', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockProperty }),
        });
    });

    it('should display images section', async () => {
      render(<EditPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText('Imagenes de la Propiedad')).toBeInTheDocument();
      });
    });
  });
});
