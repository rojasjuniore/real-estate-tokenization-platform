import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

function TestComponent() {
  const { addToast, removeToast, toasts } = useToast();

  return (
    <div>
      <button onClick={() => addToast({ type: 'success', title: 'Success' })}>
        Add Success
      </button>
      <button onClick={() => addToast({ type: 'error', title: 'Error', message: 'Error message' })}>
        Add Error
      </button>
      <button onClick={() => addToast({ type: 'warning', title: 'Warning' })}>
        Add Warning
      </button>
      <button onClick={() => addToast({ type: 'info', title: 'Info' })}>
        Add Info
      </button>
      <button onClick={() => addToast({ type: 'success', title: 'Persistent', duration: 0 })}>
        Add Persistent
      </button>
      <button onClick={() => toasts[0] && removeToast(toasts[0].id)}>
        Remove First
      </button>
      <span data-testid="toast-count">{toasts.length}</span>
    </div>
  );
}

describe('Toast System', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('provides toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  describe('useToast hook', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('addToast', () => {
    it('adds a toast', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success'));
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('adds toast with message', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Error'));
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('auto-removes toast after duration', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success'));
      expect(screen.getByText('Success')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });

    it('does not auto-remove when duration is 0', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Persistent'));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByText('Persistent')).toBeInTheDocument();
    });
  });

  describe('removeToast', () => {
    it('removes a toast by id', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success'));
      expect(screen.getByText('Success')).toBeInTheDocument();

      await user.click(screen.getByText('Remove First'));
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });
  });

  describe('Toast variants', () => {
    it('renders success toast with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success'));
      const toast = document.querySelector('.bg-green-50');
      expect(toast).toBeInTheDocument();
    });

    it('renders error toast with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Error'));
      const toast = document.querySelector('.bg-red-50');
      expect(toast).toBeInTheDocument();
    });

    it('renders warning toast with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Warning'));
      const toast = document.querySelector('.bg-yellow-50');
      expect(toast).toBeInTheDocument();
    });

    it('renders info toast with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Info'));
      const toast = document.querySelector('.bg-blue-50');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('Toast close button', () => {
    it('closes toast when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success'));
      expect(screen.getByText('Success')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Cerrar notificación'));
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });
  });

  describe('Multiple toasts', () => {
    it('can display multiple toasts', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success'));
      await user.click(screen.getByText('Add Error'));

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
    });
  });
});
