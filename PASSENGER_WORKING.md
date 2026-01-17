# Working Passenger Configuration

Your app was working perfectly with this setup before recent changes.

## Working .htaccess Configuration

Location: `/home/poaes/domains/poaes.cicte.link/public_html/.htaccess`

```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/poaes/app"
PassengerBaseURI "/"
PassengerNodejs "/home/poaes/nodevenv/app/20/bin/node"
PassengerAppType node
PassengerStartupFile dist/index.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
```

## How Your Setup Works

1. **Code is in:** `/home/poaes/app/`
2. **Build process creates:** `/home/poaes/app/dist/index.js`
3. **Passenger runs:** `dist/index.js` (the compiled production bundle)
4. **Accessed via:** `http://poaes.cicte.link`

## Build Process

Your app uses Vite to bundle everything into `dist/`:

```bash
npm run build
# Creates: dist/index.js (server + client bundled)
```

## Important Notes

- ✅ **`dist/index.js` works** - Don't change PassengerStartupFile!
- ✅ **`__dirname` works in production** - The bundler handles it
- ✅ **No manual port config needed** - Passenger handles everything
- ❌ **Don't add unnecessary middleware** - Passenger is optimized
- ❌ **Don't change server/static.ts** - Production doesn't use it

## When Something Breaks

If your app stops working:

1. **Check if dist/ exists:**
   ```bash
   ls -la /home/poaes/app/dist/
   ```

2. **Rebuild if needed:**
   ```bash
   cd /home/poaes/app
   npm run build
   ```

3. **Restart Passenger:**
   ```bash
   mkdir -p tmp
   touch tmp/restart.txt
   ```

4. **Check logs:**
   ```bash
   tail -f log/passenger.log
   ```

## Your Working Setup (DO NOT CHANGE)

```
Browser → LiteSpeed → Passenger → dist/index.js
```

Everything is bundled in `dist/index.js` by Vite. This includes:
- ✅ Server code (Express routes)
- ✅ Client code (React app)
- ✅ All dependencies
- ✅ Proper __dirname handling (by bundler)

## What NOT to Do

- ❌ Don't change PassengerStartupFile from `dist/index.js`
- ❌ Don't add development-only middleware in production
- ❌ Don't manually fix `__dirname` (bundler handles it)
- ❌ Don't try to configure ports (Passenger manages it)
- ❌ Don't mess with working code!

## Keep It Simple

Your setup was working perfectly. The recent PRs tried to fix non-issues and broke it.

**This revert PR restores everything to the working state.**

After this PR merges:
```bash
touch /home/poaes/app/tmp/restart.txt
```

Your app will be back online! ✅
