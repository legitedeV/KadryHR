const Permission = require('../models/Permission');
const UserPermission = require('../models/UserPermission');
const User = require('../models/User');
const Employee = require('../models/Employee');

/**
 * Inicjalizacja domyślnych uprawnień w systemie
 */
const initializePermissions = async () => {
  const defaultPermissions = [
    // Dashboard
    { name: 'dashboard.view', displayName: 'Widok Dashboard', description: 'Dostęp do strony głównej', module: 'dashboard', category: 'view' },
    
    // Pracownicy
    { name: 'employees.view', displayName: 'Przeglądanie pracowników', description: 'Dostęp do listy pracowników', module: 'employees', category: 'view' },
    { name: 'employees.create', displayName: 'Dodawanie pracowników', description: 'Możliwość dodawania nowych pracowników', module: 'employees', category: 'create' },
    { name: 'employees.edit', displayName: 'Edycja pracowników', description: 'Możliwość edycji danych pracowników', module: 'employees', category: 'edit' },
    { name: 'employees.delete', displayName: 'Usuwanie pracowników', description: 'Możliwość usuwania pracowników', module: 'employees', category: 'delete' },
    
    // Wynagrodzenia
    { name: 'payroll.view', displayName: 'Przeglądanie wynagrodzeń', description: 'Dostęp do kalkulatora wynagrodzeń', module: 'payroll', category: 'view' },
    { name: 'payroll.calculate', displayName: 'Obliczanie wynagrodzeń', description: 'Możliwość obliczania wynagrodzeń', module: 'payroll', category: 'create' },
    { name: 'payroll.manage', displayName: 'Zarządzanie wynagrodzeniami', description: 'Pełny dostęp do modułu wynagrodzeń', module: 'payroll', category: 'manage' },
    
    // Grafik
    { name: 'schedule.view', displayName: 'Przeglądanie grafiku', description: 'Dostęp do grafiku pracy', module: 'schedule', category: 'view' },
    { name: 'schedule.create', displayName: 'Tworzenie grafiku', description: 'Możliwość tworzenia nowych grafików', module: 'schedule', category: 'create' },
    { name: 'schedule.edit', displayName: 'Edycja grafiku', description: 'Możliwość edycji grafików', module: 'schedule', category: 'edit' },
    { name: 'schedule.delete', displayName: 'Usuwanie grafiku', description: 'Możliwość usuwania grafików', module: 'schedule', category: 'delete' },
    
    // Czas pracy
    { name: 'time_tracking.view', displayName: 'Przeglądanie czasu pracy', description: 'Dostęp do modułu czasu pracy', module: 'time_tracking', category: 'view' },
    { name: 'time_tracking.manage', displayName: 'Zarządzanie czasem pracy', description: 'Możliwość zarządzania czasem pracy', module: 'time_tracking', category: 'manage' },
    
    // Wiadomości
    { name: 'chat.view', displayName: 'Dostęp do czatu', description: 'Możliwość korzystania z czatu', module: 'chat', category: 'view' },
    
    // Raporty
    { name: 'reports.view', displayName: 'Przeglądanie raportów', description: 'Dostęp do raportów', module: 'reports', category: 'view' },
    { name: 'reports.create', displayName: 'Tworzenie raportów', description: 'Możliwość generowania raportów', module: 'reports', category: 'create' },
    
    // Wnioski
    { name: 'requests.view', displayName: 'Przeglądanie wniosków', description: 'Dostęp do wniosków urlopowych', module: 'requests', category: 'view' },
    { name: 'requests.manage', displayName: 'Zarządzanie wnioskami', description: 'Możliwość zatwierdzania/odrzucania wniosków', module: 'requests', category: 'manage' },
    
    // Urlopy
    { name: 'leaves.view', displayName: 'Przeglądanie urlopów', description: 'Dostęp do listy urlopów', module: 'leaves', category: 'view' },
    { name: 'leaves.create', displayName: 'Składanie wniosków urlopowych', description: 'Możliwość składania wniosków', module: 'leaves', category: 'create' },
    
    // Powiadomienia
    { name: 'notifications.view', displayName: 'Przeglądanie powiadomień', description: 'Dostęp do powiadomień', module: 'notifications', category: 'view' },
    
    // Ustawienia
    { name: 'settings.view', displayName: 'Przeglądanie ustawień', description: 'Dostęp do ustawień', module: 'settings', category: 'view' },
    { name: 'settings.manage', displayName: 'Zarządzanie ustawieniami', description: 'Możliwość zmiany ustawień systemowych', module: 'settings', category: 'manage' },
    
    // Panel pracownika
    { name: 'self_service.view', displayName: 'Panel pracownika', description: 'Dostęp do panelu samoobsługi', module: 'self_service', category: 'view' },
  ];

  for (const perm of defaultPermissions) {
    await Permission.findOneAndUpdate(
      { name: perm.name },
      perm,
      { upsert: true, new: true }
    );
  }
};

