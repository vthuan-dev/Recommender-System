document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    
    // Hàm validate email
    function validateEmail() {
        const email = document.getElementById("email").value;
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        
        if (!emailRegex.test(email)) {
            document.getElementById("email").setCustomValidity('Vui lòng nhập email hợp lệ');
        } else {
            document.getElementById("email").setCustomValidity('');
        }
    }

    // Hàm validate password
    function validatePassword() {
        const password = document.getElementById("password").value;
        if (password === "") {
            document.getElementById("password").setCustomValidity('Vui lòng nhập mật khẩu');
        } else {
            document.getElementById("password").setCustomValidity('');
        }
    }

    // Thêm event listeners cho validation
    document.getElementById("email").addEventListener("input", validateEmail);
    document.getElementById("password").addEventListener("input", validatePassword);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validation cơ bản
        if (!email || !password) {
            showMessage('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            showMessage('Vui lòng nhập email hợp lệ', 'error');
            return;
        }

        try {
            // Gửi request đến endpoint login-client
            const response = await fetch('/login-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Lưu token và thông tin người dùng vào localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('fullname', data.fullname);
                localStorage.setItem('role', data.role);

                // Nếu người dùng chọn "Ghi nhớ đăng nhập"
                if (document.getElementById('remember').checked) {
                    localStorage.setItem('rememberMe', 'true');
                }

                showMessage('Đăng nhập thành công!', 'success');
                startCountdown();
            } else {
                showMessage(data.message || 'Đăng nhập thất bại', 'error');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showMessage('Đã xảy ra lỗi khi đăng nhập', 'error');
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
                window.location.href = '/'; // Chuyển hướng đến trang chủ
            }
            count--;
        }, 1000);
    }

    // Xử lý nút "Đi đến trang chủ" trong overlay
    const goToHomeButton = document.querySelector('#messageOverlay button');
    if (goToHomeButton) {
        goToHomeButton.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
});
