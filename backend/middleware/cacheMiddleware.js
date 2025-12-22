// middleware/cacheMiddleware.js
// Prosty cache w pamięci dla GET requestów

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minut

const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    // Cache tylko dla GET requestów
    if (req.method !== 'GET') {
      return next();
    }

    // Klucz cache: metoda + URL + query params + user ID (jeśli jest)
    const userId = req.userId || req.user?.id || 'anonymous';
    const cacheKey = `${req.method}:${req.originalUrl}:${userId}`;

    // Sprawdź czy mamy w cache
    const cached = cache.get(cacheKey);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      
      // Jeśli cache jest świeży
      if (age < duration) {
        console.log(`\x1b[36m💾 Cache HIT\x1b[0m ${cacheKey} (age: ${Math.round(age / 1000)}s)`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', `${Math.round(age / 1000)}s`);
        return res.status(cached.status).json(cached.data);
      } else {
        // Cache wygasł, usuń
        cache.delete(cacheKey);
        console.log(`\x1b[33m💾 Cache EXPIRED\x1b[0m ${cacheKey}`);
      }
    }

    // Przechwytujemy oryginalną metodę res.json
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
      // Zapisz w cache tylko dla statusów 200-299
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data,
          status: res.statusCode,
          timestamp: Date.now(),
        });
        console.log(`\x1b[35m💾 Cache MISS\x1b[0m ${cacheKey} - saved to cache`);
        res.setHeader('X-Cache', 'MISS');
      }
      
      return originalJson(data);
    };

    next();
  };
};

// Funkcja do czyszczenia cache
const clearCache = () => {
  const size = cache.size;
  cache.clear();
  console.log(`\x1b[36m🗑️  Cache cleared\x1b[0m (${size} entries removed)`);
};

// Funkcja do czyszczenia wygasłych wpisów
const cleanExpiredCache = (maxAge = CACHE_DURATION) => {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > maxAge) {
      cache.delete(key);
      removed++;
    }
  }
  
  if (removed > 0) {
    console.log(`\x1b[33m🧹 Cleaned ${removed} expired cache entries\x1b[0m`);
  }
};

// Automatyczne czyszczenie co 10 minut
setInterval(() => cleanExpiredCache(), 10 * 60 * 1000);

module.exports = {
  cacheMiddleware,
  clearCache,
  cleanExpiredCache,
  getCacheStats: () => ({
    size: cache.size,
    keys: Array.from(cache.keys()),
  }),
};
