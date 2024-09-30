<?php
    include 'database.php'; // Bao gồm tệp kết nối cơ sở dữ liệu 

    $db = new Database(); // Tạo một phiên bản của lớp cơ sở dữ liệu

    $email = $_POST['email'];
    $phone = $_POST['phone'];
    
    $stmt = $db->link->prepare("SELECT * FROM users WHERE email = ? OR phone = ?");
    
    $stmt->bind_param("ss", $email, $phone);
    
    $stmt->execute();
    
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo 'exists';
    } else {
        echo 'not exists';
    }
    
    $stmt->close();
