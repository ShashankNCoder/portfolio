const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const achievementCards = Array.from(document.querySelectorAll(".achievement-video-card"));

const activateAchievementCard = (card) => {
  card.classList.add("is-playing");

  const iframe = card.querySelector("iframe[data-src]");
  if (iframe) {
    if (!iframe.getAttribute("src")) {
      iframe.setAttribute("src", iframe.dataset.src);
    }
    return;
  }

  const video = card.querySelector("video[data-video-src]");
  if (video) {
    if (!video.getAttribute("src")) {
      video.setAttribute("src", video.dataset.videoSrc);
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }
};

const deactivateAchievementCard = (card) => {
  const iframe = card.querySelector("iframe[data-src]");
  if (iframe) {
    iframe.setAttribute("src", "");
    card.classList.remove("is-playing");
    return;
  }

  const video = card.querySelector("video[data-video-src]");
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
    card.classList.remove("is-playing");
  }
};

achievementCards.forEach((card) => {
  card.addEventListener("mouseenter", () => activateAchievementCard(card));
  card.addEventListener("mouseleave", () => deactivateAchievementCard(card));
  card.addEventListener("focusin", () => activateAchievementCard(card));
  card.addEventListener("focusout", () => deactivateAchievementCard(card));
});

const dockItems = Array.from(document.querySelectorAll("[data-dock-item]"));
let activeDockIndex = -1;

const clearDockState = () => {
  dockItems.forEach((item) => item.classList.remove("is-active", "is-neighbor"));
  activeDockIndex = -1;
};

const updateDockState = (index) => {
  if (index < 0 || index >= dockItems.length) {
    clearDockState();
    return;
  }

  dockItems.forEach((item, itemIndex) => {
    item.classList.remove("is-active", "is-neighbor");
    if (itemIndex === index) {
      item.classList.add("is-active");
    } else if (Math.abs(itemIndex - index) === 1) {
      item.classList.add("is-neighbor");
    }
  });

  activeDockIndex = index;
};

dockItems.forEach((item, index) => {
  item.addEventListener("mouseenter", () => updateDockState(index));
  item.addEventListener("mouseleave", () => {
    if (activeDockIndex === index) {
      clearDockState();
    }
  });
  item.addEventListener("focus", () => updateDockState(index));
  item.addEventListener("blur", () => clearDockState());
});

const projectTrack = document.querySelector(".projects__track");
const prevButton = document.querySelector("[data-project-prev]");
const nextButton = document.querySelector("[data-project-next]");
const dotsContainer = document.querySelector(".projects__dots");
const initialProjectCards = projectTrack ? Array.from(projectTrack.querySelectorAll("[data-project-card]")) : [];
let projectIndex = 0;
let projectPages = [];

const getCardsPerPage = () => {
  if (window.innerWidth <= 720) {
    return 1;
  }

  if (window.innerWidth <= 1080) {
    return 2;
  }

  return 3;
};

const buildProjectPages = () => {
  if (!projectTrack || initialProjectCards.length === 0) {
    return;
  }

  const cardsPerPage = getCardsPerPage();
  const pages = [];

  for (let index = 0; index < initialProjectCards.length; index += cardsPerPage) {
    pages.push(initialProjectCards.slice(index, index + cardsPerPage));
  }

  projectTrack.innerHTML = "";

  pages.forEach((pageCards) => {
    const page = document.createElement("div");
    page.className = "project-page";
    pageCards.forEach((card) => page.appendChild(card));
    projectTrack.appendChild(page);
  });

  projectPages = Array.from(projectTrack.children);
  projectIndex = Math.min(projectIndex, Math.max(projectPages.length - 1, 0));

  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    projectPages.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "projects__dot";
      dot.dataset.projectDot = String(index);
      dot.setAttribute("aria-label", `Show project page ${index + 1}`);
      dot.addEventListener("click", () => {
        projectIndex = index;
        updateProjectSlider();
      });
      dotsContainer.appendChild(dot);
    });
  }

  updateProjectSlider();
};

const updateProjectSlider = () => {
  if (!projectTrack || projectPages.length === 0) {
    return;
  }

  projectTrack.style.transform = `translateX(-${projectIndex * 100}%)`;

  if (prevButton) {
    prevButton.disabled = projectPages.length <= 1;
  }

  if (nextButton) {
    nextButton.disabled = projectPages.length <= 1;
  }

  Array.from(document.querySelectorAll(".projects__dot")).forEach((dot, index) => {
    dot.classList.toggle("is-active", index === projectIndex);
  });
};

prevButton?.addEventListener("click", () => {
  if (projectPages.length <= 1) return;
  projectIndex = (projectIndex - 1 + projectPages.length) % projectPages.length;
  updateProjectSlider();
});

nextButton?.addEventListener("click", () => {
  if (projectPages.length <= 1) return;
  projectIndex = (projectIndex + 1) % projectPages.length;
  updateProjectSlider();
});

window.addEventListener("resize", () => {
  buildProjectPages();
});

buildProjectPages();
