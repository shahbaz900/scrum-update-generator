# 🚀 Deployment Guide

This guide covers deploying the Scrum Update Generator to various platforms.

## 📋 Table of Contents

1. [GitHub Pages Deployment](#github-pages-deployment)
2. [Vercel Deployment](#vercel-deployment)
3. [Docker Deployment](#docker-deployment)

---

## 🌐 GitHub Pages Deployment

### Prerequisites

- GitHub repository with Actions enabled
- Node.js 18+

### Step 1: Enable GitHub Pages

Before the workflow can deploy, you **must** enable GitHub Pages in your repository settings:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages** (or visit `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/settings/pages`)
3. Under **Source**, select **GitHub Actions** from the dropdown
4. Click **Save**

> ⚠️ **Important**: The deployment workflow will fail with a 404 error if GitHub Pages is not enabled first!

### Step 2: Automatic Deployment

Once GitHub Pages is enabled, the deployment workflow will automatically run on every push to the `main` branch.

The workflow:
1. Builds the Next.js app as a static export
2. Uploads the build artifacts
3. Deploys to GitHub Pages

### Manual Deployment

You can also trigger a manual deployment:

1. Go to **Actions** → **Deploy to GitHub Pages**
2. Click **Run workflow** → **Run workflow**

### Configuration

The deployment is configured in:
- **Workflow**: `.github/workflows/deploy.yml`
- **Next.js Config**: `next.config.js`

Key settings in `next.config.js`:
```javascript
output: 'export',           // Static export for GitHub Pages
basePath: '/scrum-update-generator',  // Repository name as base path
trailingSlash: true,       // Required for GitHub Pages routing
images: { unoptimized: true }  // Required for static export
```

### Access Your Deployment

After successful deployment, your app will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

Replace:
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

### Troubleshooting GitHub Pages

**Error: "Failed to create deployment (status: 404)"**
- **Solution**: Enable GitHub Pages in repository settings (see Step 1 above)

**Error: "404 page not found" when accessing the site**
- Check that `basePath` in `next.config.js` matches your repository name
- Ensure `.nojekyll` file exists in the `public` directory
- Wait a few minutes for DNS propagation

**Error: "Assets not loading properly"**
- Verify `basePath` is set correctly
- Check that `output: 'export'` is set in `next.config.js`
- Ensure `images.unoptimized: true` is set

---

## ⚡ Vercel Deployment

Vercel is the **recommended platform** for this Next.js app (fastest and easiest).

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to link your project

4. Add environment variables in the Vercel dashboard:
   - `JIRA_URL`
   - `JIRA_EMAIL`
   - `JIRA_API_TOKEN`
   - `CLAUDE_API_KEY`

### Configuration

For Vercel deployment, update `next.config.js`:

```javascript
basePath: process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'production' 
  ? '/scrum-update-generator' 
  : '',
```

This ensures the base path is only used for GitHub Pages, not Vercel.

---

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t scrum-update-generator .

# Run the container
docker run -p 3000:3000 \
  -e JIRA_URL=https://your-domain.atlassian.net \
  -e JIRA_EMAIL=your-email@company.com \
  -e JIRA_API_TOKEN=your-jira-token \
  -e CLAUDE_API_KEY=your-claude-key \
  scrum-update-generator
```

### Dockerfile

Create a `Dockerfile` in the root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - JIRA_URL=${JIRA_URL}
      - JIRA_EMAIL=${JIRA_EMAIL}
      - JIRA_API_TOKEN=${JIRA_API_TOKEN}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

---

## 🔒 Environment Variables

All deployment platforms require these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `JIRA_URL` | Your Jira instance URL | `https://company.atlassian.net` |
| `JIRA_EMAIL` | Your Jira account email | `user@company.com` |
| `JIRA_API_TOKEN` | Jira API token | Get from [Atlassian](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `CLAUDE_API_KEY` | Anthropic Claude API key | Get from [Anthropic Console](https://console.anthropic.com/api_keys) |

---

## 📊 Deployment Comparison

| Platform | Speed | Cost | Complexity | API Support |
|----------|-------|------|------------|-------------|
| **Vercel** | ⚡⚡⚡ | Free tier | ⭐ Easy | ✅ Full |
| **GitHub Pages** | ⚡⚡ | Free | ⭐⭐ Medium | ❌ Static only* |
| **Docker** | ⚡ | Varies | ⭐⭐⭐ Complex | ✅ Full |

*GitHub Pages deployment note: This app has API routes (`/api/generate`) that require server-side execution. When deployed to GitHub Pages, these API routes will **not work** because GitHub Pages only serves static files. 

**For full functionality with API routes, use Vercel or Docker deployment.**

---

## 🆘 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review workflow logs in the Actions tab
3. Open an issue on GitHub
