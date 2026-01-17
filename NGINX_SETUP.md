# Nginx Setup Instructions

## Prerequisites
- Ubuntu/Debian server with sudo access
- Domain `poaes.cicte.link` pointing to your server's IP
- Application running on port 5000

## Installation Steps

### 1. Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Copy Configuration

```bash
sudo cp nginx.conf /etc/nginx/sites-available/poaes
```

### 3. Enable the Site

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/poaes /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default
```

### 4. Test Configuration

```bash
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Restart Nginx

```bash
sudo systemctl restart nginx
```

### 6. Enable Nginx to Start on Boot

```bash
sudo systemctl enable nginx
```

### 7. Check Status

```bash
sudo systemctl status nginx
```

### 8. Configure Firewall (if using UFW)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 22  # Make sure SSH is allowed
sudo ufw enable
```

## Verification

1. Make sure your Node.js app is running on port 5000:
   ```bash
   # Check if app is running
   curl http://localhost:5000/
   ```

2. Access your site without port number:
   ```
   http://poaes.cicte.link
   ```

## Troubleshooting

### Check Nginx Logs
```bash
# Access log
sudo tail -f /var/log/nginx/poaes_access.log

# Error log
sudo tail -f /var/log/nginx/poaes_error.log
```

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Test Configuration
```bash
sudo nginx -t
```

### Common Issues

**502 Bad Gateway:**
- Ensure your Node.js app is running on port 5000
- Check: `sudo netstat -tulpn | grep 5000`

**Permission Denied:**
- Check Nginx user has permission to access proxy
- Verify SELinux settings if applicable

**Configuration Errors:**
- Run `sudo nginx -t` to see specific errors
- Check syntax in `/etc/nginx/sites-available/poaes`

## Optional: SSL/HTTPS Setup with Let's Encrypt

Once HTTP is working, add HTTPS:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d poaes.cicte.link

# Certbot will automatically update your Nginx config
```

## Keeping Your App Running

Use PM2 to keep your Node.js app running:

```bash
# Install PM2 globally
npm install -g pm2

# Start your app
pm2 start npm --name "poaes-app" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```
