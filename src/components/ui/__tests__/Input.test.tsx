import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  describe('rendering', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('associates label with input', () => {
      render(<Input label="Email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('generates unique id when not provided', () => {
      render(<Input label="Email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id');
      // React's useId generates IDs like :r0:, :r1:, etc.
      expect(input.getAttribute('id')).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      render(<Input error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('shows error instead of helper text', () => {
      render(<Input error="Error message" helperText="Helper text" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('helper text', () => {
    it('displays helper text', () => {
      render(<Input helperText="This is helpful" />);
      expect(screen.getByText('This is helpful')).toBeInTheDocument();
    });

    it('does not display helper text when error exists', () => {
      render(<Input helperText="Helper" error="Error" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('renders left icon', () => {
      const leftIcon = <span data-testid="left-icon">L</span>;
      render(<Input leftIcon={leftIcon} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      const rightIcon = <span data-testid="right-icon">R</span>;
      render(<Input rightIcon={rightIcon} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('applies left padding when left icon exists', () => {
      const leftIcon = <span>L</span>;
      render(<Input leftIcon={leftIcon} />);
      expect(screen.getByRole('textbox')).toHaveClass('pl-10');
    });

    it('applies right padding when right icon exists', () => {
      const rightIcon = <span>R</span>;
      render(<Input rightIcon={rightIcon} />);
      expect(screen.getByRole('textbox')).toHaveClass('pr-10');
    });
  });

  describe('fullWidth', () => {
    it('applies full width when fullWidth is true', () => {
      render(<Input fullWidth />);
      const container = screen.getByRole('textbox').closest('div')?.parentElement;
      expect(container).toHaveClass('w-full');
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toHaveClass('disabled:opacity-50');
    });
  });

  describe('interactions', () => {
    it('allows typing', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello');
      expect(input).toHaveValue('Hello');
    });

    it('calls onChange when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('merges custom className', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });
  });

  describe('forwarded ref', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML input attributes', () => {
      render(<Input type="email" name="email" required />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('name', 'email');
      expect(input).toBeRequired();
    });
  });
});
