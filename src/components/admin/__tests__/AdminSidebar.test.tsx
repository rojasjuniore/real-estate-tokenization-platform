import { render, screen } from '@testing-library/react';
import AdminSidebar from '../AdminSidebar';

// Mock next/navigation
const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Note: wagmi is already mocked globally via moduleNameMapper in jest.config.ts

describe('AdminSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/admin');
  });

  describe('Navigation Links', () => {
    it('should render dashboard link', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should render properties link', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Propiedades')).toBeInTheDocument();
    });

    it('should render dividends link', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Distribuciones')).toBeInTheDocument();
    });

    it('should render users link', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });

    it('should render KYC link', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Verificación KYC')).toBeInTheDocument();
    });

    // Marketplace link is commented out in the component
    it('should render contracts link', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Contratos')).toBeInTheDocument();
    });

    it('should render roles link', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Gestión de Roles')).toBeInTheDocument();
    });

    it('should render settings link', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    // Component uses bg-[#0e4d80]/10 for active state
    it('should highlight dashboard when on /admin', () => {
      mockUsePathname.mockReturnValue('/admin');
      render(<AdminSidebar />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-[#0e4d80]/10');
    });

    it('should highlight properties when on /admin/properties', () => {
      mockUsePathname.mockReturnValue('/admin/properties');
      render(<AdminSidebar />);

      const propertiesLink = screen.getByText('Propiedades').closest('a');
      expect(propertiesLink).toHaveClass('bg-[#0e4d80]/10');
    });

    it('should highlight settings when on /admin/settings', () => {
      mockUsePathname.mockReturnValue('/admin/settings');
      render(<AdminSidebar />);

      const settingsLink = screen.getByText('Configuración').closest('a');
      expect(settingsLink).toHaveClass('bg-[#0e4d80]/10');
    });

    it('should not highlight dashboard when on other pages', () => {
      mockUsePathname.mockReturnValue('/admin/properties');
      render(<AdminSidebar />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).not.toHaveClass('bg-[#0e4d80]/10');
    });
  });

  describe('Branding', () => {
    it('should display admin panel title', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('TokenByU')).toBeInTheDocument();
    });

    it('should display admin badge', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should have correct href for dashboard', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Dashboard').closest('a');
      expect(link).toHaveAttribute('href', '/admin');
    });

    it('should have correct href for properties', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Propiedades').closest('a');
      expect(link).toHaveAttribute('href', '/admin/properties');
    });

    it('should have correct href for dividends', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Distribuciones').closest('a');
      expect(link).toHaveAttribute('href', '/admin/dividends');
    });

    it('should have correct href for users', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Usuarios').closest('a');
      expect(link).toHaveAttribute('href', '/admin/users');
    });

    it('should have correct href for kyc', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Verificación KYC').closest('a');
      expect(link).toHaveAttribute('href', '/admin/kyc');
    });

    it('should have correct href for contracts', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Contratos').closest('a');
      expect(link).toHaveAttribute('href', '/admin/contracts');
    });

    it('should have correct href for roles', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Gestión de Roles').closest('a');
      expect(link).toHaveAttribute('href', '/admin/roles');
    });

    it('should have correct href for settings', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Configuración').closest('a');
      expect(link).toHaveAttribute('href', '/admin/settings');
    });
  });

  describe('Footer', () => {
    it('should render site link in footer', () => {
      render(<AdminSidebar />);
      expect(screen.getByText('Ir al Sitio')).toBeInTheDocument();
    });

    it('should have correct href for site link', () => {
      render(<AdminSidebar />);
      const link = screen.getByText('Ir al Sitio').closest('a');
      expect(link).toHaveAttribute('href', '/');
    });
  });
});
