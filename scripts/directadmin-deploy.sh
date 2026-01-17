#!/bin/bash

# DirectAdmin Deployment Helper Script
# Run as root or with sudo

echo "DirectAdmin Node.js Deployment Helper"
echo "======================================"
echo ""

# Get username
read -p "Enter your DirectAdmin username: " DA_USER

if [ -z "$DA_USER" ]; then
    echo "Error: Username cannot be empty"
    exit 1
fi

# Verify user exists
if [ ! -d "/usr/local/directadmin/data/users/$DA_USER" ]; then
    echo "Error: DirectAdmin user $DA_USER not found"
    exit 1
fi

echo ""
echo "Creating Nginx custom config..."

# Create nginx custom config
cat > "/usr/local/directadmin/data/users/$DA_USER/nginx_poaes.conf" << 'EOF'
upstream nodejs_poaes {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name poaes.cicte.link;

    client_max_body_size 10M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    access_log /var/log/nginx/domains/poaes.cicte.link.log;
    error_log /var/log/nginx/domains/poaes.cicte.link.error.log;

    location / {
        proxy_pass http://nodejs_poaes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://nodejs_poaes;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
EOF

echo "✓ Created /usr/local/directadmin/data/users/$DA_USER/nginx_poaes.conf"

echo ""
echo "Adding include to nginx.conf..."

# Check if include already exists
if grep -q "include /usr/local/directadmin/data/users/\*/nginx_\*.conf;" /etc/nginx/nginx.conf; then
    echo "✓ Include directive already exists"
else
    # Backup nginx.conf
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Add include inside http block
    sed -i '/^http {/a \    include /usr/local/directadmin/data/users/*/nginx_*.conf;' /etc/nginx/nginx.conf
    echo "✓ Added include directive to nginx.conf"
fi

echo ""
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx configuration is valid"
    echo ""
    echo "Reloading Nginx..."
    systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "✗ Nginx configuration test failed"
    echo "  Restoring backup..."
    cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
    exit 1
fi

echo ""
echo "================================================"
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your Node.js app is running on port 5000"
echo "2. Test: curl http://localhost:5000/api/health"
echo "3. Start with PM2: pm2 start npm --name poaes-app -- start"
echo "4. Visit: http://poaes.cicte.link"
echo "================================================"
