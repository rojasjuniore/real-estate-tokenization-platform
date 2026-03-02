import { render, screen } from '@testing-library/react';
import { DividendList } from '../DividendList';
import { type DividendInfo } from '../DividendCard';

const mockDividends: DividendInfo[] = [
  {
    distributionId: BigInt(1),
    propertyId: BigInt(1),
    propertyName: 'Luxury Apartment Miami',
    totalAmount: BigInt(10000000000),
    claimableAmount: BigInt(5000000000),
    paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
    paymentSymbol: 'USDT',
    createdAt: BigInt(1700000000),
    hasClaimed: false,
  },
  {
    distributionId: BigInt(2),
    propertyId: BigInt(1),
    propertyName: 'Luxury Apartment Miami',
    totalAmount: BigInt(5000000000),
    claimableAmount: BigInt(2500000000),
    paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
    paymentSymbol: 'USDT',
    createdAt: BigInt(1702000000),
    hasClaimed: true,
  },
];

describe('DividendList', () => {
  const defaultProps = {
    dividends: mockDividends,
    onClaim: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render list of dividends', () => {
    render(<DividendList {...defaultProps} />);
    expect(screen.getByText(/#1/)).toBeInTheDocument();
    expect(screen.getByText(/#2/)).toBeInTheDocument();
  });

  it('should display empty state when no dividends', () => {
    render(<DividendList {...defaultProps} dividends={[]} />);
    expect(screen.getByText(/no distributions/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<DividendList {...defaultProps} isLoading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display total claimable amount', () => {
    render(<DividendList {...defaultProps} />);
    // Only unclaimed: 5,000 USDT (dividend #1)
    expect(screen.getByText(/5,000.*available/i)).toBeInTheDocument();
  });

  it('should show count of unclaimed distributions', () => {
    render(<DividendList {...defaultProps} />);
    expect(screen.getByText(/1 unclaimed/i)).toBeInTheDocument();
  });
});
