<?php
include 'database.php';

class users{
    private $db;
    public function __construct(){
        $this->db = new Database();
    }
    // hàm insert user  vào database 
    public function insert_user($fullname ,$phonenumber, $password, $email  ){
        $query = "INSERT INTO users(fullname, phonenumber,password, email) VALUES('$fullname', $phonenumber,'$password', '$email')";
        $result = $this->db->insert($query);
        return $result;
    }
    
    // hàm lấy tất cả user từ database
    public function get_users(){
        $query = "SELECT * FROM users";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        return $result;
    }
    
    // hàm lấy user theo id từ database
    public function get_user_by_id($id){
        $query = "SELECT * FROM users WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id); // "i" indicates the variable type is integer.
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result;
    }
    
    // hàm xóa user theo id từ database
    public function delete_user($id){
        $query = "DELETE FROM users WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id); // "i" indicates the variable type is integer.
        $stmt->execute();
        header('Location: ' . $_SERVER['PHP_SELF']);
        $result = $stmt->affected_rows > 0;
        header('Location: user_show.php');
        return $result;
    }
    
    // hàm update user theo id từ database
    public function update_user($id, $fullname, $phonenumber, $password, $email){
        $query = "UPDATE users SET fullname = ?, password = ?, email = ?, phonenumber = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ssssi", $fullname, $password, $email, $phonenumber, $id); // "s" indicates the variable type is string, "i" indicates integer.
        $stmt->execute();
        $result = $stmt->affected_rows > 0;
        return $result;
    }
    // hàm login user từ database
    public function login($email, $password){
        $query = "SELECT * FROM users WHERE email = :email AND password = :password";
        $stmt = $this->db->prepare($query);
        $params = [
            'email' => $email,
            'password' => $password
        ];
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result;
    }
}


?>