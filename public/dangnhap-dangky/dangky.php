<?php
session_start();
include '../admin/database.php';

$db = new database();
$conn = $db->connectDB();
// Kiểm tra xem người dùng đã đăng nhập chưa
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $firstname = $_POST["firstname"];
  $tel = $_POST["tel"];
  $email = $_POST["email"];
  $password = $_POST["password"];

  // Kiểm tra xem số điện thoại đã tồn tại chưa
  $sql = "SELECT * FROM users WHERE phonenumber = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("s", $tel);
  $stmt->execute();
  $result = $stmt->get_result();

 
if ($result->num_rows > 0) {
    // Số điện thoại đã tồn tại
    echo "<script>alert('Số điện thoại đã được sử dụng. Vui lòng nhập số khác.');</script>";
} else {
    // Kiểm tra xem email đã tồn tại chưa
    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Email đã tồn tại
        echo "<script>alert('Email đã được sử dụng. Vui lòng nhập email khác.');</script>";
    } else {
        // Số điện thoại và email chưa tồn tại, tiếp tục đăng ký
        $sql = "INSERT INTO users (phonenumber, password, email, fullname) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $tel, $password, $email, $firstname);

        if ($stmt->execute()) {
            // Đăng ký thành công, lưu thông tin vào session
            $_SESSION["phonenumber"] = $tel;
            $_SESSION["fullname"] = $firstname;
            echo "<script>alert('Đăng ký thành công'); window.location.href = '../homepage/homepage.php';</script>";
        } else {
            echo "Đăng ký thất bại: " . $conn->error;
        }
    }
}
}
$conn->close();
?>
<html lang="en">
<head>
	<title>Đăng ký</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<script type="application/x-javascript"> addEventListener("load", function() { setTimeout(hideURLbar, 0); }, false); function hideURLbar(){ window.scrollTo(0,1); } </script>
<!-- fonts -->
	<link href="//fonts.googleapis.com/css?family=Raleway:100,200,300,400,500,600,700,800,900" rel="stylesheet">
	<link href="//fonts.googleapis.com/css?family=Monoton" rel="stylesheet">

	<link href="css/font-awesome.min.css" rel="stylesheet" type="text/css" media="all" />
	<link href="css/style.css" rel='stylesheet' type='text/css' media="all" />
	<meta http-equiv="UX-A Compatible " content="refresh">
	<script src="dangky.js"></script>
</head>
<body>


<!-- /css -->
</head>
<body>
<h1 class="w3ls"><strong>Đăng Ký</strong></h1>
<div class="content-w3ls">
	<div class="content-agile1">
		<h2 class="agileits1"><a href="../homepage/homepage.php">T-Store</a></h2>
		<p class="agileits2">Cửa hàng bán điện thoại hàng đầu thế giới</p>
	</div>
	<div class="content-agile2">
		<form action="" method="post">
			<div class="form-control w3layouts"> 
				<input type="text" id="firstname" name="firstname" placeholder="Hãy nhập tên" title="Vui lòng nhập tên của bạn" required="">
			</div>

			<div class="form-control w3layouts">	
				<input type="tel" id="tel" name="tel" placeholder="Số điện thoại" title="Vui lòng nhập mật khẩu " required="">
			</div>

			<div class="form-control w3layouts">	
				<input type="email" id="email" name="email" placeholder="Email" title="Vui lòng nhập email của bạn" required="">
			</div>

			<div class="form-control agileinfo">	
				<input type="password" class="lock" name="password" placeholder="Mật Khẩu" id="password1" required="">
			</div>	

			<div class="form-control agileinfo">	
				<input type="password" class="lock" name="confirm-password" placeholder="Xác nhận mật khẩu" id="password2" required="">
			</div>			

			<input type="submit" class="register" value="Đăng ký">
		</form>
		
		<script src="validate.js"></script>
		
		<div class="dangky1">
			<p style="text-align: center;">Bạn đã có tài khoản ? <a style="color: aliceblue; text-decoration: underline ;" href="dangnhap.php">Hãy đăng nhập ngay
			</a></p>
			<br>
		</div>
		
	</div>
	<div class="clear"></div>
</div>
<p class="copyright">Thiết kế bởi <a href="https://www.facebook.com/thuanng1024/?locale=vi_VN" target="_blank">Nguyen Van Thuan</a></p>
</body>
</html>