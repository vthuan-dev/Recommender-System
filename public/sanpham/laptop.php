<?php
include '..\admin\database.php';
$hinhanh = '../admin/';
$db = new database();
$link = $db->connectDB();
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
   
    </script>
    
    <div><h2>Laptop hot nhất chạy</h2></div>
    <hr>

    <div class="product-list">
    <?php
    $limit = 8; // Số sản phẩm trên mỗi trang
    // Xác định trang hiện tại là trang thứ mấy, nếu không có thì mặc định là trang 1
    $page = isset($_GET['page']) ? $_GET['page'] : 1; 
    // Xác định vị trí bắt đầu cho truy vấn,
    // ví dụ: trang 1 thì bắt đầu từ 0, trang 2 thì bắt đầu từ 8
    $start_from = ($page - 1) * $limit; 
    
    $sql = "SELECT products.id, products.name, productvariants.price, products.image 
    FROM products 
    JOIN productvariants 
    ON products.id = productvariants.product_id
    WHERE products.category = 'Laptop'
    LIMIT $start_from, $limit"; // Thêm giới hạn vào truy vấn
    
    $result = $link->query($sql);
    
    // Hiển thị dữ liệu của mỗi hàng
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            echo '<div class="product-item">';
            echo '<img src="' . $hinhanh . $row["image"] . '" alt="' . $row["name"] . '">';
            echo '<h3>' . $row["name"] . '</h3>';
            echo '<p>Gía: '.number_format($row['price']).'đ</p>';
            echo '<div class="rating">';
            echo '<span>★</span><span>★</span><span>★</span><span>★</span><span>☆</span>';
            echo '</div>';
            echo '<button class="add-to-cart" data-product-id="' . $row["id"] . '">Thêm vào giỏ hàng</button>';       
            echo '<a href="..\sanpham\sanpham.php?id=' . $row["id"] . '">';
            echo '<div class="detail-text">Ấn vào để xem chi tiết</div>';
            echo '</a>';
            echo '</div>';
        }
    } else {
        echo "No products found";
    }
    
    // Tạo liên kết phân trang
    $sql = "SELECT COUNT(*) FROM products WHERE category = 'Laptop'"; 
    $result = $link->query($sql); 
    $total_rows = $result->fetch_row()[0]; 
    // Tính tổng số trang, ví dụ có 20 sản phẩm và mỗi 
    //trang 8 sản phẩm thì sẽ có 3 trang
    $total_pages = ceil($total_rows / $limit); 
    
    if ($page > 1) {
        // Hiển thị nút "Quay lại" khi page > 1
        echo "<a href='laptop.php?page=".($page - 1)."'>Quay lại</a> ";
    }
    if ($page < $total_pages) {
        // Hiển thị nút "Xem tiếp" khi page < total_pages
        echo "<a href='laptop.php?page=".($page + 1)."'>Xem tiếp</a> ";
    }
    ?>
    </div>
</div>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script>
    $(document).ready(function(){
        $(".add-to-cart").click(function(e){
            e.preventDefault();
            var product_id = $(this).data('product-id');
            $.ajax({
                type: "POST",
                url: "../giohang/giohang.php",
                data: {action: 'add', product_id: product_id},
                success: function(response){
                    alert("Sản phẩm đã được thêm vào giỏ hàng");
                    location.reload(); // Reload the page to update the cart
                }
            });
        });
    });
</script>

</div>
        
    
</div>
<script src=""></script>

    

   
    </div>
<!-- Add this button to your HTML -->
<footer>
    <h3>Contact</h3>
    <p>Địa chỉ: Mậu thân, Xuân Khánh ,Ninh Kiểu, Cần Thơ</p>
    <p>Email: thuanb2112012@student.ctu.edu.vn</p>
    <p>Điện thoại: 0706871283</p>
    <p>© Can Tho University</p>
</footer>

</body>
</html>