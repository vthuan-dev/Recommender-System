const fs = require('fs').promises;
const path = require('path');

async function initUploadDirs() {
  const uploadDir = path.resolve(__dirname, '../assets/uploads/products');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Upload directories created successfully');
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
}

module.exports = { initUploadDirs };