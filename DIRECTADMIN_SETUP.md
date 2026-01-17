# DirectAdmin + CloudLinux Setup Instructions

## Prerequisites
- DirectAdmin control panel access
- SSH access with sudo/root privileges
- Domain `poaes.cicte.link` added in DirectAdmin
- CloudLinux server

## Important DirectAdmin Notes

DirectAdmin uses a **two-tier proxy setup**:
- **Nginx** (port 80/443) → **Apache** (port 8080/8443)
- We'll configure Nginx to proxy directly to Node.js (port 5000)

## Setup Steps

### 1. Verify Your DirectAdmin Username

```bash
# Find your DirectAdmin username
ls /usr/local/directadmin/data/users/
```

Replace `USERNAME` in commands below with your actual username.

### 2. Add Domain in DirectAdmin (if not already added)

1. Log into DirectAdmin
2. Go to **Account Manager** → **Domain Setup**
3. Add `poaes.cicte.link` as a domain
4. Wait for DNS propagation

### 3. Create Custom Nginx Configuration

```bash
# SSH into your server as root or use sudo

# Replace USERNAME with your DirectAdmin username
USERNAME="your_username_here"

# Create custom Nginx config
sudo nano /usr/local/directadmin/data/users/$USERNAME/nginx_poaes.conf
```

Paste the contents from `nginx_directadmin.conf`, then:
- Replace `USERNAME` with your actual DirectAdmin username
- Save and exit (Ctrl+X, Y, Enter)

### 4. Update DirectAdmin Nginx Templates (Alternative Method)

If the above doesn't work, use DirectAdmin's custom templates:

```bash
# Create custom template directory if it doesn't exist
sudo mkdir -p /usr/local/directadmin/data/templates/custom

# Copy default Nginx template
sudo cp /usr/local/directadmin/data/templates/nginx_server.conf \
       /usr/local/directadmin/data/templates/custom/nginx_server.conf

# Edit the custom template
sudo nano /usr/local/directadmin/data/templates/custom/nginx_server.conf
```

Add this location block before the `location /` block:

```nginx
# Node.js App Proxy (add this BEFORE existing location / block)
location / {
    if ($host = poaes.cicte.link) {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        break;
    }
    # Rest of DirectAdmin config continues...
}
```

### 5. Include Custom Config in DirectAdmin

Edit the main nginx config to include custom configs:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside the `http` block:

```nginx
http {
    # ... existing config ...
    
    # Include custom configs
    include /usr/local/directadmin/data/users/*/nginx_*.conf;
    
    # ... rest of config ...
}
```

### 6. Test and Reload Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Or use DirectAdmin's command
sudo /usr/local/directadmin/custombuild/build rewrite_confs
```

### 7. Set Up Node.js App with PM2

```bash
# Navigate to your app directory
cd /home/USERNAME/domains/poaes.cicte.link/

# Install PM2 if not installed
npm install -g pm2

# Start your app
pm2 start npm --name "poaes-app" -- start

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the command it outputs
```

### 8. Configure Firewall (CSF/ConfigServer)

DirectAdmin often uses CSF firewall:

```bash
# Edit CSF config
sudo nano /etc/csf/csf.conf

# Ensure these ports are open in TCP_IN and TCP_OUT:
# 80,443,5000

# Restart CSF
sudo csf -r
```

## Method 2: Using DirectAdmin's Custom HTTPD Config

If Nginx approach doesn't work, use Apache ProxyPass:

### 1. Enable Apache Proxy Modules

```bash
# SSH as root
sudo yum install mod_proxy mod_proxy_http -y  # CloudLinux/CentOS
```

### 2. Create Custom Apache Config

```bash
USERNAME="your_username_here"
sudo nano /usr/local/directadmin/data/users/$USERNAME/httpd_poaes.conf
```

Add:

```apache
<VirtualHost *:8080>
    ServerName poaes.cicte.link
    
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5000/
    ProxyPassReverse / http://127.0.0.1:5000/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://127.0.0.1:5000/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://127.0.0.1:5000/$1 [P,L]
</VirtualHost>
```

### 3. Include in DirectAdmin Apache Config

```bash
# Edit user's httpd.conf
sudo nano /usr/local/directadmin/data/users/$USERNAME/httpd.conf
```

Add at the end:

```apache
Include /usr/local/directadmin/data/users/$USERNAME/httpd_poaes.conf
```

### 4. Restart Services

```bash
sudo systemctl restart httpd
sudo systemctl reload nginx
```

## Verification

### 1. Check if Node.js is Running

```bash
# Check port 5000
sudo netstat -tulpn | grep 5000
# Should show Node.js process

# Test locally
curl http://localhost:5000/api/health
```

### 2. Check Nginx

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### 3. Test External Access

```bash
curl http://poaes.cicte.link/api/health
```

Or visit in browser: `http://poaes.cicte.link`

## Troubleshooting

### 502 Bad Gateway

**Check if app is running:**
```bash
pm2 status
pm2 logs poaes-app
```

**Check Nginx can reach Node.js:**
```bash
curl http://127.0.0.1:5000/api/health
```

### 404 Not Found

**Check DirectAdmin Nginx config:**
```bash
sudo nginx -T | grep poaes
```

**Rebuild DirectAdmin configs:**
```bash
cd /usr/local/directadmin/custombuild
sudo ./build rewrite_confs
sudo systemctl reload nginx
```

### Permission Issues

**Fix ownership:**
```bash
USERNAME="your_username_here"
sudo chown -R $USERNAME:$USERNAME /home/$USERNAME/domains/poaes.cicte.link/
```

### SELinux Issues (CloudLinux)

If SELinux is blocking connections:

```bash
# Check SELinux status
getenforce

# Allow Nginx to proxy
sudo setsebool -P httpd_can_network_connect 1

# Or temporarily disable (not recommended for production)
sudo setenforce 0
```

### DirectAdmin Overwriting Configs

If DirectAdmin keeps overwriting your configs:

```bash
# Lock the file
sudo chattr +i /usr/local/directadmin/data/users/USERNAME/nginx_poaes.conf

# To unlock later:
sudo chattr -i /usr/local/directadmin/data/users/USERNAME/nginx_poaes.conf
```

## SSL/HTTPS Setup

Once HTTP works, add SSL through DirectAdmin:

1. Log into DirectAdmin
2. Go to **SSL Certificates**
3. Select `poaes.cicte.link`
4. Choose **Let's Encrypt** (free)
5. Click **Save**

DirectAdmin will automatically configure SSL for both Nginx and Apache.

## Keeping App Running After Reboot

```bash
# PM2 should auto-start with the startup script
pm2 startup
pm2 save

# Verify it's enabled
systemctl status pm2-USERNAME
```

## Alternative: Using DirectAdmin's Node.js Selector (if available)

Some DirectAdmin versions have Node.js support:

1. Log into DirectAdmin
2. Go to **Extra Features** → **Node.js Selector**
3. Select your Node.js version
4. Point to your app directory
5. Set startup command

This method handles proxying automatically.

## Notes

- **DirectAdmin** may reset configs during updates - use custom templates
- **CloudLinux** has CageFS which may restrict access - check CageFS settings
- Always backup configs before changes:
  ```bash
  sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
  ```
