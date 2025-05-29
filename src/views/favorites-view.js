class FavoritesView {
  constructor() {
    this.app = document.getElementById("app-container");
  }

  render(favorites = []) {
    this.app.innerHTML = `
      <section class="container">
        <div class="favorites-header">
          <h2><i class="fas fa-heart"></i> My Favorites</h2>
          <p class="favorites-subtitle">
            ${
              favorites.length > 0
                ? `You have ${favorites.length} favorite ${
                    favorites.length === 1 ? "story" : "stories"
                  }`
                : "No favorite stories yet. Start adding some!"
            }
          </p>
        </div>
        
        <div id="favorites-container" class="favorites-container">
          ${this._renderFavorites(favorites)}
        </div>
        
        ${favorites.length === 0 ? this._renderEmptyState() : ""}
      </section>
    `;

    this._attachEventListeners();
  }
  _renderFavorites(favorites) {
    if (favorites.length === 0) {
      return "";
    }

    return `
      <div class="story-list">        ${favorites
        .map((story) => {
          const isGuest = story.isGuest || story.id.startsWith("guest_");
          return `
          <article class="story-card" data-story-id="${story.id}">
            <div class="story-thumbnail">
              <img src="${story.photoUrl}" alt="Story by ${
            story.name
          }" loading="lazy">
              <button class="favorite-btn active" data-story-id="${
                story.id
              }" title="Remove from favorites">
                <i class="fas fa-heart" id="heart-${story.id}"></i>
              </button>
              ${
                isGuest
                  ? '<div class="guest-badge"><i class="fas fa-user"></i> Guest</div>'
                  : ""
              }
            </div>
            <div class="story-info">
              <div class="story-header">
                <div class="author-info">
                  <div class="author-avatar">
                    <i class="fas fa-user-circle"></i>
                  </div>
                  <div class="author-details">
                    <span class="author-name">${story.name || "Anonymous"}${
            isGuest ? " (Guest)" : ""
          }</span>
                    <span class="upload-date">${this._formatDate(
                      story.addedAt || story.createdAt
                    )}</span>
                  </div>
                </div>
              </div>
              <div class="story-content">
                <h3 class="story-title">${this._truncateText(
                  story.description,
                  60
                )}</h3>
                <p class="story-description">${this._truncateText(
                  story.description,
                  120
                )}</p>
              </div>
              <div class="story-actions">
                <button class="btn-detail view-btn" data-story-id="${story.id}">
                  <i class="fas fa-eye"></i> View Details
                </button>
              </div>
            </div>
          </article>
        `;
        })
        .join("")}
      </div>
    `;
  }

  _renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="far fa-heart"></i>
        </div>
        <h3>No Favorites Yet</h3>
        <p>Start exploring stories and add them to your favorites by clicking the heart icon!</p>
        <div class="empty-state-actions">
          <a href="#/" class="btn btn-primary">
            <i class="fas fa-home"></i> Browse Stories
          </a>
          <a href="#/map" class="btn btn-secondary">
            <i class="fas fa-map"></i> Explore Map
          </a>
        </div>
      </div>
    `;
  }

  _attachEventListeners() {
    const favoritesContainer = document.getElementById("favorites-container");

    // Delegate events to the container
    favoritesContainer.addEventListener("click", (e) => {
      if (e.target.closest(".favorite-btn")) {
        const btn = e.target.closest(".favorite-btn");
        const storyId = btn.dataset.storyId;
        this._handleFavoriteToggle(storyId, btn);
      } else if (e.target.closest(".btn-detail, .view-btn")) {
        const btn = e.target.closest(".btn-detail, .view-btn");
        const storyId = btn.dataset.storyId;
        this._handleViewStory(storyId);
      } else if (e.target.closest(".share-btn")) {
        const btn = e.target.closest(".share-btn");
        const storyId = btn.dataset.storyId;
        this._handleShareStory(storyId);
      }
    });
  }

  _handleFavoriteToggle(storyId, btn) {
    // Dispatch custom event to presenter
    const event = new CustomEvent("favorite:toggle", {
      detail: { storyId },
    });
    document.dispatchEvent(event);

    // Provide immediate visual feedback
    btn.classList.add("removing");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }

  _handleViewStory(storyId) {
    window.location.hash = `#/story/${storyId}`;
  }

  _handleShareStory(storyId) {
    if (navigator.share) {
      navigator
        .share({
          title: "Check out this story!",
          text: "I found this interesting story on Dicoding Story App",
          url: `${window.location.origin}${window.location.pathname}#/story/${storyId}`,
        })
        .catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}${window.location.pathname}#/story/${storyId}`;
      navigator.clipboard
        .writeText(url)
        .then(() => {
          this.showToast("Story link copied to clipboard!");
        })
        .catch(() => {
          this.showToast("Unable to share story", "error");
        });
    }
  }

  showLoadingState() {
    this.app.innerHTML = `
      <section class="container">
        <div class="favorites-header">
          <h2><i class="fas fa-heart"></i> My Favorites</h2>
        </div>
        <div class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>Loading your favorite stories...</p>
        </div>
      </section>
    `;
  }

  showError(message) {
    this.app.innerHTML = `
      <section class="container">
        <div class="favorites-header">
          <h2><i class="fas fa-heart"></i> My Favorites</h2>
        </div>
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
          <button class="btn btn-secondary" onclick="window.location.reload()">
            <i class="fas fa-redo"></i> Try Again
          </button>
        </div>
      </section>
    `;
  }

  showToast(message, type = "success") {
    // Create toast notification
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${
          type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
        }"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add("show"), 100);

    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
  removeFavoriteFromView(storyId) {
    const storyCard = document.querySelector(`[data-story-id="${storyId}"]`);
    if (storyCard) {
      storyCard.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      storyCard.style.opacity = "0";
      storyCard.style.transform = "scale(0.95)";

      setTimeout(() => {
        storyCard.remove();

        // Check if no favorites left - use correct selector
        const remainingCards = document.querySelectorAll(
          ".story-card[data-story-id]"
        );
        if (remainingCards.length === 0) {
          document.getElementById("favorites-container").innerHTML =
            this._renderEmptyState();

          // Update header
          const subtitle = document.querySelector(".favorites-subtitle");
          if (subtitle) {
            subtitle.textContent =
              "No favorite stories yet. Start adding some!";
          }
        } else {
          // Update count in header
          const subtitle = document.querySelector(".favorites-subtitle");
          if (subtitle) {
            const count = remainingCards.length;
            subtitle.textContent = `You have ${count} favorite ${
              count === 1 ? "story" : "stories"
            }`;
          }
        }
      }, 300);
    }
  }

  _truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  _formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  _formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}

export default FavoritesView;
