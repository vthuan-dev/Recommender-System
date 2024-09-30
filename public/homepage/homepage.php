<?php
include '..\admin\database.php';

$hinhanh = '../admin/';
session_start();

// Thực hiện truy vấn SQL
$db = new database();
$link = $db->connectDB();


$sql = "SELECT products.id, products.name , productvariants.price, products.image, products.description FROM products JOIN productvariants ON products.id = productvariants.product_id";
$result = $link->query($sql);


  // Hiển thị dữ liệu của mỗi hàng


?>


<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="home-style.css">
    <link rel="icon" href="https://cdn.tgdd.vn/ValueIcons/iphone.jpg"  type="image/icon type">
    <meta http-equiv="UX-A Compatible" content="refresh">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <link rel="stylesheet" href="log.css">
    <title>Cửa hàng điện thoại</title>
</head>
<body>
    <div class="trangchu">
        <div class="navigation">
           
            <div class="logo">
                <a href="homepage.php">
                    <img src="..\img\image.png" alt="T-Store">
                </a>
            </div>
            <div class="tragop">
                <a href="#"><img src="https://s3v2.interdata.vn:9000/s3-586-15343-storage/dienthoaigiakho/wp-content/uploads/2022/05/31012158/1200x1200_Key-Tra-Gop_2208.jpg" alt=""></a>
            </div>
          
           <div class="timkiem">
            <form  action="search.php" method="get">
                <input type="text" name="q" placeholder="Bạn muốn tìm gì ?">
                <i class="fa fa-search"></i>

            </form>
           </div>

        <?php
        //query lấy dữ liệu từ bảng 
      if (isset($_GET['q'])) {  
        // q là biến tìm kiếm, dùng để tìm kiếm tên sản phẩm
        $search = $_GET['q'];
        // Tìm kiếm sản phẩm theo tên
        $search = '%' . $search . '%';
        $stmt = $link->prepare("SELECT products.id, products.name, productvariants.price, products.image 
        FROM products 
        JOIN productvariants 
        ON products.id = productvariants.product_id
        WHERE products.name LIKE ?");
        $stmt->bind_param("s", $search);
        $stmt->execute();
        $result = $stmt->get_result();


        while($product = $result->fetch_assoc()) {
            echo '<div class="product-item">';
            echo '<img src="' . $hinhanh . $product["image"] . '" alt="' . $product["name"] . '">';
            echo '<h3>' . $product["name"] . '</h3>';
            echo '<p>' . $product["price"] . ' đ</p>';
            echo '<div class="rating">';
            echo '<span>★</span><span>★</span><span>★</span><span>★</span><span>☆</span>';
            echo '</div>';
            echo '<button class="add-to-cart" data-product-id="' . $product["id"] . '">Thêm vào giỏ hàng</button>';
            echo '<a href="..\sanpham\sanpham.php?id=' . $product["id"] . '">';
            echo '<div class="detail-text">Ấn vào để xem chi tiết</div>';
            echo '</a>';
            echo '</div>';

        }
    }
?>






           <div class="giohang">
            <a href="..\giohang\giohang.php"><i class="fas fa-shopping-cart"></i></a>
        </div>
         
        
        </style>
         
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
        <div class="dienthoai"><a href="..\sanpham\dienthoai.php">Điện thoại</a></div>        
        <div class="laptop"><a href="..\sanpham\laptop.php">Laptop</a></div>
        <div class="amthanh"><a href="..\sanpham\amthanh.php">Âm thanh</a></div>
        <div class="dongho"><a href="..\sanpham\dongho.php">Đồng Hồ</a></div>
        <div class="tivi"><a href="..\sanpham\tivi.php">Tivi</a></div>
        <div class="news"><a href="..\sanpham\news.php">Tin tức</a></div>
    </div>
    <div class="uudai">
        <img class="mySlides" src="..\img\tai-nghe-sennheiser-momentum-true-wireless-4.webp" alt="">
        <img class="mySlides" src="..\img\MSI_sliding.webp" alt="">
        <img class="mySlides" src="..\img\samsung-galaxy.webp" alt="">
        <img class="mySlides" src="..\img\huawei-band-9-sliding.webp" alt="">

    </div>

    <script src="index.js"></script>
   
    
    <div><h2>Điện thoại bán chạy</h2></div>
    <hr>

    <div class="product-list">
    <?php


    // 
    $sql = "SELECT products.id, products.name, productvariants.price, products.image 
    FROM products 
    JOIN productvariants 
    ON products.id = productvariants.product_id
    WHERE products.category = 'Điện thoại'";
    $result = $link->query($sql);

    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            //in ra từng sản phẩm
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
    
    ?>
</div>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script>
           // Thêm sản phẩm vào giỏ hàng dùng jquery ajax  
        $(document).ready(function(){
            // Khi click vào nút thêm vào giỏ hàng thì thực hiện ajax
            $(".add-to-cart").click(function(e){
                // Ngăn chặn hành vi mặc định của nút submit có nghĩa là không gửi dữ liệu đi đâu cả
                e.preventDefault();
                // Lấy product_id từ thuộc tính data-product-id của nút thêm vào giỏ hàng
                var product_id = $(this).data('product-id');
                // Thực hiện ajax
                $.ajax({
                    // Phương thức post
                    type: "POST",
                    url: "../giohang/giohang.php",
                    // Truyền product_id vào action
                    data: {action: 'add', product_id: product_id},
                    success: function(response){
                        // Hiển thị thông báo
                        alert("Sản phẩm đã được thêm vào giỏ hàng");
                        location.reload(); // Reload the page to update the cart
                    }
                });
            });
        });
    </script>


    <div><h2>Laptop hot nhất chạy</h2></div>
    <hr>
    <div class="product-list ">
    <?php
        $sql = "SELECT products.id, products.name, productvariants.price, products.image 
    FROM products 
    JOIN productvariants 
    ON products.id = productvariants.product_id
    WHERE products.category = 'Laptop'";
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
    ?>
    </div>

    <div><h2>Đồng hồ bán chạy</h2></div>
    <hr>
        
    <div class="product-list ">
    <?php


// 
$sql = "SELECT products.id, products.name, productvariants.price, products.image 
FROM products 
JOIN productvariants 
ON products.id = productvariants.product_id
WHERE products.category = 'Đồng hồ'";
$result = $link->query($sql);

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
?>
       
    </div>
    <div><h2>Tivi bán chạy</h2></div>
    <hr>

    <div class="product-list ">
    <?php


// 
$sql = "SELECT products.id, products.name, productvariants.price, products.image 
FROM products 
JOIN productvariants 
ON products.id = productvariants.product_id
WHERE products.category = 'Tivi'";
$result = $link->query($sql);

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
?>

    </div>
     
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