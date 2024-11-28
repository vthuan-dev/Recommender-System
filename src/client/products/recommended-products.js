const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/recommended-products', async (req, res) => {
    try {
        console.log('Calling ML service for recommendations...');
        const response = await axios.get('http://localhost:5001/api/recommended-products', {
            params: {
                limit: req.query.limit || 8,
                page: req.query.page || 1
            }
        });
        
        console.log('ML service response:', response.data);
        
        if (response.data.success) {
            res.json({
                success: true,
                recommendations: response.data.recommendations,
                metadata: response.data.metadata
            });
        } else {
            throw new Error('Failed to get recommendations');
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recommendations'
        });
    }
});

module.exports = router;