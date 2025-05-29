# Dicoding Story App - Advanced PWA

🚀 Progressive Web Application untuk berbagi cerita dengan komunitas Dicoding menggunakan foto dan lokasi.

## ✨ PWA Features

- 📱 **Installable**: Dapat diinstall pada desktop dan mobile
- 🔄 **Offline Support**: Bekerja offline dengan IndexedDB storage
- 🔔 **Push Notifications**: Notifikasi untuk cerita baru dan update app
- 🔄 **Background Sync**: Sinkronisasi otomatis saat kembali online
- ⚡ **App Shortcuts**: Akses cepat untuk menambah cerita baru
- 🎨 **Responsive Design**: Dioptimalkan untuk semua ukuran layar

## 🎯 Core Features

- 📸 Upload foto dengan kamera dan galeri
- 🗺️ Integrasi peta interaktif untuk menampilkan lokasi cerita
- 🔐 Sistem autentikasi pengguna (login/register)
- ⭐ Sistem favorit untuk menyimpan cerita pilihan
- 📱 Mobile-friendly responsive design
- ♿ Aksesibilitas sesuai standar web (skip to content, semantic HTML)
- ⚡ Single Page Application (SPA) dengan smooth transitions
- 🔄 Transisi halaman yang halus dengan View Transition API

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Architecture**: Model-View-Presenter (MVP)
- **PWA**: VitePWA plugin dengan Workbox
- **Build Tool**: Vite
- **Storage**: IndexedDB untuk persistence offline
- **Maps**: Leaflet.js untuk peta interaktif
- **API**: Dicoding Story API
- **Icons**: Font Awesome
- **Notifications**: Web Push API dengan VAPID keys

## 🚀 Cara Menjalankan Proyek

### Prerequisites

- Node.js (versi 16 atau lebih baru)
- NPM atau Yarn

### Langkah-langkah

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd story-app-copilot
   ```

2. **Install dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

3. **Jalankan development server**

   ```bash
   npm run dev
   ```

4. **Build untuk production**

   ```bash
   npm run build
   ```

5. **Preview production build**

   ```bash
   npm run preview
   ```

6. **Deploy**

   ```bash
   npm run deploy
   ```

## 🌐 Deployment

Aplikasi ini siap untuk dideploy ke berbagai platform static hosting:

### GitHub Pages

1. **Push ke GitHub repository**
2. **Enable GitHub Pages** di repository settings
3. **GitHub Actions** akan otomatis build dan deploy

### Netlify

1. **Connect repository** ke Netlify
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

## 🌐 Deployment

### GitHub Pages (Recommended)

1. **Setup GitHub repository**

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

2. **Enable GitHub Pages**

   - Go to repository Settings > Pages
   - Source: Deploy from a branch
   - Branch: gh-pages

3. **Deploy using script**
   ```powershell
   .\deploy.ps1
   ```

### Vercel

1. **Import repository** ke Vercel
2. **Framework preset**: Vite
3. **Build command**: `npm run build`
4. **Output directory**: `dist`

### Netlify

1. **Connect GitHub repository**
2. **Build command**: `npm run build`
3. **Publish directory**: `dist`

### Firebase Hosting

1. **Install Firebase CLI**: `npm install -g firebase-tools`
2. **Initialize**: `firebase init hosting`
3. **Build**: `npm run build`
4. **Deploy**: `firebase deploy`

## 🔧 Development

4. **Buka browser dan akses**
   ```
   http://localhost:5173
   ```

### Scripts yang Tersedia

- `npm run dev` - Menjalankan development server
- `npm run build` - Build proyek untuk production
- `npm run preview` - Preview build production
- `npm run serve` - Serve build production di port 3000

## Struktur Proyek

```
story-app-copilot/
├── public/
│   ├── icons/
│   │   └── app-icon.svg
│   └── manifest.json
├── src/
│   ├── models/
│   │   └── story-model.js
│   ├── views/
│   │   ├── home-view.js
│   │   ├── auth-view.js
│   │   ├── add-story-view.js
│   │   ├── story-detail-view.js
│   │   └── map-view.js
│   ├── presenters/
│   │   ├── home-presenter.js
│   │   ├── auth-presenter.js
│   │   ├── add-story-presenter.js
│   │   ├── story-detail-presenter.js
│   │   └── map-presenter.js
│   ├── scripts/
│   │   ├── app.js
│   │   └── notification-helper.js
│   └── styles/
│       └── style.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Penggunaan

1. **Login/Register**: Buat akun baru atau login dengan akun yang sudah ada
2. **Lihat Stories**: Browse cerita-cerita dari pengguna lain di halaman Home
3. **Tambah Story**: Klik "Add Story" untuk menambah cerita baru dengan foto dan lokasi
4. **Lihat Map**: Klik "Map" untuk melihat semua cerita di peta interaktif

## API

Aplikasi ini menggunakan [Dicoding Story API](https://story-api.dicoding.dev/v1) untuk:

- Autentikasi pengguna
- Mengambil daftar cerita
- Menambah cerita baru
- Mengambil detail cerita

## Fitur Aksesibilitas

- Skip to content link
- Semantic HTML elements
- Alt text untuk gambar
- Label yang tepat untuk form controls
- Keyboard navigation support

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Kontribusi

Silakan buat issue atau pull request jika ingin berkontribusi pada proyek ini.

## Lisensi

MIT License

- An internet connection for initial loading and API interactions

### Installation

1. Clone the repository or download the source code
2. Start a local web server in the project directory

   - Using Python: `python -m http.server 8080`
   - Using Node.js: `npx serve`

3. Open your browser and navigate to:
   - `http://localhost:8080`

## Using the App

1. **Register/Login**: Create a new account or use your existing credentials
2. **Browse Stories**: View stories shared by the community
3. **Add a Story**: Click "Add Story" to create your own story
   - Take a photo using your camera
   - Enter a description
   - Click on the map to add a location
4. **View on Map**: See all stories on the interactive map

## API Reference

This app uses the Dicoding Story API. Documentation can be found at:
[https://story-api.dicoding.dev/v1/](https://story-api.dicoding.dev/v1/)

## Technical Details

- Built with vanilla JavaScript without frameworks
- Uses the Model-View-Presenter (MVP) architectural pattern
- SPA (Single Page Application) with hash-based routing
- Leaflet.js for interactive maps
- Web Storage API for local data persistence
- Service Worker for offline capabilities
- View Transitions API for smooth page transitions

## License

This project is for educational purposes only.
