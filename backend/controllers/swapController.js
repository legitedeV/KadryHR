const SwapRequest = require('../models/SwapRequest');
const Employee = require('../models/Employee');

exports.createSwapRequest = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { requesterEmployee, swapWithEmployee, date, reason } = req.body || {};

    if (!requesterEmployee || !swapWithEmployee || !date) {
      return res.status(400).json({
        message: 'Wymagane pola: pracownik zgłaszający, pracownik do zamiany, data.',
      });
    }

    if (requesterEmployee === swapWithEmployee) {
      return res
        .status(400)
        .json({ message: 'Nie można zamienić zmiany z tym samym pracownikiem.' });
    }

    const [requester, swapWith] = await Promise.all([
      Employee.findById(requesterEmployee),
      Employee.findById(swapWithEmployee),
    ]);

    if (!requester || !swapWith) {
      return res
        .status(404)
        .json({ message: 'Wybrani pracownicy nie istnieją.' });
    }

    const swapRequest = await SwapRequest.create({
      requesterEmployee,
      swapWithEmployee,
      date: new Date(date),
      reason: reason || '',
      createdBy: userId,
    });

    res.status(201).json(swapRequest);
  } catch (err) {
    next(err);
  }
};

exports.getSwapRequests = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};

    const query = {};
    if (role !== 'admin') {
      query.createdBy = userId;
    }

    const swaps = await SwapRequest.find(query)
      .populate('requesterEmployee')
      .populate('swapWithEmployee')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(swaps);
  } catch (err) {
    next(err);
  }
};

exports.updateSwapStatus = async (req, res, next) => {
  try {
    const { role } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień.' });
    }

    const { id } = req.params;
    const { status, adminNote } = req.body || {};

    const swap = await SwapRequest.findById(id);
    if (!swap) {
      return res.status(404).json({ message: 'Prośba o zamianę nie istnieje.' });
    }

    if (status) {
      swap.status = status;
    }

    if (adminNote) {
      swap.adminNote = adminNote;
    }

    await swap.save();

    res.json(swap);
  } catch (err) {
    next(err);
  }
};
