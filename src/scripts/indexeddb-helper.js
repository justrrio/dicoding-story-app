import { openDB } from "idb";

class IndexedDBHelper {
  constructor() {
    this.dbName = "dicoding-story-db";
    this.version = 1;
    this.db = null;
  }

  async initDB() {
    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db) {
          // Create stories store
          if (!db.objectStoreNames.contains("stories")) {
            const storyStore = db.createObjectStore("stories", {
              keyPath: "id",
            });
            storyStore.createIndex("createdAt", "createdAt");
          }

          // Create favorites store
          if (!db.objectStoreNames.contains("favorites")) {
            const favoriteStore = db.createObjectStore("favorites", {
              keyPath: "id",
            });
            favoriteStore.createIndex("addedAt", "addedAt");
          }

          // Create offline-stories store for stories created offline
          if (!db.objectStoreNames.contains("offline-stories")) {
            const offlineStore = db.createObjectStore("offline-stories", {
              keyPath: "tempId",
              autoIncrement: true,
            });
            offlineStore.createIndex("createdAt", "createdAt");
          }
        },
      });
      console.log("IndexedDB initialized successfully");
    } catch (error) {
      console.error("Error initializing IndexedDB:", error);
    }
  }

  // Stories operations
  async saveStory(story) {
    try {
      if (!this.db) await this.initDB();

      const storyWithTimestamp = {
        ...story,
        savedAt: new Date().toISOString(),
      };

      await this.db.put("stories", storyWithTimestamp);
      console.log("Story saved to IndexedDB:", story.id);
    } catch (error) {
      console.error("Error saving story to IndexedDB:", error);
    }
  }
  async getAllStories() {
    try {
      if (!this.db) await this.initDB();
      const stories = await this.db.getAll("stories");
      return stories.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error("Error getting stories from IndexedDB:", error);
      return [];
    }
  }

  async getStoryById(id) {
    try {
      if (!this.db) await this.initDB();
      return await this.db.get("stories", id);
    } catch (error) {
      console.error("Error getting story from IndexedDB:", error);
      return null;
    }
  }

  // Legacy method names for compatibility
  async getStories() {
    return this.getAllStories();
  }

  async getStory(id) {
    return this.getStoryById(id);
  }

  async deleteStory(id) {
    try {
      if (!this.db) await this.initDB();
      await this.db.delete("stories", id);
      console.log("Story deleted from IndexedDB:", id);
    } catch (error) {
      console.error("Error deleting story from IndexedDB:", error);
    }
  }

  // Favorites operations
  async addToFavorites(story) {
    try {
      if (!this.db) await this.initDB();

      const favoriteStory = {
        ...story,
        addedAt: new Date().toISOString(),
      };

      await this.db.put("favorites", favoriteStory);
      console.log("Story added to favorites:", story.id);
    } catch (error) {
      console.error("Error adding to favorites:", error);
    }
  }
  async getAllFavorites() {
    try {
      if (!this.db) await this.initDB();
      const favorites = await this.db.getAll("favorites");
      return favorites.sort(
        (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
      );
    } catch (error) {
      console.error("Error getting favorites from IndexedDB:", error);
      return [];
    }
  }

  async getFavoriteById(id) {
    try {
      if (!this.db) await this.initDB();
      const favorite = await this.db.get("favorites", id);
      return favorite;
    } catch (error) {
      console.error("Error getting favorite by id:", error);
      return null;
    }
  }

  // Legacy method names for compatibility
  async getFavorites() {
    return this.getAllFavorites();
  }

  async removeFromFavorites(id) {
    try {
      if (!this.db) await this.initDB();
      await this.db.delete("favorites", id);
      console.log("Story removed from favorites:", id);
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  }

  async isFavorite(id) {
    try {
      if (!this.db) await this.initDB();
      const favorite = await this.db.get("favorites", id);
      return !!favorite;
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  }

  // Offline stories operations
  async saveOfflineStory(storyData) {
    try {
      if (!this.db) await this.initDB();

      const tempId = Date.now(); // Use timestamp as tempId
      const offlineStory = {
        tempId: tempId,
        ...storyData,
        createdAt: new Date().toISOString(),
        synced: false,
      };

      await this.db.add("offline-stories", offlineStory);
      console.log("Offline story saved with tempId:", tempId);
      return tempId;
    } catch (error) {
      console.error("Error saving offline story:", error);
      return null;
    }
  }

  async getAllOfflineStories() {
    try {
      if (!this.db) await this.initDB();
      return await this.db.getAll("offline-stories");
    } catch (error) {
      console.error("Error getting offline stories:", error);
      return [];
    }
  }

  // Legacy method names for compatibility
  async getOfflineStories() {
    return this.getAllOfflineStories();
  }

  async deleteOfflineStory(tempId) {
    try {
      if (!this.db) await this.initDB();
      await this.db.delete("offline-stories", tempId);
      console.log("Offline story deleted:", tempId);
    } catch (error) {
      console.error("Error deleting offline story:", error);
    }
  }

  // Clear all data
  async clearAllData() {
    try {
      if (!this.db) await this.initDB();
      await this.db.clear("stories");
      await this.db.clear("favorites");
      await this.db.clear("offline-stories");
      console.log("All IndexedDB data cleared");
    } catch (error) {
      console.error("Error clearing IndexedDB data:", error);
    }
  }

  // Get database size info
  async getDBInfo() {
    try {
      if (!this.db) await this.initDB();

      const storiesCount = await this.db.count("stories");
      const favoritesCount = await this.db.count("favorites");
      const offlineStoriesCount = await this.db.count("offline-stories");

      return {
        stories: storiesCount,
        favorites: favoritesCount,
        offlineStories: offlineStoriesCount,
        total: storiesCount + favoritesCount + offlineStoriesCount,
      };
    } catch (error) {
      console.error("Error getting DB info:", error);
      return { stories: 0, favorites: 0, offlineStories: 0, total: 0 };
    }
  }
}

export { IndexedDBHelper };
export default IndexedDBHelper;
