import { IndexedDBHelper } from "../scripts/indexeddb-helper.js";

class StoryModel {
  constructor() {
    this.baseUrl = "https://story-api.dicoding.dev/v1";
    this.token = localStorage.getItem("token") || null;
    this.dbHelper = new IndexedDBHelper();
  }
  async register(name, email, password) {
    try {
      // Validate input before sending to API
      if (!name || !email || !password) {
        return {
          error: true,
          message: "Name, email, and password are required",
        };
      }

      if (password.length < 8) {
        return {
          error: true,
          message: "Password must be at least 8 characters long",
        };
      }

      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      // Log response for debugging
      if (data.error) {
        console.warn("Registration API error:", data.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to register: ${error.message}`);
    }
  }
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!data.error) {
        // Save login data in local storage
        localStorage.setItem("token", data.loginResult.token);
        localStorage.setItem("userId", data.loginResult.userId);
        localStorage.setItem("name", data.loginResult.name);
        this.token = data.loginResult.token;
      } else {
        // Log error details for debugging
        console.warn("Login API error:", data.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to login: ${error.message}`);
    }
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    this.token = null;
  }

  isLoggedIn() {
    return !!this.token;
  }
  async getStories(page = 1, size = 10, location = 0) {
    try {
      let allStories = [];

      // Get guest stories from local storage first
      const guestStories = JSON.parse(
        localStorage.getItem("guestStories") || "[]"
      );
      allStories = [...guestStories];

      // Try to get from cache first if offline
      if (!navigator.onLine) {
        const cachedStories = await this.dbHelper.getAllStories();
        // Filter out guest stories from cache to avoid duplicates
        const nonGuestCachedStories = cachedStories.filter(
          (story) => !story.isGuest
        );
        allStories = [...allStories, ...nonGuestCachedStories];

        // Sort by creation date (newest first)
        allStories.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        return {
          error: false,
          message: "Stories retrieved from cache and local storage",
          listStory: allStories,
        };
      }

      // If online and authenticated, fetch from API
      if (this.token) {
        const url = new URL(`${this.baseUrl}/stories`);
        url.searchParams.append("page", page);
        url.searchParams.append("size", size);
        url.searchParams.append("location", location);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        const data = await response.json();

        // Combine API stories with guest stories
        if (data.error === false && data.listStory) {
          // Cache API stories to IndexedDB
          for (const story of data.listStory) {
            await this.dbHelper.saveStory(story);
          }

          allStories = [...allStories, ...data.listStory];
        }
      }

      // Sort all stories by creation date (newest first)
      allStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        error: false,
        message: "Stories retrieved successfully",
        listStory: allStories,
      };
    } catch (error) {
      console.error("Error fetching stories:", error);

      // Return cached stories and guest stories if network fails
      const cachedStories = await this.dbHelper.getAllStories();
      const guestStories = JSON.parse(
        localStorage.getItem("guestStories") || "[]"
      );

      // Filter out guest stories from cache to avoid duplicates
      const nonGuestCachedStories = cachedStories.filter(
        (story) => !story.isGuest
      );
      const allStories = [...guestStories, ...nonGuestCachedStories];

      // Sort by creation date (newest first)
      allStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (allStories.length > 0) {
        return {
          error: false,
          message:
            "Stories retrieved from cache and local storage (network error)",
          listStory: allStories,
        };
      }

      throw new Error(`Failed to fetch stories: ${error.message}`);
    }
  }
  async getStoryDetail(id) {
    try {
      // Check if it's a guest story first
      if (id.startsWith("guest_")) {
        const guestStories = JSON.parse(
          localStorage.getItem("guestStories") || "[]"
        );
        const guestStory = guestStories.find((story) => story.id === id);

        if (guestStory) {
          return {
            error: false,
            message: "Guest story retrieved from local storage",
            story: guestStory,
          };
        }
      }

      // Try to get from cache first if offline
      if (!navigator.onLine) {
        const cachedStory = await this.dbHelper.getStoryById(id);
        if (cachedStory) {
          return {
            error: false,
            message: "Story retrieved from cache",
            story: cachedStory,
          };
        }
      }

      // If online and authenticated, fetch from API
      if (this.token) {
        const response = await fetch(`${this.baseUrl}/stories/${id}`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        const data = await response.json();

        // Cache story detail if successful
        if (data.error === false && data.story) {
          await this.dbHelper.saveStory(data.story);
        }

        return data;
      }

      // If not authenticated and story not found in guest stories, return error
      return {
        error: true,
        message: "Story not found",
      };
    } catch (error) {
      console.error("Error fetching story detail:", error);

      // Try to get from cache if network fails
      const cachedStory = await this.dbHelper.getStoryById(id);
      if (cachedStory) {
        return {
          error: false,
          message: "Story retrieved from cache (network error)",
          story: cachedStory,
        };
      }

      // Check guest stories as fallback
      if (id.startsWith("guest_")) {
        const guestStories = JSON.parse(
          localStorage.getItem("guestStories") || "[]"
        );
        const guestStory = guestStories.find((story) => story.id === id);

        if (guestStory) {
          return {
            error: false,
            message: "Guest story retrieved from local storage",
            story: guestStory,
          };
        }
      }
      throw new Error(`Failed to fetch story detail: ${error.message}`);
    }
  }

  async addStory(formData) {
    try {
      // If user is not logged in, save as guest story locally
      if (!this.token) {
        return await this._saveGuestStoryLocally(formData);
      }

      // If offline, save to offline store
      if (!navigator.onLine) {
        const storyData = {
          description: formData.get("description"),
          photo: formData.get("photo"),
          lat: formData.get("lat"),
          lon: formData.get("lon"),
          createdAt: new Date().toISOString(),
          userId: localStorage.getItem("userId"),
          userName: localStorage.getItem("name"),
        };

        await this.dbHelper.saveOfflineStory(storyData);

        return {
          error: false,
          message: "Story saved offline. Will sync when online.",
          offline: true,
        };
      }

      // Authenticated user - send to API
      const response = await fetch(`${this.baseUrl}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error adding story:", error);

      // If user is not logged in, save as guest story locally
      if (!this.token) {
        return await this._saveGuestStoryLocally(formData);
      }

      // If network error, save offline for authenticated users
      const storyData = {
        description: formData.get("description"),
        photo: formData.get("photo"),
        lat: formData.get("lat"),
        lon: formData.get("lon"),
        createdAt: new Date().toISOString(),
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("name"),
      };

      await this.dbHelper.saveOfflineStory(storyData);
      return {
        error: false,
        message:
          "Story saved offline due to network error. Will sync when online.",
        offline: true,
      };
    }
  }

  async _saveGuestStoryLocally(formData) {
    try {
      // Generate a unique ID for the guest story
      const guestStoryId =
        "guest_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

      // Convert the photo file to base64 for local storage
      const photoFile = formData.get("photo");
      let photoBase64 = null;

      if (photoFile && photoFile.size > 0) {
        photoBase64 = await this._convertFileToBase64(photoFile);
      }

      const guestStory = {
        id: guestStoryId,
        name: "Guest User",
        description: formData.get("description"),
        photoUrl: photoBase64,
        createdAt: new Date().toISOString(),
        lat: formData.get("lat") ? parseFloat(formData.get("lat")) : null,
        lon: formData.get("lon") ? parseFloat(formData.get("lon")) : null,
        isGuest: true,
      };

      // Save to local storage
      const existingGuestStories = JSON.parse(
        localStorage.getItem("guestStories") || "[]"
      );
      existingGuestStories.push(guestStory);
      localStorage.setItem(
        "guestStories",
        JSON.stringify(existingGuestStories)
      );

      // Also save to IndexedDB for consistency
      await this.dbHelper.saveStory(guestStory);

      return {
        error: false,
        message: "Story saved locally as guest user.",
        story: guestStory,
        isGuest: true,
      };
    } catch (error) {
      console.error("Error saving guest story:", error);
      return {
        error: true,
        message: "Failed to save story locally.",
      };
    }
  }

  async _convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Sync offline stories when back online
  async syncOfflineStories() {
    try {
      if (!navigator.onLine) return false;

      const offlineStories = await this.dbHelper.getAllOfflineStories();
      const syncedStories = [];

      for (const story of offlineStories) {
        try {
          const formData = new FormData();
          formData.append("description", story.description);
          formData.append("photo", story.photo);
          if (story.lat) formData.append("lat", story.lat);
          if (story.lon) formData.append("lon", story.lon);

          const result = await this.addStory(formData);
          if (!result.error && !result.offline) {
            syncedStories.push(story.tempId);
          }
        } catch (error) {
          console.error("Error syncing story:", error);
        }
      }

      // Remove synced stories from offline store
      for (const tempId of syncedStories) {
        await this.dbHelper.deleteOfflineStory(tempId);
      }

      return syncedStories.length;
    } catch (error) {
      console.error("Error syncing offline stories:", error);
      return false;
    }
  }

  // Favorites management
  async addToFavorites(story) {
    return await this.dbHelper.addToFavorites(story);
  }

  async removeFromFavorites(storyId) {
    return await this.dbHelper.removeFromFavorites(storyId);
  }

  async getFavorites() {
    return await this.dbHelper.getAllFavorites();
  }
  async isFavorite(storyId) {
    const favorite = await this.dbHelper.getFavoriteById(storyId);
    return !!favorite;
  }

  // Guest story management
  getGuestStories() {
    return JSON.parse(localStorage.getItem("guestStories") || "[]");
  }

  deleteGuestStory(storyId) {
    const guestStories = JSON.parse(
      localStorage.getItem("guestStories") || "[]"
    );
    const updatedStories = guestStories.filter((story) => story.id !== storyId);
    localStorage.setItem("guestStories", JSON.stringify(updatedStories));
    return true;
  }

  clearAllGuestStories() {
    localStorage.removeItem("guestStories");
    return true;
  }
}

export default StoryModel;
