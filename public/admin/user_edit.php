<?php
    include 'header.php';
    include 'slider.php';
    include 'class/crud_class_user.php';

    $user = new users();
    // kiểm tra id có 
    if (!isset($_GET['id']) || $_GET['id'] == NULL) {
        echo "<script>window.location = 'productlist.php'</script>";
    } else {
        $id = $_GET['id'];
    }

    // get user by id để hiển thị thông tin người dùng cần sửa
    $get_user_byID = $user->get_user_by_id($id);
    // lấy thông tin người dùng cần sửa
    if ($get_user_byID) {
         $result = $get_user_byID;
    }

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $fullname = $_POST['fullname'];
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];
        $email = $_POST['email'];
        $phonenumber = $_POST['phonenumber'];
        // gọi hàm update_user từ class users, kiểm tra thông tin người dùng đã thay đổi chưa, nếu có thì update, không thì không update
        if ($phonenumber != $result['phonenumber'] || $password != $result['password'] || $confirm_password != $result['confirm_password'] || $email != $result['email'] || $fullname != $result['fullname']) {
            $update_user = $user->update_user($id, $fullname, $phonenumber, $password, $email);        
            header('Location: user_edit.php?id="$id"');
        }
    }

?>
<div class="admin-content-right">
<div class="admin-content-right-product-add">
    <h1>Sửa người dùng</h1>
    <form action="" method="POST">
        <input type="text" name="fullname" placeholder="Nhập họ và tên"
            value="<?php echo isset($result['fullname']) ? $result['fullname'] : '' ?>"
            >
        <input type="password" name="password" placeholder="Nhập mật khẩu"
            value="<?php echo isset($result['password']) ? $result['password'] : '' ?>"
            >
        <input type="password" name="confirm_password" placeholder="Nhập lại mật khẩu"
            value="<?php echo isset($result['confirm_password']) ? $result['confirm_password'] : '' ?>"
            >
        <input type="email" name="email" placeholder="Nhập email"
            value="<?php echo isset($result['email']) ? $result['email'] : '' ?>"
            >
        <input type="text" name="phonenumber" placeholder="Nhập số điện thoại"
            value="<?php echo isset($result['phonenumber']) ? $result['phonenumber'] : '' ?>"
            >
        <button type="submit">Sửa</button>
    </form>
</div>
</div>