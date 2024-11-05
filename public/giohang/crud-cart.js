document.querySelectorAll('.remove').forEach(function(button) {
    button.addEventListener('click', function() {
        var product_id = this.value;

        //gửi request đến server để xóa sản phẩm khỏi giỏ hàng
        fetch('giohang.php', {
            method: 'POST',
            headers: {
                // Nghĩa là: Tôi gửi dữ liệu dạng form urlencoded đi
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            // Dữ liệu body sẽ được gửi đi theo dạng form urlencoded
            body: 'product_id=' + product_id + '&action=remove',
        })
        // Sau khi đã xóa sản phẩm khỏi giỏ hàng, thì reload lại trang để cập nhật giỏ hàng
        .then(function(response) {
            // Nếu request không thành công
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Nếu request thành công, thì trả về response dạng text
            return response.text();
        })
        // Sau khi đã nhận được response dạng text
        .then(function() {
            // Tải lại trang
            location.reload();
        })
        // Xử lý lỗi nếu có
        .catch(function(error) {
            console.error('There has been a problem with your fetch operation:', error);
        });
    });
});