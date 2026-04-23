#!/bin/bash
set -e
cd /var/www/merxtax
echo '[DEPLOY] Pulling latest code...'
git pull origin main
echo '[DEPLOY] Installing dependencies...'
npm install --production=false
echo '[DEPLOY] Building...'
npm run build
echo '[DEPLOY] Restarting PM2...'
pm2 reload merxtax --update-env
echo '[DEPLOY] Done!'
