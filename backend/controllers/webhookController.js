const asyncHandler = require('express-async-handler');
const Webhook = require('../models/Webhook');
const crypto = require('crypto');

/**
 * GET /api/webhooks
 * Get all webhooks for the company
 */
exports.getWebhooks = asyncHandler(async (req, res) => {
  const companyId = req.user.id;

  const webhooks = await Webhook.find({ companyId })
    .sort({ createdAt: -1 })
    .select('-secret'); // Don't expose secret in list

  res.json({ webhooks });
});

/**
 * GET /api/webhooks/:id
 * Get a single webhook
 */
exports.getWebhook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const companyId = req.user.id;

  const webhook = await Webhook.findOne({ _id: id, companyId })
    .select('-secret'); // Don't expose secret

  if (!webhook) {
    return res.status(404).json({ message: 'Webhook nie został znaleziony' });
  }

  res.json({ webhook });
});

/**
 * POST /api/webhooks
 * Create a new webhook
 */
exports.createWebhook = asyncHandler(async (req, res) => {
  const { url, eventTypes, secret } = req.body;
  const companyId = req.user.id;
  const createdBy = req.user.id;

  // Validation
  if (!url || !eventTypes || eventTypes.length === 0) {
    return res.status(400).json({ 
      message: 'URL i typy zdarzeń są wymagane' 
    });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (_err) {
    return res.status(400).json({ 
      message: 'Nieprawidłowy format URL' 
    });
  }

  // Generate secret if not provided
  const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

  const webhook = await Webhook.create({
    companyId,
    url,
    eventTypes,
    secret: webhookSecret,
    createdBy,
  });

  // Return webhook with secret (only on creation)
  res.status(201).json({ 
    webhook: {
      ...webhook.toObject(),
      secret: webhookSecret,
    },
    message: 'Webhook został utworzony. Zapisz secret - nie będzie ponownie wyświetlony.',
  });
});

/**
 * PATCH /api/webhooks/:id
 * Update a webhook
 */
exports.updateWebhook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { url, eventTypes, isActive } = req.body;
  const companyId = req.user.id;

  const webhook = await Webhook.findOne({ _id: id, companyId });

  if (!webhook) {
    return res.status(404).json({ message: 'Webhook nie został znaleziony' });
  }

  // Update fields
  if (url !== undefined) {
    try {
      new URL(url);
      webhook.url = url;
    } catch (_err) {
      return res.status(400).json({ message: 'Nieprawidłowy format URL' });
    }
  }

  if (eventTypes !== undefined) {
    if (!Array.isArray(eventTypes) || eventTypes.length === 0) {
      return res.status(400).json({ message: 'Typy zdarzeń muszą być niepustą tablicą' });
    }
    webhook.eventTypes = eventTypes;
  }

  if (isActive !== undefined) {
    webhook.isActive = isActive;
  }

  await webhook.save();

  res.json({ 
    webhook: webhook.toObject(),
    message: 'Webhook został zaktualizowany',
  });
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
exports.deleteWebhook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const companyId = req.user.id;

  const webhook = await Webhook.findOneAndDelete({ _id: id, companyId });

  if (!webhook) {
    return res.status(404).json({ message: 'Webhook nie został znaleziony' });
  }

  res.json({ message: 'Webhook został usunięty' });
});

/**
 * POST /api/webhooks/:id/test
 * Test a webhook by sending a test event
 */
exports.testWebhook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const companyId = req.user.id;

  const webhook = await Webhook.findOne({ _id: id, companyId });

  if (!webhook) {
    return res.status(404).json({ message: 'Webhook nie został znaleziony' });
  }

  // Send test event
  const eventBus = require('../utils/eventBus');
  eventBus.emitEvent('webhook.test', {
    webhookId: webhook._id.toString(),
    companyId: companyId.toString(),
    message: 'To jest testowe zdarzenie webhook',
  });

  res.json({ message: 'Testowe zdarzenie zostało wysłane' });
});
