import { render, screen } from '@testing-library/react';
import { TokenBalance } from '../TokenBalance';

describe('TokenBalance', () => {
  describe('rendering', () => {
    it('renders token symbol and balance', () => {
      render(<TokenBalance symbol="MATIC" balance="10.5432" />);
      expect(screen.getByText('MATIC')).toBeInTheDocument();
      expect(screen.getByText('10.5432')).toBeInTheDocument();
    });

    it('renders with custom icon when provided', () => {
      const icon = <span data-testid="custom-icon">💰</span>;
      render(<TokenBalance symbol="USDT" balance="100.00" icon={icon} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders zero balance correctly', () => {
      render(<TokenBalance symbol="USDC" balance="0" />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders large balances correctly', () => {
      render(<TokenBalance symbol="MATIC" balance="1000000.1234" />);
      expect(screen.getByText('1000000.1234')).toBeInTheDocument();
    });
  });

  describe('formatting', () => {
    it('applies correct text styles', () => {
      render(<TokenBalance symbol="MATIC" balance="10.5" />);
      const symbolElement = screen.getByText('MATIC');
      expect(symbolElement).toHaveClass('font-medium');
    });
  });

  describe('accessibility', () => {
    it('provides semantic structure', () => {
      render(<TokenBalance symbol="MATIC" balance="10.5" />);
      const container = screen.getByText('MATIC').closest('div');
      expect(container).toBeInTheDocument();
    });
  });
});
