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
      // Try to get from cache first if offline
      if (!navigator.onLine) {
        const cachedStories = await this.dbHelper.getAllStories();
        return {
          error: false,
          message: "Stories retrieved from cache",
          listStory: cachedStories,
        };
      }

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

      // Cache stories to IndexedDB if successful
      if (data.error === false && data.listStory) {
        for (const story of data.listStory) {
          await this.dbHelper.saveStory(story);
        }
      }

      return data;
    } catch (error) {
      console.error("Error fetching stories:", error);

      // Return cached stories if network fails
      const cachedStories = await this.dbHelper.getAllStories();
      if (cachedStories.length > 0) {
        return {
          error: false,
          message: "Stories retrieved from cache (network error)",
          listStory: cachedStories,
        };
      }

      throw new Error(`Failed to fetch stories: ${error.message}`);
    }
  }
  async getStoryDetail(id) {
    try {
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

      throw new Error(`Failed to fetch story detail: ${error.message}`);
    }
  }
  async addStory(formData) {
    try {
      // If offline, save to offline store
      if (!navigator.onLine) {
        console.log("Offline detected, saving story locally");

        // Convert photo blob to base64 for storage
        const photoBlob = formData.get("photo");
        let photoBase64 = null;

        if (photoBlob && photoBlob instanceof Blob) {
          try {
            const arrayBuffer = await photoBlob.arrayBuffer();
            const base64String = btoa(
              String.fromCharCode(...new Uint8Array(arrayBuffer))
            );
            photoBase64 = `data:${photoBlob.type};base64,${base64String}`;
          } catch (error) {
            console.error("Error converting photo to base64:", error);
          }
        }

        const storyData = {
          description: formData.get("description"),
          photoBase64: photoBase64, // Store as base64 string
          photoType: photoBlob ? photoBlob.type : "image/jpeg",
          lat: formData.get("lat"),
          lon: formData.get("lon"),
          createdAt: new Date().toISOString(),
          userId: localStorage.getItem("userId"),
          userName: localStorage.getItem("name"),
        };

        const tempId = await this.dbHelper.saveOfflineStory(storyData);
        console.log("Story saved offline with tempId:", tempId);

        return {
          error: false,
          message: "Story saved offline. Will sync when online.",
          offline: true,
          tempId: tempId,
        };
      }

      const url = this.token
        ? `${this.baseUrl}/stories`
        : `${this.baseUrl}/stories/guest`;

      const headers = {};
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error adding story:", error);

      // If network error, save offline with base64 conversion
      const photoBlob = formData.get("photo");
      let photoBase64 = null;

      if (photoBlob && photoBlob instanceof Blob) {
        try {
          const arrayBuffer = await photoBlob.arrayBuffer();
          const base64String = btoa(
            String.fromCharCode(...new Uint8Array(arrayBuffer))
          );
          photoBase64 = `data:${photoBlob.type};base64,${base64String}`;
        } catch (photoError) {
          console.error(
            "Error converting photo to base64 in catch block:",
            photoError
          );
        }
      }

      const storyData = {
        description: formData.get("description"),
        photoBase64: photoBase64, // Store as base64 string
        photoType: photoBlob ? photoBlob.type : "image/jpeg",
        lat: formData.get("lat"),
        lon: formData.get("lon"),
        createdAt: new Date().toISOString(),
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("name"),
      };

      const tempId = await this.dbHelper.saveOfflineStory(storyData);
      console.log(
        "Story saved offline due to network error with tempId:",
        tempId
      );

      return {
        error: false,
        message:
          "Story saved offline due to network error. Will sync when online.",
        offline: true,
        tempId: tempId,
      };
    }
  }

  // Sync offline stories when back online
  async syncOfflineStories() {
    try {
      if (!navigator.onLine) return false;

      const offlineStories = await this.dbHelper.getAllOfflineStories();
      const syncedStories = [];
      for (const story of offlineStories) {
        try {
          console.log("Syncing offline story:", story.description);

          const formData = new FormData();
          formData.append("description", story.description);

          // Convert base64 back to blob
          if (story.photoBase64) {
            try {
              const response = await fetch(story.photoBase64);
              const blob = await response.blob();
              formData.append("photo", blob, "photo.jpg");
            } catch (photoError) {
              console.error("Error converting base64 to blob:", photoError);
              // Skip this story if photo conversion fails
              continue;
            }
          }

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
}

export default StoryModel;
