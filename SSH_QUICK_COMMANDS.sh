#!/usr/bin/env bash

# ═══════════════════════════════════════════════════════════════════
# KadryHR - Szybkie Komendy SSH dla Zarządzania Rolami
# ═══════════════════════════════════════════════════════════════════

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  KadryHR - Szybkie Komendy SSH${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────
# FUNKCJA: Promocja na Super Admin
# ─────────────────────────────────────────────────────────────────────
promote_to_super_admin() {
    local EMAIL="${1:-admin@kadryhr.local}"
    
    echo -e "${YELLOW}🔄 Promowanie użytkownika: ${EMAIL}${NC}"
    echo ""
    
    cd /home/deploy/apps/kadryhr-app/backend || exit 1
    
    if [ -f "scripts/manageRoles.js" ]; then
        node scripts/manageRoles.js promote "$EMAIL"
    else
        echo -e "${RED}❌ Skrypt nie znaleziony. Używam bezpośredniego MongoDB...${NC}"
        mongosh mongodb://localhost:27017/kadryhr --quiet --eval "
            const result = db.users.updateOne(
                { email: '$EMAIL' },
                { \$set: { role: 'super_admin' } }
            );
            if (result.modifiedCount > 0) {
                print('✅ SUCCESS! User promoted to super_admin');
            } else {
                print('⚠️  User was already super_admin or not found');
            }
        "
    fi
}

# ─────────────────────────────────────────────────────────────────────
# FUNKCJA: Lista Adminów
# ─────────────────────────────────────────────────────────────────────
list_admins() {
    echo -e "${YELLOW}📋 Lista adminów i super adminów:${NC}"
    echo ""
    
    cd /home/deploy/apps/kadryhr-app/backend || exit 1
    
    if [ -f "scripts/manageRoles.js" ]; then
        node scripts/manageRoles.js list
    else
        mongosh mongodb://localhost:27017/kadryhr --quiet --eval "
            db.users.find(
                { role: { \$in: ['admin', 'super_admin'] } },
                { name: 1, email: 1, role: 1, isActive: 1 }
            ).forEach(function(user) {
                const icon = user.role === 'super_admin' ? '👑' : '🔑';
                print(icon + ' ' + user.name);
                print('   Email: ' + user.email);
                print('   Role: ' + user.role);
                print('   Active: ' + user.isActive);
                print('');
            });
        "
    fi
}

# ─────────────────────────────────────────────────────────────────────
# FUNKCJA: Sprawdź Użytkownika
# ─────────────────────────────────────────────────────────────────────
check_user() {
    local EMAIL="${1:-admin@kadryhr.local}"
    
    echo -e "${YELLOW}🔍 Sprawdzanie użytkownika: ${EMAIL}${NC}"
    echo ""
    
    cd /home/deploy/apps/kadryhr-app/backend || exit 1
    
    if [ -f "scripts/manageRoles.js" ]; then
        node scripts/manageRoles.js check "$EMAIL"
    else
        mongosh mongodb://localhost:27017/kadryhr --quiet --eval "
            const user = db.users.findOne(
                { email: '$EMAIL' },
                { name: 1, email: 1, role: 1, isActive: 1 }
            );
            if (user) {
                const icon = user.role === 'super_admin' ? '👑' : user.role === 'admin' ? '🔑' : '👤';
                print(icon + ' ' + user.name);
                print('   Email: ' + user.email);
                print('   Role: ' + user.role);
                print('   Active: ' + user.isActive);
            } else {
                print('❌ User not found');
            }
        "
    fi
}

# ─────────────────────────────────────────────────────────────────────
# FUNKCJA: Weryfikacja MongoDB
# ─────────────────────────────────────────────────────────────────────
verify_mongodb() {
    echo -e "${YELLOW}🔍 Weryfikacja MongoDB...${NC}"
    echo ""
    
    # Sprawdź status MongoDB
    if systemctl is-active --quiet mongod; then
        echo -e "${GREEN}✅ MongoDB działa${NC}"
    else
        echo -e "${RED}❌ MongoDB nie działa${NC}"
        echo -e "${YELLOW}   Uruchom: sudo systemctl start mongod${NC}"
        return 1
    fi
    
    # Sprawdź połączenie
    if mongosh mongodb://localhost:27017/kadryhr --quiet --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Połączenie z MongoDB OK${NC}"
    else
        echo -e "${RED}❌ Nie można połączyć się z MongoDB${NC}"
        return 1
    fi
    
    # Sprawdź bazę danych
    local DB_EXISTS=$(mongosh mongodb://localhost:27017/kadryhr --quiet --eval "db.getName()" 2>/dev/null)
    if [ "$DB_EXISTS" = "kadryhr" ]; then
        echo -e "${GREEN}✅ Baza danych 'kadryhr' istnieje${NC}"
    else
        echo -e "${RED}❌ Baza danych 'kadryhr' nie istnieje${NC}"
        return 1
    fi
    
    # Sprawdź kolekcję users
    local USER_COUNT=$(mongosh mongodb://localhost:27017/kadryhr --quiet --eval "db.users.countDocuments()" 2>/dev/null)
    echo -e "${GREEN}✅ Liczba użytkowników: ${USER_COUNT}${NC}"
    
    echo ""
}

# ─────────────────────────────────────────────────────────────────────
# FUNKCJA: Menu Główne
# ─────────────────────────────────────────────────────────────────────
show_menu() {
    echo -e "${BLUE}Wybierz akcję:${NC}"
    echo ""
    echo "  1) Promuj admin@kadryhr.local na super_admin"
    echo "  2) Promuj innego użytkownika na super_admin"
    echo "  3) Lista wszystkich adminów"
    echo "  4) Sprawdź użytkownika"
    echo "  5) Weryfikacja MongoDB"
    echo "  6) Pomoc"
    echo "  0) Wyjście"
    echo ""
    read -p "Wybór: " choice
    
    case $choice in
        1)
            promote_to_super_admin "admin@kadryhr.local"
            ;;
        2)
            read -p "Podaj email użytkownika: " email
            promote_to_super_admin "$email"
            ;;
        3)
            list_admins
            ;;
        4)
            read -p "Podaj email użytkownika: " email
            check_user "$email"
            ;;
        5)
            verify_mongodb
            ;;
        6)
            show_help
            ;;
        0)
            echo -e "${GREEN}Do widzenia!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Nieprawidłowy wybór${NC}"
            ;;
    esac
    
    echo ""
    read -p "Naciśnij Enter, aby kontynuować..."
    show_menu
}

