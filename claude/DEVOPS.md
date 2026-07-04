# DEVOPS.md — Phase 3: AWS VPS + Self-Hosted PostgreSQL

> **This file is for future reference only.**
> Do NOT act on this during Phase 1 or Phase 2.
> Come back to this when you have 50+ restaurants and want full control + cost savings.
>
> **Status check:** nothing in this file has been started. The app currently deploys to Vercel via GitHub Actions (see `CICD.md`) and runs entirely on Supabase Postgres (see `STACK.md`). No EC2/RDS/S3/Nginx/PM2 exists anywhere in this repo today — everything below is still purely a future plan.

---

## Why Move to AWS at Scale?

```
Supabase Pro: $25/month flat
AWS EC2 t3.small + RDS: ~$15-20/month
AWS EC2 t3.medium (self-hosted Postgres): ~$12/month

At 100 restaurants:
  Supabase Pro:        $25/month (same price)
  AWS self-hosted:     $20/month (you manage it)

Real benefit = CONTROL, not just cost
- Your data, your server
- No vendor limits
- Custom backups, custom scaling
- Learn DevOps skills you own forever
```

---

## The Migration Plan (When Ready)

```
Step 1: Spin up AWS EC2 instance
Step 2: Install PostgreSQL on EC2
Step 3: Export data from Supabase
Step 4: Import data into EC2 Postgres
Step 5: Update DATABASE_URL in .env
Step 6: Run prisma migrate deploy
Step 7: Test everything
Step 8: Point domain to new server
Step 9: Shut down Supabase
```

**Zero code changes.** Prisma abstracts the database entirely.

---

## AWS Services You Will Use

| Service | Purpose | Cost |
|---|---|---|
| EC2 t3.small | App server (if self-hosting Next.js) | ~$15/month |
| EC2 t3.micro | Postgres database server | ~$8/month |
| RDS PostgreSQL | Managed Postgres (easier than EC2) | ~$15-25/month |
| S3 | Store bill PDFs, receipt images | ~$1/month |
| Route 53 | DNS management | $0.50/month |
| ACM | Free SSL certificates | Free |
| CloudFront | CDN for static assets | ~$1/month |
| SES | Email sending (replace Resend) | $0.10/1000 emails |

---

## Option A — EC2 + Self-Hosted Postgres (Cheapest, Most Control)

### Step 1: Launch EC2 Instance

```bash
# In AWS Console:
# EC2 → Launch Instance
# AMI: Ubuntu 24.04 LTS
# Type: t3.small (2 vCPU, 2GB RAM) for DB
# Storage: 20GB gp3 SSD (expandable later)
# Security Group:
#   - Port 22 (SSH) — your IP only
#   - Port 5432 (Postgres) — app server IP only
#   - Port 80/443 (HTTP/HTTPS) — everywhere (if hosting app here too)
```

### Step 2: Install PostgreSQL on EC2

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -u postgres psql

# Inside psql:
CREATE DATABASE dineflow;
CREATE USER dineflow_user WITH ENCRYPTED PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE dineflow TO dineflow_user;
\q
```

### Step 3: Configure PostgreSQL for Remote Access

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf
# Change: listen_addresses = 'localhost'
# To:     listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Add this line (replace with your app server IP):
# host  dineflow  dineflow_user  YOUR_APP_SERVER_IP/32  scram-sha-256

# Restart postgres
sudo systemctl restart postgresql
```

### Step 4: Update Connection String

```env
# .env.local (production)
DATABASE_URL="postgresql://dineflow_user:your-password@your-ec2-ip:5432/dineflow?schema=public"
DIRECT_URL="postgresql://dineflow_user:your-password@your-ec2-ip:5432/dineflow?schema=public"
```

---

## Option B — AWS RDS PostgreSQL (Easier, Managed)

Better if you don't want to manage Postgres yourself but still want AWS.

```bash
# In AWS Console:
# RDS → Create Database
# Engine: PostgreSQL 16
# Template: Free tier (dev) or Production
# Instance: db.t3.micro (free tier) or db.t3.small
# Storage: 20GB gp2 (auto-scaling enabled)
# Enable: Multi-AZ (for production — extra cost)
# Enable: Automated backups (7 days retention)

# Get endpoint from RDS console:
DATABASE_URL="postgresql://postgres:password@your-rds-endpoint.rds.amazonaws.com:5432/dineflow"
```

