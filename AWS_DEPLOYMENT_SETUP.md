# 🚀 AWS Deployment Preparation Guide

This document walks through the recommended AWS architecture, prerequisite setup, and the step-by-step deployment flow for both the backend (`cloverSecurity-backend`) and frontend (`cloversecurity-frontend`). The goal is to get you production-ready without altering existing application code.

---

## 1. Target Architecture Overview

| Layer | AWS Service | Purpose |
| --- | --- | --- |
| Static Frontend | **S3 + CloudFront** | Host the Vite-built React bundle with global CDN caching and HTTPS termination |
| API Layer | **Elastic Beanstalk (Node.js platform)** *or* **ECS Fargate** | Run the Express/Sequelize server with auto-scaling & rolling deployments |
| Database | **Amazon RDS for PostgreSQL** | Managed PostgreSQL instance for production data |
| Secrets | **AWS Systems Manager Parameter Store** (SecureString) | Centralized environment variables (API keys, OAuth credentials) |
| Networking | **VPC** with public/private subnets | Separate concerns: ELB + CloudFront in public subnets, RDS and ECS/EB private |
| Observability | **CloudWatch Logs + Metrics** | Collect logs, alarms, and dashboards |
| Pipeline (optional) | **CodePipeline + CodeBuild** | Automate build & deployments from GitHub |

> ✅ **Recommendation**: Start with Elastic Beanstalk for the backend to simplify provisioning (managed EC2 autoscaling, integrated load balancer, environment config).

---

## 2. Prerequisites Checklist

- AWS account with administrative access (CLI configured locally)
- Registered production domain (can use Route 53 or external registrar)
- GitHub repository access token (for CI/CD integration)
- Docker installed locally (optional but useful for reproducible builds)
- Local `.env` files fully populated and tested (see existing `DEPLOYMENT_CHECKLIST.md`)

### AWS CLI & EB CLI Setup
```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure

# Install Elastic Beanstalk CLI
pip install awsebcli --upgrade --user
export PATH="$HOME/.local/bin:$PATH"
eb --version
```

---

## 3. Backend Deployment (Elastic Beanstalk)

### 3.1 One-Time Environment Provisioning
1. **Create RDS PostgreSQL**
   - Engine: PostgreSQL 14+
   - Instance: `db.t3.micro` (start small, enable autoscaling later)
   - Storage: 20GB gp3 (autoscaling on)
   - VPC: use existing or create new (multi-AZ recommended)
   - Security group: allow inbound from EB environment security group on port 5432
   - Apply parameter group with `max_connections`, `timezone=UTC`
   - Enable automated backups (7+ days)

2. **Store Secrets in Parameter Store**
   ```
   /myproject/prod/DB_HOST
   /myproject/prod/DB_NAME
   /myproject/prod/DB_USER
   /myproject/prod/DB_PASSWORD
   /myproject/prod/JWT_SECRET
   /myproject/prod/SESSION_SECRET
   /myproject/prod/GOOGLE_CLIENT_ID
   /myproject/prod/GOOGLE_CLIENT_SECRET
   /myproject/prod/GOOGLE_CALLBACK_URL
   /myproject/prod/GEMINI_API_KEY
   /myproject/prod/ZAP_API_KEY
   /myproject/prod/FRONTEND_URL (https://<your-domain>)
   ```
   - Use `SecureString` with KMS encryption

3. **Initialize Elastic Beanstalk Application**
   ```bash
   cd cloverSecurity-backend
   eb init --platform node.js --region ap-southeast-1  # choose region close to audience
   eb create securecheck-prod --single --elb-type application \
     --instance_type t3.small \
     --envvars NODE_ENV=production
   ```
   - `--single` for initial testing (can switch to load-balanced later)
   - Configure environment to use VPC private subnets (set during `eb create` or via console)

4. **Attach IAM Role Permissions**
   - EB instance profile needs access to Parameter Store (read) and CloudWatch logs
   - Add policies: `AmazonSSMReadOnlyAccess`, `CloudWatchAgentServerPolicy`

### 3.2 Deployment Process
1. **Build & Package**
   ```bash
   cd cloverSecurity-backend
   npm install
   npm test   # ensure all green
   eb deploy securecheck-prod
   ```
   EB automatically runs `npm install` on deploy; tests should be run pre-deploy.

2. **Run Database Migrations**
   ```bash
   eb ssh securecheck-prod
   cd /var/app/staging
   npx sequelize-cli db:migrate --env production
   exit
   ```
   - For zero-downtime, run via `eb ssh` or create an `.ebextensions/01_migrate.config` script.

3. **Configure Environment Variables (if not using Parameter Store)**
   - `eb setenv KEY=VALUE` for each var. Prefer Parameter Store + instance profile.

4. **Smoke Test**
   - Hit health check: `https://<eb-environment>.elasticbeanstalk.com/api/health`
   - Verify login flow from frontend once deployed (CORS must allow domain).

5. **Scaling & Health**
   - In EB console: set autoscaling min=2, max=4 (post-QA)
   - Configure CloudWatch alarms for CPU >70%, memory (via custom metrics)

---

## 4. Frontend Deployment (S3 + CloudFront)

### 4.1 Build Artifact
```bash
cd cloversecurity-frontend
npm install
npm run build
# Build output in dist/
```

