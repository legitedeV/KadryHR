const eventBus = require('../utils/eventBus');

/**
 * SSE endpoint for realtime events
 * Clients connect to this endpoint and receive server-sent events
 */
exports.sseStream = (req, res) => {
  const userId = req.user.id;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  console.log(`[SSE] User ${userId} connected to realtime stream`);

  // Event handlers for different event types
  const handlers = {
    // Notification events
    'notification.created': (data) => {
      if (data.userId === userId) {
        res.write(`data: ${JSON.stringify({ type: 'notification', data })}\n\n`);
      }
    },

    // Message events
    'message.received': (data) => {
      if (data.recipientId === userId) {
        res.write(`data: ${JSON.stringify({ type: 'message', data })}\n\n`);
      }
    },

    // Task assignment events (if tasks module exists)
    'task.assigned': (data) => {
      if (data.assigneeId === userId) {
        res.write(`data: ${JSON.stringify({ type: 'task', data })}\n\n`);
      }
    },

    // Leave request status change
    'leave.statusChanged': (data) => {
      if (data.employeeUserId === userId) {
        res.write(`data: ${JSON.stringify({ type: 'leave', data })}\n\n`);
      }
    },

    // Schedule update
    'schedule.updated': (data) => {
      // Broadcast to all users in the company
      res.write(`data: ${JSON.stringify({ type: 'schedule', data })}\n\n`);
    },
  };

  // Register all event handlers
  Object.entries(handlers).forEach(([eventType, handler]) => {
    eventBus.onEvent(eventType, handler);
  });

  // Keep-alive ping every 30 seconds
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  // Cleanup on client disconnect
  req.on('close', () => {
    console.log(`[SSE] User ${userId} disconnected from realtime stream`);
    clearInterval(keepAliveInterval);

    // Unregister all event handlers
    Object.entries(handlers).forEach(([eventType, handler]) => {
      eventBus.offEvent(eventType, handler);
    });

    res.end();
  });
};

/**
 * Helper function to emit realtime events
 * Can be called from other controllers
 */
exports.emitRealtimeEvent = (eventType, data) => {
  eventBus.emitEvent(eventType, data);
};
