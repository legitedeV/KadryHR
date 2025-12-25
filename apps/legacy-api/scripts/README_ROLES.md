# 🔐 KadryHR - Zarządzanie Rolami Użytkowników

## 🚀 Szybki Start - Promocja na Super Admin

### Metoda 1: Uniwersalny Skrypt (ZALECANA)

```bash
cd /home/deploy/apps/kadryhr-app/backend
node scripts/manageRoles.js promote admin@kadryhr.local
```

### Metoda 2: Prosty Skrypt

```bash
cd /home/deploy/apps/kadryhr-app/backend
node scripts/promoteToSuperAdmin.js admin@kadryhr.local
```

### Metoda 3: Bash Script

```bash
cd /home/deploy/apps/kadryhr-app/backend
./scripts/promote-admin.sh admin@kadryhr.local
```

### Metoda 4: Bezpośrednie MongoDB (One-liner)

```bash
mongosh mongodb://localhost:27017/kadryhr --quiet --eval "db.users.updateOne({email:'admin@kadryhr.local'},{\$set:{role:'super_admin'}})"
```

---

## 📚 Pełna Dokumentacja - manageRoles.js

### Dostępne Komendy

#### 1. Promocja do Super Admin
```bash
node scripts/manageRoles.js promote <email>
```
**Przykład:**
```bash
node scripts/manageRoles.js promote admin@kadryhr.local
```

#### 2. Degradacja do Admin
```bash
node scripts/manageRoles.js demote <email>
```
**Przykład:**
```bash
node scripts/manageRoles.js demote user@example.com
```

#### 3. Ustawienie Konkretnej Roli
```bash
node scripts/manageRoles.js set <email> <role>
```
**Przykłady:**
```bash
node scripts/manageRoles.js set user@example.com admin
node scripts/manageRoles.js set user@example.com super_admin
node scripts/manageRoles.js set admin@example.com user
```

**Dostępne role:**
- `user` - Zwykły pracownik
- `admin` - Administrator
- `super_admin` - Super Administrator

#### 4. Lista Wszystkich Adminów
```bash
node scripts/manageRoles.js list
```

**Wynik:**
```
📋 Listing all admins and super admins:

1. 👑 Super Admin
   Email: admin@kadryhr.local
   Role: super_admin
   Active: ✅ true

2. 🔑 Regular Admin
   Email: manager@kadryhr.local
   Role: admin
   Active: ✅ true
```

#### 5. Sprawdzenie Roli Użytkownika
```bash
node scripts/manageRoles.js check <email>
```
**Przykład:**
```bash
node scripts/manageRoles.js check admin@kadryhr.local
```

#### 6. Pomoc
```bash
node scripts/manageRoles.js help
```

---

## 🔍 Weryfikacja Po Zmianie

### Sprawdź w MongoDB
```bash
mongosh mongodb://localhost:27017/kadryhr --quiet --eval "db.users.findOne({email:'admin@kadryhr.local'},{name:1,email:1,role:1})"
```

### Sprawdź przez skrypt
```bash
node scripts/manageRoles.js check admin@kadryhr.local
```

---

## 🎯 Różnice Między Rolami

### 👤 User (Zwykły Pracownik)
- Dostęp do podstawowych funkcji (dashboard, panel pracownika, czas pracy, czat)
- Może otrzymać dodatkowe uprawnienia od admina
- Nie ma dostępu do panelu administracyjnego

### 🔑 Admin (Administrator)
- Pełny dostęp do wszystkich modułów
- Może zarządzać uprawnieniami zwykłych użytkowników i innych adminów
- **NIE MOŻE** edytować uprawnień super adminów
- **NIE MOŻE** inicjalizować uprawnień globalnie
- **NIE MOŻE** promować użytkowników do super_admin

### 👑 Super Admin (Super Administrator)
- Pełny dostęp do wszystkich modułów
- Może zarządzać uprawnieniami **wszystkich** użytkowników (włącznie z innymi super adminami)
- Może inicjalizować uprawnienia globalnie (przycisk "Inicjalizuj uprawnienia")
- Może promować użytkowników do dowolnej roli
- Najwyższy poziom dostępu w systemie

---

## ⚠️ Ważne Uwagi

1. **Wylogowanie wymagane**: Po zmianie roli użytkownik musi się wylogować i zalogować ponownie, aby zmiany weszły w życie.

2. **Backup przed zmianami**: Zawsze rób backup bazy danych przed masowymi zmianami ról:
   ```bash
   mongodump --uri="mongodb://localhost:27017/kadryhr" --out=/backup/kadryhr-$(date +%Y%m%d)
   ```

3. **Przynajmniej jeden super admin**: Upewnij się, że zawsze jest przynajmniej jeden aktywny super admin w systemie.

4. **MongoDB musi działać**: Sprawdź status MongoDB przed uruchomieniem skryptów:
   ```bash
   sudo systemctl status mongod
   ```

5. **Zmienne środowiskowe**: Jeśli MongoDB wymaga autoryzacji, ustaw `MONGO_URI`:
   ```bash
   export MONGO_URI="mongodb://username:password@localhost:27017/kadryhr"
   node scripts/manageRoles.js promote admin@kadryhr.local
   ```

---

## 🐛 Rozwiązywanie Problemów

### Problem: "User not found"
**Rozwiązanie:** Sprawdź dokładny email w bazie:
```bash
mongosh mongodb://localhost:27017/kadryhr --eval "db.users.find({},{name:1,email:1,role:1}).pretty()"
```

### Problem: "Cannot connect to MongoDB"
**Rozwiązanie:** 
1. Sprawdź czy MongoDB działa: `sudo systemctl status mongod`
2. Sprawdź connection string w `MONGO_URI`
3. Sprawdź czy port 27017 jest otwarty: `netstat -tuln | grep 27017`

### Problem: "Module not found"
**Rozwiązanie:** Upewnij się, że jesteś w katalogu backend:
```bash
cd /home/deploy/apps/kadryhr-app/backend
npm install
```

---

## 📞 Wsparcie

W razie problemów sprawdź logi:
```bash
# Backend logs
pm2 logs kadryhr-backend

# MongoDB logs
sudo journalctl -u mongod -f
```
