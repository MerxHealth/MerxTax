const http = require('http')
const crypto = require('crypto')
const { exec } = require('child_process')

const SECRET = 'merxtax-deploy-secret-2026'
const PORT = 9000

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    const sig = req.headers['x-hub-signature-256']
    const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex')

    if (sig !== expected) {
      console.log('[WEBHOOK] Invalid signature')
      res.writeHead(401)
      res.end('Unauthorized')
      return
    }

    const payload = JSON.parse(body)
    if (payload.ref !== 'refs/heads/main') {
      res.writeHead(200)
      res.end('Not main branch, skipping')
      return
    }

    console.log('[WEBHOOK] Deploy triggered by push to main')
    res.writeHead(200)
    res.end('Deploy started')

    exec('/var/www/merxtax/deploy.sh >> /var/log/merxtax-deploy.log 2>&1', (err) => {
      if (err) console.error('[WEBHOOK] Deploy error:', err)
      else console.log('[WEBHOOK] Deploy completed')
    })
  })
})

server.listen(PORT, () => {
  console.log(`[WEBHOOK] Server listening on port ${PORT}`)
})
