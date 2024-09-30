<?php
//include header và slider để hiển thị
    include('header.php');
    include('slider.php');
    include 'class/crud_class.php';
?>
    <?php
    //khởi tạo đối tượng products
    $product = new products();

?>


    <?php
    //kiểm tra phương thức post từ form
    if($_SERVER['REQUEST_METHOD'] == 'POST'){
        $product_name = $_POST['product_name'];
        $description = $_POST['description'];
        $category = $_POST['category'];
        $manufacturer = $_POST['manufacturer'];
        $warranty = $_POST['warranty'];
        $vat_included = $_POST['vat_included'];
        $variant_name = $_POST['variant_name'];
        $price = $_POST['price'];
        //upload ảnh
        $target_dir = "uploads/";
        //đường dẫn ảnh sau khi upload lên server sẽ được lưu vào biến $image để lưu vào cơ sở dữ liệu
        $image = $target_dir . basename($_FILES["image"]["name"]);
        //di chuyển ảnh vào thư mục uploads
        move_uploaded_file($_FILES["image"]["tmp_name"], $image);
        //gọi hàm insert_product_and_variant từ class products
        $insert_product = $product->insert_product_and_variant($product_name, $description, $category, $image, $manufacturer, $warranty, $vat_included, $variant_name, $price);
    }
?>

<div class="admin-content-right">
    <div class="admin-content-right-product-add">
        <h1>Thêm Sản Phẩm</h1>
        <form action="" method="POST" enctype="multipart/form-data">
            <input type="text" name="product_name" placeholder="Nhập tên sản phẩm">
            <input type="text" name="description" placeholder="Nhập mô tả sản phẩm">
            <select name="category" required>
                <option value="">Chọn loại sản phẩm</option>
                <option value="Điện thoại">Điện thoại</option>
                <option value="Laptop">Laptop</option>
                <option value="Tivi">Tivi</option>
                <option value="Đồng hồ">Đồng hồ</option>
            </select>
            <input type="file" name="image" accept="image/*">
            <input type="text" name="manufacturer" placeholder="Nhập nhà sản xuất">
            <input type="text" name="warranty" placeholder="Nhập bảo hành">
            <select name="vat_included" required>
                <option value="">Chọn VAT</option>
                <option value="1">Đã bao gồm VAT</option>
                <option value="0">Chưa bao gồm VAT</option>
            </select>           
             <input type="text" name="variant_name" placeholder="Nhập Phiên Bản">
            <input type="text" name="price" placeholder="Nhập giá">
            <button type="submit">Thêm</button>
        </form>
    </div>
</div>