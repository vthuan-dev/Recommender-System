<?php
    include 'header.php';
    include 'slider.php';
    include 'class/crud_class.php';
?>

<!DOCTYPE html>
<html>
<head>
    <title>Your Page Title</title>
    <style>
        .search-form {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }

        .search-form input[type="text"] {
            width: 300px;
            height: 40px;
            border: none;
            margin-right: 10px;
            padding: 0 20px;
            font-size: 16px;
            border-radius: 20px;
            outline: none;
            background-color: rgb(189, 195, 199);
        }

        .search-form input[type="submit"] {
            height: 40px;
            border: none;
            background-color: #008CBA;
            color: white;
            padding: 0 20px;
            font-size: 16px;
            border-radius: 20px;
            cursor: pointer;
            outline: none;
        }

        .search-form input[type="submit"]:hover {
            background-color: #45a049;
        }
        
    </style>
      <style>
        .btn {
            display: inline-block;
            padding: 10px 20px;
            color: white;
            background-color: rgb(116, 185, 255) ;
            text-decoration: none;
            text-align: center;
            margin-top: 20px;
        }
        .btn:hover {
            background-color: rgb(116, 185, 255);
        }
    </style>
</head>
<body>

    <?php
        $product = new products();
        $get_products = $product->get_products();
       
    ?>
    <?php
 
    ?>
    <div class="admin-content-right">
  
        <!-- Rest of your HTML and PHP code -->
        <div class="admin-content-right">
        <h2>Danh sách sản phẩm</h2>

        <table>
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Id Sản phẩm</th>
                    <th>Tên sản phẩm</th>
                    <th>Mô tả</th>
                    <th>Loại sản phẩm</th>
                    <th>Hình ảnh</th>
                    <th>Nhà sản xuất</th>
                    <th>Bảo hành</th>
                    <th>VAT</th>
                    <th>Phiên bản</th>
                    <th>Giá</th>
                    <th>Lựa chọn</th>
                </tr>
            </thead>
            <?php
            if($get_products){
                $i=0;
                foreach($get_products as $product)
                {
                    $i++;
            ?>
            <tbody>
                <!-- Dòng sản phẩm -->
                <tr>
                
                <td><?php echo $i ?></td>
                <td><?php echo $product['id'] ?></td>           
                <td><?php echo $product['name'] ?></td>
                <td><?php echo $product['description'] ?></td>
                <td><?php echo $product['category'] ?></td>
                <td><img src="<?php echo $product['image'] ?>" alt="Product Image"></td>
                <td><?php echo $product['manufacturer'] ?></td>
                <td><?php echo $product['warranty'] ?></td>
                <td><?php echo $product['vat_included'] ?></td>
                <td><?php echo isset($product['variant_name']) ? $product['variant_name'] : '' ?></td>
                <td><?php echo isset($product['variant_price']) ? $product['variant_price'] : '' ?></td>
                <td><a href="productedit.php?id=<?php echo $product['id'] ?>">Sửa</a>|<a href="productdelete.php?id=<?php echo $product['id'] ?>">Xóa</a></td>
            </tr>
            <?php
                }
            } else {
                ?>
                    <tr>
                        <td style="text-align:center" colspan="12">Không có tài khoản nào được hiển thị.</td>
                    </tr>
                    <tr>
                        <td style="text-align:center" colspan="12"><a href="productadd.php" class="btn">Thêm tài khoản</a></td>
                    </tr>
                <?php
                }
        ?>
            
            </tbody>
        </table>
    </div>
            </body>
</html>
    </div>
    // 


</body>
</html>