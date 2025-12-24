const axios = require('axios');
const crypto = require('crypto');
const Webhook = require('../models/Webhook');
const eventBus = require('./eventBus');

/**
 * Webhook dispatcher - sends HTTP POST requests to registered webhooks
 */
class WebhookDispatcher {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.timeout = 10000; // 10 seconds
    
    // Register event listeners
    this.registerEventListeners();
  }

  /**
   * Register listeners for all webhook event types
   */
  registerEventListeners() {
    const eventTypes = [
      'employee.created',
      'employee.updated',
      'employee.deactivated',
      'leave.created',
      'leave.statusChanged',
      'schedule.updated',
      'task.assigned',
      'task.completed',
    ];

    eventTypes.forEach(eventType => {
      eventBus.onEvent(eventType, async (data) => {
        await this.dispatch(eventType, data);
      });
    });

    console.log('[WebhookDispatcher] Registered listeners for webhook events');
  }

  /**
   * Dispatch webhook to all registered URLs for this event type
   */
  async dispatch(eventType, data) {
    try {
      // Find all active webhooks for this event type
      const webhooks = await Webhook.find({
        eventTypes: eventType,
        isActive: true,
      });

      if (webhooks.length === 0) {
        return;
      }

      console.log(`[WebhookDispatcher] Dispatching ${eventType} to ${webhooks.length} webhook(s)`);

      // Send to all webhooks in parallel
      const promises = webhooks.map(webhook => 
        this.sendWebhook(webhook, eventType, data)
      );

      await Promise.allSettled(promises);
    } catch (err) {
      console.error('[WebhookDispatcher] Error dispatching webhooks:', err);
    }
  }

  /**
   * Send webhook to a single URL with retries
   */
  async sendWebhook(webhook, eventType, data, retryCount = 0) {
    try {
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data,
      };

      // Generate signature if secret is configured
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'KadryHR-Webhook/1.0',
        'X-Webhook-Event': eventType,
      };

      if (webhook.secret) {
        const signature = this.generateSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      // Send HTTP POST request
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: this.timeout,
      });

      // Update webhook success stats
      await Webhook.findByIdAndUpdate(webhook._id, {
        lastTriggeredAt: new Date(),
        failureCount: 0,
        lastError: null,
      });

      console.log(`[WebhookDispatcher] Successfully sent ${eventType} to ${webhook.url} (status: ${response.status})`);
    } catch (err) {
      console.error(`[WebhookDispatcher] Failed to send ${eventType} to ${webhook.url}:`, err.message);

      // Retry logic
      if (retryCount < this.maxRetries) {
        console.log(`[WebhookDispatcher] Retrying ${eventType} to ${webhook.url} (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(this.retryDelay * (retryCount + 1));
        return this.sendWebhook(webhook, eventType, data, retryCount + 1);
      }

      // Update webhook failure stats
      await Webhook.findByIdAndUpdate(webhook._id, {
        $inc: { failureCount: 1 },
        lastError: err.message,
      });

      // Deactivate webhook after too many failures
      if (webhook.failureCount >= 10) {
        await Webhook.findByIdAndUpdate(webhook._id, {
          isActive: false,
        });
        console.warn(`[WebhookDispatcher] Deactivated webhook ${webhook._id} due to too many failures`);
      }
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Sleep helper for retries
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const webhookDispatcher = new WebhookDispatcher();

module.exports = webhookDispatcher;
