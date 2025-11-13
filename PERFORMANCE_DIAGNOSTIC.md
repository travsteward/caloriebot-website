# Performance Diagnostic Guide

## Problem
TTFB (Time To First Byte) is 1,000-1,200ms for static HTML pages. This is abnormally slow for a static site.

## Expected Performance
- Static HTML from CDN: **<100ms TTFB**
- Current performance: **1,000-1,200ms TTFB** (10-12x slower than expected)

## Diagnostic Steps

### 1. Test Diagnostic Endpoint
Visit: `https://caloriebot.ai/.netlify/functions/diagnostic`

This will show:
- Function response time
- Request headers
- Environment info

**If diagnostic function is fast (<100ms) but pages are slow, the issue is NOT serverless functions.**

### 2. Check Netlify Build Logs
Look for:
- Build warnings about SSR/SSG mode
- Any mention of "adapter" or "server-side rendering"
- Build time (should be fast for static site)

### 3. Test Direct File Access
Try accessing a built HTML file directly:
- Check `dist/index.html` in Netlify deploy logs
- Verify files are actually static (not being processed)

### 4. Check Redirect Processing
The `netlify.toml` has this redirect:
```toml
[[redirects]]
  from = "/:page"
  to = "/:page/"
  status = 301
  force = true
  conditions = {Path = {match = "^/[^.]+$"}}
```

**This redirect processes EVERY request** that doesn't have a trailing slash. This could be causing:
- Double requests (one to `/page`, redirect to `/page/`)
- Server-side redirect processing overhead
- Additional latency

### 5. Check for Netlify Adapter
Even though `astro.config.mjs` doesn't import it, check:
- Is `@astrojs/netlify` still installed? (YES - it's in package.json)
- Is Netlify auto-detecting it and enabling SSR mode?
- Check Netlify dashboard → Site settings → Build & deploy → Build settings

### 6. Test with curl/HTTPie
```bash
# Test homepage
curl -w "\nTime: %{time_total}s\nTTFB: %{time_starttransfer}s\n" \
  -o /dev/null -s https://caloriebot.ai/

# Test with trailing slash
curl -w "\nTime: %{time_total}s\nTTFB: %{time_starttransfer}s\n" \
  -o /dev/null -s https://caloriebot.ai/

# Check response headers
curl -I https://caloriebot.ai/
```

Look for:
- `X-NF-Request-ID` header (indicates Netlify processing)
- `Server` header (should be "Netlify" or similar)
- `Cache-Control` header (check if CDN caching is working)

### 7. Check Netlify Analytics
In Netlify dashboard:
- Go to Analytics → Performance
- Check "Edge Function Duration" (should be 0 for static sites)
- Check "Request Duration" breakdown

### 8. Test from Different Locations
Use tools like:
- [WebPageTest](https://www.webpagetest.org/) - test from multiple locations
- [GTmetrix](https://gtmetrix.com/) - detailed waterfall analysis
- [Pingdom](https://tools.pingdom.com/) - global performance test

## Most Likely Causes (in order of probability)

### 1. **Trailing Slash Redirect Overhead** (MOST LIKELY)
The redirect rule processes every request, adding latency:
```toml
[[redirects]]
  from = "/:page"
  to = "/:page/"
```

**Test:** Access pages WITH trailing slash directly (e.g., `https://caloriebot.ai/features/`)
- If fast → redirect is the problem
- If still slow → different issue

### 2. **Netlify Auto-Detecting SSR Mode**
Even without adapter in config, Netlify might detect `@astrojs/netlify` package and enable SSR.

**Check:** Netlify dashboard → Functions tab
- Are there any functions listed?
- Check function invocations (should be 0 for static pages)

### 3. **CDN Cache Misses**
If CDN isn't caching properly, every request hits origin.

**Check:** Response headers for `Cache-Control` and `CDN-Cache-Status`

### 4. **Edge Network Latency**
Netlify's edge network might have high latency in your region.

**Test:** Use WebPageTest from multiple locations

### 5. **Build Output Issues**
Files might not be properly static.

**Check:**
- `dist/` folder contents after build
- Are HTML files actually static? (no server-side code)

## Quick Fixes to Test

### Test 1: Remove Trailing Slash Redirect
Temporarily comment out the trailing slash redirect in `netlify.toml`:
```toml
# [[redirects]]
#   from = "/:page"
#   to = "/:page/"
#   status = 301
#   force = true
#   conditions = {Path = {match = "^/[^.]+$"}}
```

Then test page speed. If TTFB drops significantly, this is the culprit.

### Test 2: Remove @astrojs/netlify Package
Even though it's not used, remove it:
```bash
npm uninstall @astrojs/netlify
```

Then rebuild and redeploy. Netlify might be auto-detecting it.

### Test 3: Check Netlify Site Settings
In Netlify dashboard:
1. Site settings → Build & deploy
2. Check "Build command" (should be `npm run build`)
3. Check "Publish directory" (should be `dist`)
4. Look for any SSR/Edge Functions settings

## Next Steps

1. Run diagnostic endpoint test
2. Check Netlify build logs
3. Test with/without trailing slash
4. Check Netlify Functions dashboard
5. Test from multiple locations
6. Review response headers

Once we identify the source, we can implement the fix.

