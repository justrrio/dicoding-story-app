// Import Models
import StoryModel from "../models/story-model.js";

// Import Views
import HomeView from "../views/home-view.js";
import StoryDetailView from "../views/story-detail-view.js";
import AddStoryView from "../views/add-story-view.js";
import AuthView from "../views/auth-view.js";
import MapView from "../views/map-view.js";
import FavoritesView from "../views/favorites-view.js";
import NotFoundView from "../views/not-found-view.js";

// Import Helpers
import NotificationHelper from "./notification-helper-new.js";
import { IndexedDBHelper } from "./indexeddb-helper.js";

// Import PWA utilities
import { registerSW } from "virtual:pwa-register";

// Import Presenters
import HomePresenter from "../presenters/home-presenter.js";
import StoryDetailPresenter from "../presenters/story-detail-presenter.js";
import AddStoryPresenter from "../presenters/add-story-presenter.js";
import AuthPresenter from "../presenters/auth-presenter.js";
import MapPresenter from "../presenters/map-presenter.js";
import FavoritesPresenter from "../presenters/favorites-presenter.js";

class App {
  constructor() {
    // Initialize the model
    this.model = new StoryModel();

    // Initialize helpers
    this.notificationHelper = new NotificationHelper();
    this.dbHelper = new IndexedDBHelper(); // Initialize views
    this.homeView = new HomeView();
    this.storyDetailView = new StoryDetailView();
    this.addStoryView = new AddStoryView();
    this.authView = new AuthView();
    this.mapView = new MapView();
    this.favoritesView = new FavoritesView();
    this.notFoundView = new NotFoundView();

    // Initialize presenters
    this.homePresenter = new HomePresenter({
      view: this.homeView,
      model: this.model,
    });

    this.storyDetailPresenter = new StoryDetailPresenter({
      view: this.storyDetailView,
      model: this.model,
    });

    this.addStoryPresenter = new AddStoryPresenter({
      view: this.addStoryView,
      model: this.model,
    });

    this.authPresenter = new AuthPresenter({
      view: this.authView,
      model: this.model,
    });
    this.mapPresenter = new MapPresenter({
      view: this.mapView,
      model: this.model,
    });

    this.favoritesPresenter = new FavoritesPresenter({
      view: this.favoritesView,
      model: this.model,
    });

    // Add event listener for URL hash changes
    window.addEventListener("hashchange", () => {
      this.urlRouting();
    });

    // Add event listener for user login to initialize notifications
    document.addEventListener("user:loggedIn", async () => {
      console.log("User logged in, initializing notifications...");
      try {
        await this.notificationHelper.init();
        console.log("Notifications initialized after login");
      } catch (error) {
        console.warn("Failed to initialize notifications after login:", error);
      }
    });

    // Initialize PWA features
    this.initPWA();

    // Add online/offline event listeners
    this.setupOnlineOfflineListeners();

    // Call routing function to handle initial URL
    this.urlRouting();

    // Update navbar based on auth status
    this.updateNavbar();
  }
  urlRouting() {
    // Prevent multiple routing operations from running simultaneously
    if (this.isRouting) {
      console.log("Routing already in progress, skipping");
      return;
    }

    this.isRouting = true;

    // Use View Transition API for smooth page transitions if supported
    if (document.startViewTransition) {
      try {
        document.startViewTransition(() => {
          this._handleRouting();
          this.isRouting = false;
        });
      } catch (error) {
        console.error("Error in view transition:", error);
        this._handleRouting();
        this.isRouting = false;
      }
    } else {
      this._handleRouting();
      this.isRouting = false;
    }
  }  _handleRouting() {
    try {
      const hash = window.location.hash || "#/";
      console.log("Routing to:", hash);

      // Clean up previous presenter to prevent memory leaks and duplicate event listeners
      if (this.currentPresenter) {
        try {
          // Clean up add story presenter specifically
          if (this.currentPresenter === this.addStoryPresenter) {
            this.addStoryPresenter.cleanup();
          }
          
          // Clean up home presenter to prevent duplicate event listeners
          if (this.currentPresenter === this.homePresenter && typeof this.homePresenter.destroy === 'function') {
            this.homePresenter.destroy();
          }
          
          // Clean up story detail presenter
          if (this.currentPresenter === this.storyDetailPresenter && typeof this.storyDetailPresenter.destroy === 'function') {
            this.storyDetailPresenter.destroy();
          }
          
          // Clean up favorites presenter
          if (this.currentPresenter === this.favoritesPresenter && typeof this.favoritesPresenter.destroy === 'function') {
            this.favoritesPresenter.destroy();
          }
        } catch (error) {
          console.error("Error cleaning up presenter:", error);
        }
      }

      if (hash.startsWith("#/story/")) {
        // Story detail page
        const storyId = hash.substring("#/story/".length);
        if (!storyId) {
          console.error("Invalid story ID in URL");
          window.location.hash = "#/";
          return;
        }
        this.storyDetailPresenter.init(storyId);
        this.currentPresenter = this.storyDetailPresenter;
      } else if (hash === "#/add") {
        // Add story page - allow both authenticated users and guests
        this.addStoryPresenter.init();
        this.currentPresenter = this.addStoryPresenter;
      } else if (hash === "#/login") {
        // Login page
        this.authPresenter.renderLogin();
        this.currentPresenter = this.authPresenter;
      } else if (hash === "#/register") {
        // Register page
        this.authPresenter.renderRegister();
        this.currentPresenter = this.authPresenter;
      } else if (hash === "#/logout") {
        // Logout action
        this.model.logout();
        this.updateNavbar();
        window.location.hash = "#/login";
      } else if (hash === "#/map" || hash === "#map") {
        // Map page
        console.log("Initializing map page");
        try {
          this.mapPresenter.init();
          this.currentPresenter = this.mapPresenter;
          console.log("Map presenter initialized successfully");
        } catch (error) {
          console.error("Error initializing map presenter:", error);
        }      } else if (hash === "#/favorites") {
        // Favorites page - now accessible to both authenticated users and guests
        console.log("Initializing favorites page");
        try {
          this.favoritesPresenter.init();
          this.currentPresenter = this.favoritesPresenter;
          console.log("Favorites presenter initialized successfully");
        } catch (error) {
          console.error("Error initializing favorites presenter:", error);
        }      } else if (hash === "#home" || hash === "#/" || hash === "") {
        // Home page - now accessible to both authenticated users and guests
        console.log("Initializing home page");
        this.homePresenter.init();
        this.currentPresenter = this.homePresenter;
      } else {
        // Unknown route - show 404 page
        console.log("Unknown route:", hash);
        this.notFoundView.show();
        this.currentPresenter = null;
      }
    } catch (error) {
      console.error("Error in routing:", error);
      // Fallback to login page on error
      try {
        this.authPresenter.renderLogin();
        this.currentPresenter = this.authPresenter;
      } catch (e) {
        console.error("Failed to navigate to login page:", e);
        document.getElementById("app-container").innerHTML = `
          <div class="alert alert-danger">
            <p><i class="fas fa-exclamation-circle"></i> An error occurred. Please try refreshing the page.</p>
          </div>
        `;
      }
    }
  }
  updateNavbar() {
    const loginLink = document.getElementById("loginLink");
    const favoritesLink = document.getElementById("favoritesLink");    if (this.model.isLoggedIn()) {
      const name = localStorage.getItem("name");
      loginLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout (${name})`;
      loginLink.href = "#/logout";

      // Initialize push notifications if supported
      this._initPushNotification();
    } else {
      loginLink.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
      loginLink.href = "#/login";
    }

    // Always show favorites link - accessible to both authenticated users and guests
    if (favoritesLink) {
      favoritesLink.style.display = "block";
    }
  }
  async _initPushNotification() {
    try {
      if (this.notificationHelper.isPushNotificationSupported()) {
        await this.notificationHelper.registerServiceWorker();
        const subscription = await this.notificationHelper.getSubscription();

        if (!subscription) {
          // Ask user to subscribe to notifications if not already subscribed
          const confirmSubscribe = confirm(
            "Would you like to receive notifications when new stories are posted?"
          );

          if (confirmSubscribe) {
            try {
              await this.notificationHelper.subscribeNotification();
              console.log("User successfully subscribed to notifications");
            } catch (subError) {
              console.error("Error subscribing to notifications:", subError);
              // Do not show error to user as notifications are optional
            }
          }
        }
      }
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      // Notifications are not critical for app functionality, so continue silently
    }
  }
  // PWA Initialization
  async initPWA() {
    try {
      // Initialize IndexedDB
      await this.dbHelper.initDB();
      console.log("IndexedDB initialized");

      // Initialize notifications
      const notificationSuccess = await this.notificationHelper.init();
      if (notificationSuccess) {
        console.log("Push notifications initialized");

        // Show welcome notification
        await this.notificationHelper.showWelcomeNotification();
      }

      // Register service worker with VitePWA
      this.registerServiceWorker();

      // Check for app updates
      this.checkForUpdates();

      // Setup PWA install prompt
      this.setupInstallPrompt();

      // Check PWA install status
      this.checkPWAInstallStatus();
    } catch (error) {
      console.error("Error initializing PWA features:", error);
    }
  }

  registerServiceWorker() {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log("New version available");
        // Show update notification
        document.dispatchEvent(new CustomEvent("sw-update-available"));
      },
      onOfflineReady() {
        console.log("App ready to work offline");
        // Show offline ready notification
        document.dispatchEvent(new CustomEvent("sw-offline-ready"));
      },
    });

    // Listen for update events
    document.addEventListener("sw-update-available", () => {
      this.showUpdateAvailable();
    });

    document.addEventListener("sw-offline-ready", () => {
      this.showOfflineReady();
    });
  }

  setupOnlineOfflineListeners() {
    window.addEventListener("online", async () => {
      console.log("App is back online");

      // Show simple online notification
      try {
        if (Notification.permission === "granted") {
          new Notification("Back Online", {
            body: "You are back online. Syncing your offline stories...",
            icon: "/icons/app-icon.svg",
          });
        }
      } catch (error) {
        console.error("Error showing online notification:", error);
      }

      // Sync offline stories
      await this.syncOfflineData();

      // Update UI
      this.updateOnlineStatus(true);

      // Refresh current page if we're on home page
      if (window.location.hash === "#/" || window.location.hash === "") {
        console.log("Refreshing home page after sync");
        setTimeout(() => {
          this.loadPage();
        }, 1000);
      }
    });
    window.addEventListener("offline", async () => {
      console.log("App is offline");

      // Show simple offline notification
      try {
        if (Notification.permission === "granted") {
          new Notification("You are Offline", {
            body: "You can still add stories. They will be synced when you're back online.",
            icon: "/icons/app-icon.svg",
          });
        }
      } catch (error) {
        console.error("Error showing offline notification:", error);
      }

      // Update UI
      this.updateOnlineStatus(false);
    });
  }

  async syncOfflineData() {
    try {
      const syncedCount = await this.model.syncOfflineStories();
      if (syncedCount > 0) {
        console.log(`Synced ${syncedCount} offline stories`);

        // Show notification about sync
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Stories Synced", {
            body: `${syncedCount} offline stories have been synced`,
            icon: "/icons/icon-144x144.svg",
            badge: "/icons/icon-144x144.svg",
          });
        }

        // Refresh current view if on home page
        if (window.location.hash === "" || window.location.hash === "#home") {
          this.homePresenter.init();
        }
      }
    } catch (error) {
      console.error("Error syncing offline data:", error);
    }
  }

  updateOnlineStatus(isOnline) {
    // Add or remove offline indicator
    const existingIndicator = document.querySelector(".offline-indicator");

    if (!isOnline && !existingIndicator) {
      const indicator = document.createElement("div");
      indicator.className = "offline-indicator";
      indicator.innerHTML = '<i class="fas fa-wifi"></i> You are offline';
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff9800;
        color: white;
        text-align: center;
        padding: 8px;
        z-index: 10000;
        font-size: 14px;
      `;
      document.body.prepend(indicator);
    } else if (isOnline && existingIndicator) {
      existingIndicator.remove();
    }
  }
  showUpdateAvailable() {
    // Show update notification
    const updateBanner = document.createElement("div");
    updateBanner.className = "update-banner";
    updateBanner.innerHTML = `
      <div style="background: #4CAF50; color: white; padding: 12px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 10001;">
        <span>A new version is available!</span>
        <button onclick="window.location.reload()" style="margin-left: 10px; background: white; color: #4CAF50; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
          Update Now
        </button>
        <button onclick="this.parentElement.parentElement.remove()" style="margin-left: 5px; background: transparent; color: white; border: 1px solid white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
          Later
        </button>
      </div>
    `;
    document.body.prepend(updateBanner);
  }

