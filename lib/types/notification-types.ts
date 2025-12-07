export type NotificationType = 
  | 'payment_reminder' 
  | 'payment_received' 
  | 'student_registered' 
  | 'installment_overdue'
  | 'system_alert'
  | 'success'
  | 'warning'
  | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
  action_url?: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  fetchNotifications: () => Promise<void>;
}





