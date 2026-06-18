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
  console.log("[v0] copyToClipboard called with text:", text);
  console.log("[v0] Text length:", text?.length);
  
  try {
    console.log("[v0] navigator.clipboard available:", navigator.clipboard ? 'yes' : 'no');
    
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      console.log("[v0] Using modern clipboard API");
      await navigator.clipboard.writeText(text);
      console.log("[v0] Successfully wrote to clipboard via API");
      showToast(successMessage, { type: 'success' });
      return true;
    } else {
      // Fallback for older browsers
      console.log("[v0] Using fallback textarea method");
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      const success = document.execCommand('copy');
      console.log("[v0] execCommand('copy') result:", success);
      document.body.removeChild(textarea);
      
      if (success) {
        console.log("[v0] Successfully wrote to clipboard via fallback");
        showToast(successMessage, { type: 'success' });
      } else {
        console.log("[v0] Fallback copy failed");
      }
      return success;
    }
  } catch (err) {
    console.error('[v0] Copy failed:', err);
    console.error('[v0] Error type:', (err as Error).name);
    console.error('[v0] Error message:', (err as Error).message);
    console.error('[v0] Error stack:', (err as Error).stack);
    showToast('Failed to copy to clipboard', { type: 'error' });
    return false;
  }
}
