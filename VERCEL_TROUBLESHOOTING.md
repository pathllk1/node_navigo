# Vercel Deployment Troubleshooting Guide

## Build Errors

### Error: "Cannot find module 'express'"
**Cause**: Dependencies not installed
**Solution**:
```bash
npm install
npm ci  # Use this for production
```

### Error: "Build command failed"
**Cause**: CSS build failed
**Solution**:
```bash
npm run build:css
# Check for errors in src/input.css
# Verify tailwindcss is installed
npm install -D tailwindcss @tailwindcss/cli
```

### Error: "ENOENT: no such file or directory"
**Cause**: Missing files or wrong paths
**Solution**:
- Check public/index.html exists
- Check public/output.css exists
- Verify all imports use correct paths
- Run `npm run build:css` locally

## Environment Variable Errors

### Error: "TURSO_DATABASE_URL is not set"
**Cause**: Environment variable not configured
**Solution**:
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add: `TURSO_DATABASE_URL=libsql://...`
4. Redeploy

### Error: "JWT_SECRET is not set"
**Cause**: JWT secrets missing
**Solution**:
1. Generate strong secrets (32+ chars)
2. Add to Vercel environment variables:
   - `JWT_SECRET=your_secret_here`
   - `JWT_REFRESH_SECRET=your_refresh_secret_here`
3. Redeploy

### Error: "Cannot read property 'TURSO_AUTH_TOKEN' of undefined"
**Cause**: Environment variables not loaded
**Solution**:
- Ensure `import 'dotenv/config.js'` is at top of api/index.js
- Check .env file exists locally
- Verify variables in Vercel dashboard

## Database Connection Errors

### Error: "SQLITE_CANTOPEN"
**Cause**: Trying to use local SQLite file
**Solution**:
- Vercel doesn't support local files
- Use Turso (already configured)
- Check TURSO_DATABASE_URL is correct

### Error: "Connection timeout"
**Cause**: Database unreachable
**Solution**:
1. Verify Turso database is running
2. Check TURSO_DATABASE_URL format
3. Verify TURSO_AUTH_TOKEN is valid
4. Check network connectivity
5. Try connecting locally first

### Error: "Authentication failed"
**Cause**: Invalid Turso credentials
**Solution**:
1. Get new token from Turso dashboard
2. Update TURSO_AUTH_TOKEN
3. Redeploy

## Runtime Errors

### Error: "Cannot find module '../public/index.html'"
**Cause**: Static files not found
**Solution**:
- Ensure public/index.html exists
- Check file paths are relative
- Verify public/ directory is committed to Git

### Error: "TypeError: Cannot read property 'get' of undefined"
**Cause**: Database not initialized
**Solution**:
- Check database initialization in api/index.js
- Verify Turso connection works
- Check error logs in Vercel dashboard

### Error: "ReferenceError: window is not defined"
**Cause**: Client-side code running on server
**Solution**:
- Move client code to public/
- Use `typeof window !== 'undefined'` checks
- Separate client and server code

## Authentication Issues

### Error: "401 Unauthorized"
**Cause**: Token invalid or expired
**Solution**:
- Check JWT_SECRET matches between login and verification
- Verify token expiry time
- Check cookie settings (httpOnly, sameSite)
- Test locally first

### Error: "Cookie not being set"
**Cause**: Secure flag issues
**Solution**:
- In production: `secure: true` (HTTPS only)
- In development: `secure: false`
- Check sameSite: 'strict' is set
- Verify credentials: 'include' in fetch

### Error: "CORS error"
**Cause**: Cross-origin request blocked
**Solution**:
- Check Access-Control-Expose-Headers includes 'x-access-token'
- Verify credentials: 'include' in fetch calls
- Check sameSite cookie setting

## Static File Issues

### Error: "404 Not Found: /output.css"
**Cause**: CSS not built
**Solution**:
```bash
npm run build:css
git add public/output.css
git commit -m "Add built CSS"
git push
```

### Error: "404 Not Found: /index.html"
**Cause**: SPA fallback not working
**Solution**:
- Check vercel.json rewrites are correct
- Verify api/index.js has SPA fallback
- Check public/index.html exists

### Error: "Images not loading"
**Cause**: Wrong image paths
**Solution**:
- Use relative paths: `/images/file.png`
- Not: `./images/file.png`
- Check images are in public/ directory

## Performance Issues

