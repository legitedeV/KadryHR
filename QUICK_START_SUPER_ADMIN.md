# 🚀 Szybki Start - Promocja na Super Admin

## ⚡ Najszybsza Metoda (Skopiuj i Wklej)

```bash
cd /home/deploy/apps/kadryhr-app/backend && node scripts/manageRoles.js promote admin@kadryhr.local
```

## 📋 Weryfikacja

```bash
cd /home/deploy/apps/kadryhr-app/backend && node scripts/manageRoles.js check admin@kadryhr.local
```

---

## 📚 Dostępne Pliki Pomocnicze

### 1. **COPY_PASTE_COMMANDS.txt** ⭐
Gotowe komendy do skopiowania i wklejenia w SSH.
```bash
cat /home/deploy/apps/kadryhr-app/COPY_PASTE_COMMANDS.txt
```

### 2. **SSH_QUICK_COMMANDS.sh** 🎯
Interaktywne menu do zarządzania rolami.
```bash
cd /home/deploy/apps/kadryhr-app && ./SSH_QUICK_COMMANDS.sh
```

### 3. **backend/scripts/manageRoles.js** 🔧
Uniwersalny skrypt do zarządzania rolami.
```bash
cd /home/deploy/apps/kadryhr-app/backend
node scripts/manageRoles.js help
```

### 4. **backend/scripts/README_ROLES.md** 📖
Pełna dokumentacja zarządzania rolami.
```bash
cat /home/deploy/apps/kadryhr-app/backend/scripts/README_ROLES.md
```

---

## 🎯 Wszystkie Dostępne Komendy

### Promocja
```bash
# Uniwersalny skrypt (ZALECANE)
node scripts/manageRoles.js promote admin@kadryhr.local

# Prosty skrypt
node scripts/promoteToSuperAdmin.js admin@kadryhr.local

# Bash script
./scripts/promote-admin.sh admin@kadryhr.local

# Bezpośrednie MongoDB
mongosh mongodb://localhost:27017/kadryhr --eval "db.users.updateOne({email:'admin@kadryhr.local'},{\$set:{role:'super_admin'}})"
```

### Lista Adminów
```bash
node scripts/manageRoles.js list
```

### Sprawdź Użytkownika
```bash
node scripts/manageRoles.js check admin@kadryhr.local
```

### Zmiana Roli
```bash
node scripts/manageRoles.js set user@example.com admin
node scripts/manageRoles.js set user@example.com super_admin
```

### Degradacja
```bash
node scripts/manageRoles.js demote user@example.com
```

---

## ⚠️ Ważne

1. **Wylogowanie wymagane**: Po zmianie roli użytkownik musi się wylogować i zalogować ponownie.

2. **Uprawnienia Super Admina**:
   - ✅ Może inicjalizować uprawnienia (przycisk "Inicjalizuj uprawnienia")
   - ✅ Może zarządzać uprawnieniami wszystkich użytkowników
   - ✅ Może edytować uprawnienia innych super adminów
   - ✅ Pełny dostęp do wszystkich modułów

3. **Różnice Admin vs Super Admin**:
   - Admin: Nie może edytować uprawnień super adminów
   - Super Admin: Może edytować uprawnienia wszystkich, włącznie z innymi super adminami

---

## 🐛 Rozwiązywanie Problemów

### MongoDB nie działa
```bash
sudo systemctl status mongod
sudo systemctl start mongod
```

### Sprawdź połączenie z MongoDB
```bash
mongosh mongodb://localhost:27017/kadryhr --eval "db.runCommand({ping:1})"
```

### Lista wszystkich użytkowników
```bash
mongosh mongodb://localhost:27017/kadryhr --eval "db.users.find({},{name:1,email:1,role:1}).pretty()"
```

---

## 📞 Wsparcie

Jeśli masz problemy, sprawdź:
- `backend/scripts/README_ROLES.md` - Pełna dokumentacja
- `COPY_PASTE_COMMANDS.txt` - Gotowe komendy
- `PROMOTE_ADMIN_COMMANDS.txt` - Szczegółowe instrukcje

Lub uruchom interaktywne menu:
```bash
./SSH_QUICK_COMMANDS.sh
```
