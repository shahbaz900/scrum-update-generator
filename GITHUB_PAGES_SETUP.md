# ⚠️ GitHub Pages Setup Required

## Quick Fix for Deployment Error

If you're seeing this error:
```
Error: Failed to create deployment (status: 404)
Ensure GitHub Pages has been enabled
```

### Solution (2 minutes)

1. **Go to Settings**
   - Navigate to: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/settings/pages`
   - Replace `YOUR_USERNAME` with your GitHub username
   - Replace `YOUR_REPO_NAME` with your repository name
   - Or: Repository → Settings → Pages

2. **Enable GitHub Pages**
   - Under "Source", select **GitHub Actions** from the dropdown
   - Click **Save**

3. **Trigger Deployment**
   - Go to Actions tab
   - Click "Deploy to GitHub Pages"
   - Click "Run workflow" → "Run workflow"

4. **Access Your Site**
   - After 2-3 minutes, visit: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
   - Replace `YOUR_USERNAME` with your GitHub username
   - Replace `YOUR_REPO_NAME` with your repository name (e.g., `scrum-update-generator`)

### Important Note

⚠️ **API Limitations**: This app has server-side API routes that **will not work** on GitHub Pages (static hosting only).

**For full functionality, use [Vercel deployment](./DEPLOYMENT.md#vercel-deployment) instead.**

---

📖 **Full Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.
