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
                    <img src="..\img\logo.jpg" alt="T-Store">
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
        //kiểm tra xem người dùng đã nhập từ khóa tìm kiếm chưa
      if (isset($_GET['q'])) {
        //nếu có thì lấy từ khóa tìm kiếm và thực hiện truy vấn SQL
        $search = $_GET['q'];
        //thêm ký tự % vào trước và sau từ khóa tìm kiếm để tìm kiếm chính xác hơn
        $search = '%' . $search . '%';
        //viết câu truy vấn SQL để tìm kiếm sản phẩm theo từ khóa
        $stmt = $link->prepare("SELECT products.id, products.name, productvariants.price, products.image 
        FROM products 
        JOIN productvariants 
        ON products.id = productvariants.product_id
        WHERE products.name LIKE ?");
        //gán giá trị cho tham số truy vấn
        $stmt->bind_param("s", $search);
        $stmt->execute();
        $result = $stmt->get_result();


      
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
        <div class="dienthoai"><a href="..\sanpham\dienthoai.html">Điện thoại</a></div>        
        <div class="laptop"><a href="..\sanpham\laptop.html">Laptop</a></div>
        <div class="amthanh"><a href="..\sanpham\amthanh.html">Âm thanh</a></div>
        <div class="dongho"><a href="..\sanpham\dongho.html">Đồng Hồ</a></div>
        <div class="tivi"><a href="..\sanpham\tivi.html">Tivi</a></div>
        <div class="news"><a href="..\sanpham\news.html">Tin tức</a></div>
    </div>
    <div class="uudai">
        <img class="mySlides" src="..\img\tai-nghe-sennheiser-momentum-true-wireless-4.webp" alt="">
        <img class="mySlides" src="..\img\MSI_sliding.webp" alt="">
        <img class="mySlides" src="..\img\samsung-galaxy.webp" alt="">
        <img class="mySlides" src="..\img\huawei-band-9-sliding.webp" alt="">

    </div>

    <script src="index.js"></script>
   
        
    <div><h2>Sản phẩm tìm được</h2></div>
    <hr>

    <div class="product-list">
            <?php
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
            ?>
        </div>
    
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