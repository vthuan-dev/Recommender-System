<?php
class session{
    public static function init(){
        // kiểm tra phiên làm việc nếu chưa tồn tại thì khởi tạo phiên làm việc
        if(version_compare(phpversion(), '5.4.0', '<')){
            // phiên làm việc chưa tồn tại thì khởi tạo
            if(session_id() == ''){
                session_start();
            }
        } else {
            // phiên làm việc chưa tồn tại thì khởi tạo
            if(session_status() == PHP_SESSION_NONE){
                session_start();
            }
        }
    }
    //
    public static function set($key, $val){
        $_SESSION[$key] = $val;
    }
    public static function get($key){
        if(isset($_SESSION[$key])){
            return $_SESSION[$key];
        } else {
            return false;
        }
    }
    public static function checkSession(){
        self::init();
        if(self::get("login") == false){
            self::destroy();
            header("Location:login.php");
        }
    }
    public static function checkLogin(){
        self::init();
        if(self::get("login") == true){
            header("Location:index.php");
        }
    }
    
}