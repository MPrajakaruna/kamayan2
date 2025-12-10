# KAMAYAN POS Print Server

Production-ready print server for sending print jobs directly to network printers.

## Features

- ✅ Direct network printing to thermal printers (ESC/POS)
- ✅ RESTful API
- ✅ CORS support
- ✅ Error handling and logging
- ✅ Health check endpoint
- ✅ Production-ready configuration
- ✅ Graceful shutdown
- ✅ Environment-based configuration

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### 3. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Or use PM2:
```bash
pm2 start index.js --name kamayan-print-server
pm2 save
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "message": "Print server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### API Info
```
GET /api/info
```

Response:
```json
{
  "name": "KAMAYAN POS Print Server",
  "version": "1.0.0",
  "environment": "production",
  "endpoints": {
    "health": "/health",
    "info": "/api/info",
    "print": "/api/print"
  }
}
```

### Print Job
```
POST /api/print
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "port": 9100,
  "data": [27, 64, ...] // Array of bytes (ESC/POS commands)
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Print job sent successfully"
}
```

Response (Error):
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Deployment Options

### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start index.js --name kamayan-print-server

# Save configuration
pm2 save

# Setup auto-start
pm2 startup
```

### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "index.js"]
```

Build and run:
```bash
docker build -t kamayan-print-server .
docker run -d -p 3001:3001 --name print-server kamayan-print-server
```

### Option 3: Systemd Service (Linux)

Create `/etc/systemd/system/kamayan-print.service`:
```ini
[Unit]
Description=KAMAYAN POS Print Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable kamayan-print
sudo systemctl start kamayan-print
```

### Option 4: Cloud Platforms

#### Heroku
```bash
heroku create kamayan-print-server
git push heroku main
```

#### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy

#### Render
1. Create new Web Service
2. Connect repository
3. Set build command: `npm install`
4. Set start command: `node index.js`

#### DigitalOcean App Platform
1. Create new app
2. Connect repository
3. Configure build/run commands
4. Set environment variables

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` |

## Security

### Enable API Key Authentication

Edit `server/index.js` and add:

```javascript
const API_KEY = process.env.API_KEY;

// Add middleware before print endpoint
app.post('/api/print', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (API_KEY && apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, /* ... existing print handler ... */);
```

Then set `API_KEY` in `.env` file.

### Firewall Configuration

Allow port 3001:
```bash
# Ubuntu/Debian
sudo ufw allow 3001/tcp

# CentOS/RHEL
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
```

### Logs
```bash
# PM2 logs
pm2 logs kamayan-print-server

# Systemd logs
sudo journalctl -u kamayan-print -f
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process or change PORT in .env
```

### Printer Not Printing
1. Verify printer IP is correct
2. Check printer is online: `ping printer-ip`
3. Verify firewall allows port 9100
4. Check server logs for errors

### CORS Issues
1. Update `ALLOWED_ORIGINS` in `.env`
2. Include your POS domain
3. Restart server

## Testing

Test health endpoint:
```bash
curl http://localhost:3001/health
```

Test print endpoint:
```bash
curl -X POST http://localhost:3001/api/print \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "port": 9100,
    "data": [27, 64, 72, 101, 108, 108, 111, 10]
  }'
```

## License

MIT

