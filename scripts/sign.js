// node scripts/sign.js METHOD PATH TIMESTAMP BODY SECRET
const crypto = require('crypto');
const [,, method, path, ts, body, secret] = process.argv;
const msg = [method.toUpperCase(), path, ts, body || ''].join('\n');
const sig = crypto.createHmac('sha256', secret).update(msg).digest('hex');
console.log('sha256=' + sig);
