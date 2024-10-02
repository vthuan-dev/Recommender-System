			window.onload = function () {
				document.getElementById("password1").onchange = validatePassword;
				document.getElementById("password2").onchange = validatePassword;
			}
			function validatePassword(){
				var pass2=document.getElementById("password2").value;
				var pass1=document.getElementById("password1").value;
				if(pass1!=pass2)
					document.getElementById("password2").setCustomValidity("Mật khẩu không khớp,vui lòng nhập lại");
				else
					document.getElementById("password2").setCustomValidity('');	 
					//empty string means no validation error
			}


			document.addEventListener('DOMContentLoaded', function() {
				const form = document.getElementById('registration-form');
				const messageDiv = document.getElementById('message');
				
				function validatePassword(){
					var pass2 = document.getElementById("password2").value;
					var pass1 = document.getElementById("password1").value;
					if(pass1 != pass2)
						document.getElementById("password2").setCustomValidity("Mật khẩu không khớp, vui lòng nhập lại");
					else
						document.getElementById("password2").setCustomValidity('');
				}

				document.getElementById("password1").addEventListener("change", validatePassword);
				document.getElementById("password2").addEventListener("change", validatePassword);

				form.addEventListener('submit', async function(e) {
					e.preventDefault();

					const firstname = document.getElementById('firstname').value;
					const tel = document.getElementById('tel').value;
					const email = document.getElementById('email').value;
					const password = document.getElementById('password1').value;
					const confirmPassword = document.getElementById('password2').value;

					// Kiểm tra dữ liệu nhập vào
					var nameRegex = /^[\p{L} ]{2,30}$/u; // Cho phép các ký tự Unicode và khoảng trắng
					var telRegex = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
					var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

					let errors = [];

					if (!nameRegex.test(firstname)) {
						errors.push('Vui lòng nhập tên hợp lệ (2-30 ký tự)');
					}

					if (!telRegex.test(tel)) {
						errors.push('Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)');
					}

					if (!emailRegex.test(email)) {
						errors.push('Vui lòng nhập email hợp lệ');
					}

					if (password !== confirmPassword) {
						errors.push('Mật khẩu không khớp');
					}

					if (errors.length > 0) {
						showMessage(errors.join('<br>'), 'error');
						return;
					}

					try {
						const response = await fetch('/dangky', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({ firstname, tel, email, password }),
						});

						const data = await response.json();

						if (response.ok) {
							showMessage(data.message, 'success');
							form.reset(); // Xóa nội dung form sau khi đăng ký thành công
							// Không cần setTimeout ở đây nữa vì đã có trong hàm startCountdown
						} else {
							showMessage(data.message, 'error');
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
						startCountdown();
					} else {
						// Xử lý thông báo lỗi ở đây nếu cần
					}
				}

				function startCountdown() {
					let count = 3;
					const countdownElement = document.getElementById('countdown');
					const countdownInterval = setInterval(() => {
						countdownElement.textContent = count;
						if (count === 0) {
							clearInterval(countdownInterval);
							redirectToHomepage();
						}
						count--;
					}, 1000);
				}

				function redirectToHomepage() {
					window.location.href = '../homepage/homepage.html';
				}

				// Thêm đoạn này vào cuối file
				document.querySelector('.message-box button').addEventListener('click', redirectToLogin);
			});