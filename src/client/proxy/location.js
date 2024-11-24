const express = require('express');
const axios = require('axios');
const router = express.Router();

const PROVINCES_API = 'https://provinces.open-api.vn/api';

// Cache data
const cache = {
    provinces: null,
    districts: {},
    wards: {},
    expiryTime: 60 * 60 * 1000 // 1 hour
};

// Get provinces
router.get('/location/provinces', async (req, res) => {
    try {
        // Check cache first
        if (cache.provinces && Date.now() - cache.provinces.timestamp < cache.expiryTime) {
            return res.json(cache.provinces.data);
        }

        const response = await axios.get(`${PROVINCES_API}/p/`);
        
        // Update cache
        cache.provinces = {
            data: response.data,
            timestamp: Date.now()
        };

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching provinces:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách tỉnh thành'
        });
    }
});

// Get districts by province
router.get('/location/districts/:provinceCode', async (req, res) => {
    try {
        const { provinceCode } = req.params;

        // Check cache
        if (cache.districts[provinceCode] && 
            Date.now() - cache.districts[provinceCode].timestamp < cache.expiryTime) {
            return res.json(cache.districts[provinceCode].data);
        }

        const response = await axios.get(`${PROVINCES_API}/p/${provinceCode}?depth=2`);
        
        // Update cache
        cache.districts[provinceCode] = {
            data: response.data,
            timestamp: Date.now()
        };

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching districts:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách quận/huyện'
        });
    }
});

// Get wards by district
router.get('/location/wards/:districtCode', async (req, res) => {
    try {
        const { districtCode } = req.params;

        // Check cache
        if (cache.wards[districtCode] && 
            Date.now() - cache.wards[districtCode].timestamp < cache.expiryTime) {
            return res.json(cache.wards[districtCode].data);
        }

        const response = await axios.get(`${PROVINCES_API}/d/${districtCode}?depth=2`);
        
        // Update cache
        cache.wards[districtCode] = {
            data: response.data,
            timestamp: Date.now()
        };

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching wards:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách phường/xã'
        });
    }
});

module.exports = router; 