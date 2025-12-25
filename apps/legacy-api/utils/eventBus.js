const EventEmitter = require('events');

/**
 * Simple event bus for internal application events
 * Used for realtime notifications and webhook dispatching
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners for SSE connections
  }

  /**
   * Emit a domain event
   * @param {string} eventType - Type of event (e.g., 'notification.created', 'employee.created')
   * @param {object} data - Event data
   */
  emitEvent(eventType, data) {
    console.log(`[EventBus] Emitting event: ${eventType}`, data);
    this.emit(eventType, data);
  }

  /**
   * Subscribe to a domain event
   * @param {string} eventType - Type of event to listen for
   * @param {function} handler - Event handler function
   */
  onEvent(eventType, handler) {
    this.on(eventType, handler);
  }

  /**
   * Unsubscribe from a domain event
   * @param {string} eventType - Type of event
   * @param {function} handler - Event handler function
   */
  offEvent(eventType, handler) {
    this.off(eventType, handler);
  }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
