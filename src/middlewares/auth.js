// src/middlewares/auth.js
function authMiddleware(req, res, next) {
    // Logic xác thực ở đây
    next();
  }
  
  module.exports = authMiddleware;