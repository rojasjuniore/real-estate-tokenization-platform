import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-neutral-100', 'text-neutral-700');
    });
  });

  describe('variants', () => {
    it('renders success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('renders warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });

    it('renders error variant', () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-red-100', 'text-red-700');
    });

    it('renders info variant', () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('renders medium size (default)', () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm');
    });

    it('renders large size', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('px-3', 'py-1.5', 'text-base');
    });
  });

  describe('styling', () => {
    it('has rounded-full class', () => {
      render(<Badge>Rounded</Badge>);
      expect(screen.getByText('Rounded')).toHaveClass('rounded-full');
    });

    it('has inline-flex class', () => {
      render(<Badge>Flex</Badge>);
      expect(screen.getByText('Flex')).toHaveClass('inline-flex');
    });

    it('has font-medium class', () => {
      render(<Badge>Medium font</Badge>);
      expect(screen.getByText('Medium font')).toHaveClass('font-medium');
    });
  });

  describe('custom className', () => {
    it('merges custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-badge', 'rounded-full');
    });
  });

  describe('forwarded ref', () => {
    it('forwards ref to span element', () => {
      const ref = { current: null };
      render(<Badge ref={ref}>Ref Badge</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML span attributes', () => {
      render(<Badge data-testid="test-badge" title="Badge title">Attrs</Badge>);
      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('title', 'Badge title');
    });
  });
});
