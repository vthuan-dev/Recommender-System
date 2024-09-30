<?php
// Bắt đầu hoặc tiếp tục phiên làm việc
session_start();


// Hủy tất cả các biến phiên làm việc
$_SESSION = array();

// Nếu yêu cầu, hủy cookie phiên làm việc hiện tại
if (ini_get("session.use_cookies")) {
    // Lấy thông số cookie hiện tại của phiên làm việc
    $params = session_get_cookie_params();
    // Hủy cookie4
    // Lấy thông số cookie hiện tại của phiên làm việc, thời gian hết hạn của cookie là 42000
    setcookie(session_name(), '', time() - 42000,
        // Lấy thông số cookie hiện tại của phiên làm việc
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Cuối cùng, hủy phiên làm việc
session_destroy();


// Chuyển hướng người dùng về trang chủ (hoặc trang đăng nhập)
header("Location: ../homepage/homepage.php");
exit;