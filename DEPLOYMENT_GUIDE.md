# 🚀 AkademiHub Deployment Guide

Production'a deploy etmek için bu adımları takip edin.

## 📋 Ön Koşullar

- [ ] GitHub account
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Supabase project (free account)
- [ ] OpenAI API key
- [ ] Resend account (for email)
- [ ] Twilio account (for SMS)

## 🔧 Step 1: Environment Setup

### Local Testing
```bash
# Copy template
cp .env.example .env.local

# Fill in your values
nano .env.local

# Install & run
npm install
npm run dev

# Visit http://localhost:3000
```

### Test Build
```bash
npm run build
npm start
```

## 🌐 Step 2: Deploy to Vercel (Recommended)

Vercel, Next.js'in yaratıcıları tarafından yapılmıştır.

### 2.1 Connect GitHub
1. GitHub'da push et: `git push origin main`
2. [vercel.com](https://vercel.com)'e git
3. "Import Project" tıkla
4. GitHub repository'ni seç
5. "Import" tıkla

### 2.2 Environment Variables
Vercel dashboard'da:
1. Settings → Environment Variables
2. Aşağıdaki variablları ekle:

```
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

### 2.3 Deploy
```bash
vercel deploy --prod
```

**Your App URL:** `https://akademihub.vercel.app` (example)

## 🚂 Step 3: Deploy to Railway (Alternative)

Railway, Docker destekli hosting.

### 3.1 Install CLI
```bash
npm install -g @railway/cli
railway login
```

### 3.2 Initialize
```bash
railway init
# Select "Node.js"
# Select "Express.js" → "Other"
```

### 3.3 Environment Variables
```bash
railway variables add OPENAI_API_KEY=sk-...
railway variables add SUPABASE_SERVICE_ROLE_KEY=...
railway variables add RESEND_API_KEY=...
railway variables add TWILIO_ACCOUNT_SID=...
railway variables add TWILIO_AUTH_TOKEN=...
railway variables add TWILIO_PHONE_NUMBER=...
```

### 3.4 Deploy
```bash
railway up
```

**Your App URL:** `https://akademihub-production.up.railway.app` (example)

## 🐳 Step 4: Self-Hosted with Docker

### 4.1 Create Dockerfile (already exists)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 4.2 Build & Run
```bash
docker build -t akademihub:latest .
docker run -p 3000:3000 -e NODE_ENV=production akademihub:latest
```

### 4.3 Docker Compose (recommended)
```bash
docker-compose up -d
```

## ✅ Post-Deployment Checks

### Test All Routes
```bash
# Make these requests to your production URL
curl https://yourdomain.com/
curl https://yourdomain.com/finance
curl https://yourdomain.com/students
curl https://yourdomain.com/api/chat
```

### Test Integrations

**Email (Resend):**
```bash
curl -X POST https://yourdomain.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "body": "Test email"
  }'
```

**SMS (Twilio):**
```bash
curl -X POST https://yourdomain.com/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+905551234567",
    "body": "Test SMS"
  }'
```

**AI Chat (OpenAI):**
```bash
curl -X POST https://yourdomain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Selamlar!"
  }'
```

### Monitor Logs
- **Vercel:** Dashboard → Deployments → View Logs
- **Railway:** `railway logs`
- **Self-hosted:** `docker logs akademihub`

## 🔐 Security Checklist

Before going live:

- [ ] All secrets in environment variables (NOT in code)
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] CORS configured correctly
- [ ] Database backups scheduled
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] Error pages don't leak sensitive info
- [ ] Admin routes password protected

## 📊 Monitoring & Maintenance

### Set Up Alerts
- Vercel: Settings → Monitor → Alerts
- Railway: Projects → Alerts

### Check Performance
- Vercel Analytics: https://vercel.com/analytics
- Lighthouse: https://pagespeed.web.dev/

### Update Dependencies
```bash
npm update
npm audit
npm audit fix
```

### Backup Database
```bash
# Supabase automatic backups (free tier: 7 days)
# To manual backup:
pg_dump $DATABASE_URL > backup.sql
```

## 🆘 Troubleshooting

### "Build failed"
```bash
npm run build
```

### "Environment variable missing"
Check Vercel/Railway dashboard settings.

### "Database connection refused"
- Verify DATABASE_URL
- Check Supabase is online
- Verify network access

### "Email not sending"
- Verify RESEND_API_KEY
- Check email format
- Look at Resend dashboard for errors

### "SMS not sending"
- Verify TWILIO_ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER
- Check number format (+90...)
- Look at Twilio console

## 📈 Scaling

As traffic grows:

1. **Vercel:**
   - Automatic scaling (serverless)
   - Increase function size if needed

2. **Railway:**
   - Upgrade plan
   - Add replicas
   - Enable auto-scaling

3. **Database:**
   - Supabase Pro plan (for higher limits)
   - Index optimization
   - Query optimization

## 🎓 Next Steps

After deployment:

1. ✅ Create admin user
2. ✅ Import sample data
3. ✅ Configure email templates
4. ✅ Set up SMS templates
5. ✅ Create backup schedule
6. ✅ Configure monitoring
7. ✅ Set up CI/CD pipeline
8. ✅ Plan security audit

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs

---

**Deployment Status:** ✅ Production Ready  
**Last Updated:** 2024-10-20
