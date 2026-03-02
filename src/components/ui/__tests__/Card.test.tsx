import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';

describe('Card', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      render(<Card>Default</Card>);
      const card = screen.getByText('Default');
      expect(card).toHaveClass('bg-white', 'shadow-md');
    });
  });

  describe('variants', () => {
    it('renders elevated variant', () => {
      render(<Card variant="elevated">Elevated</Card>);
      const card = screen.getByText('Elevated');
      expect(card).toHaveClass('shadow-lg');
    });

    it('renders outlined variant', () => {
      render(<Card variant="outlined">Outlined</Card>);
      const card = screen.getByText('Outlined');
      expect(card).toHaveClass('border');
    });

    it('renders glass variant', () => {
      render(<Card variant="glass">Glass</Card>);
      const card = screen.getByText('Glass');
      expect(card).toHaveClass('backdrop-blur-md');
    });
  });

  describe('padding', () => {
    it('renders with no padding', () => {
      render(<Card padding="none">No padding</Card>);
      const card = screen.getByText('No padding');
      expect(card).not.toHaveClass('p-3', 'p-5', 'p-8');
    });

    it('renders with small padding', () => {
      render(<Card padding="sm">Small</Card>);
      const card = screen.getByText('Small');
      expect(card).toHaveClass('p-3');
    });

    it('renders with medium padding (default)', () => {
      render(<Card padding="md">Medium</Card>);
      const card = screen.getByText('Medium');
      expect(card).toHaveClass('p-5');
    });

    it('renders with large padding', () => {
      render(<Card padding="lg">Large</Card>);
      const card = screen.getByText('Large');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('hoverable', () => {
    it('applies hover styles when hoverable', () => {
      render(<Card hoverable>Hoverable</Card>);
      const card = screen.getByText('Hoverable');
      expect(card).toHaveClass('cursor-pointer', 'hover:shadow-xl');
    });

    it('does not apply hover styles by default', () => {
      render(<Card>Not hoverable</Card>);
      const card = screen.getByText('Not hoverable');
      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('custom className', () => {
    it('merges custom className', () => {
      render(<Card className="custom-class">Custom</Card>);
      const card = screen.getByText('Custom');
      expect(card).toHaveClass('custom-class', 'rounded-xl');
    });
  });

  describe('forwarded ref', () => {
    it('forwards ref to div element', () => {
      const ref = { current: null };
      render(<Card ref={ref}>Ref Card</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

describe('CardHeader', () => {
  it('renders title', () => {
    render(<CardHeader title="Card Title" />);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<CardHeader title="Title" subtitle="Subtitle text" />);
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders action element', () => {
    render(<CardHeader title="Title" action={<button>Action</button>} />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<CardHeader><span>Custom header content</span></CardHeader>);
    expect(screen.getByText('Custom header content')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<CardHeader ref={ref} title="Title" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content here</CardContent>);
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardContent className="custom-content">Content</CardContent>);
    expect(screen.getByText('Content')).toHaveClass('custom-content');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<CardContent ref={ref}>Content</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('has border top styling', () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('border-t', 'mt-4', 'pt-4');
  });

  it('applies custom className', () => {
    render(<CardFooter className="custom-footer">Footer</CardFooter>);
    expect(screen.getByText('Footer')).toHaveClass('custom-footer');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<CardFooter ref={ref}>Footer</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
