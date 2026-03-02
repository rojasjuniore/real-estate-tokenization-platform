'use client';

import { act } from '@testing-library/react';
import { useNotificationStore, Notification } from '../notifications.store';

describe('useNotificationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useNotificationStore.getState().clearAll();
      useNotificationStore.setState({ isOpen: false });
    });
  });

  describe('initial state', () => {
    it('should have empty notifications array', () => {
      const { notifications } = useNotificationStore.getState();
      expect(notifications).toEqual([]);
    });

    it('should have unreadCount of 0', () => {
      const { unreadCount } = useNotificationStore.getState();
      expect(unreadCount).toBe(0);
    });

    it('should have isOpen as false', () => {
      const { isOpen } = useNotificationStore.getState();
      expect(isOpen).toBe(false);
    });
  });

  describe('addNotification', () => {
    it('should add a notification with auto-generated id and timestamp', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Test Title',
          message: 'Test Message',
        });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toMatch(/^notif-\d+-[a-z0-9]+$/);
      expect(notifications[0].timestamp).toBeDefined();
      expect(notifications[0].read).toBe(false);
    });

    it('should increment unreadCount when adding notification', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Info',
          message: 'Info message',
        });
      });

      expect(useNotificationStore.getState().unreadCount).toBe(1);

      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'warning',
          title: 'Warning',
          message: 'Warning message',
        });
      });

      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });

    it('should prepend new notifications (newest first)', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'First',
          message: 'First message',
        });
      });

      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Second',
          message: 'Second message',
        });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].title).toBe('Second');
      expect(notifications[1].title).toBe('First');
    });

    it('should limit notifications to 50', () => {
      act(() => {
        for (let i = 0; i < 60; i++) {
          useNotificationStore.getState().addNotification({
            type: 'info',
            title: `Notification ${i}`,
            message: `Message ${i}`,
          });
        }
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(50);
    });

    it('should preserve optional fields (link, txHash)', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Transaction',
          message: 'Tx confirmed',
          link: '/transactions/123',
          txHash: '0x123abc',
        });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].link).toBe('/transactions/123');
      expect(notifications[0].txHash).toBe('0x123abc');
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        });
      });

      const id = useNotificationStore.getState().notifications[0].id;

      act(() => {
        useNotificationStore.getState().markAsRead(id);
      });

      const { notifications, unreadCount } = useNotificationStore.getState();
      expect(notifications[0].read).toBe(true);
      expect(unreadCount).toBe(0);
    });

    it('should not decrement unreadCount if already read', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        });
      });

      const id = useNotificationStore.getState().notifications[0].id;

      act(() => {
        useNotificationStore.getState().markAsRead(id);
        useNotificationStore.getState().markAsRead(id); // Mark again
      });

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should handle non-existent id gracefully', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        });
      });

      act(() => {
        useNotificationStore.getState().markAsRead('non-existent-id');
      });

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'First',
          message: 'First',
        });
        useNotificationStore.getState().addNotification({
          type: 'warning',
          title: 'Second',
          message: 'Second',
        });
      });

      act(() => {
        useNotificationStore.getState().markAllAsRead();
      });

      const { notifications, unreadCount } = useNotificationStore.getState();
      expect(notifications.every((n) => n.read)).toBe(true);
      expect(unreadCount).toBe(0);
    });
  });

  describe('removeNotification', () => {
    it('should remove a notification by id', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test',
        });
      });

      const id = useNotificationStore.getState().notifications[0].id;

      act(() => {
        useNotificationStore.getState().removeNotification(id);
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('should decrement unreadCount if removing unread notification', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test',
        });
      });

      const id = useNotificationStore.getState().notifications[0].id;

      act(() => {
        useNotificationStore.getState().removeNotification(id);
      });

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should not change unreadCount if removing read notification', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test1',
          message: 'Test1',
        });
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test2',
          message: 'Test2',
        });
      });

      const id = useNotificationStore.getState().notifications[0].id;

      act(() => {
        useNotificationStore.getState().markAsRead(id);
        useNotificationStore.getState().removeNotification(id);
      });

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications and reset unreadCount', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test1',
          message: 'Test1',
        });
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Test2',
          message: 'Test2',
        });
      });

      act(() => {
        useNotificationStore.getState().clearAll();
      });

      const { notifications, unreadCount } = useNotificationStore.getState();
      expect(notifications).toHaveLength(0);
      expect(unreadCount).toBe(0);
    });
  });

  describe('togglePanel', () => {
    it('should toggle isOpen state', () => {
      expect(useNotificationStore.getState().isOpen).toBe(false);

      act(() => {
        useNotificationStore.getState().togglePanel();
      });

      expect(useNotificationStore.getState().isOpen).toBe(true);

      act(() => {
        useNotificationStore.getState().togglePanel();
      });

      expect(useNotificationStore.getState().isOpen).toBe(false);
    });
  });

  describe('closePanel', () => {
    it('should set isOpen to false', () => {
      act(() => {
        useNotificationStore.setState({ isOpen: true });
      });

      act(() => {
        useNotificationStore.getState().closePanel();
      });

      expect(useNotificationStore.getState().isOpen).toBe(false);
    });
  });

  describe('notification types', () => {
    it.each(['success', 'info', 'warning', 'error'] as const)(
      'should accept %s type',
      (type) => {
        act(() => {
          useNotificationStore.getState().addNotification({
            type,
            title: `${type} notification`,
            message: `This is a ${type} message`,
          });
        });

        const { notifications } = useNotificationStore.getState();
        expect(notifications[0].type).toBe(type);
      }
    );
  });
});
