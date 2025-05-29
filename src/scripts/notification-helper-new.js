class NotificationHelper {
  constructor() {
    // VAPID public key dari Dicoding Story API - Updated
    this.vapidPublicKey =
      "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";
    this.apiUrl = "https://story-api.dicoding.dev/v1";
  }

  async init() {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return false;
    }

    if (!("PushManager" in window)) {
      console.warn("Push messaging not supported");
      return false;
    }

    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    try {
      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return false;
      }

      // Get service worker registration from VitePWA
      const registration = await navigator.serviceWorker.ready;
      console.log("Using VitePWA Service Worker:", registration);

      // Subscribe to push notifications
      await this.subscribeUser(registration);

      return true;
    } catch (error) {
      console.error("Error initializing notifications:", error);
      return false;
    }
  }

  isPushNotificationSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  async requestPermission() {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return Notification.permission;
  }

  async subscribeUser(registration) {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      console.log("User subscribed to push notifications:", subscription);

      // Send subscription to server (optional - for server-side push)
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe user:", error);
      throw error;
    }
  }
  async sendSubscriptionToServer(subscription) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No auth token available for subscription");
        return false;
      }

      // Prepare subscription data according to API docs
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      const response = await fetch(`${this.apiUrl}/notifications/subscribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      });

      const data = await response.json();

      if (data.error === false) {
        console.log("Successfully subscribed to push notifications:", data);
        return true;
      } else {
        console.error("Failed to subscribe:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Error sending subscription to server:", error);
      return false;
    }
  }

  async showNotification(title, options = {}) {
    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    const defaultOptions = {
      icon: "/icons/app-icon.svg",
      badge: "/icons/app-icon.svg",
      vibrate: [200, 100, 200],
      tag: "story-notification",
      renotify: true,
      requireInteraction: false,
      ...options,
    };

    try {
      // Try to use service worker notification first
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await registration.showNotification(title, defaultOptions);
      } else {
        // Fallback to regular notification
        new Notification(title, defaultOptions);
      }
    } catch (error) {
      console.error("Error showing notification:", error);
      // Fallback to regular notification
      try {
        new Notification(title, defaultOptions);
      } catch (fallbackError) {
        console.error("Fallback notification also failed:", fallbackError);
      }
    }
  }
  async showStoryNotification(story) {
    console.log("Showing story notification for:", story);

    // Check notification permission first
    console.log("Notification permission:", Notification.permission);

    if (Notification.permission !== "granted") {
      console.warn(
        "Notification permission not granted, requesting permission..."
      );
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        console.error("User denied notification permission");
        return;
      }
    }

    const title = "Story berhasil dibuat";
    const options = {
      body: `Anda telah membuat story baru dengan deskripsi: ${story.description}`,
      icon: "/icons/app-icon.svg",
      image:
        story.photoUrl && story.photoUrl !== "default-image"
          ? story.photoUrl
          : undefined,
      data: {
        url: `/#/story/${story.id}`,
        storyId: story.id,
      },
      tag: "story-created",
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "View Story",
          icon: "/icons/app-icon.svg",
        },
        {
          action: "close",
          title: "Close",
          icon: "/icons/app-icon.svg",
        },
      ],
    };
    try {
      console.log("Attempting to show notification with options:", options);

      // Simplified notification approach - try browser notification first
      console.log("Using simple browser notification");
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon,
        tag: options.tag,
        requireInteraction: false, // Simplified - don't require interaction
        data: options.data,
      });

      console.log("Browser notification created successfully");

      // Add click handler
      notification.onclick = function (event) {
        console.log("Notification clicked");
        event.preventDefault();
        window.focus();
        if (options.data && options.data.url) {
          window.location.hash = options.data.url;
        }
        notification.close();
      };

      console.log("Story notification displayed successfully");
    } catch (error) {
      console.error("Error displaying story notification:", error);
      // Final fallback to very simple notification
      try {
        console.log("Using minimal fallback notification");
        new Notification("Story berhasil dibuat", {
          body: "Story Anda telah berhasil dibuat!",
        });
        console.log("Minimal notification sent successfully");
      } catch (fallbackError) {
        console.error("All notification methods failed:", fallbackError);
      }
    }
  }

  async showWelcomeNotification() {
    const options = {
      body: "Welcome to Dicoding Story App! Start sharing your stories.",
      icon: "/icons/app-icon.svg",
      data: {
        url: "/#/add",
      },
      actions: [
        {
          action: "add-story",
          title: "Add Story",
          icon: "/icons/app-icon.svg",
        },
      ],
    };

    await this.showNotification("Welcome to Story App!", options);
  }

  async showOfflineNotification() {
    const options = {
      body: "You are currently offline. Some features may be limited.",
      icon: "/icons/app-icon.svg",
      tag: "offline-notification",
    };

    await this.showNotification("You are offline", options);
  }

  async showOnlineNotification() {
    const options = {
      body: "You are back online! All features are now available.",
      icon: "/icons/app-icon.svg",
      tag: "online-notification",
    };

    await this.showNotification("You are online", options);
  }

  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  // Check if notifications are supported and enabled
  isSupported() {
    return (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  }

  isEnabled() {
    return Notification.permission === "granted";
  }

  // Test notification method for debugging
  async testNotification() {
    console.log("Testing notification...");
    console.log("Notification permission:", Notification.permission);
    console.log("Push supported:", this.isPushNotificationSupported());

    if (Notification.permission === "granted") {
      try {
        // Try simple notification first
        new Notification("Test Notification", {
          body: "This is a test notification to verify functionality",
          icon: "/icons/app-icon.svg",
        });
        console.log("Simple notification sent");

        // Try service worker notification
        await this.showNotification("Service Worker Test", {
          body: "This is a service worker notification test",
        });
        console.log("Service worker notification sent");
      } catch (error) {
        console.error("Test notification failed:", error);
      }
    } else {
      console.warn("Notification permission not granted");
    }
  }

  // Simple test notification for debugging
  async testSimpleNotification() {
    console.log("Testing simple notification...");
    try {
      if (Notification.permission === "granted") {
        const notification = new Notification("Test Notification", {
          body: "This is a test notification",
          icon: "/icons/app-icon.svg",
        });
        console.log("Simple test notification sent successfully");

        notification.onclick = function () {
          console.log("Test notification clicked");
          notification.close();
        };

        return true;
      } else {
        console.log("Permission not granted for notifications");
        return false;
      }
    } catch (error) {
      console.error("Test notification failed:", error);
      return false;
    }
  }

  // Get notification permission status
  getPermissionStatus() {
    if (!("Notification" in window)) {
      return "not-supported";
    }
    return Notification.permission;
  }

  // Get current push subscription
  async getSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error("Error getting subscription:", error);
      return null;
    }
  }

  // Subscribe to notifications
  async subscribeNotification() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await this.subscribeUser(registration);
      return subscription;
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      throw error;
    }
  }

  // Unsubscribe from notifications
  async unsubscribeNotification() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log("No subscription to unsubscribe from");
        return true;
      }

      // Unsubscribe from browser
      const successful = await subscription.unsubscribe();

      if (successful) {
        // Notify server about unsubscription
        await this.sendUnsubscriptionToServer(subscription);
        console.log("Successfully unsubscribed from push notifications");
        return true;
      } else {
        console.error("Failed to unsubscribe");
        return false;
      }
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error);
      throw error;
    }
  }

  // Send unsubscription to server
  async sendUnsubscriptionToServer(subscription) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No auth token available for unsubscription");
        return false;
      }

      const response = await fetch(`${this.apiUrl}/notifications/subscribe`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      const data = await response.json();

      if (data.error === false) {
        console.log("Successfully unsubscribed from server:", data);
        return true;
      } else {
        console.error("Failed to unsubscribe from server:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Error sending unsubscription to server:", error);
      return false;
    }
  }

  // Register service worker (for compatibility with existing code)
  async registerServiceWorker() {
    // VitePWA handles service worker registration automatically
    // This method is kept for compatibility
    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.error("Error getting service worker:", error);
      throw error;
    }
  }
}

export default NotificationHelper;
