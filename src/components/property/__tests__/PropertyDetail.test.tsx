import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyDetail } from '../PropertyDetail';
import { Property } from '../PropertyCard';

const mockProperty: Property = {
  id: 1,
  name: 'Luxury Apartment Miami',
  location: 'Miami Beach, FL',
  imageUrl: '/images/property-1.jpg',
  price: '1000000',
  totalFractions: 10000,
  availableFractions: 5000,
  pricePerFraction: '100',
  annualYield: 8.5,
  propertyType: 'Apartment',
};

const mockPropertyDetails = {
  description: 'Beautiful oceanfront apartment with stunning views.',
  amenities: ['Pool', 'Gym', 'Parking', 'Security'],
  documents: [
    { name: 'Property Deed', url: '/docs/deed.pdf' },
    { name: 'Inspection Report', url: '/docs/inspection.pdf' },
  ],
  rentalIncome: '8000',
  occupancyRate: 95,
  propertyManager: 'Miami Properties LLC',
};

describe('PropertyDetail', () => {
  it('should render property name and location', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    expect(screen.getByText('Luxury Apartment Miami')).toBeInTheDocument();
    expect(screen.getByText('Miami Beach, FL')).toBeInTheDocument();
  });

  it('should render property image', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    const image = screen.getByAltText('Luxury Apartment Miami');
    expect(image).toBeInTheDocument();
  });

  it('should render property description', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    expect(screen.getByText('Beautiful oceanfront apartment with stunning views.')).toBeInTheDocument();
  });

  it('should render investment metrics', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    expect(screen.getByText('$100')).toBeInTheDocument(); // price per fraction
    expect(screen.getByText('8.5%')).toBeInTheDocument(); // annual yield
    expect(screen.getByText('$8,000')).toBeInTheDocument(); // monthly rental income
  });

  it('should render amenities list', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('should render documents section', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    expect(screen.getByText('Property Deed')).toBeInTheDocument();
    expect(screen.getByText('Inspection Report')).toBeInTheDocument();
  });

  it('should render occupancy rate', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should render property manager', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    expect(screen.getByText('Miami Properties LLC')).toBeInTheDocument();
  });

  it('should render buy button', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    expect(screen.getByRole('button', { name: /buy/i })).toBeInTheDocument();
  });

  it('should call onBuy when buy button is clicked', () => {
    const onBuy = jest.fn();
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} onBuy={onBuy} />);
    fireEvent.click(screen.getByRole('button', { name: /buy/i }));
    expect(onBuy).toHaveBeenCalled();
  });

  it('should disable buy button when sold out', () => {
    const soldOutProperty = { ...mockProperty, availableFractions: 0 };
    render(<PropertyDetail property={soldOutProperty} details={mockPropertyDetails} />);
    expect(screen.getByRole('button', { name: /sold out/i })).toBeDisabled();
  });

  it('should render fraction availability progress', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<PropertyDetail property={mockProperty} details={mockPropertyDetails} isLoading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
