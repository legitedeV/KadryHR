#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const INVENTORY_FILE = path.join(__dirname, '../tmp/inventory.json');

function normalizeEndpoint(endpoint) {
  // Remove trailing slashes and normalize path parameters
  return endpoint
    .replace(/\/$/, '')
    .replace(/:([a-zA-Z0-9_]+)/g, ':param')
    .toLowerCase();
}

function checkContracts() {
  if (!fs.existsSync(INVENTORY_FILE)) {
    console.error('❌ Inventory file not found. Run "npm run inventory" first.');
    process.exit(1);
  }
  
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));
  
  console.log('🔍 Analyzing API contracts...\n');
  
  // Extract all backend endpoints
  const backendEndpoints = new Map();
  const backendPathsOnly = new Set();
  
  for (const route of inventory.backend.routes) {
    const normalizedPath = normalizeEndpoint(route.fullPath);
    const key = `${route.method}:${normalizedPath}`;
    backendEndpoints.set(key, route);
    backendPathsOnly.add(normalizedPath);
  }
  
  // Extract all frontend API references
  const frontendApiCalls = new Map();
  const frontendPathsOnly = new Set();
  
  for (const hook of inventory.frontend.apiHooks) {
    const normalizedPath = normalizeEndpoint(hook.endpoint);
    const key = `${hook.method}:${normalizedPath}`;
    
    if (!frontendApiCalls.has(key)) {
      frontendApiCalls.set(key, []);
    }
    frontendApiCalls.get(key).push(hook);
    frontendPathsOnly.add(normalizedPath);
  }
  
  // Find backend endpoints without frontend usage
  const unusedBackendEndpoints = [];
  
  for (const route of inventory.backend.routes) {
    const normalizedPath = normalizeEndpoint(route.fullPath);
    const key = `${route.method}:${normalizedPath}`;
    
    // Check if this specific method+path combo is used in frontend
    const isUsed = frontendApiCalls.has(key) || 
                   // Also check if path is used (method might be unknown in frontend)
                   Array.from(frontendApiCalls.keys()).some(k => k.endsWith(`:${normalizedPath}`));
    
    if (!isUsed) {
      unusedBackendEndpoints.push({
        method: route.method,
        path: route.fullPath,
        file: route.file,
        normalizedPath
      });
    }
  }
  
  // Find frontend API calls without backend endpoints
  const missingBackendEndpoints = [];
  
  for (const [key, hooks] of frontendApiCalls.entries()) {
    const [method, normalizedPath] = key.split(':');
    
    // Check if backend has this endpoint (exact match or path-only match)
    const hasBackend = backendEndpoints.has(key) || 
                       (method === 'UNKNOWN' && backendPathsOnly.has(normalizedPath)) ||
                       Array.from(backendEndpoints.keys()).some(k => k.endsWith(`:${normalizedPath}`));
    
    if (!hasBackend) {
      for (const hook of hooks) {
        missingBackendEndpoints.push({
          method: hook.method,
          endpoint: hook.endpoint,
          file: hook.file,
          location: hook.location,
          normalizedPath
        });
      }
    }
  }
  
  // Find UI-only pages (pages without direct API calls)
  const uiOnlyPages = inventory.frontend.pages.filter(page => {
    // This is a simple heuristic - pages that don't have corresponding API hooks
    const pageName = page.component.toLowerCase();
    const hasApiHook = inventory.frontend.apiHooks.some(hook => 
      hook.file.toLowerCase().includes(pageName) || 
      hook.endpoint.toLowerCase().includes(pageName)
    );
    return !hasApiHook;
  });
  
  // Generate report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalBackendEndpoints: inventory.backend.routes.length,
      totalFrontendApiReferences: inventory.frontend.apiHooks.length,
      unusedBackendEndpoints: unusedBackendEndpoints.length,
      missingBackendEndpoints: missingBackendEndpoints.length,
      uiOnlyPages: uiOnlyPages.length
    },
    findings: {
      unusedBackendEndpoints,
      missingBackendEndpoints,
      uiOnlyPages
    }
  };
  
  // Save report
  const reportFile = path.join(__dirname, '../tmp/contract-check-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // Console output
  console.log('📊 Contract Check Summary');
  console.log('═'.repeat(60));
  console.log(`Total Backend Endpoints:        ${report.summary.totalBackendEndpoints}`);
  console.log(`Total Frontend API References:  ${report.summary.totalFrontendApiReferences}`);
  console.log(`Unused Backend Endpoints:       ${report.summary.unusedBackendEndpoints}`);
  console.log(`Missing Backend Endpoints:      ${report.summary.missingBackendEndpoints}`);
  console.log(`UI-Only Pages:                  ${report.summary.uiOnlyPages}`);
  console.log('═'.repeat(60));
  
  if (unusedBackendEndpoints.length > 0) {
    console.log('\n⚠️  Backend endpoints without frontend usage:');
    console.log('─'.repeat(60));
    
    // Group by file
    const byFile = {};
    for (const endpoint of unusedBackendEndpoints) {
      if (!byFile[endpoint.file]) {
        byFile[endpoint.file] = [];
      }
      byFile[endpoint.file].push(endpoint);
    }
    
    for (const [file, endpoints] of Object.entries(byFile)) {
      console.log(`\n📄 ${file}`);
      for (const ep of endpoints) {
        console.log(`   ${ep.method.padEnd(6)} ${ep.path}`);
      }
    }
  }
  
  if (missingBackendEndpoints.length > 0) {
    console.log('\n\n❌ Frontend API calls without backend endpoints:');
    console.log('─'.repeat(60));
    
    // Group by location
    const byLocation = {};
    for (const call of missingBackendEndpoints) {
      const key = `${call.location}/${call.file}`;
      if (!byLocation[key]) {
        byLocation[key] = [];
      }
      byLocation[key].push(call);
    }
    
    for (const [location, calls] of Object.entries(byLocation)) {
      console.log(`\n📄 ${location}`);
      for (const call of calls) {
        console.log(`   ${call.endpoint}`);
      }
    }
  }
  
  if (uiOnlyPages.length > 0) {
    console.log('\n\n📱 UI-Only Pages (no direct API hooks detected):');
    console.log('─'.repeat(60));
    for (const page of uiOnlyPages) {
      console.log(`   ${page.component} (${page.file})`);
    }
  }
  
  console.log(`\n\n✅ Report saved: ${reportFile}\n`);
  
  // Exit with error code if there are issues
  if (missingBackendEndpoints.length > 0) {
    console.log('⚠️  Warning: Found frontend API calls without backend endpoints');
    process.exit(1);
  }
  
  return report;
}

if (require.main === module) {
  try {
    checkContracts();
  } catch (error) {
    console.error('❌ Error checking contracts:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { checkContracts };
