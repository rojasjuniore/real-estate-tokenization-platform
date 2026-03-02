import { render, screen, fireEvent } from '@testing-library/react';
import { CreateDistributionForm } from '../CreateDistributionForm';

const mockPaymentTokens = [
  { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`, symbol: 'USDT', decimals: 6 },
  { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' as `0x${string}`, symbol: 'USDC', decimals: 6 },
];

const mockProperties = [
  { id: BigInt(1), name: 'Luxury Apartment Miami' },
  { id: BigInt(2), name: 'Beach House California' },
];

describe('CreateDistributionForm', () => {
  const defaultProps = {
    paymentTokens: mockPaymentTokens,
    properties: mockProperties,
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form title', () => {
    render(<CreateDistributionForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /create distribution/i })).toBeInTheDocument();
  });

  it('should have property selector', () => {
    render(<CreateDistributionForm {...defaultProps} />);
    expect(screen.getByLabelText(/property/i)).toBeInTheDocument();
  });

  it('should display property options', () => {
    render(<CreateDistributionForm {...defaultProps} />);
    const select = screen.getByLabelText(/property/i);
    fireEvent.click(select);
    expect(screen.getByText('Luxury Apartment Miami')).toBeInTheDocument();
    expect(screen.getByText('Beach House California')).toBeInTheDocument();
  });

  it('should have amount input', () => {
    render(<CreateDistributionForm {...defaultProps} />);
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  it('should have payment token selector', () => {
    render(<CreateDistributionForm {...defaultProps} />);
    expect(screen.getByLabelText(/payment token/i)).toBeInTheDocument();
  });

  it('should display payment token options', () => {
    render(<CreateDistributionForm {...defaultProps} />);
    const select = screen.getByLabelText(/payment token/i);
    fireEvent.click(select);
    expect(screen.getByText('USDT')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('should have submit button', () => {
    render(<CreateDistributionForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('should disable submit when form is incomplete', () => {
    render(<CreateDistributionForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
  });

  it('should call onSubmit with correct data', () => {
    render(<CreateDistributionForm {...defaultProps} />);

    // Select property
    const propertySelect = screen.getByLabelText(/property/i);
    fireEvent.change(propertySelect, { target: { value: '1' } });

    // Enter amount
    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '10000' } });

    // Select payment token
    const tokenSelect = screen.getByLabelText(/payment token/i);
    fireEvent.change(tokenSelect, { target: { value: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      propertyId: BigInt(1),
      amount: BigInt(10000000000), // 10000 with 6 decimals
      paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    });
  });

  it('should show loading state when isPending', () => {
    render(<CreateDistributionForm {...defaultProps} isPending />);
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
  });

  it('should disable form when isPending', () => {
    render(<CreateDistributionForm {...defaultProps} isPending />);
    expect(screen.getByLabelText(/property/i)).toBeDisabled();
    expect(screen.getByLabelText(/amount/i)).toBeDisabled();
    expect(screen.getByLabelText(/payment token/i)).toBeDisabled();
  });
});
