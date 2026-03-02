import { render, screen } from '@testing-library/react';
import { PropertyGrid } from '../PropertyGrid';
import { Property } from '../PropertyCard';

const mockProperties: Property[] = [
  {
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
  },
  {
    id: 2,
    name: 'Downtown Office Space',
    location: 'New York, NY',
    imageUrl: '/images/property-2.jpg',
    price: '2000000',
    totalFractions: 20000,
    availableFractions: 15000,
    pricePerFraction: '100',
    annualYield: 7.2,
    propertyType: 'Commercial',
  },
];

describe('PropertyGrid', () => {
  it('should render all properties', () => {
    render(<PropertyGrid properties={mockProperties} />);
    expect(screen.getByText('Luxury Apartment Miami')).toBeInTheDocument();
    expect(screen.getByText('Downtown Office Space')).toBeInTheDocument();
  });

  it('should render in grid layout', () => {
    render(<PropertyGrid properties={mockProperties} />);
    const grid = screen.getByRole('list');
    expect(grid).toHaveClass('grid');
  });

  it('should show loading state', () => {
    render(<PropertyGrid properties={[]} isLoading />);
    expect(screen.getByText('Loading properties...')).toBeInTheDocument();
  });

  it('should show empty state when no properties', () => {
    render(<PropertyGrid properties={[]} />);
    expect(screen.getByText('No properties found')).toBeInTheDocument();
  });

  it('should call onPropertyClick when property is clicked', () => {
    const onPropertyClick = jest.fn();
    render(<PropertyGrid properties={mockProperties} onPropertyClick={onPropertyClick} />);
    const articles = screen.getAllByRole('article');
    articles[0].click();
    expect(onPropertyClick).toHaveBeenCalledWith(mockProperties[0]);
  });

  it('should render correct number of skeleton cards when loading', () => {
    render(<PropertyGrid properties={[]} isLoading skeletonCount={3} />);
    const skeletons = screen.getAllByTestId('property-skeleton');
    expect(skeletons).toHaveLength(3);
  });
});
