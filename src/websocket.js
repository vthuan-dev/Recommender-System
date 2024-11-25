const WebSocket = require('ws');
const pool = require('./database/dbconfig').pool;

let wss;
const clients = new Map();

const initializeWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'search_query') {
          // Xử lý tìm kiếm realtime
          const results = await searchProducts(data.query);
          ws.send(JSON.stringify({
            type: 'search_suggestions',
            products: results
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });
  });
};

// Hàm tìm kiếm sản phẩm
const searchProducts = async (query) => {
  try {
    if (!query.trim()) return [];

    const searchQuery = `
      SELECT id, name 
      FROM products 
      WHERE LOWER(name) LIKE LOWER(?)
      ORDER BY 
        CASE 
          WHEN LOWER(name) LIKE LOWER(?) THEN 1
          ELSE 2
        END,
        name
      LIMIT 6
    `;

    const searchPattern = `%${query}%`;
    const startPattern = `${query}%`;

    const [results] = await pool.query(searchQuery, [searchPattern, startPattern]);
    return results;

  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

module.exports = {
  initializeWebSocket
};