  showOfflineReady() {
    // Show offline ready notification
    const offlineBanner = document.createElement("div");
    offlineBanner.className = "offline-ready-banner";
    offlineBanner.innerHTML = `
      <div style="background: #2196F3; color: white; padding: 12px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 10001;">
        <span><i class="fas fa-wifi-slash"></i> App is ready to work offline!</span>
        <button onclick="this.parentElement.parentElement.remove()" style="margin-left: 10px; background: transparent; color: white; border: 1px solid white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
          Got it
        </button>
      </div>
    `;
    document.body.prepend(offlineBanner);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (offlineBanner.parentElement) {
        offlineBanner.remove();
      }
    }, 5000);
  }
  checkForUpdates() {
    // VitePWA handles updates automatically through the registerSW callback
    // This method can be used for any additional update checking logic
    console.log("Update checking is handled by VitePWA registerSW");
  }

  // PWA Install functionality
  setupInstallPrompt() {
    let deferredPrompt;
    const installButton = document.createElement("button");
    installButton.className = "install-pwa";
    installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
    installButton.style.display = "none";
    document.body.appendChild(installButton);

    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("PWA install prompt available");
      e.preventDefault();
      deferredPrompt = e;

      // Show install button
      installButton.classList.add("show");
    });

    // Handle install button click
    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA install outcome: ${outcome}`);

        if (outcome === "accepted") {
          console.log("User accepted PWA install");
        } else {
          console.log("User dismissed PWA install");
        }

        deferredPrompt = null;
        installButton.classList.remove("show");
      }
    });

    // Listen for app installed event
    window.addEventListener("appinstalled", (e) => {
      console.log("PWA was installed");
      installButton.classList.remove("show");

      // Show success notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("App Installed!", {
          body: "Dicoding Story App has been installed successfully",
          icon: "/icons/icon-144x144.svg",
          badge: "/icons/icon-144x144.svg",
        });
      }
    });
  }

  // Add PWA install status checking
  checkPWAInstallStatus() {
    // Check if app is running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("App is running as PWA");
      document.body.classList.add("pwa-mode");
    }

    // Check if app can be installed
    if ("serviceWorker" in navigator && "BeforeInstallPromptEvent" in window) {
      console.log("PWA install capability available");
    }
  }

  // Show sync status
  showSyncStatus(message, isError = false) {
    let statusElement = document.querySelector(".sync-status");
    if (!statusElement) {
      statusElement = document.createElement("div");
      statusElement.className = "sync-status";
      document.body.appendChild(statusElement);
    }

    statusElement.textContent = message;
    statusElement.className = `sync-status ${isError ? "error" : ""}`;
    statusElement.classList.add("show");

    // Hide after 3 seconds
    setTimeout(() => {
      statusElement.classList.remove("show");
    }, 3000);
  }
}

// Initialize application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    window.app = new App();
    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    document.getElementById("app-container").innerHTML = `
      <div class="container">
        <div class="alert alert-danger">
          <h2><i class="fas fa-exclamation-triangle"></i> Application Error</h2>
          <p>Failed to initialize the application. Please try refreshing the page.</p>
          <p>Error details: ${error.message}</p>
          <button onclick="window.location.reload()" class="btn">Reload Page</button>
        </div>
      </div>
    `;
  }
});
