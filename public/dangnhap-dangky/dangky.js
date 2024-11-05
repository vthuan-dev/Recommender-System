document.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('registration-form');
	
	// Hàm validate password
	function validatePassword(){
		const pass1 = document.getElementById("password1").value;
		const pass2 = document.getElementById("password2").value;
		if(pass1 != pass2) {
			document.getElementById("password2").setCustomValidity("Mật khẩu không khớp, vui lòng nhập lại");
		} else {
			document.getElementById("password2").setCustomValidity('');
		}
	}

	// Thêm event listeners cho password
	document.getElementById("password1").addEventListener("change", validatePassword);
	document.getElementById("password2").addEventListener("change", validatePassword);

	form.addEventListener('submit', async function(e) {
		e.preventDefault();

		const fullname = document.getElementById('firstname').value;
		const phonenumber = document.getElementById('tel').value;
		const email = document.getElementById('email').value;
		const password = document.getElementById('password1').value;

		// Validation
		const nameRegex = /^[\p{L} ]{2,30}$/u;
		const phoneRegex = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
		const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

		let errors = [];

		if (!nameRegex.test(fullname)) {
			errors.push('Vui lòng nhập tên hợp lệ (2-30 ký tự)');
		}

		if (!phoneRegex.test(phonenumber)) {
			errors.push('Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)');
		}

		if (!emailRegex.test(email)) {
			errors.push('Vui lòng nhập email hợp lệ');
		}

		if (errors.length > 0) {
			showMessage(errors.join('<br>'), 'error');
			return;
		}

		try {
			// Gửi request đến endpoint register-client
			const response = await fetch('/register-client', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					fullname,
					phonenumber,
					email,
					password
				}),
			});

			const data = await response.json();

			if (response.ok) {
				showMessage('Đăng ký thành công!', 'success');
				form.reset();
				startCountdown();
			} else {
				showMessage(data.message || 'Đăng ký thất bại', 'error');
			}
		} catch (error) {
			console.error('Lỗi:', error);
			showMessage('Đã xảy ra lỗi khi đăng ký', 'error');
		}
	});

	function showMessage(message, type) {
		if (type === 'success') {
			const overlay = document.getElementById('messageOverlay');
			overlay.style.display = 'flex';
		} else {
			// Tạo và hiển thị thông báo lỗi
			const errorDiv = document.createElement('div');
			errorDiv.className = 'error-message';
			errorDiv.innerHTML = message;
			form.insertBefore(errorDiv, form.firstChild);
			
			// Tự động xóa thông báo lỗi sau 3 giây
			setTimeout(() => {
				errorDiv.remove();
			}, 3000);
		}
	}

	function startCountdown() {
		let count = 3;
		const countdownElement = document.getElementById('countdown');
		const countdownInterval = setInterval(() => {
			countdownElement.textContent = count;
			if (count === 0) {
				clearInterval(countdownInterval);
				window.location.href = '/dangnhap';  // Chuyển đến trang đăng nhập
			}
			count--;
		}, 1000);
	}
});