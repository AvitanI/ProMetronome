# ProMetronome Deployment Guide

## 📋 Overview
This guide will help you deploy:
- **Frontend**: React app to Netlify (static hosting)
- **Backend**: .NET API to Azure App Service

## 🔄 Step 1: Deploy Backend to Azure

### Option A: Using Azure CLI (Recommended)

1. **Install Azure CLI** (if not already installed):
```bash
brew install azure-cli
```

2. **Login to Azure**:
```bash
az login
```

3. **Create Resource Group**:
```bash
az group create --name ProMetronomeAPI --location "East US"
```

4. **Create App Service Plan**:
```bash
az appservice plan create \
  --name ProMetronomeAPIPlan \
  --resource-group ProMetronomeAPI \
  --sku B1 \
  --is-linux
```

5. **Create Web App**:
```bash
az webapp create \
  --name your-unique-app-name-here \
  --resource-group ProMetronomeAPI \
  --plan ProMetronomeAPIPlan \
  --runtime "DOTNET|9.0"
```

6. **Deploy from Local Code**:
```bash
cd backend/ProMetronomeAPI
az webapp up \
  --name your-unique-app-name-here \
  --resource-group ProMetronomeAPI \
  --location "East US"
```

### Option B: Using Visual Studio Publish

1. Right-click on `ProMetronomeAPI` project
2. Select "Publish"
3. Choose "Azure" → "Azure App Service (Linux)"
4. Create new or select existing App Service
5. Click "Publish"

### 🔧 Configure App Settings in Azure

After deployment, add these environment variables in Azure Portal:
- Go to your App Service → Configuration → Application settings
- Add:
  - `ASPNETCORE_ENVIRONMENT`: `Production`
  - `Spotify__ClientId`: `your_spotify_client_id`
  - `Spotify__ClientSecret`: `your_spotify_client_secret`

## 🌐 Step 2: Deploy Frontend to Netlify

### Option A: Manual Deployment

1. **Build your React app**:
```bash
cd frontend
npm run build
```

2. **Deploy to Netlify**:
```bash
netlify deploy --prod --dir=build
```

### Option B: Continuous Deployment (Recommended)

1. Connect your GitHub repo to Netlify
2. Set build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`

3. **Add Environment Variables** in Netlify:
   - Go to Site settings → Environment variables
   - Add: `REACT_APP_API_URL` = `https://your-azure-app-name.azurewebsites.net/api`

## ⚙️ Step 3: Update CORS for Production

After getting your Netlify URL, update the CORS policy in your backend:

1. Edit `backend/ProMetronomeAPI/Program.cs`
2. Replace placeholder domains with your actual domains:
```csharp
policy.WithOrigins(
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://your-actual-netlify-domain.netlify.app",
    "https://your-custom-domain.com" // if you have one
)
```

3. Redeploy your backend after updating CORS

## 🧪 Step 4: Test Your Deployment

1. **Test Backend**:
```bash
curl "https://your-azure-app-name.azurewebsites.net/api/music/health"
curl "https://your-azure-app-name.azurewebsites.net/api/music/search?query=blinding"
```

2. **Test Frontend**:
   - Visit your Netlify URL
   - Try searching for songs
   - Check browser console for any CORS or API errors

## 🔐 Security Notes

- Use Azure Key Vault for sensitive configurations in production
- Enable HTTPS only in Azure App Service
- Consider adding rate limiting for API endpoints
- Use environment variables for all configuration

## 💰 Cost Estimation

- **Azure App Service B1**: ~$13/month
- **Netlify Pro**: Free tier available, $19/month for pro features
- **Total**: ~$13-32/month depending on usage

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure your Netlify domain is in the CORS policy
2. **API Not Found**: Check the `REACT_APP_API_URL` environment variable
3. **Build Failures**: Ensure Node.js version compatibility
4. **Spotify API Issues**: Verify credentials in Azure App Settings

### Debug Commands:

```bash
# Check Azure app logs
az webapp log tail --name your-app-name --resource-group ProMetronomeAPI

# Test API directly
curl -v https://your-azure-app-name.azurewebsites.net/api/music/health
```

## 🎯 Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates
3. Set up monitoring and alerts
4. Consider CDN for better performance
