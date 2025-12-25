const Suggestion = require('../models/Suggestion');

exports.createSuggestion = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { title, content, category, type, payload } = req.body || {};

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: 'Tytuł i opis sugestii są wymagane.' });
    }

    const suggestion = await Suggestion.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'pomysl',
      type: type || 'other',
      payload: payload || null,
      createdBy: userId,
      status: 'pending'
    });

    res.status(201).json(suggestion);
  } catch (err) {
    next(err);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};
    const { status } = req.query || {};

    const query = {};

    if (status) {
      query.status = status;
    }

    if (role !== 'admin') {
      query.createdBy = userId;
    }

    const suggestions = await Suggestion.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(suggestions);
  } catch (err) {
    next(err);
  }
};

exports.updateSuggestionStatus = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień.' });
    }

    const { id } = req.params;
    const { status, resolvedNote, adminResponse } = req.body || {};

    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Sugestia nie istnieje.' });
    }

    if (status) {
      suggestion.status = status;
    }

    if (resolvedNote) {
      suggestion.resolvedNote = resolvedNote;
    }

    if (adminResponse) {
      suggestion.adminResponse = adminResponse;
    }

    suggestion.reviewedBy = userId;
    suggestion.reviewedAt = new Date();

    await suggestion.save();

    res.json(suggestion);
  } catch (err) {
    next(err);
  }
};

exports.approveSuggestion = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień.' });
    }

    const { id } = req.params;
    const { adminResponse } = req.body || {};

    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Sugestia nie istnieje.' });
    }

    suggestion.status = 'approved';
    suggestion.adminResponse = adminResponse || 'Zatwierdzono';
    suggestion.reviewedBy = userId;
    suggestion.reviewedAt = new Date();

    await suggestion.save();
    await suggestion.populate('createdBy', 'name email');
    await suggestion.populate('reviewedBy', 'name email');

    res.json({ message: 'Sugestia zatwierdzona', suggestion });
  } catch (err) {
    next(err);
  }
};

exports.rejectSuggestion = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień.' });
    }

    const { id } = req.params;
    const { adminResponse } = req.body || {};

    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Sugestia nie istnieje.' });
    }

    suggestion.status = 'rejected';
    suggestion.adminResponse = adminResponse || 'Odrzucono';
    suggestion.reviewedBy = userId;
    suggestion.reviewedAt = new Date();

    await suggestion.save();
    await suggestion.populate('createdBy', 'name email');
    await suggestion.populate('reviewedBy', 'name email');

    res.json({ message: 'Sugestia odrzucona', suggestion });
  } catch (err) {
    next(err);
  }
};
