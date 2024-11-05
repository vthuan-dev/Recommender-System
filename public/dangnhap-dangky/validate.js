document.querySelector('form').addEventListener('submit', function(event) {
    // Ngăn chặn hành động mặc định của form
    event.preventDefault();

    // Lấy dữ liệu từ các trường form
    var firstname = document.getElementById('firstname').value;
    var tel = document.getElementById('tel').value;
    var email = document.getElementById('email').value;

    // Kiểm tra dữ liệu nhập vào
    var telRegex = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
    var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

 

    if (!telRegex.test(tel)) {
        alert('Vui lòng nhập số điện thoại hợp lệ');
        return;
    }

    if (!emailRegex.test(email)) {
        alert('Vui lòng nhập email hợp lệ');
        return;
    }

    // Nếu tất cả các trường đều hợp lệ, gửi form
    this.submit();
});