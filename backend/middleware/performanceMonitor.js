// middleware/performanceMonitor.js
// Middleware do monitorowania wydajności requestów

const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Przechwytujemy oryginalną metodę res.json
  const originalJson = res.json.bind(res);
  
  res.json = function (data) {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2),
      external: ((endMemory.external - startMemory.external) / 1024 / 1024).toFixed(2),
    };

    // Kolorowe logowanie w zależności od czasu odpowiedzi
    let color = '\x1b[32m'; // zielony (szybko)
    if (duration > 1000) color = '\x1b[31m'; // czerwony (wolno)
    else if (duration > 500) color = '\x1b[33m'; // żółty (średnio)

    console.log(
      `${color}⚡ Performance\x1b[0m [${req.method}] ${req.path} - ${duration}ms | Memory: +${memoryDelta.heapUsed}MB heap, +${memoryDelta.external}MB external | Status: ${res.statusCode}`
    );

    // Dodaj header z czasem odpowiedzi
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    return originalJson(data);
  };

  next();
};

module.exports = performanceMonitor;
