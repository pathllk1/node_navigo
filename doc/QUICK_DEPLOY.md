# Quick Deployment to Vercel (5 Minutes)

## Step 1: Prepare Your Code (2 min)

```bash
# Build CSS
npm run build:css

# Verify everything works locally
npm start
# Test at http://localhost:3001
```

## Step 2: Set Up Vercel (1 min)

### Option A: Using GitHub (Recommended)
1. Push code to GitHub
2. Go to https://vercel.com/dashboard
3. Click "Add New" → "Project"
4. Select your GitHub repo
5. Click "Import"

### Option B: Using Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Step 3: Add Environment Variables (1 min)

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
TURSO_DATABASE_URL=libsql://your-db.aws-region.turso.io
TURSO_AUTH_TOKEN=your_token_here
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
NODE_ENV=production
```

## Step 4: Deploy (1 min)

### If using GitHub:
- Vercel auto-deploys when you push to main
- Or click "Deploy" in Vercel dashboard

### If using CLI:
```bash
vercel --prod
```

## Done! 🎉

Your app is now live at: `https://your-project.vercel.app`

## Verify Deployment

1. Open your Vercel URL
2. Test login
3. Check browser console for errors
4. Test API calls

## If Something Goes Wrong

```bash
# View logs
vercel logs

# Rollback
vercel rollback

# Check local setup
npm start
```

## Next Steps

- [ ] Set up custom domain
- [ ] Configure monitoring
- [ ] Test all features
- [ ] Set up backups

See `VERCEL_DEPLOYMENT.md` for detailed guide.
