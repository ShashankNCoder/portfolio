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
const achievementMediaQuery = window.matchMedia("(max-width: 720px), (pointer: coarse)");

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
  if (achievementMediaQuery.matches) {
    return;
  }

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

const primeAchievementVideosForMobile = () => {
  if (!achievementMediaQuery.matches) {
    return;
  }

  achievementCards.forEach((card) => {
    const video = card.querySelector("video[data-video-src]");
    if (!video) return;

    if (!video.getAttribute("src")) {
      video.setAttribute("src", video.dataset.videoSrc);
    }

    card.classList.add("is-playing");

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  });
};

primeAchievementVideosForMobile();
window.addEventListener("resize", primeAchievementVideosForMobile);

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
const projectStage = document.querySelector(".projects__stage");
const prevButton = document.querySelector("[data-project-prev]");
const nextButton = document.querySelector("[data-project-next]");
const dotsContainer = document.querySelector(".projects__dots");
const initialProjectCards = projectTrack ? Array.from(projectTrack.querySelectorAll("[data-project-card]")) : [];
let projectIndex = 0;
let projectPages = [];
let projectSwipeState = null;
let projectSwipeBlockClickUntil = 0;

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

const handleProjectSwipeStart = (event) => {
  if (!projectTrack || !projectPages.length || event.button !== 0) {
    return;
  }

  projectSwipeState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    isDragging: true,
    active: false,
  };

  if (projectStage?.setPointerCapture && event.pointerId != null) {
    projectStage.setPointerCapture(event.pointerId);
  }
};

const handleProjectSwipeMove = (event) => {
  if (!projectSwipeState || !projectSwipeState.isDragging || !projectTrack || !projectPages.length) {
    return;
  }

  const deltaX = event.clientX - projectSwipeState.startX;
  const deltaY = event.clientY - projectSwipeState.startY;

  if (!projectSwipeState.active && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
    projectSwipeState.active = true;
  }

  if (projectSwipeState.active) {
    event.preventDefault();
    projectSwipeState.currentX = event.clientX;
    projectSwipeState.currentY = event.clientY;
  }
};

const finishProjectSwipe = (event) => {
  if (!projectSwipeState || !projectTrack || !projectPages.length) {
    projectSwipeState = null;
    return;
  }

  if (projectSwipeState.active) {
    const deltaX = projectSwipeState.currentX - projectSwipeState.startX;
    const threshold = Math.max(48, window.innerWidth * 0.12);

    if (deltaX <= -threshold && projectPages.length > 1) {
      projectIndex = (projectIndex + 1) % projectPages.length;
      updateProjectSlider();
    } else if (deltaX >= threshold && projectPages.length > 1) {
      projectIndex = (projectIndex - 1 + projectPages.length) % projectPages.length;
      updateProjectSlider();
    }

    projectSwipeBlockClickUntil = Date.now() + 300;
  }

  if (event?.pointerId != null && projectStage?.hasPointerCapture?.(event.pointerId)) {
    projectStage.releasePointerCapture(event.pointerId);
  }

  projectSwipeState = null;
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

if (projectStage) {
  projectStage.addEventListener("pointerdown", handleProjectSwipeStart);
  projectStage.addEventListener("pointermove", handleProjectSwipeMove);
  projectStage.addEventListener("pointerup", finishProjectSwipe);
  projectStage.addEventListener("pointercancel", finishProjectSwipe);
  projectStage.addEventListener("click", (event) => {
    if (Date.now() < projectSwipeBlockClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

window.addEventListener("resize", () => {
  buildProjectPages();
});

buildProjectPages();

const journeyMarquee = document.querySelector(".journey__marquee");
let journeyDragState = null;
let journeyAutoScrollFrame = null;
let journeyAutoScrollPaused = false;

const startJourneyAutoScroll = () => {
  if (!journeyMarquee || journeyAutoScrollFrame != null) {
    return;
  }

  const tick = () => {
    if (!journeyMarquee) {
      journeyAutoScrollFrame = null;
      return;
    }

    if (!journeyAutoScrollPaused && journeyMarquee.scrollWidth > journeyMarquee.clientWidth) {
      journeyMarquee.scrollLeft += 0.7;

      const halfWidth = journeyMarquee.scrollWidth / 2;
      if (journeyMarquee.scrollLeft >= halfWidth) {
        journeyMarquee.scrollLeft -= halfWidth;
      }
    }

    journeyAutoScrollFrame = window.requestAnimationFrame(tick);
  };

  journeyAutoScrollFrame = window.requestAnimationFrame(tick);
};

const stopJourneyAutoScroll = () => {
  if (journeyAutoScrollFrame != null) {
    window.cancelAnimationFrame(journeyAutoScrollFrame);
    journeyAutoScrollFrame = null;
  }
};

const handleJourneyDragStart = (event) => {
  if (!journeyMarquee || event.button !== 0) {
    return;
  }

  journeyAutoScrollPaused = true;
  journeyDragState = {
    startX: event.clientX,
    startScrollLeft: journeyMarquee.scrollLeft,
    active: false,
    pointerId: event.pointerId,
  };

  if (journeyMarquee.setPointerCapture && event.pointerId != null) {
    journeyMarquee.setPointerCapture(event.pointerId);
  }
};

const handleJourneyDragMove = (event) => {
  if (!journeyDragState || !journeyMarquee) {
    return;
  }

  const deltaX = event.clientX - journeyDragState.startX;

  if (!journeyDragState.active && Math.abs(deltaX) > 6) {
    journeyDragState.active = true;
  }

  if (journeyDragState.active) {
    event.preventDefault();
    journeyMarquee.scrollLeft = journeyDragState.startScrollLeft - deltaX;
  }
};

const finishJourneyDrag = (event) => {
  if (!journeyDragState || !journeyMarquee) {
    journeyDragState = null;
    journeyAutoScrollPaused = false;
    return;
  }

  if (event?.pointerId != null && journeyMarquee.hasPointerCapture?.(event.pointerId)) {
    journeyMarquee.releasePointerCapture(event.pointerId);
  }

  journeyDragState = null;
  journeyAutoScrollPaused = false;
};

if (journeyMarquee) {
  journeyMarquee.addEventListener("pointerdown", handleJourneyDragStart);
  journeyMarquee.addEventListener("pointermove", handleJourneyDragMove);
  journeyMarquee.addEventListener("pointerup", finishJourneyDrag);
  journeyMarquee.addEventListener("pointercancel", finishJourneyDrag);
  journeyMarquee.addEventListener("mouseenter", () => {
    journeyAutoScrollPaused = true;
  });
  journeyMarquee.addEventListener("mouseleave", () => {
    journeyAutoScrollPaused = false;
  });
  journeyMarquee.addEventListener("focusin", () => {
    journeyAutoScrollPaused = true;
  });
  journeyMarquee.addEventListener("focusout", () => {
    journeyAutoScrollPaused = false;
  });
  startJourneyAutoScroll();
}

window.addEventListener("load", () => {
  startJourneyAutoScroll();
});
