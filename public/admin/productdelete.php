<?php
    include 'class/crud_class.php';

    $product = new products();
    //kiểm tra id có tồn tại hay không
    if (!isset($_GET['id']) || $_GET['id'] == NULL) {
        //nếu không tồn tại thì chuyển hướng về trang productlist.php
        echo "<script>window.location = 'productlist.php'</script>";
    } else {
        //nếu tồn tại thì lấy id
        $id = $_GET['id'];
    }
    //gọi hàm delete_product từ class products
    $delete_product_and_variant = $product-> delete_product($id);

   
?>