### Error: "Function timeout (60s)"
**Cause**: Request takes too long
**Solution**:
- Optimize database queries
- Add pagination
- Use caching
- Consider background jobs

### Error: "Memory exceeded"
**Cause**: Too much memory used
**Solution**:
- Optimize queries
- Stream large responses
- Reduce payload size
- Use pagination

### Error: "Slow response times"
**Cause**: Performance degradation
**Solution**:
- Check Vercel analytics
- Optimize database queries
- Add caching headers
- Use CDN for static files

## Deployment Issues

### Error: "Deployment failed"
**Cause**: Various issues
**Solution**:
1. Check build logs in Vercel dashboard
2. Run `npm run build` locally
3. Verify all files committed
4. Check for syntax errors
5. Try redeploying

### Error: "Deployment stuck"
**Cause**: Long build time
**Solution**:
- Check for infinite loops
- Verify dependencies install quickly
- Check for large files
- Try canceling and redeploying

### Error: "Rollback failed"
**Cause**: Previous deployment also failed
**Solution**:
- Fix the issue
- Deploy new version
- Or manually revert Git commit

## Testing Issues

### Error: "Login not working"
**Cause**: Multiple possible issues
**Solution**:
1. Check browser console for errors
2. Check Vercel function logs
3. Verify database connection
4. Test locally first
5. Check environment variables

### Error: "API calls failing"
**Cause**: Route not found or auth failed
**Solution**:
1. Check route exists in api/index.js
2. Verify authentication middleware
3. Check request headers
4. Test with curl or Postman
5. Check Vercel logs

### Error: "Timer not displaying"
**Cause**: Token not readable
**Solution**:
- Check accessToken cookie is httpOnly: false
- Verify token is in cookie
- Check timer element exists in DOM
- Check browser console for errors

## Debugging Tips

### 1. Check Vercel Logs
```bash
vercel logs
# or in dashboard: Deployments → Logs
```

### 2. Test Locally First
```bash
npm start
# Test at http://localhost:3001
# Check console for errors
```

### 3. Use Browser DevTools
- Console: Check for JavaScript errors
- Network: Check API responses
- Application: Check cookies and storage
- Sources: Debug JavaScript

### 4. Check Environment Variables
```bash
# Locally
echo $TURSO_DATABASE_URL

# In Vercel dashboard
Project Settings → Environment Variables
```

### 5. Test Database Connection
```bash
# Locally
node -e "import('./server/utils/db.js')"
```

### 6. Check Git Status
```bash
git status
# Ensure all files committed
git log --oneline
# Check recent commits
```

## Common Solutions

### Solution 1: Clear Cache and Redeploy
```bash
vercel --prod --force
```

### Solution 2: Rollback to Previous Version
```bash
vercel rollback
```

### Solution 3: Rebuild CSS
```bash
npm run build:css
git add public/output.css
git commit -m "Rebuild CSS"
git push
```

### Solution 4: Update Environment Variables
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Update variables
4. Redeploy

### Solution 5: Check Git History
```bash
git log --oneline
git diff HEAD~1
# Review recent changes
```

## Getting Help

### Vercel Support
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Status: https://www.vercel-status.com

### Turso Support
- Docs: https://docs.turso.tech
- Discord: https://discord.gg/turso

### Express.js
- Docs: https://expressjs.com
- Error Handling: https://expressjs.com/en/guide/error-handling.html

### JWT
- Docs: https://jwt.io
- Debugging: https://jwt.io/debugger

## Emergency Procedures

### If Production is Down

1. **Check Status**
   - Vercel dashboard
   - Turso dashboard
   - Browser console

2. **Immediate Actions**
   - Check recent deployments
   - Review error logs
   - Check environment variables

3. **Rollback**
   ```bash
   vercel rollback
   ```

4. **Fix and Redeploy**
   ```bash
   # Fix issue locally
   npm start  # Test
   git push   # Deploy
   ```

5. **Communicate**
   - Notify users
   - Post status update
   - Monitor recovery

## Prevention

### Best Practices
- Test locally before pushing
- Use staging environment
- Monitor error rates
- Regular backups
- Security updates
- Performance monitoring

### Monitoring Setup
- Vercel analytics
- Error tracking (Sentry)
- Uptime monitoring
- Database monitoring
- Log aggregation

---

**Remember**: Most issues can be resolved by:
1. Checking logs
2. Testing locally
3. Verifying environment variables
4. Reviewing recent changes
5. Redeploying

If stuck, check the relevant documentation or reach out to support.
