# 🚀 PWA Deployment Guide

This guide will help you deploy the Dicoding Story App PWA to GitHub Pages.

## Prerequisites

- Git installed and configured
- Node.js and npm installed
- GitHub account

## Quick Deployment Steps

### 1. Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it something like `dicoding-story-app-pwa`
3. Keep it public for GitHub Pages to work
4. Don't initialize with README (we already have one)

### 2. Connect Local Repository to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select "Deploy from a branch"
5. Select **gh-pages** branch (will be created automatically)
6. Click **Save**

### 4. Deploy Using PowerShell Script

Run the automated deployment script:

```powershell
.\deploy.ps1
```

Or deploy manually:

```bash
# Build the application
npm run build

# Create and switch to gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
git commit --allow-empty -m "Initial gh-pages commit"
git checkout main

# Deploy
git checkout gh-pages
cp -r dist/* .
git add .
git commit -m "Deploy PWA"
git push origin gh-pages
git checkout main
```

### 5. Access Your PWA

Your PWA will be available at:

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## Alternative Deployment Platforms

### Netlify

1. Go to [Netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy

### Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect Vite configuration
4. Deploy

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

## Testing Your Deployed PWA

Once deployed, test these features:

### ✅ PWA Installation

- Visit your deployed URL
- Look for browser install prompt
- Install the app
- Verify it appears in your apps list

### ✅ Offline Functionality

- Open the PWA
- Disconnect internet
- Navigate between pages
- Verify offline page appears when needed

### ✅ Push Notifications

- Register/login to the app
- Grant notification permissions
- Create a new story
- Verify you receive a notification

### ✅ Responsive Design

- Test on desktop and mobile
- Verify all features work on both

## Troubleshooting

### GitHub Pages Not Working

- Ensure repository is public
- Check that gh-pages branch exists
- Verify GitHub Pages is enabled in settings
- Wait 5-10 minutes for changes to propagate

### PWA Not Installing

- Ensure you're using HTTPS (GitHub Pages uses HTTPS)
- Check browser console for service worker errors
- Verify manifest.json is accessible

### Notifications Not Working

- Ensure you're using HTTPS
- Check notification permissions in browser
- Verify VAPID key is correct in notification-helper-new.js

## Update STUDENT.txt

After successful deployment, update your STUDENT.txt file with:

```
Deployment URL: https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify all files are properly built in dist/
3. Ensure GitHub Pages is properly configured
4. Test locally first with `npm run preview`
