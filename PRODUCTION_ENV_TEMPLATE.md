# Production Environment Variables Template
# Copy these to your hosting platforms (Vercel, Railway, etc.)

# ====================
# BACKEND (Railway)
# ====================

NODE_ENV=production
API_PORT=5000

# Database Configuration
# Get these from PlanetScale connection string
DB_HOST=your_planetscale_host
DB_USER=your_planetscale_username
DB_PASSWORD=your_planetscale_password
DB_NAME=your_database_name

# Security
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ====================
# FRONTEND (Vercel)
# ====================

# API Configuration
VITE_API_URL=https://your-railway-app.railway.app
VITE_APP_URL=https://your-domain.com

# ====================
# IMPORTANT NOTES
# ====================

# 1. Replace all "your-*" values with actual values
# 2. Never commit this file with real values to version control
# 3. JWT_SECRET should be a strong random string (32+ characters)
# 4. Use different secrets for development and production
# 5. CORS_ORIGIN should match your exact domain (no trailing slash)

# Example JWT_SECRET generation:
# - Use a password generator with 32+ characters
# - Or use: openssl rand -hex 32 (on Linux/Mac)
# - Or use an online UUID generator

# Example domain setup:
# - If your domain is my-fsm-app.com
# - Then CORS_ORIGIN should be: https://my-fsm-app.com
# - VITE_APP_URL should be: https://my-fsm-app.com