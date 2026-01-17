# Phusion Passenger Setup Guide (CloudLinux + DirectAdmin)

Your server uses **Phusion Passenger** - a sophisticated Node.js application manager built into CloudLinux. This is **much better** than manual proxies because Passenger handles everything automatically!

## What is Passenger?

**Phusion Passenger** integrates with LiteSpeed/Apache to run Node.js apps without manual port configuration. It:
- ✅ Automatically starts your Node.js app
- ✅ Monitors and restarts on crashes
- ✅ Handles multiple concurrent requests
- ✅ Manages process scaling
- ✅ No port 5000 configuration needed!

## Current Issue

Your `.htaccess` points to the wrong startup file:
```apache
PassengerStartupFile dist/index.js  # ❌ This file doesn't exist
```

## Step-by-Step Fix

### Step 1: Verify Your File Structure

SSH into your server and check:

```bash
cd /home/poaes/app

# Check current structure
ls -la

# Expected structure:
# /home/poaes/app/
#   ├── server/
#   │   └── index.ts  ← Your actual startup file
#   ├── client/
#   ├── shared/
#   ├── package.json
#   ├── .htaccess
#   └── node_modules/
```

### Step 2: Update .htaccess Configuration

Your current `.htaccess` is in the **wrong location**. It should be in your domain's `public_html` directory:

```bash
# Navigate to your domain's public_html
cd /home/poaes/domains/poaes.cicte.link/public_html

# Create or update .htaccess
nano .htaccess
```

**Add this configuration:**

```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/poaes/app"
PassengerBaseURI "/"
PassengerNodejs "/home/poaes/nodevenv/app/20/bin/node"
PassengerAppType node
PassengerStartupFile server/index.ts
PassengerNodeAppStartCommand "node --loader tsx server/index.ts"

# Environment variables
SetEnv NODE_ENV production
SetEnv PORT 5000

# Logging
PassengerLogLevel 3
PassengerDebugger on

# Performance
PassengerMinInstances 1
PassengerMaxPoolSize 6
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

# Passenger restarts
PassengerRestartDir /home/poaes/app/tmp
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Create Restart Directory

Passenger needs a `tmp` directory for restart signals:

```bash
cd /home/poaes/app
mkdir -p tmp
touch tmp/restart.txt
```

### Step 4: Install Dependencies

Make sure all dependencies are installed:

```bash
cd /home/poaes/app

# Install production dependencies
/home/poaes/nodevenv/app/20/bin/npm install --production=false

# Or if using the Node.js selector in DirectAdmin:
npm install
```

### Step 5: Check Environment Variables

Create or update `.env` file:

```bash
cd /home/poaes/app
nano .env
```

Add required environment variables:

```bash
NODE_ENV=production
PORT=5000

# Database (update with your actual credentials)
MYSQL_HOST=localhost
MYSQL_USER=poaes_db_user
MYSQL_PASSWORD=your_password
MYSQL_DBNAME=poaes_database

# Add other environment variables your app needs
```

Save and exit.

### Step 6: Verify Database Connection

```bash
# Test MySQL connection
mysql -u poaes_db_user -p poaes_database

# Run database initialization if needed
cd /home/poaes/app
/home/poaes/nodevenv/app/20/bin/node server/init-db.ts
```

### Step 7: Restart Passenger

```bash
# Method 1: Touch restart.txt (preferred)
touch /home/poaes/app/tmp/restart.txt

# Method 2: Restart through DirectAdmin
# Go to DirectAdmin → Setup Node.js App → Click "Restart"

