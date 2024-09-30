<?php
include '../admin/database.php';
session_start();

// Kết nối cơ sở dữ liệu
$db = new database();
// tạo kết nối
$conn = $db->connectDB();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $tel = $_POST["tel"];
  $password = $_POST["password"];

  // Kiểm tra xem số điện thoại và mật khẩu có khớp với dữ liệu trong cơ sở dữ liệu hay không
  $sql = "SELECT * FROM users WHERE phonenumber = ? AND password = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("ss", $tel, $password);
  $stmt->execute();
  $result = $stmt->get_result();
	// Kiểm tra xem số điện thoại và mật khẩu có khớp với dữ liệu trong cơ sở dữ liệu hay không
  if ($result->num_rows > 0) {
	// Số điện thoại và mật khẩu khớp, đăng nhập thành công
    $user = $result->fetch_assoc();
	// Lưu trữ thông tin người dùng trong phiên
    $_SESSION["phonenumber"] = $user['phonenumber'];
    $_SESSION["fullname"] = $user['fullname'];
    echo "<script>alert('Đăng nhập thành công'); window.location.href = '../homepage/homepage.php';</script>";
} else {
    // Số điện thoại hoặc mật khẩu không khớp, đăng nhập thất bại
    echo "<script>alert('Số điện thoại hoặc mật khẩu không đúng. Vui lòng thử lại.');</script>";
}

  $stmt->close();
}

$conn->close();

?>

<html lang="en">
<head>
	<title>Đăng nhập</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<script type="application/x-javascript"> addEventListener("load", function() { setTimeout(hideURLbar, 0); }, false); function hideURLbar(){ window.scrollTo(0,1); } </script>
<!-- fonts -->
	<link href="//fonts.googleapis.com/css?family=Raleway:100,200,300,400,500,600,700,800,900" rel="stylesheet">
	<link href="//fonts.googleapis.com/css?family=Monoton" rel="stylesheet">

	<link href="css/font-awesome.min.css" rel="stylesheet" type="text/css" media="all" />
	<link href="css/style.css" rel='stylesheet' type='text/css' media="all" />
	
</head>
<body>


<body>
<h1 class="w3ls"><strong>Đăng nhập</strong></h1>
<div style="height: 400px;" class="content-w3ls">
	<div style="height: 400px;" class="content-agile1">
		<h2 style="margin-top: -10px;" class="agileits1"><a href="../homepage/homepage.php">T-Store</a></h2>
		<p   class="agileits2"></p>
	</div>
	<div class="content-agile2">
		<form action="dangnhap.php" method="post" autocomplete="off">
			

			<div class="form-control w3layouts">	
				<input type="tel" id="tel" name="tel" placeholder="Số điện thoại" title="Vui lòng nhập mật khẩu " required="">
			</div>

			<div class="form-control agileinfo">	
				<input type="password" class="lock" name="password" placeholder="Mật Khẩu" id="password1" required="">
			</div>	

		
			<input type="submit" class="register" value="Đăng nhập">
		</form>

        <div class="dangky1">
			<p style="text-align: center;">Bạn chưa có tài khoản ? <a style="color: aliceblue; text-decoration: underline ;" href="dangky.php">Hãy đăng ký ngay
			</a></p>
			<br>
		<p class="wthree w3l">Đăng nhập nhanh hơn với: </p>
		<ul class="social-agileinfo wthree2">
			<li><a href="#"><i class="fa fa-facebook"></i></a></li>
			<li><a href="#"><i class="fa fa-youtube"></i></a></li>
			<li><a href="#"><i class="fa fa-google-plus"></i></a></li>
		</ul>
	</div>
	<div class="clear"></div>
</div>
</body>
</html>