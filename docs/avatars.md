# Avatary — konfiguracja i serwowanie plików

## Lokalizacja plików

Backend zapisuje avatary do katalogu względnego względem `backend-v2`:

```
../uploads/avatars/<organisationId>/<entityType>/<entityId>/<filename>
```

`AvatarsService` zawsze zwraca publiczny URL w formacie:

```
/static/avatars/<organisationId>/<entityType>/<entityId>/<filename>
```

## Dev server (Nest)

Backend ma włączone statyczne serwowanie zasobów przez `ServeStaticModule`:

```
ServeStaticModule.forRoot({
  rootPath: join(process.cwd(), '..', 'uploads'),
  serveRoot: '/static',
})
```

W trybie dev to znaczy, że `/static/avatars/...` będzie wskazywać na
`../uploads/avatars/...` względem katalogu `backend-v2`.

## Produkcja (Nginx)

Na produkcji najlepiej serwować `/static/` bezpośrednio z Nginx, aby odciążyć
aplikację backendu. Przykładowy fragment konfiguracji znajduje się w
`docs/nginx-avatars-example.conf`.

Ważne:

- `alias` musi wskazywać na `/home/debian/KadryHR/uploads/` (bez `avatars/`),
  ponieważ URL `/static/avatars/...` mapuje się na
  `/home/debian/KadryHR/uploads/avatars/...`.
- `location /static/` musi być dodany do sekcji `server { ... }` z TLS
  (`listen 443 ssl;`), a nie tylko do HTTP/redirect.
