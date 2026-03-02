import { render, screen } from '@testing-library/react';
import { Spinner, LoadingOverlay } from '../Spinner';

describe('Spinner', () => {
  describe('rendering', () => {
    it('renders spinner element', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has accessible label', () => {
      render(<Spinner />);
      expect(screen.getByLabelText('Cargando')).toBeInTheDocument();
    });

    it('has screen reader text', () => {
      render(<Spinner />);
      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Spinner size="sm" />);
      expect(screen.getByRole('status')).toHaveClass('w-4', 'h-4');
    });

    it('renders medium size (default)', () => {
      render(<Spinner size="md" />);
      expect(screen.getByRole('status')).toHaveClass('w-8', 'h-8');
    });

    it('renders large size', () => {
      render(<Spinner size="lg" />);
      expect(screen.getByRole('status')).toHaveClass('w-12', 'h-12');
    });
  });

  describe('styling', () => {
    it('has animation class', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveClass('animate-spin');
    });

    it('has border styling', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveClass('border-2', 'rounded-full');
    });

    it('has primary color', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveClass('text-primary-500');
    });
  });

  describe('custom className', () => {
    it('merges custom className', () => {
      render(<Spinner className="custom-spinner" />);
      expect(screen.getByRole('status')).toHaveClass('custom-spinner', 'animate-spin');
    });
  });
});

describe('LoadingOverlay', () => {
  describe('rendering', () => {
    it('renders nothing when isLoading is false', () => {
      render(<LoadingOverlay isLoading={false} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('renders overlay when isLoading is true', () => {
      render(<LoadingOverlay isLoading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('displays default message', () => {
      render(<LoadingOverlay isLoading={true} />);
      const messages = screen.getAllByText('Cargando...');
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    it('displays custom message', () => {
      render(<LoadingOverlay isLoading={true} message="Procesando..." />);
      expect(screen.getByText('Procesando...')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has fixed positioning', () => {
      render(<LoadingOverlay isLoading={true} />);
      const overlay = screen.getByRole('status').closest('.fixed');
      expect(overlay).toBeInTheDocument();
    });

    it('has backdrop blur', () => {
      render(<LoadingOverlay isLoading={true} />);
      const overlay = screen.getByRole('status').closest('.backdrop-blur-sm');
      expect(overlay).toBeInTheDocument();
    });

    it('has z-index 50', () => {
      render(<LoadingOverlay isLoading={true} />);
      const overlay = screen.getByRole('status').closest('.z-50');
      expect(overlay).toBeInTheDocument();
    });
  });
});
