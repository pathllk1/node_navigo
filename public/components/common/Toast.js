/**
 * Toast Notification Component
 * Displays temporary notification messages
 */

let toastContainer = null;
let toastCounter = 0;

/**
 * Initialize toast container
 */
function initToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }
}

/**
 * Show toast notification
 * @param {Object} options - Toast options
 * @param {string} options.message - Toast message
 * @param {string} options.type - 'success', 'error', 'warning', 'info'
 * @param {number} options.duration - Duration in ms (default: 3000)
 * @param {boolean} options.dismissible - Show close button (default: true)
 */
export function showToast({ 
  message, 
  type = 'info', 
  duration = 3000, 
  dismissible = true 
}) {
  initToastContainer();
  
  const toastId = `toast-${++toastCounter}`;
  
  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: `<svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: `<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>`
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: `<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>`
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: `<svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>`
    }
  };
  
  const style = typeStyles[type] || typeStyles.info;
  
  const toastHTML = `
    <div id="${toastId}" 
         class="toast pointer-events-auto ${style.bg} ${style.border} ${style.text} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md transform transition-all duration-300 translate-x-full opacity-0">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          ${style.icon}
        </div>
        <div class="flex-1 pt-0.5">
          <p class="text-sm font-medium">${message}</p>
        </div>
        ${dismissible ? `
          <button type="button" 
                  data-action="close-toast"
                  data-toast-id="${toastId}"
                  class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;
  
  // Add to container
  const div = document.createElement('div');
  div.innerHTML = toastHTML;
  const toast = div.firstElementChild;
  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 10);
  
  // Setup close button
  if (dismissible) {
    const closeBtn = toast.querySelector('[data-action="close-toast"]');
    closeBtn?.addEventListener('click', () => hideToast(toastId));
  }
  
  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(() => hideToast(toastId), duration);
  }
  
  return toastId;
}

/**
 * Hide toast
 */
export function hideToast(toastId) {
  const toast = document.getElementById(toastId);
  if (toast) {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }
}

/**
 * Show success toast
 */
export function showSuccess(message, duration = 3000) {
  return showToast({ message, type: 'success', duration });
}

/**
 * Show error toast
 */
export function showError(message, duration = 5000) {
  return showToast({ message, type: 'error', duration });
}

/**
 * Show warning toast
 */
export function showWarning(message, duration = 4000) {
  return showToast({ message, type: 'warning', duration });
}

/**
 * Show info toast
 */
export function showInfo(message, duration = 3000) {
  return showToast({ message, type: 'info', duration });
}

/**
 * Clear all toasts
 */
export function clearAllToasts() {
  if (toastContainer) {
    const toasts = toastContainer.querySelectorAll('.toast');
    toasts.forEach(toast => {
      toast.classList.add('translate-x-full', 'opacity-0');
    });
    setTimeout(() => {
      toastContainer.innerHTML = '';
    }, 300);
  }
}
