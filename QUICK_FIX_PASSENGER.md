# Quick Fix for Passenger 503 Error

> **Note:** Replace `poaes` with your username and `poaes.cicte.link` with your domain in the commands below.

Your app is configured with **Phusion Passenger**. Here's the 5-minute fix:

## Fix Steps

```bash
# 1. SSH into your server
ssh poaes@your-server

# 2. Navigate to public_html (NOT app directory!)
cd /home/poaes/domains/poaes.cicte.link/public_html

# 3. Update .htaccess
nano .htaccess
```

Replace contents with:

```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/poaes/app"
PassengerBaseURI "/"
PassengerNodejs "/home/poaes/nodevenv/app/20/bin/node"
PassengerAppType node
PassengerStartupFile server/index.ts
PassengerNodeAppStartCommand "node --loader tsx server/index.ts"
SetEnv NODE_ENV production
SetEnv PORT 5000
PassengerLogLevel 3
PassengerMinInstances 1
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
```

Save (Ctrl+X, Y, Enter)

```bash
# 4. Create tmp directory
cd /home/poaes/app
mkdir -p tmp
touch tmp/restart.txt

# 5. Install dependencies
npm install

# 6. Install tsx for TypeScript support
npm install tsx --save

# 7. Restart Passenger
touch tmp/restart.txt

# 8. Check logs
tail -f log/passenger.log
```

## Test

```bash
curl http://poaes.cicte.link/api/health
```

Expected: `{"status":"ok",...}`

## Still Not Working?

Check logs:
```bash
tail -f /home/poaes/app/log/passenger.log
tail -f /usr/local/lsws/logs/error.log
```

See full guide: [PASSENGER_SETUP.md](PASSENGER_SETUP.md)