/**
 * Pobierz wszystkie uprawnienia
 */
exports.getAllPermissions = async (req, res, next) => {
  try {
    const { module, category } = req.query;
    
    const query = { isActive: true };
    if (module) query.module = module;
    if (category) query.category = category;
    
    const permissions = await Permission.find(query).sort({ module: 1, category: 1, name: 1 });
    
    // Grupuj uprawnienia po modułach
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});
    
    res.json({
      permissions,
      grouped,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Pobierz uprawnienia użytkownika
 */
exports.getUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const userPermission = await UserPermission.findOne({
      user: userId,
      isActive: true,
    }).populate('user', 'name email role');
    
    if (!userPermission) {
      return res.json({
        permissions: [],
        restrictions: {},
      });
    }
    
    res.json(userPermission);
  } catch (err) {
    next(err);
  }
};

/**
 * Przypisz uprawnienia użytkownikowi
 */
exports.assignPermissions = async (req, res, next) => {
  try {
    const { role: currentUserRole } = req.user;
    
    // Tylko admin i super_admin mogą zarządzać uprawnieniami
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień do zarządzania uprawnieniami' });
    }
    
    const { userId, permissions, restrictions } = req.body;
    
    if (!userId || !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Nieprawidłowe dane wejściowe' });
    }
    
    // Sprawdź czy użytkownik docelowy istnieje
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }
    
    // KLUCZOWA ZASADA: Admin nie może edytować uprawnień super admina
    if (targetUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Tylko super admin może edytować uprawnienia super admina' 
      });
    }
    
    // Sprawdź czy wszystkie uprawnienia istnieją
    const validPermissions = await Permission.find({
      name: { $in: permissions },
      isActive: true,
    });
    
    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({ message: 'Niektóre uprawnienia są nieprawidłowe' });
    }
    
    // Znajdź lub utwórz UserPermission
    let userPermission = await UserPermission.findOne({ user: userId });
    
    if (userPermission) {
      userPermission.permissions = permissions;
      userPermission.restrictions = restrictions || userPermission.restrictions;
      userPermission.grantedBy = req.user.id;
      userPermission.isActive = true;
    } else {
      userPermission = new UserPermission({
        user: userId,
        permissions,
        restrictions: restrictions || {},
        grantedBy: req.user.id,
      });
    }
    
    await userPermission.save();
    
    res.json({
      message: 'Uprawnienia zostały zaktualizowane',
      userPermission,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Usuń uprawnienia użytkownika
 */
exports.revokePermissions = async (req, res, next) => {
  try {
    const { role: currentUserRole } = req.user;
    
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({ message: 'Brak uprawnień do zarządzania uprawnieniami' });
    }
    
    const { userId } = req.params;
    
    // Sprawdź czy użytkownik docelowy istnieje
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }
    
    // Admin nie może odbierać uprawnień super adminowi
    if (targetUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Tylko super admin może zarządzać uprawnieniami super admina' 
      });
    }
    
    const userPermission = await UserPermission.findOne({ user: userId });
    
    if (!userPermission) {
      return res.status(404).json({ message: 'Nie znaleziono uprawnień użytkownika' });
    }
    
    userPermission.isActive = false;
    await userPermission.save();
    
    res.json({
      message: 'Uprawnienia zostały odebrane',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Pobierz listę użytkowników z ich uprawnieniami
 */
exports.getUsersWithPermissions = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name email role')
      .sort({ name: 1 });
    
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const userPermission = await UserPermission.findOne({
          user: user._id,
          isActive: true,
        });
        
        return {
          ...user.toObject(),
          permissions: userPermission ? userPermission.permissions : [],
          restrictions: userPermission ? userPermission.restrictions : {},
          hasCustomPermissions: !!userPermission,
        };
      })
    );
    
    res.json(usersWithPermissions);
  } catch (err) {
    next(err);
  }
};

/**
 * Inicjalizuj uprawnienia (endpoint administracyjny)
 */
exports.initPermissions = async (req, res, next) => {
  try {
    const { role } = req.user;
    
    if (role !== 'super_admin') {
      return res.status(403).json({ message: 'Tylko super admin może inicjalizować uprawnienia' });
    }
    
    await initializePermissions();
    
    res.json({
      message: 'Uprawnienia zostały zainicjalizowane',
    });
  } catch (err) {
    next(err);
  }
};

module.exports.initializePermissions = initializePermissions;
