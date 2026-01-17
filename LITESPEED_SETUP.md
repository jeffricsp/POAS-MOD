# LiteSpeed + DirectAdmin Configuration Guide

Your server uses **LiteSpeed Web Server** with DirectAdmin. This guide will help you configure LiteSpeed to proxy requests to your Node.js application.

## Prerequisites
- DirectAdmin control panel access
- SSH access to your server
- Node.js app running on port 5000
- Domain: poaes.cicte.link

## Understanding Your Setup

**LiteSpeed** is a high-performance web server (alternative to Apache/Nginx) that's integrated with DirectAdmin.

**Current Issue:**
LiteSpeed is trying to connect to a Unix socket but your Node.js app runs on port 5000. We need to configure LiteSpeed to proxy to it.

## Step 1: Verify Your Node.js App is Running

```bash
# SSH into your server

# Check if Node.js is running
ps aux | grep node

# Check if port 5000 is listening
netstat -tulpn | grep 5000
# or
ss -tulpn | grep 5000

# Test locally
curl http://localhost:5000/api/health
```

If your app is NOT running, start it:
```bash
cd /home/USERNAME/domains/poaes.cicte.link/private_html
# or wherever your app is located

# Install PM2 if not installed
npm install pm2 -g

# Start your app
pm2 start npm --name "poaes-app" -- start

# Make it auto-start on reboot
pm2 save
pm2 startup
```

## Step 2: Configure LiteSpeed Through DirectAdmin

### Method 1: DirectAdmin Web Terminal (Recommended)

1. **Log into DirectAdmin** at `https://your-server-ip:2222`

2. **Navigate to Domain Setup:**
   - Click "Domain Setup" or "Domain Management"
   - Find `poaes.cicte.link`
   - Click "Modify" or settings icon

3. **Look for one of these options:**
   - **"Custom HTTPD Configuration"**
   - **"Custom Apache Configuration"** (LiteSpeed uses Apache syntax)
   - **"Proxy Settings"**
   - **"External Application"**

### Method 2: Create .htaccess Proxy (Easiest)

```bash
# Navigate to your domain's public_html
cd /home/USERNAME/domains/poaes.cicte.link/public_html

# Create or edit .htaccess
nano .htaccess
```

Add this configuration:

```apache
# LiteSpeed Proxy Configuration for Node.js App

# Enable RewriteEngine
RewriteEngine On

# Proxy all requests to Node.js on port 5000
RewriteCond %{REQUEST_URI} !^/cgi-bin
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]

# Preserve original host header
ProxyPreserveHost On

# WebSocket support (if needed)
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://127.0.0.1:5000/$1" [P,L]

# Disable directory browsing
Options -Indexes

# Error handling
ErrorDocument 502 "Node.js application is not responding. Please check if it's running on port 5000."
ErrorDocument 503 "Node.js application is temporarily unavailable."
```

Save and exit (Ctrl+X, Y, Enter)

### Method 3: LiteSpeed External App Configuration

1. **SSH as your user** (not root)

2. **Create LiteSpeed context configuration:**

```bash
# Create .ls directory if it doesn't exist
mkdir -p ~/domains/poaes.cicte.link/.ls

# Create context configuration
cat > ~/domains/poaes.cicte.link/.ls/proxy.conf << 'EOF'
context / {
  type                    proxy
  handler                 127.0.0.1:5000
  addDefaultCharset       off
}
EOF
```

3. **Create .htaccess to enable it:**

```bash
cd ~/domains/poaes.cicte.link/public_html

cat > .htaccess << 'EOF'
# Enable LiteSpeed context

EOF
```

## Step 3: Test Configuration

1. **Restart LiteSpeed** (if you have access):
   ```bash
   # Try these commands (one should work):
   /usr/local/lsws/bin/lswsctrl restart
   # or through DirectAdmin
   ```

2. **Test locally:**
   ```bash
   curl http://localhost:5000/api/health
   curl http://poaes.cicte.link/api/health
   ```

3. **Test in browser:**
   ```
   http://poaes.cicte.link
   ```

## Step 4: Contact Support (If Above Doesn't Work)

If you don't have permission to restart LiteSpeed or modify configurations, contact your hosting provider with this message:

---

**Subject: Configure LiteSpeed to Proxy to Node.js Application**

Hello,

