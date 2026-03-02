import { render, screen, fireEvent } from '@testing-library/react';
import { DividendCard, type DividendInfo } from '../DividendCard';

const mockDividend: DividendInfo = {
  distributionId: BigInt(1),
  propertyId: BigInt(1),
  propertyName: 'Luxury Apartment Miami',
  totalAmount: BigInt(10000000000), // 10,000 USDT (6 decimals)
  claimableAmount: BigInt(5000000000), // 5,000 USDT
  paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
  paymentSymbol: 'USDT',
  createdAt: BigInt(1700000000),
  hasClaimed: false,
};

describe('DividendCard', () => {
  const defaultProps = {
    dividend: mockDividend,
    onClaim: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render distribution info', () => {
    render(<DividendCard {...defaultProps} />);
    expect(screen.getByText('Luxury Apartment Miami')).toBeInTheDocument();
  });

  it('should display total distribution amount', () => {
    render(<DividendCard {...defaultProps} />);
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
  });

  it('should display claimable amount', () => {
    render(<DividendCard {...defaultProps} />);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it('should display payment token symbol', () => {
    render(<DividendCard {...defaultProps} />);
    const usdtElements = screen.getAllByText(/USDT/);
    expect(usdtElements.length).toBeGreaterThan(0);
  });

  it('should show claim button when not claimed', () => {
    render(<DividendCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /claim/i })).toBeInTheDocument();
  });

  it('should call onClaim when claim button clicked', () => {
    render(<DividendCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /claim/i }));
    expect(defaultProps.onClaim).toHaveBeenCalledWith(BigInt(1));
  });

  it('should disable claim button when isPending', () => {
    render(<DividendCard {...defaultProps} isPending />);
    expect(screen.getByRole('button', { name: /claiming/i })).toBeDisabled();
  });

  it('should show claimed status when hasClaimed is true', () => {
    const claimedDividend = { ...mockDividend, hasClaimed: true };
    render(<DividendCard {...defaultProps} dividend={claimedDividend} />);
    expect(screen.getByText(/claimed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /claim/i })).not.toBeInTheDocument();
  });

  it('should display distribution date', () => {
    render(<DividendCard {...defaultProps} />);
    // Date should be formatted (Nov 14, 2023 for timestamp 1700000000)
    expect(screen.getByText(/nov/i)).toBeInTheDocument();
  });

  it('should show distribution ID', () => {
    render(<DividendCard {...defaultProps} />);
    expect(screen.getByText(/#1/)).toBeInTheDocument();
  });

  it('should disable claim button when claimableAmount is zero', () => {
    const nothingToClaim = { ...mockDividend, claimableAmount: BigInt(0) };
    render(<DividendCard {...defaultProps} dividend={nothingToClaim} />);
    expect(screen.getByRole('button', { name: /claim/i })).toBeDisabled();
  });
});
