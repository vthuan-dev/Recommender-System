<?php
    include 'class/crud_class_user.php';

    $user= new users();

    if (!isset($_GET['id']) || $_GET['id'] == NULL) {
        echo "<script>window.location = 'user_show.php'</script>";
    } else {
        $id = $_GET['id'];
    }
    //gọi hàm delete_user từ class users
    $delete_user = $user->delete_user($id);



   
?>