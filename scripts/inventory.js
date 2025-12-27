#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BACKEND_ROUTES_DIR = path.join(__dirname, '../backend/routes');
const BACKEND_MODELS_DIR = path.join(__dirname, '../backend/models');
const FRONTEND_SRC_DIR = path.join(__dirname, '../frontend/src');
const OUTPUT_FILE = path.join(__dirname, '../tmp/inventory.json');

function extractExpressEndpoints(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const endpoints = [];
  
  // Match router.METHOD('/path', ...) patterns
  const routeRegex = /router\.(get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    endpoints.push({
      method,
      path: routePath,
      file: path.basename(filePath)
    });
  }
  
  return endpoints;
}

function scanBackendRoutes() {
  const routes = [];
  
  if (!fs.existsSync(BACKEND_ROUTES_DIR)) {
    console.warn(`⚠️  Backend routes directory not found: ${BACKEND_ROUTES_DIR}`);
    return routes;
  }
  
  const files = fs.readdirSync(BACKEND_ROUTES_DIR).filter(f => f.endsWith('.js'));
  
  for (const file of files) {
    const filePath = path.join(BACKEND_ROUTES_DIR, file);
    const endpoints = extractExpressEndpoints(filePath);
    
    // Extract base path from file name (e.g., authRoutes.js -> /api/auth)
    const basePath = file.replace(/Routes\.js$/, '').toLowerCase();
    
    for (const endpoint of endpoints) {
      routes.push({
        file,
        basePath: `/api/${basePath}`,
        method: endpoint.method,
        path: endpoint.path,
        fullPath: `/api/${basePath}${endpoint.path}`
      });
    }
  }
  
  return routes;
}

function scanMongooseModels() {
  const models = [];
  
  if (!fs.existsSync(BACKEND_MODELS_DIR)) {
    console.warn(`⚠️  Backend models directory not found: ${BACKEND_MODELS_DIR}`);
    return models;
  }
  
  const files = fs.readdirSync(BACKEND_MODELS_DIR).filter(f => f.endsWith('.js'));
  
  for (const file of files) {
    const filePath = path.join(BACKEND_MODELS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract model name from mongoose.model() call
    const modelMatch = content.match(/mongoose\.model\s*\(\s*['"`]([^'"`]+)['"`]/);
    const schemaMatch = content.match(/new\s+mongoose\.Schema\s*\(/);
    
    if (modelMatch || schemaMatch) {
      models.push({
        file,
        modelName: modelMatch ? modelMatch[1] : path.basename(file, '.js'),
        hasSchema: !!schemaMatch
      });
    }
  }
  
  return models;
}

function scanFrontendRoutes() {
  const routes = [];
  const apiHooks = [];
  
  if (!fs.existsSync(FRONTEND_SRC_DIR)) {
    console.warn(`⚠️  Frontend src directory not found: ${FRONTEND_SRC_DIR}`);
    return { routes, apiHooks };
  }
  
  // Scan pages directory for components
  const pagesDir = path.join(FRONTEND_SRC_DIR, 'pages');
  if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
    
    for (const file of files) {
      const componentName = path.basename(file, path.extname(file));
      routes.push({
        type: 'page',
        file,
        component: componentName,
        path: `pages/${file}`
      });
    }
  }
  
  // Check hooks directory
  const hooksDir = path.join(FRONTEND_SRC_DIR, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
    
    for (const file of files) {
      const filePath = path.join(hooksDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Look for api.get/post/put/patch/delete calls with relative paths
      // Matches: api.get('/employees'), api.post(`/leaves/${id}`)
      const apiMethodRegex = /api\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      
      while ((match = apiMethodRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let endpoint = match[2];
        
        // Convert relative path to absolute API path
        if (!endpoint.startsWith('/api/')) {
          endpoint = '/api' + (endpoint.startsWith('/') ? '' : '/') + endpoint;
        }
        
        apiHooks.push({
          file,
          method,
          endpoint,
          location: 'hooks'
        });
      }
      
      // Also look for direct /api/ references
      const directApiRegex = /['"`](\/api\/[^'"`]+)['"`]/g;
      while ((match = directApiRegex.exec(content)) !== null) {
        // Skip if already captured by method regex
        const endpoint = match[1];
        if (!apiHooks.some(h => h.endpoint === endpoint && h.file === file)) {
          apiHooks.push({
            file,
            method: 'UNKNOWN',
            endpoint,
            location: 'hooks'
          });
        }
      }
    }
  }
  
  // Check api directory
  const apiDir = path.join(FRONTEND_SRC_DIR, 'api');
  if (fs.existsSync(apiDir)) {
    const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
    
    for (const file of files) {
      const filePath = path.join(apiDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Look for api method calls
      const apiMethodRegex = /api\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      
      while ((match = apiMethodRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let endpoint = match[2];
        
        if (!endpoint.startsWith('/api/')) {
          endpoint = '/api' + (endpoint.startsWith('/') ? '' : '/') + endpoint;
        }
        
        apiHooks.push({
          file,
          method,
          endpoint,
          location: 'api'
        });
      }
      
      // Direct /api/ references
      const directApiRegex = /['"`](\/api\/[^'"`]+)['"`]/g;
      while ((match = directApiRegex.exec(content)) !== null) {
        const endpoint = match[1];
        if (!apiHooks.some(h => h.endpoint === endpoint && h.file === file)) {
          apiHooks.push({
            file,
            method: 'UNKNOWN',
            endpoint,
            location: 'api'
          });
        }
      }
    }
  }
  
  // Also scan pages for direct API calls
  if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
    
    for (const file of pageFiles) {
      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const apiMethodRegex = /api\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      
      while ((match = apiMethodRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let endpoint = match[2];
        
        if (!endpoint.startsWith('/api/')) {
          endpoint = '/api' + (endpoint.startsWith('/') ? '' : '/') + endpoint;
        }
        
        apiHooks.push({
          file,
          method,
          endpoint,
          location: 'pages'
        });
      }
    }
  }
  
  return { routes, apiHooks };
}

function generateInventory() {
  console.log('🔍 Scanning backend routes...');
  const backendRoutes = scanBackendRoutes();
  console.log(`   Found ${backendRoutes.length} endpoints`);
  
  console.log('🔍 Scanning Mongoose models...');
  const models = scanMongooseModels();
  console.log(`   Found ${models.length} models`);
  
  console.log('🔍 Scanning frontend routes and API calls...');
  const { routes: frontendRoutes, apiHooks } = scanFrontendRoutes();
  console.log(`   Found ${frontendRoutes.length} pages`);
  console.log(`   Found ${apiHooks.length} API hook references`);
  
  const inventory = {
    generatedAt: new Date().toISOString(),
    backend: {
      routes: backendRoutes,
      models: models,
      summary: {
        totalEndpoints: backendRoutes.length,
        totalModels: models.length,
        routeFiles: [...new Set(backendRoutes.map(r => r.file))].length
      }
    },
    frontend: {
      pages: frontendRoutes,
      apiHooks: apiHooks,
      summary: {
        totalPages: frontendRoutes.length,
        totalApiReferences: apiHooks.length
      }
    }
  };
  
  // Ensure tmp directory exists
  const tmpDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(inventory, null, 2));
  console.log(`\n✅ Inventory generated: ${OUTPUT_FILE}`);
  
  return inventory;
}

if (require.main === module) {
  try {
    generateInventory();
  } catch (error) {
    console.error('❌ Error generating inventory:', error.message);
    process.exit(1);
  }
}

module.exports = { generateInventory };
