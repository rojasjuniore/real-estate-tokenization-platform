import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  describe('rendering with image', () => {
    it('renders image when src is provided', () => {
      render(<Avatar src="/avatar.jpg" alt="User avatar" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('sets alt text correctly', () => {
      render(<Avatar src="/avatar.jpg" alt="User avatar" />);
      expect(screen.getByAltText('User avatar')).toBeInTheDocument();
    });

    it('uses default alt text when not provided', () => {
      render(<Avatar src="/avatar.jpg" />);
      expect(screen.getByAltText('Avatar')).toBeInTheDocument();
    });
  });

  describe('fallback rendering', () => {
    it('renders fallback initials when no src', () => {
      render(<Avatar fallback="John Doe" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders single initial for single word', () => {
      render(<Avatar fallback="John" />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('limits initials to 2 characters', () => {
      render(<Avatar fallback="John Middle Doe" />);
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('renders question mark when no fallback', () => {
      render(<Avatar />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('converts initials to uppercase', () => {
      render(<Avatar fallback="john doe" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders xs size', () => {
      render(<Avatar fallback="John Doe" size="xs" />);
      const container = screen.getByText('JD').closest('.w-6');
      expect(container).toBeInTheDocument();
    });

    it('renders sm size', () => {
      render(<Avatar fallback="John Doe" size="sm" />);
      const container = screen.getByText('JD').closest('.w-8');
      expect(container).toBeInTheDocument();
    });

    it('renders md size (default)', () => {
      render(<Avatar fallback="John Doe" size="md" />);
      const container = screen.getByText('JD').closest('.w-10');
      expect(container).toBeInTheDocument();
    });

    it('renders lg size', () => {
      render(<Avatar fallback="John Doe" size="lg" />);
      const container = screen.getByText('JD').closest('.w-12');
      expect(container).toBeInTheDocument();
    });

    it('renders xl size', () => {
      render(<Avatar fallback="John Doe" size="xl" />);
      const container = screen.getByText('JD').closest('.w-16');
      expect(container).toBeInTheDocument();
    });
  });

  describe('status indicator', () => {
    it('renders online status', () => {
      render(<Avatar fallback="John Doe" status="online" />);
      const status = document.querySelector('.bg-green-500');
      expect(status).toBeInTheDocument();
    });

    it('renders offline status', () => {
      render(<Avatar fallback="John Doe" status="offline" />);
      const status = document.querySelector('.bg-neutral-400');
      expect(status).toBeInTheDocument();
    });

    it('renders away status', () => {
      render(<Avatar fallback="John Doe" status="away" />);
      const status = document.querySelector('.bg-yellow-500');
      expect(status).toBeInTheDocument();
    });

    it('renders busy status', () => {
      render(<Avatar fallback="John Doe" status="busy" />);
      const status = document.querySelector('.bg-red-500');
      expect(status).toBeInTheDocument();
    });

    it('does not render status when not provided', () => {
      render(<Avatar fallback="John Doe" />);
      const statusColors = ['.bg-green-500', '.bg-neutral-400', '.bg-yellow-500', '.bg-red-500'];
      statusColors.forEach((color) => {
        expect(document.querySelector(color)).not.toBeInTheDocument();
      });
    });
  });

  describe('status sizes', () => {
    it('renders smaller status indicator for xs avatar', () => {
      render(<Avatar fallback="John Doe" size="xs" status="online" />);
      const status = document.querySelector('.w-1\\.5');
      expect(status).toBeInTheDocument();
    });

    it('renders larger status indicator for xl avatar', () => {
      render(<Avatar fallback="John Doe" size="xl" status="online" />);
      const status = document.querySelector('.w-4');
      expect(status).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has rounded-full class for image', () => {
      render(<Avatar src="/avatar.jpg" />);
      expect(screen.getByRole('img')).toHaveClass('rounded-full');
    });

    it('has gradient background for fallback', () => {
      render(<Avatar fallback="John Doe" />);
      const fallbackEl = screen.getByText('JD');
      expect(fallbackEl).toHaveClass('bg-gradient-to-br');
    });

    it('has ring styling', () => {
      render(<Avatar src="/avatar.jpg" />);
      expect(screen.getByRole('img')).toHaveClass('ring-2', 'ring-white');
    });
  });

  describe('custom className', () => {
    it('merges custom className on image', () => {
      render(<Avatar src="/avatar.jpg" className="custom-avatar" />);
      expect(screen.getByRole('img')).toHaveClass('custom-avatar');
    });

    it('merges custom className on fallback', () => {
      render(<Avatar fallback="John Doe" className="custom-avatar" />);
      expect(screen.getByText('JD')).toHaveClass('custom-avatar');
    });
  });

  describe('forwarded ref', () => {
    it('forwards ref to image element when src provided', () => {
      const ref = { current: null };
      render(<Avatar ref={ref} src="/avatar.jpg" />);
      expect(ref.current).toBeInstanceOf(HTMLImageElement);
    });
  });
});
