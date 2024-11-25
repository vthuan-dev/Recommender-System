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
        if (data.type === 'subscribe_order') {
          // Lưu orderId vào client connection
          clients.set(ws, data.orderId);
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

const broadcastOrderUpdate = (orderId, status) => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const subscribedOrderId = clients.get(client);
      if (subscribedOrderId === orderId) {
        client.send(JSON.stringify({
          type: 'order_update',
          orderId: orderId,
          newStatus: status,
          timestamp: new Date().toISOString()
        }));
      }
    }
  });
};

module.exports = {
  initializeWebSocket,
  broadcastOrderUpdate
};