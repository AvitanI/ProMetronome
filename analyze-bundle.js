#!/usr/bin/env node

// Bundle analysis script for ProMetronome
// Run with: node analyze-bundle.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing ProMetronome bundle...\n');

// Check if build directory exists
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  console.log('❌ Build directory not found. Running production build first...\n');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to build project:', error.message);
    process.exit(1);
  }
}

// Install webpack-bundle-analyzer if not present
try {
  require.resolve('webpack-bundle-analyzer');
} catch (e) {
  console.log('📦 Installing webpack-bundle-analyzer...\n');
  execSync('npm install --save-dev webpack-bundle-analyzer', { stdio: 'inherit' });
}

// Analyze the bundle
console.log('📊 Opening bundle analyzer...\n');

try {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  const analyzer = new BundleAnalyzerPlugin({
    analyzerMode: 'server',
    openAnalyzer: true,
    generateStatsFile: true,
    statsFilename: 'bundle-stats.json'
  });

  // For Create React App, we need to use the static files
  execSync('npx webpack-bundle-analyzer build/static/js/*.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to analyze bundle:', error.message);
  console.log('\n💡 Alternative: You can manually inspect the build/static/js/ files');
  console.log('Large files in your bundle:');
  
  try {
    const jsDir = path.join(buildDir, 'static', 'js');
    const files = fs.readdirSync(jsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(jsDir, file);
        const stats = fs.statSync(filePath);
        return { name: file, size: stats.size };
      })
      .sort((a, b) => b.size - a.size);

    files.forEach(file => {
      const sizeKB = (file.size / 1024).toFixed(1);
      console.log(`  ${file.name}: ${sizeKB} KB`);
    });
  } catch (e) {
    console.error('Could not read build files:', e.message);
  }
}

console.log('\n✅ Bundle analysis complete!');
console.log('\n🎯 Performance Tips:');
console.log('• Consider lazy loading heavy components');
console.log('• Use React.memo for components that re-render frequently');
console.log('• Optimize images and audio files');
console.log('• Remove unused dependencies');
console.log('• Use tree shaking for Material-UI imports');
