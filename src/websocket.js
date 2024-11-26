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
        
        switch(data.type) {
          case 'subscribe_order':
            clients.set(ws, { type: 'order', id: data.orderId });
            break;
            
          case 'subscribe_product':
            clients.set(ws, { type: 'product', id: data.productId });
            break;
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

const broadcastCommentUpdate = (productId, data) => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const subscription = clients.get(client);
      if (subscription?.type === 'product' && subscription.id === productId) {
        client.send(JSON.stringify({
          type: 'comment_update',
          productId: productId,
          data: data,
          timestamp: new Date().toISOString()
        }));
      }
    }
  });
};

const broadcastOrderUpdate = (orderId, status) => {
  if (!wss) return;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const subscription = clients.get(client);
      if (subscription?.type === 'order' && subscription.id === orderId) {
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
  broadcastOrderUpdate,
  broadcastCommentUpdate
};