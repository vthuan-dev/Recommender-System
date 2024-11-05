$(document).ready(function(){
    $("form").submit(function(e){
        // Lấy giá trị của các input
        var email = $("input[name='email']").val();
        var phonenumber = $("input[name='phonenumber']").val();
        var password = $("input[name='password']").val();
        var confirm_password = $("input[name='confirm_password']").val();
        // Kiểm tra dữ liệu có hợp lệ không
        if (!email.match(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)) {
            alert('Email không đúng định dạng.');
            e.preventDefault();
            return;
        }
        // Kiểm tra dữ liệu có hợp lệ không
        if (!phonenumber.match(/^0[0-9]{9}$/)) {
            alert('Số điện thoại không đúng định dạng.');
            e.preventDefault();
            return;
        }
        // Kiểm tra dữ liệu có hợp lệ không
        if (password !== confirm_password) {
            alert('Mật khẩu và mật khẩu xác nhận không khớp.');
            e.preventDefault();
            return;
        }
    });
});