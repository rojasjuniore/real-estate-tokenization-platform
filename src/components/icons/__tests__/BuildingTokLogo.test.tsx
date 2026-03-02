import { render, screen } from '@testing-library/react';
import { BuildingTokLogo } from '../BuildingTokLogo';

describe('BuildingTokLogo', () => {
  it('renders the logo SVG', () => {
    render(<BuildingTokLogo />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with default size', () => {
    render(<BuildingTokLogo />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '180');
  });

  it('renders with custom size', () => {
    render(<BuildingTokLogo width={240} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '240');
  });

  it('renders with custom height', () => {
    render(<BuildingTokLogo height={50} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('height', '50');
  });

  it('applies custom className', () => {
    render(<BuildingTokLogo className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders variant light (default) with correct colors', () => {
    render(<BuildingTokLogo variant="light" />);
    const svg = document.querySelector('svg');
    // Light variant uses blue (#223A8E) for UILDING and orange (#D54315) for B and TOK
    expect(svg?.innerHTML).toContain('#223A8E'); // Blue for UILDING
    expect(svg?.innerHTML).toContain('#D54315'); // Orange for B and TOK
  });

  it('renders variant dark with white text', () => {
    render(<BuildingTokLogo variant="dark" />);
    const svg = document.querySelector('svg');
    // Dark variant should have white for UILDING
    expect(svg?.innerHTML).toContain('#FFFFFF');
    // Should still have orange for B and TOK
    expect(svg?.innerHTML).toContain('#D54315');
  });

  it('renders icon-only variant', () => {
    render(<BuildingTokLogo variant="icon-only" />);
    const svg = document.querySelector('svg');
    // Icon-only should only have the B icon
    expect(svg).toBeInTheDocument();
    // Should have smaller viewBox for icon only
    expect(svg).toHaveAttribute('viewBox', '0 0 72 76');
    // Should have orange color for B
    expect(svg?.innerHTML).toContain('#D54315');
  });

  it('maintains aspect ratio with preserveAspectRatio', () => {
    render(<BuildingTokLogo />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  });

  it('calculates correct aspect ratio for full logo', () => {
    render(<BuildingTokLogo width={596} />);
    const svg = document.querySelector('svg');
    // Full logo viewBox is 596x128, so height should be 128 for width 596
    expect(svg).toHaveAttribute('height', '128');
  });
});
