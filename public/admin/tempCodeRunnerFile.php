<?php
    include 'database.php'; // Include your database connection file

    $email = $_POST['email'];
    $password = $_POST['password'];

    $query = "SELECT * FROM users WHERE email = '$email' AND password = '$password'";
    $result = mysqli_query($conn, $query);

    if (mysqli_num_rows($result) > 0) {
        echo 'exists';
    } else {
        echo 'not exists';
    }
?>