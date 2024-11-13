import Swal from 'sweetalert2'

const CustomSweetAlert = {
  async success(title, message) {
    return await Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      backdrop: `rgba(17, 24, 39, 0.65)`,
      showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutDown animate__faster'
      },
      customClass: {
        popup: 'tech-alert-popup',
        title: 'tech-alert-title',
        icon: 'tech-alert-icon',
        content: 'tech-alert-content',
        timerProgressBar: 'tech-timer-progress'
      }
    })
  },

  async error(title, message) {
    return await Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: 'Đóng',
      backdrop: `rgba(17, 24, 39, 0.65)`,
      showClass: {
        popup: 'animate__animated animate__fadeIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOut animate__faster'
      },
      customClass: {
        popup: 'tech-alert-popup tech-alert-error',
        title: 'tech-alert-title',
        icon: 'tech-alert-icon',
        content: 'tech-alert-content',
        confirmButton: 'tech-alert-button'
      },
      buttonsStyling: false
    })
  },

  async validation(errors) {
    const errorList = errors.map(err => `
      <div class="tech-error-item">
        <div class="error-icon">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="error-content">
          <span class="error-text">${err}</span>
        </div>
      </div>
    `).join('')

    return await Swal.fire({
      icon: 'warning',
      title: 'Vui lòng kiểm tra lại!',
      html: `<div class="tech-error-container">${errorList}</div>`,
      backdrop: `rgba(17, 24, 39, 0.65)`,
      showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster'
      },
      customClass: {
        popup: 'tech-alert-popup tech-alert-validation',
        title: 'tech-alert-title',
        icon: 'tech-alert-icon',
        content: 'tech-alert-content',
        confirmButton: 'tech-alert-button'
      },
      buttonsStyling: false
    })
  },

  async confirm(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
    return await Swal.fire({
      icon: 'question',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      backdrop: `rgba(17, 24, 39, 0.65)`,
      showClass: {
        popup: 'animate__animated animate__zoomIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__zoomOut animate__faster'
      },
      customClass: {
        popup: 'tech-alert-popup tech-alert-confirm',
        title: 'tech-alert-title',
        icon: 'tech-alert-icon',
        content: 'tech-alert-content',
        confirmButton: 'tech-alert-button-confirm',
        cancelButton: 'tech-alert-button-cancel'
      },
      buttonsStyling: false
    })
  }
}

export default CustomSweetAlert