import { logger } from 'hono/logger';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { connectDB } from './db.js';
import { User } from './models/User.js';
import { Message } from './models/Message.js';
import mongoose from 'mongoose';
import { app } from './app.js';

export { app };

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

// Additional middleware for production server
app.use('*', logger());

// Health check (already defined in app.ts, override with server timestamp)

// WebSocket client registry: userId -> WebSocket
const wsClients = new Map<string, ServerWebSocket>();

interface JwtPayload {
  userId: string;
}

interface WsIncomingMessage {
  type: string;
  receiverId?: string;
  content?: string;
}

// WebSocket upgrade route
app.get(
  '/ws',
  upgradeWebSocket(async (c) => {
    const token = c.req.query('token');
    let authenticatedUserId: string | null = null;

    if (token) {
      try {
        const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
        const user = await User.findById(payload.userId);
        if (user) {
          authenticatedUserId = user._id.toString();
        }
      } catch {
        // Authentication will be denied in onOpen
      }
    }

    return {
      onOpen(_event: Event, ws: ServerWebSocket) {
        if (!authenticatedUserId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized: invalid token' }));
          ws.close();
          return;
        }
        wsClients.set(authenticatedUserId, ws);
        console.log(`[WS] Client connected: ${authenticatedUserId}`);
      },

      async onMessage(event: MessageEvent, ws: ServerWebSocket) {
        if (!authenticatedUserId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
          return;
        }

        let data: WsIncomingMessage;
        try {
          data = JSON.parse(event.data as string) as WsIncomingMessage;
        } catch {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
          return;
        }

        if (data.type === 'message') {
          const { receiverId, content } = data;

          if (!receiverId || !content) {
            ws.send(
              JSON.stringify({ type: 'error', message: 'Missing receiverId or content' })
            );
            return;
          }

          try {
            const message = await Message.create({
              senderId: new mongoose.Types.ObjectId(authenticatedUserId),
              receiverId: new mongoose.Types.ObjectId(receiverId),
              content,
            });

            const messageJson = message.toJSON();

            // Confirm to sender
            ws.send(JSON.stringify({ type: 'sent', message: messageJson }));

            // Forward to receiver if online
            const receiverWs = wsClients.get(receiverId);
            if (receiverWs) {
              receiverWs.send(JSON.stringify({ type: 'message', message: messageJson }));
            }
          } catch (err) {
            console.error('[WS] Error saving message:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to send message' }));
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${data.type}` }));
        }
      },

      onClose(_event: Event, _ws: ServerWebSocket) {
        if (authenticatedUserId) {
          wsClients.delete(authenticatedUserId);
          console.log(`[WS] Client disconnected: ${authenticatedUserId}`);
        }
      },
    };
  })
);

// Start server
(async () => {
  try {
    await connectDB();
    console.log(`[Server] Starting on port ${config.port}`);
  } catch (err) {
    console.error('[Server] Failed to connect to DB:', err);
    process.exit(1);
  }
})();

export default {
  port: config.port,
  fetch: app.fetch,
  websocket,
};
