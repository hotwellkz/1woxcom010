import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import { broadcastDevReady } from '@remix-run/node';
import * as build from '@remix-run/dev/server-build';

import { terminalStore, previewStore, actionRunner } from './app/lib/server';
import terminalRouter from './app/routes/api.terminal';
import previewRouter from './app/routes/api.preview';
import commandRouter from './app/routes/api.command';

const app = express();
const httpServer = createServer(app);

// Создаем WebSocket сервер
const wss = new WebSocketServer({ server: httpServer });

// Обработка WebSocket соединений
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Передаем сообщение в соответствующий сервис
      switch (message.type) {
        case 'terminal':
          terminalStore.handleClientMessage(ws, message);
          break;
        case 'preview':
          previewStore.handleClientMessage(ws, message);
          break;
        case 'command':
          actionRunner.handleClientMessage(ws, message);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    // Уведомляем все сервисы о отключении клиента
    terminalStore.handleClientDisconnect(ws);
    previewStore.handleClientDisconnect(ws);
    actionRunner.handleClientDisconnect(ws);
  });
});

app.use(express.static('public'));
app.use(express.json());

// Настраиваем API эндпоинты
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Подключаем API роуты
app.use('/api/terminal', terminalRouter);
app.use('/api/preview', previewRouter);
app.use('/api/command', commandRouter);

// Настраиваем Remix
app.all(
  '*',
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  }),
);

const port = process.env.PORT || 3004;

httpServer.listen(port, () => {
  console.log(`Express server listening on port ${port}`);

  if (process.env.NODE_ENV === 'development') {
    broadcastDevReady(build);
  }
});
