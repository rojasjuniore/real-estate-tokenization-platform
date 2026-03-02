import { render, screen, fireEvent } from '@testing-library/react';
import { PurchaseModal } from '../PurchaseModal';

const mockListing = {
  id: BigInt(1),
  seller: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  propertyId: BigInt(1),
  propertyName: 'Luxury Apartment Miami',
  amount: BigInt(1000),
  pricePerToken: BigInt(100000000), // 100 USDT (6 decimals)
  paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
  paymentSymbol: 'USDT',
};

describe('PurchaseModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    listing: mockListing,
    onPurchase: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(<PurchaseModal {...defaultProps} />);
    expect(screen.getByText('Buy Fractions')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<PurchaseModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Buy Fractions')).not.toBeInTheDocument();
  });

  it('should display property name', () => {
    render(<PurchaseModal {...defaultProps} />);
    expect(screen.getByText('Luxury Apartment Miami')).toBeInTheDocument();
  });

  it('should display available fractions', () => {
    render(<PurchaseModal {...defaultProps} />);
    expect(screen.getByText(/1,000 fractions available/)).toBeInTheDocument();
  });

  it('should have quantity input', () => {
    render(<PurchaseModal {...defaultProps} />);
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
  });

  it('should update total price when quantity changes', () => {
    render(<PurchaseModal {...defaultProps} />);
    const input = screen.getByLabelText(/quantity/i);
    fireEvent.change(input, { target: { value: '10' } });
    // Total should be in the blue section
    const totalSection = screen.getByText('Total').parentElement;
    expect(totalSection).toHaveTextContent('1,000');
  });

  it('should display price per fraction', () => {
    render(<PurchaseModal {...defaultProps} />);
    // Price per fraction is in the green section
    const priceSection = screen.getByText('Price per fraction').parentElement;
    expect(priceSection).toHaveTextContent('100 USDT');
  });

  it('should have confirm purchase button', () => {
    render(<PurchaseModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /confirm purchase/i })).toBeInTheDocument();
  });

  it('should call onPurchase with quantity when confirmed', () => {
    render(<PurchaseModal {...defaultProps} />);
    const input = screen.getByLabelText(/quantity/i);
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm purchase/i }));
    expect(defaultProps.onPurchase).toHaveBeenCalledWith(BigInt(5));
  });

  it('should disable confirm button when quantity is 0', () => {
    render(<PurchaseModal {...defaultProps} />);
    const input = screen.getByLabelText(/quantity/i);
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.getByRole('button', { name: /confirm purchase/i })).toBeDisabled();
  });

  it('should disable confirm button when quantity exceeds available', () => {
    render(<PurchaseModal {...defaultProps} />);
    const input = screen.getByLabelText(/quantity/i);
    fireEvent.change(input, { target: { value: '2000' } });
    expect(screen.getByRole('button', { name: /confirm purchase/i })).toBeDisabled();
  });

  it('should show error message when quantity exceeds available', () => {
    render(<PurchaseModal {...defaultProps} />);
    const input = screen.getByLabelText(/quantity/i);
    fireEvent.change(input, { target: { value: '2000' } });
    expect(screen.getByText(/exceeds available/i)).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', () => {
    render(<PurchaseModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show loading state when isPending', () => {
    render(<PurchaseModal {...defaultProps} isPending />);
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('should disable buttons when isPending', () => {
    render(<PurchaseModal {...defaultProps} isPending />);
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });

  it('should have max button to set max quantity', () => {
    render(<PurchaseModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /max/i }));
    const input = screen.getByLabelText(/quantity/i) as HTMLInputElement;
    expect(input.value).toBe('1000');
  });
});
