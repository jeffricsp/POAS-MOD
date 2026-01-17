# Quick Setup Reference

## Identify Your Setup

Run this command to identify your web server:

```bash
# Check which web server is running
ps aux | grep -E 'httpd|nginx|lsws|litespeed'
```

**Results:**
- `lsws` or `litespeed` → LiteSpeed → See [LITESPEED_SETUP.md](LITESPEED_SETUP.md)
- `nginx` → Nginx → See [NGINX_SETUP.md](NGINX_SETUP.md)
- `httpd` or `apache` → Apache → See [DIRECTADMIN_SETUP.md](DIRECTADMIN_SETUP.md)

## Don't Have Server Access?

Use **Cloudflare Tunnel** → See [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md)

- ✅ No server config needed
- ✅ Works on shared hosting
- ✅ Free SSL included
- ✅ 5 minute setup

## Quick Cloudflare Setup

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
./cloudflared-linux-amd64 tunnel login
./cloudflared-linux-amd64 tunnel create poaes-app
./cloudflared-linux-amd64 tunnel route dns poaes-app poaes.cicte.link
# Create config file as shown in CLOUDFLARE_TUNNEL_SETUP.md
./cloudflared-linux-amd64 tunnel run poaes-app
```

Access at: `https://poaes.cicte.link` ✅
