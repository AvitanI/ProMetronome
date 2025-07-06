#!/bin/bash

# Deploy script for ProMetronome
echo "🚀 Deploying ProMetronome to Netlify..."

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Navigate to frontend directory
cd frontend

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=build

echo "✅ Deployment complete!"
echo "🌍 Your app is live at your Netlify URL"
