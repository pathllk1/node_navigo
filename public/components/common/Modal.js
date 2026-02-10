/**
 * Modal Component
 * Reusable modal dialog with customizable content
 */

export function Modal({ 
  id,
  title, 
  content, 
  size = 'md', // 'sm', 'md', 'lg', 'xl', 'full'
  showFooter = true,
  primaryButton = 'Save',
  secondaryButton = 'Cancel',
  onPrimary = null,
  onSecondary = null,
  closeOnBackdrop = true
}) {
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };
  
  return `
    <div id="${id}" class="modal fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="modal-backdrop fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" data-action="close-modal"></div>
      
      <!-- Modal panel -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="modal-panel relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full ${sizeClasses[size]}">
          
          <!-- Header -->
          <div class="modal-header flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900" id="modal-title">
              ${title}
            </h3>
            <button type="button" 
                    data-action="close-modal"
                    class="text-gray-400 hover:text-gray-500 focus:outline-none">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Content -->
          <div class="modal-content px-6 py-4 max-h-[70vh] overflow-y-auto">
            ${content}
          </div>
          
          <!-- Footer -->
          ${showFooter ? `
            <div class="modal-footer flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              ${secondaryButton ? `
                <button type="button" 
                        data-action="modal-secondary"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  ${secondaryButton}
                </button>
              ` : ''}
              ${primaryButton ? `
                <button type="button" 
                        data-action="modal-primary"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  ${primaryButton}
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Show modal
 */
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Focus trap
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
}

/**
 * Hide modal
 */
export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

/**
 * Setup modal event listeners
 * Call this after rendering the modal
 */
export function setupModalListeners(modalId, { onPrimary, onSecondary, closeOnBackdrop = true }) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.addEventListener('click', (e) => {
    // Close on backdrop click
    if (closeOnBackdrop && e.target.closest('[data-action="close-modal"]')) {
      hideModal(modalId);
      if (onSecondary) onSecondary();
    }
    
    // Primary button click
    if (e.target.closest('[data-action="modal-primary"]')) {
      if (onPrimary) {
        const result = onPrimary();
        // Auto-close if onPrimary returns true
        if (result !== false) {
          hideModal(modalId);
        }
      } else {
        hideModal(modalId);
      }
    }
    
    // Secondary button click
    if (e.target.closest('[data-action="modal-secondary"]')) {
      if (onSecondary) onSecondary();
      hideModal(modalId);
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      hideModal(modalId);
      if (onSecondary) onSecondary();
    }
  });
}

/**
 * Confirm dialog (simplified modal)
 */
export function showConfirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  const modalId = 'confirm-modal-' + Date.now();
  
  const modalHTML = Modal({
    id: modalId,
    title,
    content: `<p class="text-gray-700">${message}</p>`,
    size: 'sm',
    primaryButton: confirmText,
    secondaryButton: cancelText
  });
  
  // Append to body
  const div = document.createElement('div');
  div.innerHTML = modalHTML;
  document.body.appendChild(div);
  
  // Setup listeners
  setupModalListeners(modalId, {
    onPrimary: () => {
      if (onConfirm) onConfirm();
      // Remove modal from DOM
      setTimeout(() => div.remove(), 300);
      return true;
    },
    onSecondary: () => {
      if (onCancel) onCancel();
      // Remove modal from DOM
      setTimeout(() => div.remove(), 300);
    }
  });
  
  // Show modal
  showModal(modalId);
}

/**
 * Alert dialog (simplified modal)
 */
export function showAlert({ title, message, buttonText = 'OK', onClose }) {
  const modalId = 'alert-modal-' + Date.now();
  
  const modalHTML = Modal({
    id: modalId,
    title,
    content: `<p class="text-gray-700">${message}</p>`,
    size: 'sm',
    primaryButton: buttonText,
    secondaryButton: null
  });
  
  // Append to body
  const div = document.createElement('div');
  div.innerHTML = modalHTML;
  document.body.appendChild(div);
  
  // Setup listeners
  setupModalListeners(modalId, {
    onPrimary: () => {
      if (onClose) onClose();
      // Remove modal from DOM
      setTimeout(() => div.remove(), 300);
      return true;
    }
  });
  
  // Show modal
  showModal(modalId);
}
