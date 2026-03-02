import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const defaultOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  describe('rendering', () => {
    it('renders select element', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders all options', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    });

    it('renders placeholder option', () => {
      render(<Select options={defaultOptions} placeholder="Select an option" />);
      expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument();
    });

    it('placeholder option is disabled', () => {
      render(<Select options={defaultOptions} placeholder="Select an option" />);
      const placeholder = screen.getByRole('option', { name: 'Select an option' });
      expect(placeholder).toBeDisabled();
    });

    it('renders with label', () => {
      render(<Select options={defaultOptions} label="Choose" />);
      expect(screen.getByText('Choose')).toBeInTheDocument();
    });

    it('associates label with select', () => {
      render(<Select options={defaultOptions} label="Choose" id="select-id" />);
      const select = screen.getByLabelText('Choose');
      expect(select).toHaveAttribute('id', 'select-id');
    });

    it('generates unique id when not provided', () => {
      render(<Select options={defaultOptions} label="Choose" />);
      const select = screen.getByLabelText('Choose');
      expect(select).toHaveAttribute('id');
      // React's useId generates IDs like :r0:, :r1:, etc.
      expect(select.getAttribute('id')).toBeTruthy();
    });
  });

  describe('disabled options', () => {
    it('disables options marked as disabled', () => {
      const optionsWithDisabled = [
        { value: 'enabled', label: 'Enabled' },
        { value: 'disabled', label: 'Disabled', disabled: true },
      ];
      render(<Select options={optionsWithDisabled} />);
      expect(screen.getByRole('option', { name: 'Disabled' })).toBeDisabled();
    });
  });

  describe('error state', () => {
    it('displays error message', () => {
      render(<Select options={defaultOptions} error="Selection required" />);
      expect(screen.getByText('Selection required')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      render(<Select options={defaultOptions} error="Error" />);
      expect(screen.getByRole('combobox')).toHaveClass('border-red-500');
    });

    it('shows error instead of helper text', () => {
      render(<Select options={defaultOptions} error="Error" helperText="Helper" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });
  });

  describe('helper text', () => {
    it('displays helper text', () => {
      render(<Select options={defaultOptions} helperText="Choose wisely" />);
      expect(screen.getByText('Choose wisely')).toBeInTheDocument();
    });
  });

  describe('left icon', () => {
    it('renders left icon', () => {
      const leftIcon = <span data-testid="left-icon">I</span>;
      render(<Select options={defaultOptions} leftIcon={leftIcon} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('applies left padding when left icon exists', () => {
      const leftIcon = <span>I</span>;
      render(<Select options={defaultOptions} leftIcon={leftIcon} />);
      expect(screen.getByRole('combobox')).toHaveClass('pl-10');
    });
  });

  describe('fullWidth', () => {
    it('applies full width when fullWidth is true', () => {
      render(<Select options={defaultOptions} fullWidth />);
      const container = screen.getByRole('combobox').closest('div')?.parentElement;
      expect(container).toHaveClass('w-full');
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Select options={defaultOptions} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('interactions', () => {
    it('allows selecting an option', async () => {
      const user = userEvent.setup();
      render(<Select options={defaultOptions} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'option2');
      expect(select).toHaveValue('option2');
    });

    it('calls onChange when selection changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Select options={defaultOptions} onChange={handleChange} />);

      await user.selectOptions(screen.getByRole('combobox'), 'option1');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('chevron icon', () => {
    it('renders chevron icon', () => {
      render(<Select options={defaultOptions} />);
      const chevron = document.querySelector('svg');
      expect(chevron).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('merges custom className', () => {
      render(<Select options={defaultOptions} className="custom-select" />);
      expect(screen.getByRole('combobox')).toHaveClass('custom-select');
    });
  });

  describe('forwarded ref', () => {
    it('forwards ref to select element', () => {
      const ref = { current: null };
      render(<Select ref={ref} options={defaultOptions} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML select attributes', () => {
      render(<Select options={defaultOptions} name="my-select" required />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('name', 'my-select');
      expect(select).toBeRequired();
    });
  });
});
