<?php
    include 'header.php';
    include 'slider.php';
    include 'class/crud_class.php';

    $product = new products();
    // kiểm tra id có tồn tại hay không
    if (!isset($_GET['id']) || $_GET['id'] == NULL) {
        echo "<script>window.location = 'productlist.php'</script>";
    } else {
        $id = $_GET['id'];
    }

    // get product by id để hiển thị thông tin sản phẩm cần sửa
    $get_products_byID = $product->get_products_byID($id);
    if ($get_products_byID) {
        $result = $get_products_byID;
        // code goes here
    }
    

    // kiểm tra phương thức post từ form sửa sản phẩm
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $product_name = $_POST['product_name'];
        $description = $_POST['description'];
        $category = $_POST['category'];
        $manufacturer = $_POST['manufacturer'];
        $warranty = $_POST['warranty'];
        $vat_included = $_POST['vat_included'];
        $variant_name = $_POST['variant_name'];
        $price = $_POST['price'];

        $target_dir = "uploads/";
        $image = $target_dir . basename($_FILES["image"]["name"]);

        // Check if image file is a actual image or fake image
        if(isset($_FILES["image"]["tmp_name"]) && $_FILES["image"]["tmp_name"] != '') {
            move_uploaded_file($_FILES["image"]["tmp_name"], $image);
        } else {
            $image = null; // or default image path
        }
        // gọi hàm update_product_and_variant từ class products
        $update_product = $product->update_product_and_variant($id, $product_name, $description, $category, $image, $manufacturer, $warranty, $vat_included, $variant_name, $price);
    }
    
 
    
    
  
 
?>


    <div class="admin-content-right">
        <div class="admin-content-right-product-add">
            <h1>Sửa Sản Phẩm</h1>
            <form action="" method="POST" enctype="multipart/form-data">
                <input type="text" name="product_name" placeholder="Nhập tên sản phẩm"
                value="<?php echo isset($result['name']) ? $result['name'] : '' ?>">
                <input type="text" name="description" placeholder="Nhập mô tả sản phẩm"
                value="<?php echo isset($result['description']) ? $result['description'] : '' ?>"
                >
                <select name="category" required>
                    <option value="">Chọn loại sản phẩm</option>
                    <option value="Điện thoại" <?php echo isset($result['category']) && $result['category'] == 'Điện thoại' ? 'selected' : '' ?>>Điện thoại</option>
                    <option value="Laptop" <?php echo isset($result['category']) && $result['category'] == 'Laptop' ? 'selected' : '' ?>>Laptop</option>
                    <option value="Tivi" <?php echo isset($result['category']) && $result['category'] == 'Tivi' ? 'selected' : '' ?>>Tivi</option>
                    <option value="Đồng hồ" <?php echo isset($result['category']) && $result['category'] == 'Đồng hồ' ? 'selected' : '' ?>>Đồng hồ</option>
                </select>
                <input type="file" name="image" accept="image/*"
                value="<?php echo isset($result['image']) ? $result['image'] : '' ?>"
                >
                <input type="text" name="manufacturer" placeholder="Nhập nhà sản xuất"
                value="<?php echo isset($result['manufacturer']) ? $result['manufacturer'] : '' ?>"
                >
                <input type="text" name="warranty" placeholder="Nhập bảo hành"
                value="<?php echo isset($result['warranty']) ? $result['warranty'] : '' ?>"
                >
                <select name="vat_included" required>
                    <option value="">Chọn VAT</option>
                    <option value="1" <?php echo isset($result['vat_included']) && $result['vat_included'] == '1' ? 'selected' : '' ?>>Đã bao gồm VAT</option>
                    <option value="0" <?php echo isset($result['vat_included']) && $result['vat_included'] == '0' ? 'selected' : '' ?>>Chưa bao gồm VAT</option>
                </select>
                <input type="text" name="variant_name" placeholder="Nhập Phiên bản"
                    value="<?php echo $result['variant_name']?>"
                >
                <input type="text" name="price" placeholder="Nhập giá"
                    value="<?php echo $result['variant_price'] ?>"
                >
            <button type="submit">Sửa</button>
        </form>
    </div>
</div>
