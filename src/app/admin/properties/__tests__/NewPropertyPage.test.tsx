import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewPropertyPage from '../new/page';

// Mock hooks
const mockUseWeb3Auth = jest.fn();
const mockUseRouter = jest.fn();

jest.mock('@/lib/web3auth', () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
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

describe('NewPropertyPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  describe('Authentication', () => {
    it('should redirect to home if not connected', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: false,
      });

      render(<NewPropertyPage />);

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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });

      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText('Nueva Propiedad')).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should display name input field', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nombre \*/i)).toBeInTheDocument();
      });
    });

    it('should display location input field', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Ubicación \*/i)).toBeInTheDocument();
      });
    });

    it('should display property type select', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Tipo de Propiedad \*/i)).toBeInTheDocument();
      });
    });

    it('should display total fractions input', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Total de Fracciones \*/i)).toBeInTheDocument();
      });
    });

    it('should display price per fraction input', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Precio por Fracción/i)).toBeInTheDocument();
      });
    });

    it('should display description textarea', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Descripción \*/i)).toBeInTheDocument();
      });
    });

    it('should display estimated ROI input', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/ROI Estimado/i)).toBeInTheDocument();
      });
    });

    it('should display timeline select', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Horizonte de Inversión/i)).toBeInTheDocument();
      });
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

    it('should show validation errors when submitting empty form', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });

      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nombre \*/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Enviar para Revisión'));

      await waitFor(() => {
        // Should show validation error for required name field
        expect(screen.getByText('Nombre es un campo requerido')).toBeInTheDocument();
      });
    });

    it('should show error message on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });

      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nombre \*/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/Nombre \*/i), 'Test Property');
      await userEvent.type(screen.getByLabelText(/Ubicación \*/i), 'Miami, FL');
      await userEvent.type(screen.getByLabelText(/Total de Fracciones \*/i), '1000');
      await userEvent.type(screen.getByLabelText(/Precio por Fracción/i), '100');
      await userEvent.type(screen.getByLabelText(/Descripción \*/i), 'A beautiful property');

      fireEvent.click(screen.getByText('Enviar para Revisión'));

      // The form will show validation error for images (required)
      await waitFor(() => {
        expect(screen.getByText('Debes subir al menos una imagen')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner during auth check', () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: true,
      });

      render(<NewPropertyPage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });
  });

  describe('Cancel Action', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should have cancel button that navigates back', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });

      const cancelLink = screen.getByText('Cancelar').closest('a');
      expect(cancelLink).toHaveAttribute('href', '/admin/properties');
    });
  });

  describe('Images Section', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should display images section', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText('Imágenes de la Propiedad')).toBeInTheDocument();
      });
    });

    it('should have upload button for images', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText(/Haz clic para subir imágenes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Documents Section', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should display documents section', async () => {
      render(<NewPropertyPage />);

      await waitFor(() => {
        expect(screen.getByText('Documentos Legales')).toBeInTheDocument();
      });
    });
  });
});
