const WebSocket = require('ws');

let wss;
const clients = new Map();

const initializeWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'subscribe_order') {
          clients.set(ws, data.orderId);
          console.log(`Client subscribed to order ${data.orderId}`);
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

const broadcastOrderUpdate = (orderId, newStatus) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && clients.get(client) === orderId) {
      try {
        client.send(JSON.stringify({
          type: 'order_update',
          orderId: orderId,
          newStatus: newStatus,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Broadcast error:', error);
      }
    }
  });
};

module.exports = {
  initializeWebSocket,
  broadcastOrderUpdate
};