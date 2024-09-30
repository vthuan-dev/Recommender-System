// src/services/userService.js
const db = require('../database/config');

exports.getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM users', (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
};

exports.createUser = (userData) => {
  // Logic tạo user
};