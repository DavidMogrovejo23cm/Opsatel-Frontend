import Swal from 'sweetalert2';

// Standard opsatel custom styled Swal instance
const OpsatelSwal = Swal.mixin({
  customClass: {
    container: 'opsatel-swal-container',
    popup: 'opsatel-swal-popup',
    header: 'opsatel-swal-header',
    title: 'opsatel-swal-title',
    htmlContainer: 'opsatel-swal-html',
    closeButton: 'opsatel-swal-close',
    confirmButton: 'opsatel-swal-confirm-btn',
    cancelButton: 'opsatel-swal-cancel-btn',
    actions: 'opsatel-swal-actions',
    input: 'opsatel-swal-input',
    icon: 'opsatel-swal-icon'
  },
  buttonsStyling: false,
  background: 'transparent',
  showClass: {
    popup: 'opsatel-swal-show'
  },
  hideClass: {
    popup: 'opsatel-swal-hide'
  }
});

// Toast notification instance
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'opsatel-toast-popup',
    title: 'opsatel-toast-title',
    icon: 'opsatel-toast-icon'
  },
  background: 'transparent'
});

/**
 * Show a modern alert dialog
 */
export const showAlert = (message, icon = 'info', title = '') => {
  let defaultTitle = '';
  if (!title) {
    if (icon === 'success') defaultTitle = '¡Éxito!';
    else if (icon === 'error') defaultTitle = '¡Error!';
    else if (icon === 'warning') defaultTitle = 'Atención';
    else defaultTitle = 'Información';
  } else {
    defaultTitle = title;
  }

  return OpsatelSwal.fire({
    title: defaultTitle,
    html: typeof message === 'string' ? message.replace(/\n/g, '<br/>') : message,
    icon: icon,
    confirmButtonText: 'Entendido'
  });
};

/**
 * Show success alert
 */
export const showSuccess = (message, title = '¡Éxito!') => {
  return showAlert(message, 'success', title);
};

/**
 * Show error alert
 */
export const showError = (message, title = '¡Error!') => {
  return showAlert(message, 'error', title);
};

/**
 * Show warning alert
 */
export const showWarning = (message, title = 'Atención') => {
  return showAlert(message, 'warning', title);
};

/**
 * Show confirmation dialog with Promise resolving to boolean (true/false)
 */
export const showConfirm = async (title, message, confirmButtonText = 'Sí, continuar', cancelButtonText = 'Cancelar', icon = 'warning') => {
  const result = await OpsatelSwal.fire({
    title: title || '¿Estás seguro?',
    html: typeof message === 'string' ? message.replace(/\n/g, '<br/>') : message,
    icon: icon,
    showCancelButton: true,
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    reverseButtons: true
  });

  return result.isConfirmed;
};

/**
 * Show toast notification
 */
export const showToast = (message, icon = 'success', timer = 3000) => {
  return Toast.fire({
    icon: icon,
    title: message,
    timer: timer
  });
};

export default OpsatelSwal;