### 4.2 S3 Bucket Setup
- Create S3 bucket: `myproject-frontend-prod`
- Enable static website hosting (even though CloudFront will be primary)
- Enable versioning and server-side encryption (SSE-S3)
- Block public access (CloudFront will serve content)

### 4.3 Upload Build
```bash
aws s3 sync dist/ s3://myproject-frontend-prod --delete --cache-control "max-age=31536000"
```
- For `index.html`, consider shorter cache: upload separately with `--cache-control "no-cache"`

### 4.4 CloudFront Distribution
- Origin: `myproject-frontend-prod.s3.amazonaws.com`
- Viewer protocol: redirect HTTP to HTTPS
- Default root object: `index.html`
- Add behavior to forward `index.html` for SPA routes (custom error response for 403/404 -> 200)
- Attach SSL certificate (ACM in `us-east-1`)
- Set custom domain `app.yourdomain.com`

### 4.5 Route 53 DNS
- Create `A` record (alias) pointing `app.yourdomain.com` to CloudFront distribution
- Propagation may take ~5 minutes

### 4.6 CORS & Environment Variable Adjustments
- Backend must add `app.yourdomain.com` to allowed origins
- Frontend `.env.production` should point to the EB load balancer domain or API gateway (e.g. `https://api.yourdomain.com/api`)

---

## 5. Continuous Deployment (Optional but Recommended)

### 5.1 GitHub Actions Workflow Skeleton
- Use CodeBuild/CodePipeline or GitHub Actions runner to deploy on tagged releases.
- Example flow:
  1. Run tests (`npm test` both backend & frontend)
  2. Build frontend; sync to S3
  3. Deploy backend via `eb deploy`

### 5.2 CodePipeline Alternative
- Source: GitHub (webhook)
- Build stage: CodeBuild project
  - Install dependencies, run tests
  - Trigger EB deploy via CLI
- Deploy stage (frontend): custom script to sync S3 + invalidate CloudFront cache

---

## 6. Production Readiness Tasks

- [ ] Update `config/config.json` production block to use `use_env_variable` and point to EB environment variable with RDS connection string.
- [ ] Harden Express headers (`helmet`, `cors` with strict origins, `rateLimit`).
- [ ] Configure logging (`winston`/`pino`) -> CloudWatch.
- [ ] Enable AWS WAF on CloudFront distribution for additional protection.
- [ ] Schedule automated RDS snapshots beyond default backup policy.
- [ ] Set up CloudWatch alarms for:
  - EB health status
  - RDS CPU/storage/burst credits
  - 5XX errors on ALB
- [ ] Configure CloudWatch log retention (e.g. 30 days).
- [ ] Document rollback plan (already in `DEPLOYMENT_CHECKLIST.md`).

---

## 7. Deployment Runbook (Summary)

1. **Prepare**
   - Confirm tests green: `npm test` (backend) + `npm run test` (frontend optional)
   - Build frontend: `npm run build`
   - Update env secrets in Parameter Store

2. **Deploy Backend**
   - `eb deploy securecheck-prod`
   - Run migrations
   - Verify `/api/health`

3. **Deploy Frontend**
   - `aws s3 sync dist/ s3://myproject-frontend-prod --delete`
   - `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`

4. **Verification**
   - Open `https://app.yourdomain.com`
   - Validate Google OAuth flow
   - Run smoke tests (create target, run scan, view dashboard)

5. **Post-Deploy**
   - Monitor CloudWatch dashboards for 30 minutes
   - Confirm error rate <1%
   - Update status page / stakeholders

---

## 8. Troubleshooting Cheatsheet

| Symptom | Check |
| --- | --- |
| EB deploy fails | `eb logs --stream` for detailed output |
| 5XX from API | Verify env vars loaded, DB reachable (`psql` test), migrations run |
| OAuth redirect mismatch | Update Google Console redirect URI to production domain |
| CORS errors | Add CloudFront domain to backend CORS whitelist & redeploy |
| RDS connection errors | Confirm SG rules between EB and RDS, check SSL requirements |
| Frontend 403 from S3 | Ensure CloudFront origin access or bucket policy allows CloudFront |

---

## 9. Reference Commands

```bash
# Parameter Store helper (store secret)
echo -n 'super-secret' | aws ssm put-parameter \
  --name /myproject/prod/JWT_SECRET \
  --value file:///dev/stdin \
  --type SecureString \
  --overwrite

# EB environment variables (fallback method)
eb setenv DB_HOST=... DB_NAME=... DB_USER=... DB_PASSWORD=... \
  JWT_SECRET=... SESSION_SECRET=... FRONTEND_URL=https://app.yourdomain.com

# Connect to RDS for manual inspection
psql "host=<rds-endpoint> dbname=Clover_security user=<user> password=<pwd>"

# CloudFront cache invalidation after deploy
aws cloudfront create-invalidation --distribution-id ABC123 --paths "/*"
```

---

## 10. Next Steps

- Translate this runbook into a shared README for your ops team.
- Automate the manual steps via CI/CD pipelines as soon as the first production deployment succeeds.
- Regularly update secrets rotation schedule (Google OAuth credentials, JWT/Session secrets, API keys).

> 🎯 **You are now ready to deploy the existing codebase to AWS without modifying application logic. Follow the runbook carefully, and keep an eye on CloudWatch metrics during the first rollout.**
