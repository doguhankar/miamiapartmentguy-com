/**
 * Simple toast notification system
 * Uses browser's alert for MVP - can be replaced with a toast library later
 */

export interface ToastOptions {
  duration?: number; // milliseconds
  type?: 'success' | 'error' | 'info';
}

export function showToast(message: string, options: ToastOptions = {}): void {
  const { type = 'info' } = options;
  
  // For MVP, use alert. In production, use a toast library like react-hot-toast
  // We'll use console + browser notifications
  console.log(`[Toast ${type.toUpperCase()}] ${message}`);
  
  // Show browser notification if available
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(message);
      }
    } catch (err) {
      // Silently fail if notifications not available
    }
  }
}

/**
 * Copy text to clipboard with toast notification
 */
export async function copyToClipboard(text: string, successMessage: string = 'Copied to clipboard'): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, { type: 'success' });
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (success) {
        showToast(successMessage, { type: 'success' });
      }
      return success;
    }
  } catch (err) {
    console.error('[Toast] Copy failed:', err);
    showToast('Failed to copy to clipboard', { type: 'error' });
    return false;
  }
}
