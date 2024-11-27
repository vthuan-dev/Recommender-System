const express = require('express');
const router = express.Router();
const { pool } = require('../../database/dbconfig');
const PopularityRecommender = require('../../ml/popularity_recommender');

// Khởi tạo recommender
const recommender = new PopularityRecommender();

// API để lấy sản phẩm gợi ý
router.get('/recommended-products', async (req, res) => {
    try {
        const { 
            category, 
            brand,
            min_price,
            max_price,
            page = 1,
            limit = 8 
        } = req.query;

        // Train model nếu cần
        if (!recommender.recommendations) {
            await recommender.fit(pool);
        }

        // Lấy recommendations với filters
        const recommendations = recommender.recommend(
            parseInt(limit),
            category,
            min_price,
            max_price,
            brand
        );

        res.json({
            products: recommendations,
            total: recommendations.length,
            page: parseInt(page),
            limit: parseInt(limit)
        });

    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});