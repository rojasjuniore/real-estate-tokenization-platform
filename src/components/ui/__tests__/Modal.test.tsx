import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalFooter } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders children when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Modal {...defaultProps} title="Modal Title" />);
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<Modal {...defaultProps} title="Title" description="Modal description" />);
      expect(screen.getByText('Modal description')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(<Modal {...defaultProps} title="Title" />);
      expect(screen.getByLabelText('Cerrar modal')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} title="Title" showCloseButton={false} />);
      expect(screen.queryByLabelText('Cerrar modal')).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies small size class', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modalContent = screen.getByText('Modal content').closest('.max-w-sm');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies medium size class (default)', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = screen.getByText('Modal content').closest('.max-w-md');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies large size class', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modalContent = screen.getByText('Modal content').closest('.max-w-lg');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies xl size class', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modalContent = screen.getByText('Modal content').closest('.max-w-xl');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies full size class', () => {
      render(<Modal {...defaultProps} size="full" />);
      const modalContent = screen.getByText('Modal content').closest('.max-w-4xl');
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(<Modal {...defaultProps} title="Title" onClose={handleClose} />);

      await user.click(screen.getByLabelText('Cerrar modal'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);

      const backdrop = screen.getByText('Modal content').closest('.fixed.inset-0');
      if (backdrop) {
        await user.click(backdrop);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);

      await user.click(screen.getByText('Modal content'));
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('has backdrop with blur', () => {
      render(<Modal {...defaultProps} />);
      const backdrop = document.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('has animation classes', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = screen.getByText('Modal content').closest('.animate-scale-in');
      expect(modalContent).toBeInTheDocument();
    });
  });
});

describe('ModalFooter', () => {
  it('renders children', () => {
    render(<ModalFooter><button>Save</button></ModalFooter>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('has border top styling', () => {
    render(<ModalFooter>Footer</ModalFooter>);
    expect(screen.getByText('Footer')).toHaveClass('border-t');
  });

  it('has flex layout with gap', () => {
    render(<ModalFooter>Footer</ModalFooter>);
    expect(screen.getByText('Footer')).toHaveClass('flex', 'gap-3');
  });

  it('applies custom className', () => {
    render(<ModalFooter className="custom-footer">Footer</ModalFooter>);
    expect(screen.getByText('Footer')).toHaveClass('custom-footer');
  });
});
