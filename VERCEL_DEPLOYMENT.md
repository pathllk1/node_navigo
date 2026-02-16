# Vercel Deployment Guide

This guide explains how to deploy the SPA application to Vercel.

## Prerequisites

1. **Vercel Account**: Create one at https://vercel.com
2. **Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## Environment Variables Required

Set these in your Vercel project settings:

```
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db.aws-region.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_min_32_chars

# Node Environment
NODE_ENV=production
```

## Deployment Methods

### Method 1: Using Vercel Dashboard (Recommended for Beginners)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: public
5. Add environment variables in "Environment Variables" section
6. Click "Deploy"

### Method 2: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Method 3: GitHub Integration (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com/dashboard
3. Click "Add New" → "Project"
4. Select your GitHub repository
5. Configure environment variables
6. Click "Deploy"
7. Future pushes to main branch auto-deploy

## Project Structure for Vercel

```
.
├── api/
│   └── index.js              # Serverless function entry point
├── public/                   # Static files (HTML, CSS, JS)
│   ├── index.html
│   ├── output.css
│   └── ...
├── server/
│   ├── index.js             # Local development server
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   └── utils/               # Database, helpers
├── vercel.json              # Vercel configuration
├── .vercelignore            # Files to ignore
├── package.json
└── .env                     # Local only (not committed)
```

## How It Works

### Local Development
```bash
npm run dev
# Runs: node server/index.js
# Server: http://localhost:3001
```

### Vercel Production
- `api/index.js` is deployed as a serverless function
- All requests route through the Express app
- Static files served from `public/` directory
- Database connections use Turso (serverless-friendly)

## Key Features

### ✅ What Works on Vercel

- **Express.js API**: All routes work as serverless functions
- **Authentication**: JWT with httpOnly cookies
- **Database**: Turso (serverless SQLite)
- **Static Files**: HTML, CSS, JS from public/
- **SPA Routing**: Navigo client-side routing
- **Security Headers**: CSP, XSS protection, etc.

### ⚠️ Limitations

- **File Uploads**: Limited to 5MB per request
  - Solution: Use cloud storage (AWS S3, Cloudinary, etc.)
- **Session Duration**: Max 60 seconds per request
  - Solution: Use background jobs for long operations
- **Database**: Turso only (no local SQLite)
  - Already configured in production

## Troubleshooting

### Build Fails
```
Error: Cannot find module 'dotenv'
```
**Solution**: Run `npm install` locally, commit package-lock.json

### Database Connection Error
```
Error: TURSO_DATABASE_URL not set
```
**Solution**: Add environment variables in Vercel dashboard

### Static Files Not Loading
```
404 Not Found: /output.css
```
**Solution**: Ensure CSS is built before deployment
- Run: `npm run build:css`
- Commit: `public/output.css`

### CORS/Cookie Issues
```
Cookie not being set
```
**Solution**: Ensure:
- `secure: false` in development
- `secure: true` in production (HTTPS only)
- `sameSite: 'strict'` for same-origin requests

## Performance Optimization

### 1. CSS Optimization
```bash
npm run build:css
# Generates minified output.css
```

### 2. Static Asset Caching
- Vercel automatically caches static files
- Set cache headers in vercel.json

### 3. Database Connection Pooling
- Turso handles connection pooling automatically
- No additional configuration needed

## Security Checklist

- ✅ Environment variables not in code
- ✅ JWT secrets are strong (32+ chars)
- ✅ HTTPS enforced (Vercel default)
- ✅ Security headers configured
- ✅ CORS restricted to same-origin
- ✅ Cookies are httpOnly and sameSite

## Monitoring & Logs

### View Logs
```bash
vercel logs
```

### Monitor Performance
- Vercel Dashboard → Analytics
- Check function duration and memory usage

### Error Tracking
- Check Vercel dashboard for failed deployments
- Review function logs for runtime errors

## Custom Domain

1. Go to Vercel Dashboard → Project Settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records (instructions provided)
5. Wait for DNS propagation (5-48 hours)

## Rollback

If deployment has issues:

```bash
# View deployment history
vercel list

# Rollback to previous deployment
vercel rollback
```

## Database Backup

Turso provides automatic backups. To export data:

```bash
# Using Turso CLI
turso db dump your-db-name > backup.sql
```

## Next Steps

1. Deploy to Vercel
2. Test all features in production
3. Monitor logs and performance
4. Set up custom domain
5. Configure monitoring/alerts

## Support

- Vercel Docs: https://vercel.com/docs
- Turso Docs: https://docs.turso.tech
- Express.js: https://expressjs.com
