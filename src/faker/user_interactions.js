const { faker } = require('@faker-js/faker/locale/vi');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '100103',
    database: 'NLCN',
    port: 3307
};

async function generateFakeUsers(numUsers = 20) {
    try {
        const conn = await mysql.createConnection(dbConfig);
        
        // Lấy role_id cho customer
        const [roles] = await conn.execute('SELECT id FROM roles WHERE name = "customer"');
        const customerRoleId = roles[0].id;
        
        // Tạo array các đầu số Việt Nam
        const vietnamPhonePrefixes = ['032', '033', '034', '035', '036', '037', '038', '039', '070', '079', '077', '076', '078', '089', '090', '093', '094', '096', '097', '098', '099'];
        
        for (let i = 0; i < numUsers; i++) {
            // Tạo số điện thoại Việt Nam hợp lệ
            const prefix = vietnamPhonePrefixes[Math.floor(Math.random() * vietnamPhonePrefixes.length)];
            const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
            const phoneNumber = prefix + suffix;

            const user = {
                fullname: faker.person.fullName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
                phonenumber: phoneNumber, // Số điện thoại 10 số
                role_id: customerRoleId,
                created_at: faker.date.past()
            };

            // Insert user
            await conn.execute(`
                INSERT INTO users 
                (fullname, email, password, phonenumber, role_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                user.fullname,
                user.email,
                user.password,
                user.phonenumber,
                user.role_id,
                user.created_at
            ]);
        }

        console.log(`Generated ${numUsers} fake users successfully!`);
        return true;

    } catch (error) {
        console.error('Error generating fake users:', error);
        return false;
    }
}

// Tạo mảng comments tiếng Việt mẫu
const vietnameseComments = [
    "Sản phẩm rất tốt, đáng tiền",
    "Chất lượng tuyệt vời, giao hàng nhanh",
    "Đóng gói cẩn thận, sản phẩm như mô tả",
    "Mình rất hài lòng với sản phẩm này",
    "Giá cả hợp lý, chất lượng ok",
    "Sẽ ủng hộ shop lần sau",
    "Máy chạy mượt, pin trâu",
    "Thiết kế đẹp, xứng đáng với giá tiền",
    "Hàng chính hãng, yên tâm sử dụng",
    "Camera chụp đẹp, màu sắc tự nhiên",
    "Âm thanh to rõ, bass mạnh",
    "Màn hình hiển thị sắc nét",
    "Pin dùng được 2 ngày, rất bền",
    "Mua làm quà tặng, người nhận rất thích",
    "Phụ kiện đầy đủ, hướng dẫn chi tiết",
    "Shop tư vấn nhiệt tình, sẽ quay lại ủng hộ",
    "Đóng gói kỹ càng, ship nhanh",
    "Mình đã mua nhiều lần, rất ưng",
    "Sản phẩm dùng ổn định, không lỗi vặt",
    "Giá tốt nhất trong tầm giá"
];

// Thêm comments tiêu cực để đa dạng
const negativeComments = [
    "Sản phẩm tạm được, chưa như mong đợi",
    "Chất lượng bình thường, giá hơi cao",
    "Pin tụt nhanh, hơi thất vọng",
    "Giao hàng hơi chậm",
    "Màn hình dễ bị xước",
    "Phần mềm còn nhiều lỗi",
    "Chất lượng không tương xứng giá tiền",
    "Sản phẩm dễ bị nóng khi sử dụng",
    "Camera chụp chưa được nét lắm",
    "Âm thanh còn nhỏ, chưa đạt kỳ vọng"
];

function getRandomComment(rating) {
    if (rating >= 4) {
        return vietnameseComments[Math.floor(Math.random() * vietnameseComments.length)];
    } else {
        return negativeComments[Math.floor(Math.random() * negativeComments.length)];
    }
}

async function generateUserInteractions() {
    try {
        const conn = await mysql.createConnection(dbConfig);

        // Lấy danh sách users và products
        const [users] = await conn.execute('SELECT id FROM users WHERE role_id = 2');
        const [products] = await conn.execute('SELECT id FROM products');
        
        // Generate Reviews với comments tiếng Việt
        for (const user of users) {
            const numReviews = faker.number.int({ min: 1, max: 5 });
            const reviewedProducts = new Set();

            for (let i = 0; i < numReviews; i++) {
                let productId;
                do {
                    productId = products[Math.floor(Math.random() * products.length)].id;
                } while (reviewedProducts.has(productId));

                reviewedProducts.add(productId);

                // Random rating và lấy comment phù hợp
                const rating = faker.number.int({ min: 1, max: 5 });
                const comment = getRandomComment(rating);

                // Tạo review
                await conn.execute(`
                    INSERT INTO reviews 
                    (product_id, user_id, rating, comment, created_at, is_verified)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    productId,
                    user.id,
                    rating,
                    comment,
                    faker.date.past(),
                    faker.datatype.boolean()
                ]);

                // Thêm replies cho một số reviews
                if (faker.datatype.boolean(0.3)) { // 30% chance
                    await conn.execute(`
                        INSERT INTO review_replies
                        (review_id, content, user_type, user_id)
                        VALUES (?, ?, ?, ?)
                    `, [
                        (await conn.execute('SELECT LAST_INSERT_ID() as id'))[0][0].id,
                        "Cảm ơn bạn đã đánh giá sản phẩm. Shop sẽ cố gắng phục vụ tốt hơn!",
                        'admin',
                        users[0].id
                    ]);
                }
            }
        }

        // 2. Generate Orders
        for (const user of users) {
            // Mỗi user sẽ có 0-3 orders
            const numOrders = faker.number.int({ min: 0, max: 3 });

            for (let i = 0; i < numOrders; i++) {
                // Tạo order
                const [orderResult] = await conn.execute(`
                    INSERT INTO orders (user_id, total, status, created_at)
                    VALUES (?, ?, ?, ?)
                `, [
                    user.id,
                    0, // Tạm thời set total = 0
                    faker.helpers.arrayElement(['delivered', 'shipped', 'processing']),
                    faker.date.past()
                ]);

                const orderId = orderResult.insertId;

                // Thêm 1-4 sản phẩm vào order
                const numItems = faker.number.int({ min: 1, max: 4 });
                let orderTotal = 0;

                for (let j = 0; j < numItems; j++) {
                    const productId = products[Math.floor(Math.random() * products.length)].id;
                    
                    // Lấy variant của product
                    const [variants] = await conn.execute(
                        'SELECT id, price FROM productvariants WHERE product_id = ?',
                        [productId]
                    );

                    if (variants.length > 0) {
                        const variant = variants[Math.floor(Math.random() * variants.length)];
                        const quantity = faker.number.int({ min: 1, max: 3 });
                        const itemTotal = variant.price * quantity;
                        orderTotal += itemTotal;

                        // Thêm order item
                        await conn.execute(`
                            INSERT INTO orderitems 
                            (order_id, product_id, variant_id, quantity, price)
                            VALUES (?, ?, ?, ?, ?)
                        `, [
                            orderId,
                            productId,
                            variant.id,
                            quantity,
                            variant.price
                        ]);

                        // Update sold_count
                        await conn.execute(`
                            UPDATE productvariants 
                            SET sold_count = sold_count + ?
                            WHERE id = ?
                        `, [quantity, variant.id]);
                    }
                }

                // Update order total
                await conn.execute(
                    'UPDATE orders SET total = ? WHERE id = ?',
                    [orderTotal, orderId]
                );
            }
        }

        console.log('Generated Vietnamese reviews successfully!');
        await conn.end();

    } catch (error) {
        console.error('Error generating interactions:', error);
    }
}

// Chạy tất cả
async function main() {
    await generateFakeUsers(20);  // Tạo 20 users mới
    await generateUserInteractions();  // Tạo tương tác cho users
}

main(); 