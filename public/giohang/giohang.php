<?php
session_start();

include '../admin/database.php';
$db = new Database();
//kiểm tra phương thức request, lấy id sản phẩm và action
if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $product_id = $_POST['product_id'];
    //lấy action từ form
    $action = $_POST['action'];
    //nếu action là add thì thêm sản phẩm vào giỏ hàng
    if ($action === 'add') {
        $query = "SELECT p.name as product_name, v.name as variant_name, v.price as variant_price 
                  FROM products p 
                  JOIN productvariants v ON p.id = v.product_id 
                  WHERE p.id = ?";
        $stmt = $db->link->prepare($query);
        $stmt->bind_param("i", $product_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();
        //kiểm tra sản phẩm có tồn tại không
        if ($product) {
            //nếu không có giỏ hàng thì tạo giỏ hàng
            if (!isset($_SESSION['cart'])) {
                $_SESSION['cart'] = [];
            }

            // nếu có giỏ hàng thì kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa
            if (isset($_SESSION['cart'][$product_id])) {
                // nếu sản phẩm đã tồn tại thì tăng số lượng lên 1
                $_SESSION['cart'][$product_id]['quantity']++;
            } else {
                // nếu sản phẩm chưa tồn tại thì thêm sản phẩm vào giỏ hàng
                $_SESSION['cart'][$product_id] = [
                    'name' => $product['product_name'] . ' - ' . $product['variant_name'],
                    'price' => $product['variant_price'],
                    'quantity' => 1
                ];
            }
        }
    //nếu action là remove thì xóa sản phẩm khỏi giỏ hàng
    } elseif ($action === 'remove') {
        //kiểm tra sản phẩm có tồn tại trong giỏ hàng không
        if (isset($product_id) && array_key_exists($product_id, $_SESSION['cart'])) {
            //nếu có thì xóa sản phẩm khỏi giỏ hàng
            unset($_SESSION['cart'][$product_id]);
        } else {
            //nếu không có thì thông báo lỗi
            echo "Lỗi: Id không hợp lệ hoặc không tồn tại trong giỏ hàng";
        }
    }
}

    
    // Redirect back to the product page
    //header('Location: ../sanpham/sanpham.php?id=' . $product_id);
    

?>

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="..\homepage\home-style.css">
    <link rel="icon" href="https://cdn.tgdd.vn/ValueIcons/iphone.jpg"  type="image/icon type">
    <meta http-equiv="refresh" content="5">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="giohang.css">
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
            <form  action="/search" method="get">
                <input type="text" name="q" placeholder="Bạn muốn tìm gì ?">
                <i class="fa fa-search"></i>

            </form>
           </div>
           <div class="giohang">
            <a href="#"><i class="fas fa-shopping-cart"></i></a>
        </div>
           
         
        <div class="dangnhap-dangky">
        <?php
        //bắt đầu session nếu chưa có session
            if (isset($_SESSION["phonenumber"])) {
                //nếu đã đăng nhập thì hiển thị nút đăng xuất
                echo "Chào mừng " . $_SESSION["fullname"];
                echo "<a href='../admin/logout.php'><i class='fas fa-sign-out-alt'></i> Đăng xuất</a>";
            } else {
                //nếu chưa đăng nhập thì hiển thị nút đăng nhập
                echo "<a href='..\dangnhap-dangky\dangky.php'><i class='fas fa-user'></i> Đăng ký</a>";
            }
            ?>        </div>
        
    
     
</div>
<div class="pagebody">
    <div class="device-type">
        <div class="dienthoai"><a href="../sanpham/dienthoai.php">Điện thoại</a></div>        
        <div class="laptop"><a href="../sanpham/laptop.php">Laptop</a></div>
        <div class="amthanh"><a href="../sanpham/amthanh.php">Âm thanh</a></div>
        <div class="dongho"><a href="../sanpham/dongho.php">Đồng Hồ</a></div>
        <div class="tivi"><a href="../sanpham/tivi.php">Tivi</a></div>
        <div class="news"><a href="../sanpham/news.php">Tin tức</a></div>
    </div>
    <div class="uudai">
        <img class="mySlides" src="..\img\tai-nghe-sennheiser-momentum-true-wireless-4.webp" alt="">
        <img class="mySlides" src="..\img\MSI_sliding.webp" alt="">
        <img class="mySlides" src="..\img\samsung-galaxy.webp" alt="">
        <img class="mySlides" src="..\img\huawei-band-9-sliding.webp" alt="">
    
    </div>
   
    <script src="..\homepage\index.js"></script>

    <div><h2>Giỏ hàng </h2></div>
    <hr>
    <!-- HTML -->
    
    <table class="cart-table">
        <thead>
            <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Tổng giá</th>
            </tr>
        </thead>
        <tbody>
        <?php
        // bắt đầu session nếu chưa có session
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        // Nếu chưa có giỏ hàng thì tạo giỏ hàng
        if (!isset($_SESSION['cart'])) {
            // Tạo giỏ hàng
            $_SESSION['cart'] = array();
        }

        // Lặp qua giỏ hàng để hiển thị sản phẩm
        foreach ($_SESSION['cart'] as $product_id => $product) {
            echo '<tr>';
            echo '<td>' . $product['name'] . '</td>';
            echo '<td>' .number_format($product['price']).'đ</td>';
            echo '<td>' . $product['quantity'] . '</td>';
           
            
            
            echo '<td>' . number_format($product['price'] * $product['quantity']) . ' đ</td>';
            echo '<td><button class="remove" value="' . $product_id . '">Xóa</button></td>';
            echo '<td colspan="4" align="right"><button class="order" onclick="order()">Đặt hàng</button></td>';
            

            echo '</tr>';
        }
    

        ?>
            <!-- Kết thúc lặp -->
        </tbody>
    </table>
    <script>
        
    </script>
    
    
 
  
    <script src="crud-cart.js"></script>



    
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