const { faker } = require('@faker-js/faker');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '100103',
    database: 'NLCN',
    port: 3307
};

async function generateFakeRatings(numRatings = 100) {
    try {
        const conn = await mysql.createConnection(dbConfig);
        
        // 1. Lấy danh sách products và users hiện có
        const [products] = await conn.execute('SELECT id FROM products');
        const [users] = await conn.execute('SELECT id FROM users');
        
        // 2. Tạo ratings
        for (let i = 0; i < numRatings; i++) {
            const rating = {
                product_id: products[Math.floor(Math.random() * products.length)].id,
                user_id: users[Math.floor(Math.random() * users.length)].id,
                rating: faker.number.int({ min: 1, max: 5 }),
                comment: faker.commerce.productDescription(),
                created_at: faker.date.past(),
                is_verified: faker.datatype.boolean()
            };

            // 3. Kiểm tra xem user đã rate product này chưa
            const [existing] = await conn.execute(
                'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
                [rating.user_id, rating.product_id]
            );

            if (existing.length === 0) {
                // 4. Insert nếu chưa có
                await conn.execute(`
                    INSERT INTO reviews 
                    (product_id, user_id, rating, comment, created_at, is_verified)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    rating.product_id,
                    rating.user_id,
                    rating.rating,
                    rating.comment,
                    rating.created_at,
                    rating.is_verified
                ]);
                
                // 5. Có thể thêm fake replies cho một số reviews
                if (faker.datatype.boolean(0.3)) { // 30% chance
                    await conn.execute(`
                        INSERT INTO review_replies
                        (review_id, content, user_type, user_id)
                        VALUES (?, ?, ?, ?)
                    `, [
                        (await conn.execute('SELECT LAST_INSERT_ID() as id'))[0][0].id,
                        faker.commerce.productDescription(),
                        'admin',
                        users[0].id // Assume first user is admin
                    ]);
                }
            }
        }

        console.log(`Generated ${numRatings} fake ratings successfully!`);
        await conn.end();

    } catch (error) {
        console.error('Error generating fake ratings:', error);
    }
}

// Thêm fake sold_count cho products
async function updateProductSoldCounts() {
    try {
        const conn = await mysql.createConnection(dbConfig);
        
        const [variants] = await conn.execute('SELECT id FROM productvariants');
        
        for (const variant of variants) {
            const sold_count = faker.number.int({ min: 0, max: 100 });
            
            await conn.execute(
                'UPDATE productvariants SET sold_count = ? WHERE id = ?',
                [sold_count, variant.id]
            );
        }

        console.log('Updated sold counts successfully!');
        await conn.end();

    } catch (error) {
        console.error('Error updating sold counts:', error);
    }
}

// Chạy functions
async function main() {
    await generateFakeRatings(200);  // Tạo 200 ratings
    await updateProductSoldCounts();  // Update sold counts
}

main(); 