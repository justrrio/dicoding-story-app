class NotFoundView {
  constructor() {
    this.element = null;
  }

  render() {
    const notFoundContainer = document.createElement("div");
    notFoundContainer.className = "not-found-container";
    notFoundContainer.innerHTML = `
      <div class="not-found-content">
        <div class="not-found-icon">
          <i class="fas fa-search"></i>
          <span class="icon-404">404</span>
        </div>
        <h1>Page Not Found</h1>
        <p>Oops! The page you're looking for doesn't exist.</p>
        <p>It might have been moved, deleted, or you entered the wrong URL.</p>
        <div class="not-found-actions">
          <button id="go-home-btn" class="btn btn-primary">
            <i class="fas fa-home"></i> Go to Home
          </button>
          <button id="go-back-btn" class="btn btn-secondary">
            <i class="fas fa-arrow-left"></i> Go Back
          </button>
        </div>        <div class="not-found-suggestions">
          <h3>You might want to:</h3>
          <ul>
            <li><a href="#/">Browse all stories</a></li>
            <li><a href="#/add">Share your story</a></li>
            <li><a href="#/map">Explore story locations</a></li>
          </ul>
        </div>
      </div>
    `;

    this.element = notFoundContainer;
    this.bindEvents();
    return notFoundContainer;
  }
  bindEvents() {
    const goHomeBtn = this.element.querySelector("#go-home-btn");
    const goBackBtn = this.element.querySelector("#go-back-btn");

    goHomeBtn.addEventListener("click", () => {
      window.location.hash = "#/";
    });

    goBackBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = "#/";
      }
    });
  }

  show() {
    const appContainer = document.getElementById("app-container");
    appContainer.innerHTML = "";
    appContainer.appendChild(this.render());

    // Update page title
    document.title = "Page Not Found - Dicoding Story App";

    // Add animation
    this.element.style.opacity = "0";
    this.element.style.transform = "translateY(20px)";

    requestAnimationFrame(() => {
      this.element.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      this.element.style.opacity = "1";
      this.element.style.transform = "translateY(0)";
    });
  }
}

export default NotFoundView;
