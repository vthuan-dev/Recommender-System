const { faker } = require('@faker-js/faker/locale/vi');
const mysql = require('mysql2/promise');

// Config database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '100103',
    database: 'NLCN',
    port: 3307
};

// Mẫu comments tiếng Việt
const positive_comments = [
    "Sản phẩm rất tốt, đúng như mô tả",
    "Chất lượng tuyệt vời, đáng đồng tiền",
    "Giao hàng nhanh, đóng gói cẩn thận",
    "Rất hài lòng với sản phẩm này",
    "Sẽ ủng hộ shop lần sau",
    "Máy chạy mượt, pin trâu",
    "Thiết kế đẹp, xứng đáng với giá tiền",
    "Hàng chính hãng, yên tâm sử dụng",
    "Camera chụp đẹp, màu sắc tự nhiên",
    "Âm thanh to rõ, bass mạnh"
];

const negative_comments = [
    "Sản phẩm tạm được, chưa như mong đợi",
    "Chất lượng bình thường, giá hơi cao",
    "Pin tụt nhanh, hơi thất vọng",
    "Giao hàng hơi chậm",
    "Màn hình dễ bị xước",
    "Phần mềm còn nhiều lỗi",
    "Chất lượng không tương xứng giá tiền"
];

const admin_replies = [
    "Cảm ơn quý khách đã đánh giá. Shop sẽ cố gắng phục vụ tốt hơn!",
    "Xin cảm ơn phản hồi của quý khách. Rất vui khi sản phẩm đáp ứng được nhu cầu!",
    "Shop xin ghi nhận ý kiến và sẽ cải thiện trong thời gian tới!",
    "Cảm ơn quý khách đã tin tưởng và ủng hộ shop!",
    "Xin lỗi vì trải nghiệm chưa tốt. Shop sẽ cố gắng khắc phục!"
];

async function generateReviews() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Lấy admin user_id với role_id = 3
        const [admins] = await connection.execute(
            'SELECT id FROM users WHERE role_id = 3 LIMIT 1'
        );
        
        if (admins.length === 0) {
            throw new Error('Không tìm thấy admin user trong database');
        }
        const adminId = admins[0].id;

        // Lấy các đơn hàng đã delivered
        const [orders] = await connection.execute(`
            SELECT o.id, o.user_id, oi.product_id 
            FROM orders o
            JOIN orderitems oi ON o.id = oi.order_id
            WHERE o.status = 'delivered'
        `);

        // Tạo reviews cho mỗi đơn hàng
        for (const order of orders) {
            // 70% khả năng user sẽ review
            if (Math.random() < 0.7) {
                const rating = Math.floor(Math.random() * 3) + 3; // 3-5 sao
                const comment = rating >= 4 
                    ? positive_comments[Math.floor(Math.random() * positive_comments.length)]
                    : negative_comments[Math.floor(Math.random() * negative_comments.length)];

                try {
                    // Insert review
                    const [result] = await connection.execute(`
                        INSERT INTO reviews 
                        (product_id, user_id, rating, comment, created_at, is_verified)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        order.product_id,
                        order.user_id,
                        rating,
                        comment,
                        faker.date.between({
                            from: '2023-09-01T00:00:00.000Z',
                            to: new Date()
                        }),
                        true
                    ]);

                    const reviewId = result.insertId;

                    // 30% khả năng admin reply
                    if (Math.random() < 0.3) {
                        await connection.execute(`
                            INSERT INTO review_replies
                            (review_id, content, user_type, user_id, created_at)
                            VALUES (?, ?, ?, ?, ?)
                        `, [
                            reviewId,
                            admin_replies[Math.floor(Math.random() * admin_replies.length)],
                            'admin',
                            adminId, // Sử dụng adminId với role_id = 3
                            faker.date.between({
                                from: '2023-11-01T00:00:00.000Z',
                                to: new Date()
                            })
                        ]);
                    }
                } catch (err) {
                    console.error(`Error creating review: ${err.message}`);
                    continue;
                }
            }
        }

        console.log("Reviews generation completed!");

    } catch (err) {
        console.error(`Database error: ${err.message}`);
    } finally {
        if (connection) await connection.end();
    }
}

async function generateCarts() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Lấy users với role_id = 4 (khách hàng)
        const [users] = await connection.execute('SELECT id FROM users WHERE role_id = 4');
        const [products] = await connection.execute('SELECT id FROM products');

        for (const user of users) {
            // 40% khả năng user có giỏ hàng
            if (Math.random() < 0.4) {
                // Tạo cart
                const [result] = await connection.execute(
                    'INSERT INTO carts (user_id) VALUES (?)',
                    [user.id]
                );
                const cartId = result.insertId;

                // Thêm 1-4 sản phẩm vào giỏ
                const numItems = Math.floor(Math.random() * 4) + 1;
                const selectedProducts = faker.helpers.arrayElements(products, numItems);

                for (const product of selectedProducts) {
                    // Lấy variants của product
                    const [variants] = await connection.execute(
                        'SELECT id FROM productvariants WHERE product_id = ?',
                        [product.id]
                    );

                    if (variants.length > 0) {
                        const variant = faker.helpers.arrayElement(variants);
                        const quantity = Math.floor(Math.random() * 3) + 1;

                        await connection.execute(`
                            INSERT INTO cartitems 
                            (cart_id, product_id, variant_id, quantity)
                            VALUES (?, ?, ?, ?)
                        `, [cartId, product.id, variant.id, quantity]);
                    }
                }
            }
        }

        console.log("Carts generation completed!");

    } catch (err) {
        console.error(`Database error: ${err.message}`);
    } finally {
        if (connection) await connection.end();
    }
}

async function main() {
    await generateReviews();
    await generateCarts();
}

main().catch(console.error);