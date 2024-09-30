
  
<?php
    include 'header.php';
    include 'slider.php';
    include 'class/crud_class_user.php';

    $user = new users();
    $get_users = $user->get_users();
?>

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <style>
        .btn {
            display: inline-block;
            padding: 10px 20px;
            color: white;
            background-color: rgb(116, 185, 255) ;
            text-decoration: none;
            text-align: center;
            margin-top: 20px;
        }
        .btn:hover {
            background-color: rgb(116, 185, 255);
        }
    </style>
    
<div class="admin-content-right">
    <h2>Danh sách tài khoản người dùng</h2>
    <table>
        <thead>
            <tr>
                <th>STT</th>
                <th>Id Người dùng</th>
                <th>Tên người dùng</th>
                <th>SDT</th>
                <th>Mật khẩu</th>
                <th>Email</th>
                <th>Tùy chọn</th>
            </tr>
        </thead>
        <tbody>
        <?php
        if($get_users && count($get_users) > 0){
            $i=0;
            foreach($get_users as $user){
                $i++;
        ?>
            <tr>
                <td><?php echo $i ?></td>
                <td><?php echo $user['id'] ?></td>           
                <td><?php echo $user['fullname'] ?></td>
                <td><?php echo $user['phonenumber'] ?></td>
                <td><?php echo $user['password'] ?></td>
                <td><?php echo $user['email'] ?></td>
                <td><a href="user_edit.php?id=<?php echo $user['id'] ?>">Sửa</a>|<a href="userdelete.php?id=<?php echo $user['id'] ?>">Xóa</a></td>
            </tr>
        <?php
                }
            } else {
        ?>
            <tr>
                <td style="text-align:center" colspan="7"> Opp ! Không có tài khoản nào cả </td>
            </tr>
            <tr>
                <td style="text-align:center" colspan="7"><a href="useradd.php" class="btn">Thêm tài khoản</a></td>
            </tr>
        <?php
            }
        ?>
        </tbody>
    </table>
</div>
</body>

</html>