RDS handles: backups, patches, failover, monitoring. You just use it.

---

## Backup Strategy (Self-Hosted)

```bash
# Automated daily backup script
# Save as: /home/ubuntu/backup-db.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/dineflow_$DATE.sql"

# Create backup
pg_dump -U dineflow_user -h localhost dineflow > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://your-bucket/db-backups/

# Delete local backups older than 7 days
find /backups -name "*.gz" -mtime +7 -delete

echo "Backup complete: $BACKUP_FILE.gz"
```

```bash
# Schedule with cron — runs at 2 AM every day
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## SSL Certificate (Free with Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate for your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

---

## Nginx Setup (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Config file: /etc/nginx/sites-available/dineflow
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Process Manager (Keep App Running)

```bash
# Install PM2
npm install -g pm2

# Start Next.js app
pm2 start npm --name "dineflow" -- start

# Save PM2 config (survives server restart)
pm2 save
pm2 startup

# Useful commands
pm2 status          # check if running
pm2 logs dineflow   # view logs
pm2 restart dineflow # restart app
pm2 monit           # live monitoring
```

---

## Monitoring Setup

```bash
# Install basic monitoring
# Option 1: PM2 built-in (free)
pm2 monit

# Option 2: Netdata (free, beautiful dashboard)
wget -O /tmp/netdata-kickstart.sh https://get.netdata.cloud/kickstart.sh
sudo sh /tmp/netdata-kickstart.sh

# Access at: http://your-server-ip:19999
```

---

## Complete AWS Cost Estimate at Scale

### 10-50 restaurants
```
EC2 t3.small (app):      $15/month
EC2 t3.micro (DB):        $8/month
S3 (backups + PDFs):      $2/month
Route 53:                 $1/month
Total:                   ~$26/month = ~₹2,200/month
```

### 50-200 restaurants
```
EC2 t3.medium (app):     $30/month
RDS db.t3.small (DB):    $25/month
S3:                       $5/month
CloudFront CDN:           $3/month
Total:                   ~$63/month = ~₹5,300/month
```

Compare: Supabase at this scale would be custom enterprise pricing.

---

## Migration Checklist (Supabase → AWS)

```
Before migration:
□ AWS account set up and billing alerts configured
□ EC2 or RDS instance running and tested
□ Postgres installed and accessible
□ Backup of Supabase data taken
□ New DATABASE_URL tested in staging environment

Migration steps:
□ Export from Supabase: pg_dump
□ Import to AWS: pg_restore
□ Update .env on Vercel/server
□ Run: prisma migrate deploy
□ Test all features in production
□ Monitor for 24 hours
□ Cancel Supabase subscription

Post migration:
□ Set up automated daily backups to S3
□ Set up monitoring (PM2 / Netdata)
□ Set up backup restore test (monthly)
□ Configure CloudWatch alerts (AWS)
```

---

## DevOps Learning Path (In Order)

When you're ready to do this yourself:

```
1. Linux basics (Ubuntu commands, file system, permissions)
   → Resource: linuxcommand.org (free)

2. SSH and server access
   → Practice: SSH into your EC2

3. PostgreSQL administration
   → Resource: postgresql.org/docs (free)

4. Nginx configuration
   → Resource: nginx.org/en/docs

5. SSL with Let's Encrypt
   → Resource: certbot.eff.org

6. PM2 process management
   → Resource: pm2.keymetrics.io/docs

7. AWS fundamentals
   → Resource: AWS free tier + AWS Skill Builder (free)

8. Backup and restore strategies
   → Practice: pg_dump, pg_restore, S3 sync

Timeline: 2-3 months of weekend learning gets you comfortable with all of this
```

---

## Important Notes

- **Never expose port 5432 (Postgres) to the internet** — only allow your app server IP
- **Always use strong passwords** — minimum 20 characters for DB password
- **Set AWS billing alerts** — set at $10, $25, $50 to avoid surprise bills
- **Enable MFA on AWS root account** — immediately after creating account
- **Keep EC2 security groups tight** — only open ports you actually need
- **Test backups** — a backup you've never tested is not a backup