# Method 3: Delete passenger PID files
rm -f /home/poaes/app/tmp/pids/*.pid
```

### Step 8: Check Passenger Logs

```bash
# View Passenger logs
tail -f /home/poaes/app/log/passenger.log

# Or check LiteSpeed error log
tail -f /usr/local/lsws/logs/error.log

# Or DirectAdmin logs
tail -f /var/log/directadmin/error.log
```

### Step 9: Test Your App

```bash
# Test locally
curl http://localhost/api/health

# Test via domain
curl http://poaes.cicte.link/api/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"..."}
```

## Troubleshooting

### 503 Service Unavailable

**Check Passenger logs:**
```bash
tail -f /home/poaes/app/log/passenger.log
```

**Common causes:**
1. Wrong startup file path
2. Missing dependencies
3. Database connection error
4. Missing environment variables

### "Cannot find module" Error

**Install dependencies:**
```bash
cd /home/poaes/app
/home/poaes/nodevenv/app/20/bin/npm install
```

### TypeScript Errors

If using TypeScript, you need `tsx` or compile to JavaScript:

**Option 1: Use tsx loader (recommended):**
```apache
PassengerNodeAppStartCommand "node --loader tsx server/index.ts"
```

Install tsx:
```bash
cd /home/poaes/app
npm install tsx --save
```

**Option 2: Compile TypeScript to JavaScript:**
```bash
cd /home/poaes/app
npm run build

# Update .htaccess to use compiled files:
PassengerStartupFile dist/server/index.js
```

### Database Connection Errors

**Verify MySQL credentials:**
```bash
mysql -u poaes_db_user -p poaes_database
```

**Check `.env` file:**
```bash
cat /home/poaes/app/.env
```

**Initialize database:**
```bash
cd /home/poaes/app
/home/poaes/nodevenv/app/20/bin/node server/init-db.ts
```

### App Crashes on Startup

**Check Node.js version:**
```bash
/home/poaes/nodevenv/app/20/bin/node --version
# Should be v20.x.x
```

**Check startup file syntax:**
```bash
cd /home/poaes/app
/home/poaes/nodevenv/app/20/bin/node --check server/index.ts
```

### Permission Errors

**Fix file permissions:**
```bash
cd /home/poaes
chmod -R 755 app
chown -R poaes:poaes app
```

## DirectAdmin Integration

### Using DirectAdmin's Node.js Selector

1. **Log into DirectAdmin**
2. **Go to "Setup Node.js App"**
3. **Configure:**
   - Node.js Version: 20.x
   - Application Mode: Production
   - Application Root: `/home/poaes/app`
   - Application URL: `poaes.cicte.link`
   - Application Startup File: `server/index.ts`
   - Environment Variables: (add from .env)

4. **Click "Save"**
5. **Click "Restart"**

### Environment Variables in DirectAdmin

Instead of `.env` file, you can set environment variables in DirectAdmin:

1. **Setup Node.js App**
2. **Scroll to "Environment Variables"**
3. **Add each variable:**
   ```
   NODE_ENV=production
   PORT=5000
   MYSQL_HOST=localhost
   MYSQL_USER=poaes_db_user
   MYSQL_PASSWORD=your_password
   MYSQL_DBNAME=poaes_database
   ```

## Correct File Locations

### Application Files
```
/home/poaes/app/
├── server/
│   ├── index.ts          ← Startup file
│   ├── routes.ts
│   ├── storage.ts
│   └── ...
├── client/
├── shared/
├── package.json
├── .env                  ← Environment variables
├── node_modules/
├── tmp/
│   └── restart.txt       ← Touch this to restart
└── log/
    └── passenger.log     ← Check for errors
```

### Web Files (.htaccess)
```
/home/poaes/domains/poaes.cicte.link/public_html/
└── .htaccess            ← Passenger configuration
```

## Passenger Commands

### Restart App
```bash
# Preferred method
touch /home/poaes/app/tmp/restart.txt

# Force restart
rm -f /home/poaes/app/tmp/pids/*.pid
touch /home/poaes/app/tmp/restart.txt
```

### View Status
```bash
# Check if Passenger is running
ps aux | grep Passenger

# Check app processes
ps aux | grep node
```

### View Logs
```bash
# Passenger log
tail -f /home/poaes/app/log/passenger.log

# App log (if you're logging to file)
tail -f /home/poaes/app/log/app.log

# LiteSpeed error log
tail -f /usr/local/lsws/logs/error.log
```

### Clear Passenger Cache
```bash
rm -rf /home/poaes/app/tmp/cache/*
touch /home/poaes/app/tmp/restart.txt
```

## Production Checklist

- [ ] `.htaccess` in correct location (`public_html/`)
- [ ] `PassengerStartupFile` points to existing file
- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file with all required variables
- [ ] Database initialized (`node server/init-db.ts`)
- [ ] `tmp/` directory exists
- [ ] Correct file permissions (755)
- [ ] Node.js version is 20.x
- [ ] App restarts successfully (`touch tmp/restart.txt`)
- [ ] Logs show no errors (`tail -f log/passenger.log`)
- [ ] App accessible at domain (`curl http://poaes.cicte.link`)

## SSL/HTTPS Setup

Once HTTP works:

1. **Log into DirectAdmin**
2. **Go to SSL Certificates**
3. **Select your domain**
4. **Choose "Let's Encrypt SSL"**
5. **Click "Save"**

DirectAdmin will automatically configure HTTPS!

## Advantages of Passenger

vs. Manual Port Configuration:
- ✅ **No port management** - Passenger handles everything
- ✅ **Auto-restart** - Crashes are automatically recovered
- ✅ **Process scaling** - Multiple workers handled automatically
- ✅ **Memory management** - Efficient resource usage
- ✅ **Zero-downtime restarts** - Just touch `restart.txt`
- ✅ **Built-in monitoring** - Logs and status built-in

vs. PM2:
- ✅ **Better integration** - Works natively with LiteSpeed
- ✅ **No extra daemon** - LiteSpeed manages everything
- ✅ **DirectAdmin UI** - Manage from control panel
- ✅ **More efficient** - Shared with web server

## Summary

**Your setup:**
```
Browser → LiteSpeed → Passenger → Your Node.js App
```

**No ports to configure!** Passenger handles everything internally.

**Quick restart:**
```bash
touch /home/poaes/app/tmp/restart.txt
```

**Check logs:**
```bash
tail -f /home/poaes/app/log/passenger.log
```

**Access app:**
```
http://poaes.cicte.link
```

Done! ✅
