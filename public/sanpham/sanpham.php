<?php
include '../admin/database.php';

$db = new Database();
$hinhanh = '../admin/';
session_start();




$product_id = $_GET['id'];

// Thực hiện truy vấn SQL
$query = "SELECT products.name AS product_name, productvariants.name AS variant_name, productvariants.price, products.description, products.image , products.manufacturer, products.warranty, products.vat_included 
FROM products 
JOIN productvariants 
ON products.id = productvariants.product_id
WHERE products.id = ?";

$stmt = $db->link->prepare($query);
$stmt->bind_param("i", $product_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
// Kiểm tra xem sản phẩm có tồn tại không
if (!$row) {
    header('Location: ../homepage/homepage.php');
    exit;
}
?>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="..\homepage\home-style.css">
    <link rel="icon" href="https://cdn.tgdd.vn/ValueIcons/iphone.jpg"  type="image/icon type">
    <meta http-equiv="refresh" content="30">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="sanpham.css">
    <script src="..\giohang\scrud-cart.js"></script>
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
        <div class="dienthoai"><a href="..\sanpham\dienthoai.php">Điện thoại</a></div>        
        <div class="laptop"><a href="laptop.php">Laptop</a></div>
        <div class="amthanh"><a href="amthanh.php">Âm thanh</a></div>
        <div class="dongho"><a href="dongho.php">Đồng Hồ</a></div>
        <div class="tivi"><a href="tivi.php">Tivi</a></div>
        <div class="news"><a href="news.php">Tin tức</a></div>
    </div>

    <div class="sanpham">
     
        <div class="thongtin">
            <div id="tensanpham">
                <?php echo $row['product_name']; ?>  
            </div>
            <div class="hinhanh">
            
            <?php
            echo '<img style="width:100%" src="' .$hinhanh . $row["image"] . '" alt="' . $row["product_name"] . '">';          
            ?>
              </div>      
        <div id="tt-spham">
            <div class="in4may">
                <i class="fas fa-info-circle"></i> <?php echo $row['description']; ?>
            </div>
            <div class="spdikem">
                <i class="fas fa-box-open"></i> <?php echo $row['manufacturer']; ?>            </div>
            <div class="baohanh">
                <i class="fas fa-shield-alt"></i> <?php echo $row['warranty']; ?>
            </div>
            <div class="chinhsach">
                <i class="fas fa-tag"></i> Giá sản phẩm đã <?php echo $row['vat_included'] ? 'bao gồm' : 'chưa bao gồm'; ?> VAT
            </div> 
        </div>
          </div>

        <div class="sanpham-loai" style="margin-left: 0;
        padding-left: 0;
        position: relative;
        left: 200px;}">
            <div class="gia">
                <div class="giaban">
                    <?php echo number_format($row['price']); ?>đ
                </div>
                <div class="giakm">
                    41.990.000đ
                </div>
            </div>
            <div class="variants">
                <div class="vr">
                <?php echo $row['variant_name']; ?>
                </div>
                
            </div>
        <div class="hinhthuc-mua">
            <div id="muangay">
                <button>Mua ngay</button>
            </div>
                <div id="themgiohang">
        <form method="POST" action="../giohang/giohang.php">
            <input type="hidden" name="product_id" value="<?php echo $product_id; ?>">
            <button>Thêm vào giỏ hàng</button>
        </form>
    </div>
            
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script>
        //thêm sản phẩm vào giỏ hàng
        $(document).ready(function(){
            $("#themgiohang button").click(function(e){
                e.preventDefault();
                // Lấy product_id từ form và gửi lên server để thêm vào giỏ hàng
                var product_id = $(this).closest('form').find("input[name='product_id']").val();
                $.ajax({
                    type: "POST",
                    url: "../giohang/giohang.php",
                    // Gửi product_id lên server
                    data: {action: 'add', // Thêm sản phẩm vào giỏ hàng
                         product_id: product_id // ID của sản phẩm
                        }, 
                    // Hiển thị thông báo thêm sản phẩm vào giỏ hàng thành công
                    success: function(response){
                        alert("Sản phẩm đã được thêm vào giỏ hàng");
                        location.reload(); // Reload the page to update the cart
                    }
                });
            });
        });
    </script>
        </div>
        <div class="thongsomay">
            <table>
                <tr>
                    <td>Kích thước màn hình</td>
                    <td>6.7 inches</td>
                </tr>
                <tr>
                    <td>Công nghệ màn hình</td>
                    <td>Dynamic AMOLED 2X</td>
                </tr>
                <tr>
                    <td>Camera sau</td>
                    <td>Camera siêu rộng: 12MP, F2.2, 123°, 1.12 μm, FF<br>
                        Camera chính: 12MP, F1.8, Dual Pixel, 1.8μm, OIS</td>
                </tr>
                <tr>
                    <td>Camera trước</td>
                    <td>10MP, F2.4, 1.22μm</td>
                </tr>
                <tr>
                    <td>Chipset</td>
                    <td>Snapdragon 8 Gen 2 for Galaxy</td>
                </tr>
                <tr>
                    <td>Dung lượng RAM</td>
                    <td>8 GB</td>
                </tr>
                <tr>
                    <td>Bộ nhớ trong</td>
                    <td>256 GB</td>
                </tr>
                <tr>
                    <td>Pin</td>
                    <td>3700 mAh</td>
                </tr>
                <tr>
                    <td>Thẻ SIM</td>
                    <td>2 SIM (nano‑SIM và eSIM)</td>
                </tr>
                <tr>
                    <td>Hệ điều hành</td>
                    <td>Android 13</td>
                </tr>
                <tr>
                    <td>Độ phân giải màn hình</td>
                    <td>1080 x 2640 pixels</td>
                </tr>
                <tr>
                    <td>Tính năng màn hình</td>
                    <td>Màn hình trong: Dynamic AMOLED 2X, FHD+ (2640 x 1080 Pixels), 120 Hz, Ultra Thin Glass, độ sáng tối đa 1000nits<br>
                        Màn hình phụ: 3.4" (720x748) Super AMOLED, 60Hz, 306ppi, Corning Gorilla Glass Victus 2</td>
                </tr>
            </table>
        </div>
        </div>
        
    </div>

    </div>
    

    </div>
    
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