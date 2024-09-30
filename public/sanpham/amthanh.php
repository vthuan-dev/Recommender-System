
<?php
include '../admin/database.php';

$db = new Database();
$hinhanh = '../admin/';
session_start();

?>

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="..\homepage\home-style.css">
    <link rel="icon" href="https://cdn.tgdd.vn/ValueIcons/iphone.jpg"  type="image/icon type">
    <meta http-equiv="UX-A Compatible" content="refresh">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="../homepage/log.css">

    <title>Cửa hàng điện thoại</title>
</head>
<body>
    <div class="trangchu">
        <div class="navigation">
           
            <div class="logo">
                <a href="..\homepage\homepage.php">
                    <img src="..\img\logo.jpg" alt="T-Store">
                </a>
            </div>
            
            <div class="tragop">
                <a href="#"><img src="https://s3v2.interdata.vn:9000/s3-586-15343-storage/dienthoaigiakho/wp-content/uploads/2022/05/31012158/1200x1200_Key-Tra-Gop_2208.jpg" alt=""></a>
            </div>
          
        
          
        
           <div class="timkiem">
            <form  action="../homepage/search.php" method="get">
                <input type="text" name="q" placeholder="Bạn muốn tìm gì ?">
                <i class="fa fa-search"></i>

            </form>
           </div>
           <div class="giohang">
            <a href="../giohang/giohang.php"><i class="fas fa-shopping-cart"></i></a>
        </div>
           
         
        <div class="dangnhap-dangky">
            <?php
            if (isset($_SESSION["phonenumber"])) {
                echo "Xin chào " . $_SESSION["fullname"];
                echo "<a href='../admin/logout.php'><i class='fas fa-sign-out-alt'></i> Đăng xuất</a>";
            } else {
                echo "<a href='..\dangnhap-dangky\dangky.php'><i class='fas fa-user'></i> Đăng ký</a>";
            }
            ?>
        </div>
        
    
     
</div>
<div class="pagebody">
    <div class="device-type">
        <div class="dienthoai"><a href="dienthoai.php">Điện thoại</a></div>        
        <div class="laptop"><a href="laptop.php">Laptop</a></div>
        <div class="amthanh"><a href="amthanh.php">Âm thanh</a></div>
        <div class="dongho"><a href="dongho.php">Đồng Hồ</a></div>
        <div class="tivi"><a href="tivi.php">Tivi</a></div>
        <div class="news"><a href="news.php">Tin tức</a></div>
    </div>
    <div class="uudai">
        <img class="mySlides" src="..\img\tai-nghe-sennheiser-momentum-true-wireless-4.webp" alt="">
        <img class="mySlides" src="..\img\MSI_sliding.webp" alt="">
        <img class="mySlides" src="..\img\samsung-galaxy.webp" alt="">
        <img class="mySlides" src="..\img\huawei-band-9-sliding.webp" alt="">
    
    </div>
   
    <script src="..\homepage\index.js"></script>

    <div><h2>Tai nghe bán chạy</h2></div>
    <hr>
    <!-- HTML -->
    <div class="product-list"></div>
    


    
</div>

    

    <footer>
        <h3>Contact</h3>
        <p>Địa chỉ: Mậu thân, Xuân Khánh ,Ninh Kiểu, Cần Thơ</p>
        <p>Email: thuanb2112012@student.ctu.edu.vn</p>
        <p>Điện thoại: 0706871283</p>
        <p>© Can Tho University</p>
    </footer>
    </div>
<!-- Add this button to your HTML -->


</body>
</html>