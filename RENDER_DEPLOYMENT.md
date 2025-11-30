# Render Deployment Guide

## Prerequisites
- GitHub account with your repo pushed
- Render account (free tier available)
- MySQL database (Render free tier or external like PlanetScale)

## Quick Start (Recommended: Manual Setup)

### 1. Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/IAMTRAMEN/fsmpro.git
git push -u origin main
```

### 2. Create MySQL Database

**Option A: Render MySQL (Free)**
- Go to https://render.com
- Click **New +** → **MySQL**
- Choose free tier
- Copy connection details

**Option B: PlanetScale (Recommended - Easier)**
- Go to https://planetscale.com (free MySQL hosting)
- Create a new database
- Get connection string

### 3. Create Web Service on Render
1. Go to https://render.com
2. Click **New +** → **Web Service**
3. Connect GitHub repo
4. Configure:
   - **Name**: `fsmpro`
   - **Environment**: `Node`
   - **Region**: closest to you
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 4. Add Environment Variables
In Render dashboard → **Environment** tab, add:

```env
NODE_ENV=production
API_PORT=3000
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=fsm_app
JWT_SECRET=your-secure-secret-key-here
```

### 5. Deploy
- Click **Create Web Service**
- Render auto-deploys from `main` branch
- Check logs for any errors

## Environment Variables Explained

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` for deployment |
| `API_PORT` | Port for Express server (Render uses 3000) |
| `DB_HOST` | MySQL host address |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (`fsm_app`) |
| `JWT_SECRET` | Secret key for JWT tokens (keep secure!) |

## Update Frontend API URLs

After deployment, update your frontend API calls to use your Render URL:

```javascript
// Before (development)
const API_URL = 'http://localhost:5000/api';

// After (production)
const API_URL = 'https://your-app-name.onrender.com/api';
```

## Accessing Your App

- **Frontend**: `https://your-app-name.onrender.com`
- **API**: `https://your-app-name.onrender.com/api`
- **Server Logs**: Render Dashboard → View Logs

## Troubleshooting

### Build Fails
- Check logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally first

### Database Connection Error
- Verify DB credentials in Environment variables
- Check database is running
- Ensure firewall allows external connections

### 404 on Page Refresh
- Already fixed in server.ts - catch-all route serves index.html
- Verifies `NODE_ENV=production` is set

### Slow First Load
- Render free tier may have cold starts
- Upgrade to paid plan for better performance

## Auto-Deploy from Git

Render automatically deploys on git push:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Render auto-deploys!
```

To disable auto-deploy:
1. Go to Settings → Autodeployment
2. Disable autodeployment

## Custom Domain

1. Render Dashboard → Settings
2. Add custom domain
3. Configure DNS at your domain provider

## Performance Tips

- Render free tier has limitations (spinning down after 15 min inactivity)
- Consider upgrading to Starter ($7/mo) for consistent performance
- Use CDN for static assets if needed

## Support

- Render Docs: https://render.com/docs
- GitHub Issues: Create issue if problems occur
