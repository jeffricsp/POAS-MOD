# CloudFlare Tunnel Setup (No Server Config Required!)

**Best option for reseller/shared hosting** where you don't have sudo or LiteSpeed admin access.

## What is CloudFlare Tunnel?

CloudFlare Tunnel creates a secure connection from your server to CloudFlare's network, allowing you to expose your Node.js app without configuring web servers.

**Benefits:**
- ✅ No server configuration needed
- ✅ No open ports required
- ✅ Free SSL/HTTPS automatically
- ✅ DDoS protection included
- ✅ Works on ANY hosting (even restrictive shared hosting)
- ✅ Bypass LiteSpeed/Nginx/Apache entirely

## Prerequisites

- CloudFlare account (free)
- Your domain managed by CloudFlare DNS
- SSH access to your server
- Node.js app running on port 5000

## Step 1: Add Domain to CloudFlare

1. **Sign up at** [cloudflare.com](https://cloudflare.com) (free)
2. **Add your domain** `poaes.cicte.link`
3. **Update nameservers** at your domain registrar to CloudFlare's nameservers
4. **Wait for DNS propagation** (usually 5-10 minutes)

## Step 2: Download CloudFlared

```bash
# SSH into your server
cd ~

# Download cloudflared binary
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Make it executable
chmod +x cloudflared-linux-amd64

# Optional: Move to a bin directory (if you have access)
# or just run from current directory
```

## Step 3: Authenticate with CloudFlare

```bash
# Login to CloudFlare
./cloudflared-linux-amd64 tunnel login
```

This will:
1. Open a browser window
2. Ask you to log into CloudFlare
3. Select your domain
4. Download a certificate to `~/.cloudflared/cert.pem`

If browser doesn't open automatically, copy the URL shown and open it manually.

## Step 4: Create Tunnel

```bash
# Create a tunnel named "poaes-app"
./cloudflared-linux-amd64 tunnel create poaes-app
```

This creates a tunnel and saves credentials to:
`~/.cloudflared/<TUNNEL-ID>.json`

**Important:** Save the Tunnel ID shown (you'll need it)

## Step 5: Configure DNS

```bash
# Route your domain to the tunnel
./cloudflared-linux-amd64 tunnel route dns poaes-app poaes.cicte.link
```

This creates a CNAME record in CloudFlare DNS pointing to your tunnel.

## Step 6: Create Configuration File

```bash
# Create config directory if it doesn't exist
mkdir -p ~/.cloudflared

# Create config file
nano ~/.cloudflared/config.yml
```

Add this configuration (replace TUNNEL-ID with your actual tunnel ID):

```yaml
tunnel: TUNNEL-ID
credentials-file: /home/USERNAME/.cloudflared/TUNNEL-ID.json

ingress:
  - hostname: poaes.cicte.link
    service: http://localhost:5000
  - hostname: www.poaes.cicte.link
    service: http://localhost:5000
  - service: http_status:404
```

**Replace:**
- `TUNNEL-ID` with your actual tunnel ID (from Step 4)
- `USERNAME` with your actual username

Save and exit (Ctrl+X, Y, Enter)

## Step 7: Run the Tunnel

```bash
# Test run (foreground)
./cloudflared-linux-amd64 tunnel run poaes-app
```

You should see:
```
Registered tunnel connection
```

**Test in browser:** `https://poaes.cicte.link` (HTTPS automatically!)

## Step 8: Run Tunnel in Background

Stop the test run (Ctrl+C), then:

```bash
# Run in background
nohup ./cloudflared-linux-amd64 tunnel run poaes-app > ~/cloudflared.log 2>&1 &

# Check if running
ps aux | grep cloudflared

# Check logs
tail -f ~/cloudflared.log
```

## Step 9: Auto-Start on Reboot

Create a startup script:

```bash
# Create script
nano ~/start-tunnel.sh
```

Add:

```bash
#!/bin/bash
cd ~
nohup ./cloudflared-linux-amd64 tunnel run poaes-app > ~/cloudflared.log 2>&1 &
```

Save and make executable:

```bash
chmod +x ~/start-tunnel.sh
```

**Add to crontab:**

```bash
crontab -e
```

Add this line:

```
@reboot /home/USERNAME/start-tunnel.sh
```

Replace `USERNAME` with your actual username.

## Verification

1. **Check tunnel status:**
   ```bash
   ps aux | grep cloudflared
   ```

2. **Check logs:**
   ```bash
   tail -f ~/cloudflared.log
   ```

3. **Test in browser:**
   ```
   https://poaes.cicte.link
   ```

   ✅ Should load your app
   ✅ HTTPS automatically configured
   ✅ No :5000 in URL

## Managing the Tunnel

**Stop tunnel:**
```bash
pkill cloudflared
```

**Start tunnel:**
```bash
~/start-tunnel.sh
```

**View logs:**
```bash
tail -f ~/cloudflared.log
```

**List tunnels:**
```bash
./cloudflared-linux-amd64 tunnel list
```

**Delete tunnel:**
```bash
./cloudflared-linux-amd64 tunnel delete poaes-app
```

## Troubleshooting

### Tunnel Won't Start

**Check if cloudflared is already running:**
```bash
ps aux | grep cloudflared
pkill cloudflared  # Stop existing instance
~/start-tunnel.sh  # Start fresh
```

### DNS Not Resolving

**Check CloudFlare DNS:**
1. Log into CloudFlare dashboard
2. Go to DNS settings
3. Verify CNAME record exists for `poaes.cicte.link`
4. Should point to `<TUNNEL-ID>.cfargotunnel.com`

**Wait for propagation:**
```bash
dig poaes.cicte.link
# Should show CNAME record
```

### 502 Bad Gateway

**Node.js app not running:**
```bash
# Check if app is running on port 5000
curl http://localhost:5000/api/health

# Start app if needed
pm2 start npm --name poaes-app -- start
```

### Connection Errors

**Check config file path in error log:**
```bash
tail -f ~/cloudflared.log
```

Make sure paths in `~/.cloudflared/config.yml` are correct.

## Advantages Over LiteSpeed Config

**CloudFlare Tunnel:**
- ✅ No server configuration needed
- ✅ No sudo/root access required
- ✅ Works on shared/reseller hosting
- ✅ Free SSL/HTTPS
- ✅ DDoS protection
- ✅ Analytics dashboard
- ✅ Easier to manage

**LiteSpeed Config:**
- ⚠️ Requires server access
- ⚠️ May need support ticket
- ⚠️ More complex setup
- ✅ Slightly lower latency (direct connection)

## Multiple Environments

You can run different apps on subdomains:

```yaml
ingress:
  - hostname: app.poaes.cicte.link
    service: http://localhost:5000
  - hostname: api.poaes.cicte.link
    service: http://localhost:3000
  - hostname: poaes.cicte.link
    service: http://localhost:5000
  - service: http_status:404
```

## Cost

**CloudFlare Tunnel:** 100% FREE
- No bandwidth limits
- Unlimited requests
- Free SSL
- Free DDoS protection

## Next Steps

Once tunnel is working:
1. ✅ Configure SSL (automatic!)
2. ✅ Set up auto-restart with cron
3. ✅ Monitor logs
4. ✅ Enjoy your app on port 80/443!

## Summary

```bash
# One-time setup:
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
./cloudflared-linux-amd64 tunnel login
./cloudflared-linux-amd64 tunnel create poaes-app
./cloudflared-linux-amd64 tunnel route dns poaes-app poaes.cicte.link

# Create config file, then:
nohup ./cloudflared-linux-amd64 tunnel run poaes-app > ~/cloudflared.log 2>&1 &

# Done! Access at https://poaes.cicte.link
```
