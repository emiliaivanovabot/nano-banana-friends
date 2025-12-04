# 🚀 CI/CD Pipeline Setup Guide

This guide will help you complete the setup of your comprehensive CI/CD pipeline for the nano-banana-friends project.

## 📋 Table of Contents
- [Repository Configuration](#-repository-configuration)
- [Environment Setup](#-environment-setup)
- [Branch Protection Rules](#-branch-protection-rules)
- [Secrets Configuration](#-secrets-configuration)
- [Vercel Integration](#-vercel-integration)
- [Testing the Pipeline](#-testing-the-pipeline)
- [Monitoring and Maintenance](#-monitoring-and-maintenance)

## 🔧 Repository Configuration

### 1. Enable GitHub Actions
1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Navigate to **Actions** > **General**
4. Under "Actions permissions", select **Allow all actions and reusable workflows**
5. Under "Workflow permissions", select **Read and write permissions**
6. Check **Allow GitHub Actions to create and approve pull requests**

### 2. Enable Dependabot
1. In repository **Settings**
2. Navigate to **Security & analysis**
3. Enable **Dependabot alerts**
4. Enable **Dependabot security updates**
5. The `.github/dependabot.yml` file will automatically configure version updates

## 🛡️ Branch Protection Rules

### Main Branch Protection
Set up these rules for the `main` branch:

1. Go to **Settings** > **Branches**
2. Click **Add rule** for `main` branch
3. Configure the following settings:

#### Required Settings:
```
✅ Restrict pushes that create files larger than 100MB
✅ Require a pull request before merging
  ├── ✅ Require approvals (1 minimum)
  ├── ✅ Dismiss stale PR approvals when new commits are pushed  
  └── ✅ Require review from code owners
  
✅ Require status checks to pass before merging
  ├── ✅ Require branches to be up to date before merging
  └── Required status checks:
      ├── 🔍 Quality Checks
      ├── 🏗️ Build & Test (20)
      ├── 🔍 Dependency Security Scan
      ├── 🔒 Code Security Analysis
      └── ⚡ Performance Test
      
✅ Require conversation resolution before merging
✅ Include administrators (recommended)
```

#### Advanced Settings:
```
✅ Allow force pushes (for emergency fixes only)
✅ Allow deletions (be cautious)
```

### Development Branch (Optional)
If you use a `develop` branch:
- Same rules as main but with fewer required reviewers
- Allow force pushes for development workflow

## 🔐 Secrets Configuration

Add these secrets in **Settings** > **Secrets and variables** > **Actions**:

### Required Secrets:
```bash
# Vercel Integration (get from Vercel dashboard)
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here  
VERCEL_PROJECT_ID=your_project_id_here

# Optional: Custom deployment notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

### How to Get Vercel Secrets:
1. **VERCEL_TOKEN**: 
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Create a new token with appropriate scope
   
2. **VERCEL_ORG_ID & VERCEL_PROJECT_ID**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   vercel link
   
   # Get project info
   vercel project ls
   ```

## 🚀 Vercel Integration

### Automatic Setup
The deployment workflow will automatically:
- Deploy to preview on every push to `main`
- Allow manual production deployments
- Run health checks after deployment
- Provide rollback capabilities

### Manual Vercel Setup (Alternative)
If you prefer manual Vercel setup:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from local:**
   ```bash
   # First time setup
   vercel
   
   # Subsequent deployments
   vercel --prod
   ```

3. **Environment Variables in Vercel:**
   - Add your environment variables in Vercel dashboard
   - Ensure they match your local `.env` file requirements

### Environment Variables for Vercel:
```bash
# Add these in Vercel Dashboard > Settings > Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Add any other environment variables your app needs
```

## 🧪 Testing the Pipeline

### 1. Test CI Pipeline
Create a simple test PR:

```bash
# Create a test branch
git checkout -b test/ci-pipeline

# Make a small change
echo "// Testing CI pipeline" >> src/App.jsx

# Commit and push
git add .
git commit -m "test: CI pipeline validation"
git push origin test/ci-pipeline
```

Create a PR and verify:
- ✅ All CI checks pass
- ✅ Security scans complete
- ✅ Build artifacts are created
- ✅ Quality gates work correctly

### 2. Test Deployment
Merge the test PR to `main` and verify:
- ✅ Automatic preview deployment
- ✅ Health checks pass
- ✅ Preview URL is accessible
- ✅ Application works correctly

### 3. Test Dependabot
Dependabot will automatically:
- Create PRs for dependency updates
- Run all CI checks on dependency PRs
- Auto-merge safe updates (patch/dev dependencies)
- Request manual review for major updates

## 📊 Monitoring and Maintenance

### GitHub Actions Monitoring
- Monitor workflow runs in **Actions** tab
- Set up notifications for failed builds
- Review security scan reports regularly

### Performance Monitoring
- Check build times and optimize if needed
- Monitor bundle size changes
- Review dependency update frequency

### Security Monitoring
- Review Dependabot alerts weekly
- Check security scan results
- Update secrets and tokens regularly

### Regular Maintenance Tasks

#### Weekly:
- [ ] Review failed builds and fix issues
- [ ] Check Dependabot PRs and merge safe updates
- [ ] Monitor application performance

#### Monthly:
- [ ] Review and update security policies
- [ ] Audit environment variables and secrets
- [ ] Update CI/CD configurations if needed
- [ ] Review branch protection rules

#### Quarterly:
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] CI/CD pipeline efficiency analysis
- [ ] Backup and disaster recovery testing

## 🛠️ Troubleshooting

### Common Issues and Solutions:

#### 1. CI Checks Failing
```bash
# Check specific workflow logs
# Common issues:
- Node version mismatch
- Missing dependencies  
- Environment variable issues
- Build configuration problems
```

#### 2. Deployment Failures
```bash
# Check Vercel deployment logs
# Common issues:
- Environment variables not set
- Build command issues
- Output directory mismatch
- Domain configuration problems
```

#### 3. Security Scan Issues
```bash
# Common issues:
- Vulnerable dependencies (run npm audit fix)
- Secrets in code (move to environment variables)
- Insecure coding practices
```

#### 4. Dependabot Issues
```bash
# Common issues:
- Merge conflicts in dependency updates
- Breaking changes in major updates
- CI failures on dependency PRs
```

## 📞 Support and Resources

### Documentation Links:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)

### Pipeline Components:
- **Main CI/CD**: `.github/workflows/ci.yml`
- **Deployment**: `.github/workflows/deploy.yml`
- **Security**: `.github/workflows/security.yml`  
- **Dependabot**: `.github/dependabot.yml`
- **Auto-merge**: `.github/workflows/dependabot-auto-merge.yml`

### Getting Help:
1. Check workflow logs in GitHub Actions
2. Review this setup guide
3. Check documentation links above
4. Create an issue in the repository for persistent problems

---

**🎉 Congratulations!** Your nano-banana-friends project now has a production-ready CI/CD pipeline with:
- Automated testing and quality checks
- Security scanning and vulnerability management
- Automatic dependency updates with smart merging
- Bulletproof deployment to Vercel with rollback capabilities
- Comprehensive monitoring and alerting

The pipeline is designed to scale with your team and maintain high code quality while minimizing manual intervention.