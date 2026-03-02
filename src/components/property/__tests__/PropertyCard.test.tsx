import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';

const mockProperty = {
  id: 1,
  name: 'Luxury Apartment Miami',
  location: 'Miami Beach, FL',
  imageUrl: '/images/property-1.jpg',
  price: '1000000',
  totalFractions: 10000,
  availableFractions: 5000,
  pricePerFraction: '100',
  annualYield: 8.5,
  propertyType: 'Apartment' as const,
};

describe('PropertyCard', () => {
  it('should render property name', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Luxury Apartment Miami')).toBeInTheDocument();
  });

  it('should render property location', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Miami Beach, FL')).toBeInTheDocument();
  });

  it('should render property image', () => {
    render(<PropertyCard property={mockProperty} />);
    const image = screen.getByAltText('Luxury Apartment Miami');
    expect(image).toBeInTheDocument();
  });

  it('should render price per fraction', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/\$100/)).toBeInTheDocument();
  });

  it('should render annual yield', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/8.5%/)).toBeInTheDocument();
  });

  it('should render property type badge', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Apartment')).toBeInTheDocument();
  });

  it('should render available fractions', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it('should render progress bar for availability', () => {
    render(<PropertyCard property={mockProperty} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('should call onClick when card is clicked', () => {
    const onClick = jest.fn();
    render(<PropertyCard property={mockProperty} onClick={onClick} />);
    screen.getByRole('article').click();
    expect(onClick).toHaveBeenCalledWith(mockProperty);
  });

  it('should show sold out badge when no fractions available', () => {
    const soldOutProperty = { ...mockProperty, availableFractions: 0 };
    render(<PropertyCard property={soldOutProperty} />);
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });

  it('should apply hover styles', () => {
    render(<PropertyCard property={mockProperty} />);
    const card = screen.getByRole('article');
    expect(card).toHaveClass('hover:shadow-lg');
  });
});
