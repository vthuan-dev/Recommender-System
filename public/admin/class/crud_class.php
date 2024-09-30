<?php
include 'database.php';
?>
<?php
class products{
    private $db;
    public function __construct(){
        $this->db = new Database();
    }
    // hàm insert product  vào database

    public function insert_product_and_variant($product_name, $description, $category, $image, $manufacturer, $warranty, $vat_included, $variant_name, $price){
        // Handle image upload
        $target_dir = "uploads/";
        // Tải file lên server mà không kiểm tra xem nó có phải là hình ảnh không
        $target_file = $target_dir . basename($_FILES["image"]["name"]);
        move_uploaded_file($_FILES["image"]["tmp_name"], $target_file);
    
        // thêm vào bảng products 
        $query = "INSERT INTO products(name, description, category, image, manufacturer, warranty, vat_included) VALUES(?, ?, ?, ?, ?, ?, ?)";
        // Prepare the query
        $stmt = $this->db->prepare($query);
        // Chức năng bind_param() sẽ gán các tham số vào câu lệnh SQL và thực thi câu lệnh
        $stmt->bind_param("sssssss", $product_name, $description, $category, $target_file, $manufacturer, $warranty, $vat_included);
        $stmt->execute();
        // Lấy id của sản phẩm vừa thêm vào
        $product_id = $stmt->insert_id;
    
        
        // Insert into productvariants table
        $query = "INSERT INTO productvariants(product_id, name, price) VALUES(?, ?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("iss", $product_id, $variant_name, $price);
        $stmt->execute();
        // Chuyển hướng về trang productlist.php
        header('Location: productlist.php');

        
        // Trả về true nếu số hàng bị ảnh hưởng lớn hơn 0
        return $stmt->affected_rows > 0;
    }
    // hàm lấy tất cả product từ database
    public function get_products_byID($id){
        // Lấy thông tin sản phẩm từ bảng products và productvariants
        $query = "SELECT products.*, productvariants.name as variant_name, productvariants.price as variant_price 
                  FROM products 
                  LEFT JOIN productvariants ON products.id = productvariants.product_id 
                  WHERE products.id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    // hàm lấy tất cả product từ database
    public function get_products() {
        $query = "SELECT p.*, v.name as variant_name, v.price  as variant_price
                  FROM products p 
                  LEFT JOIN productvariants v ON p.id = v.product_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        return $result;
    }

    
    
    
    // hàm cập nhật product và variant vào database
    public function update_product_and_variant($id, $product_name, $description, $category, $image, $manufacturer, $warranty, $vat_included, $variant_name, $price){
        // Handle image upload
        $target_dir = "uploads/";
        // Tải file lên server mà không kiểm tra xem nó có phải là hình ảnh không
        $imageFileType = strtolower(pathinfo(basename($_FILES["image"]["name"]),PATHINFO_EXTENSION));
        // Tạo tên file mới
        $target_file = $target_dir . uniqid() . '.' . $imageFileType;
    
        // Kiểm tra xem người dùng đã chọn hình ảnh mới chưa
        if(isset($_FILES["image"]["tmp_name"]) && $_FILES["image"]["tmp_name"] != '') {
            $image = $target_dir . basename($_FILES["image"]["name"]);
            move_uploaded_file($_FILES["image"]["tmp_name"], $image);
        } else {
            $image = null; // or default image path
        }
        // Bắt đầu giao dịch
        $this->db->begin_transaction();
    
        try {
            // Cập nhật bảng products
            $query = "UPDATE products SET name = ?, description = ?, category = ?, image = ?, manufacturer = ?, warranty = ?, vat_included = ? WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("sssssssi", $product_name, $description, $category, $image, $manufacturer, $warranty, $vat_included, $id);
            $stmt->execute();
    
            // Cập nhật bảng productvariants
            $query_variant = "UPDATE productvariants SET name = ?, price = ? WHERE product_id = ?";
            $stmt_variant = $this->db->prepare($query_variant);
            $stmt_variant->bind_param("sdi", $variant_name, $price, $id);
            $stmt_variant->execute();
    
            // Nếu cả hai câu lệnh cập nhật đều thành công, thì commit giao dịch
            $this->db->commit();
        } catch (Exception $e) {
            // Nếu có lỗi xảy ra, hủy bỏ giao dịch
            $this->db->rollback();
            // In ra lỗi
            throw $e;
        }
        header('Location: productlist.php');
    }
    
    

    public function delete_product($id){
        // Kiểm tra xem sản phẩm có các model không
        $query = "SELECT * FROM productvariants WHERE product_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
    
        // nếu có model, xóa chúng trước
        if ($result && $result->num_rows > 0) {
            $query = "DELETE FROM productvariants WHERE product_id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("i", $id);
            $stmt->execute();
    
            //nếu xóa không thành công, in ra lỗi và trả về false
            if ($stmt->affected_rows === 0) {
                die("Error: " . $this->db->error);
                return false;
            }
        header('Location: productlist.php');
        }
    
        // Delete the record from the products table
        $query = "DELETE FROM products WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
    
        // nếu xóa không thành công, in ra lỗi và trả về false
        if ($stmt->affected_rows === 0) {
            die("Error: " . $this->db->error);
            return false;
        }
    
        // If everything was successful, return true
        return true;
    }

    

       

    
    
    
    
    
 

 
    


}


?>