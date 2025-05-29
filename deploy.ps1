# PowerShell deployment script for GitHub Pages
# This script helps deploy the PWA to GitHub Pages

Write-Host "🚀 Dicoding Story App PWA Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git repository not found. Please initialize git first:" -ForegroundColor Red
    Write-Host "   git init" -ForegroundColor Yellow
    Write-Host "   git add ." -ForegroundColor Yellow
    Write-Host "   git commit -m 'Initial commit'" -ForegroundColor Yellow
    exit 1
}

# Check if we have a remote
$remotes = git remote
if (-not $remotes) {
    Write-Host "📝 No remote repository configured." -ForegroundColor Yellow
    Write-Host "Please follow these steps:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Create a new repository on GitHub" -ForegroundColor Green
    Write-Host "2. Add the remote:" -ForegroundColor Green
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Yellow
    Write-Host "3. Push to GitHub:" -ForegroundColor Green
    Write-Host "   git branch -M main" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4. Enable GitHub Pages in repository settings:" -ForegroundColor Green
    Write-Host "   - Go to Settings > Pages" -ForegroundColor Yellow
    Write-Host "   - Source: Deploy from a branch" -ForegroundColor Yellow
    Write-Host "   - Branch: gh-pages" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "5. Run this script again after setting up the remote" -ForegroundColor Green
    exit 1
}

Write-Host "✅ Git repository configured" -ForegroundColor Green

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Check if gh-pages branch exists
$branches = git branch -a
if ($branches -match "gh-pages") {
    Write-Host "🌿 gh-pages branch found" -ForegroundColor Green
} else {
    Write-Host "🌿 Creating gh-pages branch..." -ForegroundColor Cyan
    git checkout --orphan gh-pages
    git rm -rf .
    git commit --allow-empty -m "Initial gh-pages commit"
    git checkout master
}

# Deploy to gh-pages
Write-Host "🚀 Deploying to GitHub Pages..." -ForegroundColor Cyan

# Copy dist contents to gh-pages branch
git checkout gh-pages
Copy-Item -Path "dist\*" -Destination "." -Recurse -Force
git add .
git commit -m "Deploy PWA to GitHub Pages - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin gh-pages

# Return to main branch
git checkout master

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "Your PWA will be available at:" -ForegroundColor Cyan
$remote_url = git remote get-url origin
$repo_path = $remote_url -replace "https://github.com/", "" -replace ".git", ""
Write-Host "https://$($repo_path.Split('/')[0]).github.io/$($repo_path.Split('/')[1])/" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor White
Write-Host "1. Wait 5-10 minutes for GitHub Pages to update" -ForegroundColor Green
Write-Host "2. Visit your deployment URL" -ForegroundColor Green
Write-Host "3. Test PWA features (install, offline, notifications)" -ForegroundColor Green
Write-Host "4. Update STUDENT.txt with the deployment URL" -ForegroundColor Green
