class HomeView {
  constructor() {
    this.app = document.getElementById("app-container");
  }
  render(stories = []) {
    this.app.innerHTML = `
      <section class="container">
        <h2><i class="fas fa-book-open"></i> Latest Stories</h2>
        ${
          stories.length === 0
            ? `<div class="loading"><div class="spinner"></div></div>`
            : `<div class="story-list">
              ${stories
                .map((story) => this._createStoryCardTemplate(story))
                .join("")}
            </div>`
        }
      </section>
    `;

    this._attachEventListeners();
  }
  _createStoryCardTemplate(story) {
    const isGuest = story.isGuest || story.id.startsWith("guest_");

    return `
      <article class="story-card" data-story-id="${story.id}">
        <div class="story-thumbnail">
          <img src="${story.photoUrl}" alt="Story by ${
      story.name
    }" loading="lazy">
          <button class="favorite-btn" data-story-id="${
            story.id
          }" title="Add to favorites">
            <i class="far fa-heart" id="heart-${story.id}"></i>
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
                <span class="author-name">${story.name}${
      isGuest ? " (Guest)" : ""
    }</span>
                <span class="upload-date">${this._formatDate(
                  story.createdAt
                )}</span>
              </div>
            </div>
          </div>
          <div class="story-content">
            <h3 class="story-title">${this._truncateDescription(
              story.description,
              60
            )}</h3>
            <p class="story-description">${this._truncateDescription(
              story.description,
              120
            )}</p>
          </div>
          <div class="story-actions">
            <a href="#/story/${story.id}" class="btn-detail">
              <i class="fas fa-eye"></i> View Details
            </a>
          </div>
        </div>
      </article>
    `;
  }

  _truncateDescription(description, maxLength = 100) {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  }

  _formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  }
  _attachEventListeners() {
    const storyList = document.querySelector(".story-list");
    if (storyList) {
      storyList.addEventListener("click", (e) => {
        if (e.target.closest(".favorite-btn")) {
          const btn = e.target.closest(".favorite-btn");
          const storyId = btn.dataset.storyId;
          this._handleFavoriteToggle(storyId, btn);
        }
      });
    }
  }

  _handleFavoriteToggle(storyId, btn) {
    // Get story data from the card
    const storyCard = btn.closest(".story-card");
    const storyData = this._extractStoryDataFromCard(storyCard);

    // Dispatch custom event to presenter
    const event = new CustomEvent("favorite:toggle", {
      detail: { storyId, storyData },
    });
    document.dispatchEvent(event);

    // Provide immediate visual feedback
    const icon = btn.querySelector("i");
    btn.classList.add("loading");
    icon.className = "fas fa-spinner fa-spin";
  }

  _extractStoryDataFromCard(storyCard) {
    const storyId = storyCard.dataset.storyId;
    const img = storyCard.querySelector("img");
    const name = storyCard.querySelector("h3").textContent;
    const description = storyCard.querySelector("p").textContent;

    return {
      id: storyId,
      name: name,
      description: description,
      photoUrl: img.src,
    };
  }
  updateFavoriteButton(storyId, isFavorite) {
    const btn = document.querySelector(
      `[data-story-id="${storyId}"].favorite-btn`
    );
    const icon = document.getElementById(`heart-${storyId}`);

    if (btn && icon) {
      btn.classList.remove("loading");
      if (isFavorite) {
        icon.className = "fas fa-heart";
        btn.classList.add("favorited");
        btn.title = "Remove from favorites";
      } else {
        icon.className = "far fa-heart";
        btn.classList.remove("favorited");
        btn.title = "Add to favorites";
      }
    }
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
}

export default HomeView;
