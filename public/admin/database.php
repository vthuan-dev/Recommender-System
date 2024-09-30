<?php

include 'config.php';

//Chứa các lệnh truy vấn cơ sở dữ liệu
Class database{
    public $host = "localhost";
    public $username = "nlcs";
    public $password = "100103";
    public $dbname = "tmdt";
    //Biến chứ đối tượng kết nối cơ sở dữ liệu
    public $link;
    //Biến chứa lỗi nếu có
    public $error;
    
    


    //Hàm khởi tạo
    public function __construct(){
        $this->connectDB();
    }
    //Hàm kết nối cơ sở dữ liệu
    public function connectDB(){
        $this->link = new mysqli($this->host, $this->username, $this->password, $this->dbname);
        if($this->link->connect_error){
            $this->error = "Connection failed: ".$this->link->connect_error;
            return false;
        }
        return $this->link;
    }
    //Hàm khởi tạo gd
    public function begin_transaction() {
        $this->link->begin_transaction();
    }
    public function commit() {
        $this->link->commit();
    }
    //Hàm chạy câu truy vấn
    public function select($query){
        $result = $this->link->query($query) 
        or die($this->link->error.__LINE__);
        if($result->num_rows > 0){
            return $result;
        } else {
            return false;
        }
    }

    //hàm prepare cho câu truy vấn
    public function prepare($query){
        $stmt = $this->link->prepare($query);
        if($stmt === false) {
            die($this->link->error);
        }
        return $stmt;
    }

    public function insert($query){
        $insert_row = $this->link->query($query) or die($this->link->error.__LINE__);
        if($insert_row){
            return $insert_row;
        } else {
            return false;
        }
    }

    public function update($query){
        $update_row = $this->link->query($query) or die($this->link->error.__LINE__);
        if($update_row){
            header("Location: index.php?msg=".urlencode('Record Updated'));
            exit();
        } else {
            die("Error : (".$this->link->errno.")".$this->link->error);
        }
    }

    public function delete($query){
        $delete_row = $this->link->query($query) or die($this->link->error.__LINE__);
        if($delete_row){
            header("Location: index.php?msg=".urlencode('Record Deleted'));
            exit();
        } else {
            die("Error : (".$this->link->errno.")".$this->link->error);
        }
    }
}