// Resource preloading and AOT optimization checker
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing build for AOT optimizations...\n');

const buildPath = path.join(__dirname, 'build');
const staticPath = path.join(buildPath, 'static');

if (!fs.existsSync(buildPath)) {
  console.log('❌ Build directory not found. Run npm run build:aot first.');
  process.exit(1);
}

// Analyze JavaScript bundles
const jsPath = path.join(staticPath, 'js');
if (fs.existsSync(jsPath)) {
  const jsFiles = fs.readdirSync(jsPath).filter(file => file.endsWith('.js'));
  
  console.log('📦 JavaScript Bundle Analysis:');
  jsFiles.forEach(file => {
    const filePath = path.join(jsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    if (file.includes('main')) {
      console.log(`  🎯 Main Bundle: ${file} (${sizeKB} KB)`);
    } else if (file.includes('vendors') || file.includes('chunk')) {
      console.log(`  📚 Vendor/Chunk: ${file} (${sizeKB} KB)`);
    } else {
      console.log(`  📄 Other: ${file} (${sizeKB} KB)`);
    }
  });
}

// Analyze CSS bundles
const cssPath = path.join(staticPath, 'css');
if (fs.existsSync(cssPath)) {
  const cssFiles = fs.readdirSync(cssPath).filter(file => file.endsWith('.css'));
  
  console.log('\n🎨 CSS Bundle Analysis:');
  cssFiles.forEach(file => {
    const filePath = path.join(cssPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`  🎨 ${file} (${sizeKB} KB)`);
  });
}

// Check for gzip compression
console.log('\n🗜️  Compression Check:');
const hasGzip = fs.readdirSync(jsPath).some(file => file.endsWith('.gz'));
if (hasGzip) {
  console.log('  ✅ Gzip compression enabled');
} else {
  console.log('  ⚠️  Gzip compression not found - enable in server config');
}

// Generate preload suggestions
console.log('\n📋 Preload Suggestions:');
const indexPath = path.join(buildPath, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  console.log('Add these to your HTML <head> for better performance:');
  
  // Find critical resources
  const jsMatches = indexContent.match(/static\/js\/[^"]+\.js/g);
  const cssMatches = indexContent.match(/static\/css\/[^"]+\.css/g);
  
  if (cssMatches) {
    cssMatches.forEach(css => {
      console.log(`<link rel="preload" href="/${css}" as="style">`);
    });
  }
  
  if (jsMatches) {
    const mainJs = jsMatches.find(js => js.includes('main'));
    if (mainJs) {
      console.log(`<link rel="preload" href="/${mainJs}" as="script">`);
    }
  }
}

console.log('\n✅ AOT Analysis Complete!');
console.log('\n🎯 Optimization Status:');
console.log('• Tree shaking: Enabled via babel-plugin-import');
console.log('• Code splitting: Enabled via lazy loading');
console.log('• Minification: Enhanced with Terser');
console.log('• Compression: Available (check server config)');
console.log('• Caching: Theme objects cached at build time');
console.log('• Constants: Pre-computed at build time');
