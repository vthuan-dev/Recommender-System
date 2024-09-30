<?php

//hàm format ngày tháng
Class format{
    public function formatDate($date){
        return date('F j, Y, g:i a', strtotime($date));
    }
    //hàm rút ngắn văn bản để hiển thị trên trang chủ
    public function textShorten($text, $limit = 400){
        $text = $text. " ";
        $text = substr($text, 0, $limit);
        $text = substr($text, 0, strrpos($text, ' '));
        $text = $text.".....";
        return $text;
    }
    //hàm chuyển đổi ký tự đặc biệt
    public function validation($data){
        $data = trim($data);
        $data = stripcslashes($data);
        $data = htmlspecialchars($data);
        return $data;
    }
    //hàm chuyển đổi tiêu đề
    public function title(){
        $path = $_SERVER['SCRIPT_FILENAME'];
        $title = basename($path, '.php');
        $title = str_replace('-', ' ', $title);
        if($title == 'index'){
            $title = 'home';
        } elseif($title == 'contact'){
            $title = 'contact';
        }
        return $title = ucwords($title);
    }
}