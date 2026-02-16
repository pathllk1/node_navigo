# Pre-Deployment Checklist

Complete this checklist before deploying to Vercel.

## Code Quality

- [ ] No console.log statements left in production code
- [ ] All error handling is in place
- [ ] No hardcoded secrets or API keys in code
- [ ] All environment variables use process.env
- [ ] No local file paths (use relative paths)
- [ ] No references to local database files

## Dependencies

- [ ] All dependencies in package.json (not devDependencies)
- [ ] No unused dependencies
- [ ] package-lock.json is committed
- [ ] Run `npm install` locally to verify

## Environment Variables

- [ ] TURSO_DATABASE_URL is set
- [ ] TURSO_AUTH_TOKEN is set
- [ ] JWT_SECRET is set (min 32 chars)
- [ ] JWT_REFRESH_SECRET is set (min 32 chars)
- [ ] NODE_ENV=production for Vercel
- [ ] All vars added to Vercel dashboard

## Database

- [ ] Turso database created and accessible
- [ ] Database schema initialized
- [ ] Test user created (for testing)
- [ ] Backup of production data taken
- [ ] Connection string verified

## Frontend

- [ ] CSS built: `npm run build:css`
- [ ] public/output.css is committed
- [ ] public/index.html exists
- [ ] All static assets in public/ folder
- [ ] No broken image/font links

## Security

- [ ] No secrets in .env (use .env.example)
- [ ] .env added to .gitignore
- [ ] HTTPS enforced (Vercel default)
- [ ] Security headers configured in vercel.json
- [ ] CORS properly configured
- [ ] JWT secrets are strong

## API Routes

- [ ] All routes tested locally
- [ ] Authentication middleware working
- [ ] Error responses are consistent
- [ ] No 404 errors for valid routes
- [ ] CORS headers set correctly

## Testing

- [ ] Login/logout works
- [ ] Token refresh works
- [ ] Protected routes require auth
- [ ] API calls return correct data
- [ ] Error handling works
- [ ] Timer displays correctly

## Configuration Files

- [ ] vercel.json exists and configured
- [ ] .vercelignore exists
- [ ] package.json has build script
- [ ] api/index.js is the entry point
- [ ] All routes imported in api/index.js

## Git

- [ ] All changes committed
- [ ] No uncommitted files
- [ ] Branch is up to date
- [ ] Ready to push to main

## Vercel Setup

- [ ] Vercel account created
- [ ] Project created in Vercel
- [ ] Git repository connected
- [ ] Environment variables added
- [ ] Build settings configured

## Deployment

- [ ] Run `npm run build` locally (should succeed)
- [ ] Test locally: `npm start`
- [ ] Push to Git
- [ ] Monitor Vercel deployment
- [ ] Check deployment logs
- [ ] Test production URL

## Post-Deployment

- [ ] Test login on production
- [ ] Test API calls
- [ ] Check console for errors
- [ ] Verify database connection
- [ ] Test token refresh
- [ ] Monitor performance

## Rollback Plan

- [ ] Know how to rollback if needed
- [ ] Have previous deployment URL
- [ ] Database backup available
- [ ] Can revert Git commits if needed

## Monitoring

- [ ] Set up error tracking (optional)
- [ ] Monitor Vercel analytics
- [ ] Check function duration
- [ ] Monitor database queries
- [ ] Set up alerts for failures

---

## Quick Deployment Command

```bash
# 1. Build CSS
npm run build:css

# 2. Commit changes
git add .
git commit -m "Prepare for Vercel deployment"

# 3. Push to main
git push origin main

# 4. Vercel auto-deploys (if connected)
# Or manually deploy:
vercel --prod
```

## Troubleshooting

If deployment fails:

1. Check Vercel build logs
2. Verify environment variables
3. Test locally: `npm start`
4. Check database connection
5. Review error messages
6. Rollback if necessary

## Support

- Vercel Docs: https://vercel.com/docs
- Check VERCEL_DEPLOYMENT.md for detailed guide
