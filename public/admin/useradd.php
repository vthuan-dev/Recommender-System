<?php
    include('header.php');
    include('slider.php');
    include 'class/crud_class_user.php';
?>
<?php
// khai báo biến và gán giá trị rỗng cho biến để tránh lỗi khi không có giá trị
    $user = new users();
    $passwordError = '';
    $fullname = '';
    $phonenumber = '';
    $email = '';
    // kiểm tra phương thức post từ form và kiểm tra giá trị của các trường nhập liệu từ form và gọi hàm insert_user từ class users
    if($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['phonenumber'], $_POST['password'], $_POST['confirm_password'], $_POST['email'], $_POST['fullname'])){
        $fullname = $_POST['fullname'];
        $phonenumber = $_POST['phonenumber']; 
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];
        $email = $_POST['email'];

        // nếu mật khẩu và mật khẩu xác nhận khớp thì gọi hàm insert_user từ class users
        if($password === $confirm_password){
            $insert_user = $user->insert_user($fullname, $phonenumber, $password, $email);
            if($insert_user){
                // reset lại giá trị của các biến
                $fullname = '';
                $phonenumber = '';
                $password = '';
                $confirm_password = '';
                $email = '';
            }
        } else {
            $passwordError = 'Mật khẩu xác nhận không khớp.';
        }
        
    }
?>

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
<style>
    .admin-content-right {
        display: flex;
        justify-content: center;
        align-items: flex-start; /* Adjust this */
        height: 100vh; /* Adjust as needed */
        background-color: wheat;
    }

    .admin-content-right-product-add {
        width: 50%; /* Adjust as needed */
        margin-top: 20px; /* Add this */
        border-radius: 16px;
    }

    .admin-content-right-product-add input {
        width: 100%;
        margin-bottom: 10px; /* Add this */
    }

    .password-field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    #passwordError {
        color: red;
        display: none;
        height: 8px;
    }

    .error {
        margin-bottom: 20px; /* Add this */
    }
</style>

<div class="admin-content-right">
    <div class="admin-content-right-product-add">
        <h1>Thêm người dùng</h1>
        <form action="" method="POST">
            <input type="text" name="fullname" placeholder="Nhập họ và tên" value="<?php echo htmlspecialchars($fullname); ?>">
            <input type="password" name="password" placeholder="Nhập mật khẩu">
            <div class="password-field">
                <input type="password" name="confirm_password" placeholder="Nhập lại mật khẩu">
                <p id="passwordError"></p>
            </div>
            <input type="email" name="email" placeholder="Nhập email" value="<?php echo htmlspecialchars($email); ?>">
            <input type="text" name="phonenumber" placeholder="Nhập số điện thoại" value="<?php echo htmlspecialchars($phonenumber); ?>">
            <button type="submit">Thêm</button>
        </form>
    </div>
</div>

<script>
    // Lắng nghe sự kiện input trên input confirm_password
    var password = document.querySelector('input[name="password"]');
    var confirm_password = document.querySelector('input[name="confirm_password"]');
    var passwordError = document.getElementById('passwordError');
    var passwordField = document.querySelector('.password-field');
    // nếu mật khẩu và mật khẩu xác nhận không khớp thì hiển thị thông báo lỗi
    confirm_password.addEventListener('input', function(){
        if(password.value && confirm_password.value) {
            // nếu mật khẩu  xác nhận dài hơn mật khẩu thì hiển thị thông báo lỗi 
            if(confirm_password.value.length > password.value.length){
                passwordError.textContent = 'Sai mật khẩu xác nhận.';
                passwordError.style.display = 'block';
                passwordField.classList.add('error');
            } else {
                // ngược lại thì ẩn thông báo lỗi
                passwordError.textContent = '';
                passwordError.style.display = 'none';
                passwordField.classList.remove('error');
            }
        } else {
            // nếu mật khẩu và mật khẩu xác nhận rỗng thì ẩn thông báo lỗi
            passwordError.textContent = '';
            passwordError.style.display = 'none';
            if(passwordField.classList.contains('error')) {
                passwordField.classList.remove('error');
            }
        }
    });


</script>

<script>
    // lắng nghe sự kiện blur trên input email và phonemumber
$(document).ready(function() {
    // lắng nghe sự kiện blur trên input email và phone
    $('input[name="email"], input[name="phone"]').on('blur', function() {
        var email = $('input[name="email"]').val();
        var phone = $('input[name="phone"]').val();
        // gửi request ajax đến file check_user.php để kiểm tra email và số điện thoại đã tồn tại chưa
        $.ajax({
            // đường dẫn file check_user.php
            url: 'check_user.php',
            type: 'POST',
            data: {
                'email': email,
                'phone': phone
            },
            // nếu request thành công thì trả về dữ liệu
            success: function(data) {
                // nếu dữ liệu trả về là exists thì hiển thị thông báo
                if (data == 'exists') {
                    alert('Email hoặc số điện thoại đã tồn tại. Vui lòng nhập một cái khác.');
                }
            }
        });
    });
});
</script>

</body>
</body>
</html>