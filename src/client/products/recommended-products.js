const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/recommended-products', async (req, res) => {
    try {
        console.log('Calling ML service with params:', req.query);
        const response = await axios.get('http://localhost:5001/api/recommended-products', {
            params: req.query,
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        console.log('ML service response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recommendations'
        });
    }
});

module.exports = router;