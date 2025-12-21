const Suggestion = require('../models/Suggestion');

exports.createSuggestion = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { title, content, category } = req.body || {};

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: 'Tytuł i opis sugestii są wymagane.' });
    }

    const suggestion = await Suggestion.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'pomysl',
      createdBy: userId,
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
    const { role } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień.' });
    }

    const { id } = req.params;
    const { status, resolvedNote } = req.body || {};

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

    await suggestion.save();

    res.json(suggestion);
  } catch (err) {
    next(err);
  }
};