I need help configuring LiteSpeed Web Server to proxy requests for my domain `poaes.cicte.link` to my Node.js application running on `localhost:5000`.

**Current Issue:**
I'm getting 503 errors. The LiteSpeed logs show:
```
connection to [uds://...] error: Connection refused!
```

**What I Need:**
Please configure LiteSpeed to proxy HTTP/HTTPS requests from `poaes.cicte.link` to `http://127.0.0.1:5000`.

**My Setup:**
- Domain: poaes.cicte.link
- Node.js app running on: localhost:5000
- DirectAdmin account: [YOUR_USERNAME]

**Required Configuration:**
Either add a proxy context in LiteSpeed configuration or enable mod_proxy so my .htaccess file can proxy requests.

Thank you!

---

## Troubleshooting

### 503 Error Persists

**Check app status:**
```bash
pm2 status
pm2 logs poaes-app
```

**Restart your app:**
```bash
pm2 restart poaes-app
```

**Check if port 5000 is accessible:**
```bash
curl http://127.0.0.1:5000/api/health
```

### Permission Denied

**.htaccess not working?**
- LiteSpeed might need `AllowOverride All` enabled
- Contact hosting support to enable it

### Socket Connection Errors

**LiteSpeed is looking for Unix socket instead of TCP port:**

This happens when LiteSpeed is configured for PHP-FPM or similar. You need to:

1. Remove any existing socket configuration for your domain
2. Add TCP proxy configuration pointing to port 5000
3. Contact support if you can't access LiteSpeed admin

### Check LiteSpeed Admin Console

If you have access to LiteSpeed Admin (usually at `https://your-server-ip:7080`):

1. **Go to Virtual Hosts**
2. **Find your domain** (poaes.cicte.link)
3. **External App tab:**
   - Click "Add"
   - Name: `nodejs_app`
   - Type: `Proxy`
   - Address: `127.0.0.1:5000`
   - Max Connections: `50`
   - Save

4. **Context tab:**
   - Click "Add"
   - URI: `/`
   - Type: `Proxy`
   - Web Server: `[Web Server] nodejs_app`
   - Save

5. **Graceful Restart** LiteSpeed

## Alternative: Run App on Port 80 (Not Recommended)

**Only if proxy doesn't work** and you have no other option:

⚠️ **Warning:** Ports below 1024 require root privileges. This is NOT recommended.

Better to use Cloudflare Tunnel instead (see next section).

## Cloudflare Tunnel Alternative (Recommended)

If LiteSpeed configuration is too complex or you don't have access:

```bash
# Download Cloudflare tunnel
cd ~
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64

# Login to Cloudflare
./cloudflared-linux-amd64 tunnel login

# Create tunnel
./cloudflared-linux-amd64 tunnel create poaes-app

# Configure tunnel
./cloudflared-linux-amd64 tunnel route dns poaes-app poaes.cicte.link

# Run tunnel
./cloudflared-linux-amd64 tunnel --url http://localhost:5000 run poaes-app
```

This bypasses LiteSpeed completely and tunnels directly to your Node.js app through Cloudflare's network.

See `CLOUDFLARE_TUNNEL_SETUP.md` for detailed Cloudflare Tunnel setup.

## Verifying Success

Once configured correctly, you should see:

```bash
curl http://poaes.cicte.link/api/health
# Returns: {"status":"ok","timestamp":"..."}
```

And access your app at: `http://poaes.cicte.link` (no :5000 needed!)

## SSL/HTTPS Setup

Once HTTP works, enable SSL:

1. **Log into DirectAdmin**
2. **Go to SSL Certificates**
3. **Select your domain** (poaes.cicte.link)
4. **Choose "Let's Encrypt"**
5. **Click "Save"**

DirectAdmin + LiteSpeed will automatically configure HTTPS!

## Keep App Running

Use PM2 to keep your Node.js app running:

```bash
# Start app
pm2 start npm --name poaes-app -- start

# Auto-start on reboot
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs poaes-app

# Restart if needed
pm2 restart poaes-app
```

## Summary

**What we configured:**
- ✅ LiteSpeed proxy from port 80/443 → port 5000
- ✅ Node.js app runs on port 5000
- ✅ PM2 keeps app running
- ✅ Access via http://poaes.cicte.link

**If you get stuck:**
- Contact hosting support (template provided above)
- Or use Cloudflare Tunnel (no server config needed)
