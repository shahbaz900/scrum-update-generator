# GitHub Actions Workflows

## Deploy to GitHub Pages

This workflow automatically deploys the app to GitHub Pages when code is pushed to the `main` branch.

### Prerequisites

Before this workflow can succeed, you **must** enable GitHub Pages:

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Click **Save**

### Workflow Triggers

- **Automatic**: Runs on every push to `main` branch
- **Manual**: Can be triggered from the Actions tab

### Workflow Steps

1. **Build Job**
   - Checks out code
   - Sets up Node.js 18
   - Installs dependencies with `npm ci`
   - Builds Next.js app with `npm run build`
   - Uploads build artifacts from `./out` directory

2. **Deploy Job**
   - Deploys the artifacts to GitHub Pages
   - Runs only after build job succeeds

### Important Notes

⚠️ **API Limitations**: This app has API routes (`/api/generate`, `/api/test-jira`) that require server-side execution. These will **not work** on GitHub Pages because it only serves static files.

**For full functionality, deploy to Vercel instead.**

### Troubleshooting

**Error: "Failed to create deployment (status: 404)"**
- **Cause**: GitHub Pages is not enabled in repository settings
- **Solution**: Follow the Prerequisites steps above

**Error: "Workflow failed during build"**
- Check the build logs in the Actions tab
- Ensure all dependencies are correctly specified in `package.json`
- Verify Next.js configuration in `next.config.js`

**Site loads but shows 404**
- Check that `basePath` in `next.config.js` matches repository name
- Verify `.nojekyll` file exists in `public` directory
- Wait 2-3 minutes for GitHub Pages to fully deploy

### Configuration Files

- **Workflow**: `.github/workflows/deploy.yml`
- **Next.js Config**: `next.config.js`
- **Jekyll Bypass**: `public/.nojekyll`

### More Information

See [DEPLOYMENT.md](../../DEPLOYMENT.md) for comprehensive deployment documentation.