# ─────────────────────────────────────────────────────────────────────
# FUNKCJA: Pomoc
# ─────────────────────────────────────────────────────────────────────
show_help() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Pomoc - Dostępne Komendy${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Użycie skryptu:"
    echo "  ./SSH_QUICK_COMMANDS.sh                    # Menu interaktywne"
    echo "  ./SSH_QUICK_COMMANDS.sh promote <email>    # Promuj użytkownika"
    echo "  ./SSH_QUICK_COMMANDS.sh list               # Lista adminów"
    echo "  ./SSH_QUICK_COMMANDS.sh check <email>      # Sprawdź użytkownika"
    echo "  ./SSH_QUICK_COMMANDS.sh verify             # Weryfikuj MongoDB"
    echo ""
    echo "Przykłady:"
    echo "  ./SSH_QUICK_COMMANDS.sh promote admin@kadryhr.local"
    echo "  ./SSH_QUICK_COMMANDS.sh check admin@kadryhr.local"
    echo ""
    echo "Bezpośrednie komendy Node.js:"
    echo "  cd /home/deploy/apps/kadryhr-app/backend"
    echo "  node scripts/manageRoles.js promote admin@kadryhr.local"
    echo "  node scripts/manageRoles.js list"
    echo "  node scripts/manageRoles.js check admin@kadryhr.local"
    echo ""
}

# ─────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────

# Sprawdź argumenty
if [ $# -eq 0 ]; then
    # Brak argumentów - pokaż menu
    show_menu
else
    # Argumenty podane - wykonaj komendę
    case "$1" in
        promote)
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Użycie: $0 promote <email>${NC}"
                exit 1
            fi
            promote_to_super_admin "$2"
            ;;
        list)
            list_admins
            ;;
        check)
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Użycie: $0 check <email>${NC}"
                exit 1
            fi
            check_user "$2"
            ;;
        verify)
            verify_mongodb
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Nieznana komenda: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
fi
