/**
 * CLIP — Universal Video Clipboard
 * Ultra-Clean Minimalist Pure Icon Aesthetic
 * Apple Dynamic Island · Zero Collision · Instant WhatsApp/Discord Paste
 */

(function () {
  "use strict";

  if (window.__CLIP_INTERVAL__) clearInterval(window.__CLIP_INTERVAL__);
  if (window.__CLIP_OBSERVER__) window.__CLIP_OBSERVER__.disconnect();

  console.log("⚡ [CLIP] Universal Video Clipboard active.");

  // SVG Icons (Ultra-sleek modern icons, pure icon design)
  const ICONS = {
    bolt: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    drag: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`,
    folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    close: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    spinner: `<span class="clip-ext-spinner"></span>`,
    check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    star: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
  };

  async function checkIsPro() {
    try {
      const data = await chrome.storage.local.get("settings");
      return data?.settings?.isPro === true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 1. YouTube Shorts Adapter (Directly ABOVE the Like button in the right action column)
   */
  function handleYouTubeShorts() {
    const isShorts = window.location.pathname.includes("/shorts") || window.location.href.includes("/shorts");
    if (!isShorts) return;

    // Clean up any stray/misplaced shorts buttons that are not positioned above a like button
    document.querySelectorAll(".clip-shorts-action-wrapper").forEach(el => {
      const next = el.nextElementSibling;
      const isAboveLike = next && (
        next.matches("ytd-like-button-renderer, #like-button, like-button-view-model, ytd-toggle-button-renderer") ||
        next.querySelector("ytd-like-button-renderer, #like-button, like-button-view-model, button[aria-label*='beğen' i], button[aria-label*='like' i]")
      );
      if (!isAboveLike && !el.closest("#actions")) {
        el.remove();
      }
    });

    // A) Directly target all YouTube Shorts Like buttons across active/rendered reels
    const candidateLikeButtons = document.querySelectorAll(`
      ytd-reel-player-overlay-renderer ytd-like-button-renderer,
      ytd-reel-player-overlay-renderer #like-button,
      ytd-reel-player-overlay-renderer like-button-view-model,
      ytd-reel-video-renderer ytd-like-button-renderer,
      ytd-reel-video-renderer #like-button,
      ytd-reel-video-renderer like-button-view-model,
      #actions ytd-like-button-renderer,
      #actions #like-button,
      #actions like-button-view-model,
      ytd-shorts #like-button
    `);

    candidateLikeButtons.forEach(btn => {
      const targetLike = btn.closest("ytd-like-button-renderer, like-button-view-model, #like-button") || btn;
      if (!targetLike || !targetLike.parentElement) return;

      // Check if button is already placed directly above this like button
      if (targetLike.previousElementSibling && targetLike.previousElementSibling.classList.contains("clip-shorts-action-wrapper")) {
        return;
      }

      // Also ensure parent doesn't already contain our button
      if (targetLike.parentElement.querySelector(".clip-shorts-action-wrapper")) {
        return;
      }

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-shorts-action-wrapper";
      btnWrapper.title = "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)";
      btnWrapper.innerHTML = `
        <div class="clip-shorts-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const reel = targetLike.closest("ytd-reel-video-renderer") || document.querySelector("ytd-reel-video-renderer[is-active]") || document;
        const videoEl = reel.querySelector("video");

        let exactUrl = window.location.href;
        const shortLink = reel.querySelector("a[href*='/shorts/']");
        if (shortLink && shortLink.href) {
          exactUrl = shortLink.href;
        }

        triggerCapture(btnWrapper, videoEl, "youtube-shorts", exactUrl);
      });

      targetLike.insertAdjacentElement("beforebegin", btnWrapper);
    });

    // B) Fallback: If like buttons haven't populated yet, prepend to #actions column
    const actionBars = document.querySelectorAll(
      "ytd-reel-player-overlay-renderer #actions, #actions.ytd-reel-player-overlay-renderer, ytd-shorts #actions, ytd-reel-video-renderer #actions"
    );

    actionBars.forEach(bar => {
      if (bar.querySelector(".clip-shorts-action-wrapper")) return;

      const firstBtn = bar.querySelector("ytd-like-button-renderer, #like-button, like-button-view-model, ytd-toggle-button-renderer") || bar.firstElementChild;
      if (!firstBtn) return;

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-shorts-action-wrapper";
      btnWrapper.title = "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)";
      btnWrapper.innerHTML = `
        <div class="clip-shorts-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const reel = bar.closest("ytd-reel-video-renderer") || document.querySelector("ytd-reel-video-renderer[is-active]") || document;
        const videoEl = reel.querySelector("video");
        let exactUrl = window.location.href;
        const shortLink = reel.querySelector("a[href*='/shorts/']");
        if (shortLink && shortLink.href) {
          exactUrl = shortLink.href;
        }

        triggerCapture(btnWrapper, videoEl, "youtube-shorts", exactUrl);
      });

      bar.insertBefore(btnWrapper, firstBtn);
    });
  }

  /**
   * Helper: Extract exact TikTok video URL or 19-digit ID from container
   */
  function findTikTokVideoUrl(itemContainer) {
    if (!itemContainer) return window.location.href;

    // 1. Check direct video anchor
    const videoAnchor = itemContainer.querySelector("a[href*='/video/']");
    if (videoAnchor && videoAnchor.href) return videoAnchor.href;

    // 2. Check all anchors with /video/ in href
    const allLinks = itemContainer.querySelectorAll("a[href]");
    for (const a of allLinks) {
      if (a.href && a.href.includes("/video/")) {
        return a.href;
      }
    }

    // 3. Regex match for 18-20 digit TikTok video ID in container's HTML
    try {
      const html = itemContainer.innerHTML;
      const match = html.match(/\/video\/(\d{18,20})/);
      if (match && match[1]) {
        return `https://www.tiktok.com/@tiktok/video/${match[1]}`;
      }
      const idMatch = html.match(/data-video-id="(\d{18,20})"/);
      if (idMatch && idMatch[1]) {
        return `https://www.tiktok.com/@tiktok/video/${idMatch[1]}`;
      }
      const wrapperMatch = html.match(/xgwrapper-\d+-(\d{18,20})/);
      if (wrapperMatch && wrapperMatch[1]) {
        return `https://www.tiktok.com/@tiktok/video/${wrapperMatch[1]}`;
      }
    } catch (e) {}

    // 4. Standalone video page
    if (window.location.href.includes("/video/")) {
      return window.location.href;
    }

    return window.location.href;
  }

  /**
   * 2. TikTok Adapter (Single button inside right sidebar toolbar, zero duplicates)
   */
  function handleTikTok() {
    if (!window.location.hostname.includes("tiktok.com")) return;

    // A) TikTok Feed & Sidebar Action Items
    const actionContainers = document.querySelectorAll(
      "div[data-e2e='feed-action-item'], div[class*='DivActionItemContainer'], [class*='ActionItemContainer'], button[data-e2e='like-icon']"
    );

    actionContainers.forEach(container => {
      const parent = container.closest("div[class*='DivActionItemContainer'], [class*='ActionItemContainer']") || container.parentElement;
      if (!parent) return;

      const itemCard = parent.closest("[data-e2e='recommend-list-item-container'], [class*='DivItemContainer'], [data-e2e='feed-item'], article") || parent;

      // Prevent duplicate injection: strictly ONE button per item card
      if (itemCard.querySelector(".clip-tiktok-action-wrapper") || parent.querySelector(".clip-tiktok-action-wrapper")) return;

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-tiktok-action-wrapper";
      btnWrapper.title = "CLIP — Videoyu Panoya Kopyala";
      btnWrapper.innerHTML = `
        <div class="clip-tiktok-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const videoEl = itemCard.querySelector("video") || document.querySelector("video");
        const exactUrl = findTikTokVideoUrl(itemCard);

        triggerCapture(btnWrapper, videoEl, "tiktok", exactUrl);
      });

      // Insert cleanly in the vertical action bar above share or at top
      const shareIcon = parent.querySelector("[data-e2e='feed-share-icon'], [data-e2e='share-icon'], button[data-e2e='share-button']");
      if (shareIcon && shareIcon.parentElement === parent) {
        parent.insertBefore(btnWrapper, shareIcon);
      } else {
        parent.prepend(btnWrapper);
      }
    });

    // B) Single TikTok Video Page (/video/...) fallback
    if (window.location.pathname.includes("/video/")) {
      const videoContainer = document.querySelector("div[data-e2e='browse-video-container'], div[class*='DivVideoContainer'], div[class*='DivContainer']");
      if (videoContainer && !document.querySelector(".clip-tiktok-action-wrapper") && !document.querySelector(".clip-single-tiktok-btn")) {
        const singleBtn = document.createElement("div");
        singleBtn.className = "clip-single-tiktok-btn";
        singleBtn.title = "CLIP — Videoyu Panoya Kopyala";
        singleBtn.innerHTML = `
          <div class="clip-tiktok-action-circle">${ICONS.bolt}</div>
        `;
        singleBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
        singleBtn.addEventListener("mousedown", (e) => e.stopPropagation());
        singleBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const videoEl = videoContainer.querySelector("video") || document.querySelector("video");
          triggerCapture(singleBtn, videoEl, "tiktok", window.location.href);
        });
        videoContainer.appendChild(singleBtn);
      }
    }
  }

  /**
   * 3. Instagram Reels Adapter (Directly ABOVE the Like / Beğeni button, ZERO rogue buttons)
   */
  function handleInstagram() {
    if (!window.location.hostname.includes("instagram.com")) return;

    // 1. Instantly remove any rogue buttons that are not positioned right above a Like button
    document.querySelectorAll(".clip-reels-action-wrapper").forEach(el => {
      const next = el.nextElementSibling;
      const isAboveLike = next && (
        next.querySelector("svg[aria-label*='Beğen' i], svg[aria-label*='Like' i], svg[aria-label*='Begen' i]") ||
        next.matches("svg[aria-label*='Beğen' i], svg[aria-label*='Like' i], button, div[role='button']")
      );
      if (!isAboveLike) {
        el.remove();
      }
    });

    // 2. Query all Like icons (Turkish & English & universal heart SVG)
    const likeIcons = document.querySelectorAll(
      "svg[aria-label='Beğen'], svg[aria-label='Like'], svg[aria-label='Beğenmekten Vazgeç'], svg[aria-label='Unlike'], svg[aria-label*='Beğen' i], svg[aria-label*='Like' i], svg[aria-label*='Begen' i]"
    );

    likeIcons.forEach(svg => {
      // Ignore comment likes (comments are inside lists or have tiny dimensions)
      if (svg.closest("ul, [role='list']") || (svg.clientWidth && svg.clientWidth < 16)) return;

      const likeBtn = svg.closest("button, div[role='button'], span[role='button']") || svg.parentElement;
      if (!likeBtn) return;

      // Ensure this like button belongs to a container with a VIDEO
      let postCard = likeBtn.closest("article, div[role='dialog'], section, main, [data-blade-container]");
      let videoEl = postCard ? postCard.querySelector("video") : null;

      // If not found in immediate postCard, search upward levels for video
      if (!videoEl) {
        let parent = likeBtn.parentElement;
        for (let i = 0; i < 7; i++) {
          if (!parent || parent === document.body) break;
          videoEl = parent.querySelector("video");
          if (videoEl) {
            postCard = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }

      // Strictly ignore photo posts or non-video containers
      if (!videoEl) return;

      // Determine the exact action item unit in the Reels sidebar
      // On Reels, the button is often wrapped together with the like count span
      let targetUnit = likeBtn;
      if (likeBtn.parentElement && likeBtn.parentElement.parentElement) {
        const parentSiblings = likeBtn.parentElement.parentElement.children;
        if (parentSiblings.length >= 2 && likeBtn.parentElement.childElementCount <= 3) {
          targetUnit = likeBtn.parentElement;
        }
      }

      // Check if already injected right above this like button
      if (targetUnit.previousElementSibling && targetUnit.previousElementSibling.classList.contains("clip-reels-action-wrapper")) {
        return;
      }
      if (targetUnit.parentElement && targetUnit.parentElement.querySelector(".clip-reels-action-wrapper")) {
        return;
      }

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-reels-action-wrapper";
      btnWrapper.title = "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)";
      btnWrapper.innerHTML = `
        <div class="clip-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        let exactUrl = window.location.href;
        const reelAnchor = postCard ? postCard.querySelector("a[href*='/reel/'], a[href*='/p/']") : null;
        if (reelAnchor && reelAnchor.href) {
          exactUrl = reelAnchor.href;
        }

        triggerCapture(btnWrapper, videoEl, "instagram", exactUrl);
      });

      // Insert directly ABOVE the Like button
      targetUnit.insertAdjacentElement("beforebegin", btnWrapper);
    });
  }

  /**
   * 4. X / Twitter Adapter
   */
  function handleTwitter() {
    if (!window.location.hostname.includes("x.com") && !window.location.hostname.includes("twitter.com")) return;

    const actionGroups = document.querySelectorAll("div[role='group'][id*='id__'], div[role='group']");
    actionGroups.forEach(group => {
      const tweet = group.closest("article");
      if (!tweet || !tweet.querySelector("video") || group.querySelector(".clip-x-action-wrapper")) return;

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-x-action-wrapper";
      btnWrapper.title = "CLIP — Videoyu Panoya Kopyala";
      btnWrapper.innerHTML = `
        <div class="clip-x-action-circle">${ICONS.bolt}</div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const videoEl = tweet.querySelector("video");
        let exactUrl = window.location.href;
        const statusAnchor = tweet.querySelector("a[href*='/status/']");
        if (statusAnchor && statusAnchor.href) {
          exactUrl = statusAnchor.href;
        }

        triggerCapture(btnWrapper, videoEl, "x", exactUrl);
      });

      group.appendChild(btnWrapper);
    });
  }

  function formatSecondsToTime(sec) {
    if (isNaN(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function parseTimeToSeconds(str) {
    if (!str) return 0;
    const parts = String(str).trim().split(":");
    if (parts.length === 2) {
      return (parseInt(parts[0], 10) || 0) * 60 + (parseFloat(parts[1]) || 0);
    }
    if (parts.length === 3) {
      return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseFloat(parts[2]) || 0);
    }
    return parseFloat(str) || 0;
  }

  /**
   * 5. Regular YouTube Video Watch Page (With Interactive Time Range Trimmer)
   */
  function handleRegularYouTube() {
    if (window.location.pathname.includes("/shorts")) return;

    const targetActions = document.querySelector("#top-level-buttons-computed, ytd-menu-renderer #top-level-buttons");
    if (targetActions && !targetActions.querySelector(".clip-yt-action-wrapper")) {
      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-yt-action-wrapper";
      btnWrapper.title = "CLIP — Video Zaman Aralığı Kırp & Panoya Kopyala";
      btnWrapper.innerHTML = `
        <button class="clip-yt-pill-btn">
          <span class="clip-ext-icon-bolt">${ICONS.bolt}</span>
          <span class="clip-yt-text">CLIP</span>
        </button>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const videoEl = document.querySelector("#movie_player video, video");
        openYouTubeTrimmerModal(videoEl, window.location.href, btnWrapper);
      });

      targetActions.appendChild(btnWrapper);
    }
  }

  /**
   * YouTube Interactive Time Range Trimmer Modal
   */
  function openYouTubeTrimmerModal(videoEl, exactUrl, sourceBtn) {
    const existing = document.getElementById("clip-youtube-trimmer-modal");
    if (existing) existing.remove();

    const totalDuration = (videoEl && !isNaN(videoEl.duration) && videoEl.duration > 0) ? Math.floor(videoEl.duration) : 600;
    const curTime = (videoEl && !isNaN(videoEl.currentTime)) ? Math.floor(videoEl.currentTime) : 0;

    let initialStart = curTime > 15 ? Math.max(0, curTime - 15) : 0;
    let initialEnd = Math.min(totalDuration, initialStart + 30);
    if (initialEnd - initialStart < 5) {
      initialEnd = Math.min(totalDuration, initialStart + 5);
    }

    const videoTitle = document.querySelector("h1.ytd-watch-metadata yt-formatted-string, #title h1, h1")?.textContent?.trim() || document.title || "YouTube Video";

    const overlay = document.createElement("div");
    overlay.id = "clip-youtube-trimmer-modal";
    overlay.className = "clip-trimmer-overlay";

    overlay.innerHTML = `
      <div class="clip-trimmer-card">
        <div class="clip-trimmer-header">
          <div class="clip-trimmer-header-left">
            <div class="clip-trimmer-badge-icon">${ICONS.bolt}</div>
            <div>
              <h3 class="clip-trimmer-title">CLIP Video Kırpıcı</h3>
              <p class="clip-trimmer-subtitle">WhatsApp & Discord için istediğin saniyeleri seç ve anında kopyala</p>
            </div>
          </div>
          <button class="clip-trimmer-close-btn" id="clip-modal-close-btn" title="Kapat">${ICONS.close}</button>
        </div>

        <div class="clip-trimmer-video-info">
          <span class="clip-trimmer-video-title" title="${videoTitle}">🎬 ${videoTitle}</span>
          <span class="clip-trimmer-current-play" id="clip-cur-time-display">🔴 Oynatma: ${formatSecondsToTime(curTime)}</span>
        </div>

        <div class="clip-timeline-container">
          <div class="clip-timeline-track-wrap">
            <div class="clip-timeline-base-track"></div>
            <div class="clip-timeline-active-highlight" id="clip-timeline-hl"></div>
            <input type="range" class="clip-range-slider" id="clip-slider-start" min="0" max="${totalDuration}" step="1" value="${initialStart}">
            <input type="range" class="clip-range-slider" id="clip-slider-end" min="0" max="${totalDuration}" step="1" value="${initialEnd}">
          </div>
        </div>

        <div class="clip-time-inputs-grid">
          <div class="clip-time-card">
            <div class="clip-time-card-label">
              <span>Başlangıç</span>
              <button class="clip-time-sync-btn" id="clip-sync-start-btn">📍 Oynatıcıdan Al</button>
            </div>
            <div class="clip-time-input-group">
              <input type="text" class="clip-time-val-input" id="clip-start-val" value="${formatSecondsToTime(initialStart)}">
            </div>
          </div>

          <div class="clip-time-card">
            <div class="clip-time-card-label">
              <span>Bitiş</span>
              <button class="clip-time-sync-btn" id="clip-sync-end-btn">📍 Oynatıcıdan Al</button>
            </div>
            <div class="clip-time-input-group">
              <input type="text" class="clip-time-val-input" id="clip-end-val" value="${formatSecondsToTime(initialEnd)}">
            </div>
          </div>
        </div>

        <div class="clip-duration-status-row" id="clip-dur-status">
          <span id="clip-dur-text">⏱️ Seçilen Süre: 30 sn</span>
          <span id="clip-dur-badge">✓ WhatsApp / Discord Hızlı Kopyalama</span>
        </div>

        <div class="clip-presets-container">
          <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Hızlı Seçim:</span>
          <button class="clip-preset-chip" data-preset="prev15">⚡ Son 15 sn</button>
          <button class="clip-preset-chip" data-preset="prev30">⚡ Son 30 sn</button>
          <button class="clip-preset-chip" data-preset="prev60">⚡ Son 60 sn</button>
          <button class="clip-preset-chip" data-preset="next30">⚡ Sonraki 30 sn</button>
        </div>

        <div class="clip-trimmer-actions">
          <button class="clip-preview-play-btn" id="clip-trimmer-preview-btn" title="Seçilen aralığı YouTube oynatıcıda oynat">
            ▶️ Önizle
          </button>
          <button class="clip-confirm-copy-btn" id="clip-trimmer-copy-btn">
            ${ICONS.bolt}
            <span>Panoya Kopyala (Ctrl+V)</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector("#clip-modal-close-btn");
    const sliderStart = overlay.querySelector("#clip-slider-start");
    const sliderEnd = overlay.querySelector("#clip-slider-end");
    const highlight = overlay.querySelector("#clip-timeline-hl");
    const startValInput = overlay.querySelector("#clip-start-val");
    const endValInput = overlay.querySelector("#clip-end-val");
    const durStatusRow = overlay.querySelector("#clip-dur-status");
    const durText = overlay.querySelector("#clip-dur-text");
    const durBadge = overlay.querySelector("#clip-dur-badge");
    const syncStartBtn = overlay.querySelector("#clip-sync-start-btn");
    const syncEndBtn = overlay.querySelector("#clip-sync-end-btn");
    const previewBtn = overlay.querySelector("#clip-trimmer-preview-btn");
    const copyBtn = overlay.querySelector("#clip-trimmer-copy-btn");
    const curTimeDisplay = overlay.querySelector("#clip-cur-time-display");

    function updateRangeUI(startSec, endSec) {
      if (startSec > endSec) {
        startSec = endSec - 1;
        if (startSec < 0) startSec = 0;
      }
      const dur = endSec - startSec;

      sliderStart.value = startSec;
      sliderEnd.value = endSec;

      const leftPct = (startSec / totalDuration) * 100;
      const widthPct = Math.max(0.5, ((endSec - startSec) / totalDuration) * 100);
      highlight.style.left = `${leftPct}%`;
      highlight.style.width = `${widthPct}%`;

      startValInput.value = formatSecondsToTime(startSec);
      endValInput.value = formatSecondsToTime(endSec);

      durText.textContent = `⏱️ Seçilen Süre: ${Math.round(dur)} sn (${formatSecondsToTime(dur)})`;

      if (dur > 60) {
        durStatusRow.className = "clip-duration-status-row pro-warning";
        durBadge.textContent = "⭐ 1 dk üstü (CLIP PRO Gerekir)";
      } else {
        durStatusRow.className = "clip-duration-status-row";
        durBadge.textContent = "✓ WhatsApp / Discord Hızlı Kopyalama";
      }
    }

    updateRangeUI(initialStart, initialEnd);

    // Live sync with player time if playing
    const timeInterval = setInterval(() => {
      if (videoEl && !isNaN(videoEl.currentTime)) {
        curTimeDisplay.textContent = `🔴 Oynatma: ${formatSecondsToTime(Math.floor(videoEl.currentTime))}`;
      }
    }, 500);

    const cleanupModal = () => {
      clearInterval(timeInterval);
      overlay.remove();
    };

    closeBtn.addEventListener("click", cleanupModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanupModal();
    });

    sliderStart.addEventListener("input", () => {
      let s = parseFloat(sliderStart.value);
      let e = parseFloat(sliderEnd.value);
      if (s >= e) s = Math.max(0, e - 1);
      updateRangeUI(s, e);
    });

    sliderEnd.addEventListener("input", () => {
      let s = parseFloat(sliderStart.value);
      let e = parseFloat(sliderEnd.value);
      if (e <= s) e = Math.min(totalDuration, s + 1);
      updateRangeUI(s, e);
    });

    startValInput.addEventListener("change", () => {
      let s = parseTimeToSeconds(startValInput.value);
      let e = parseFloat(sliderEnd.value);
      if (s >= e) s = Math.max(0, e - 1);
      updateRangeUI(s, e);
    });

    endValInput.addEventListener("change", () => {
      let s = parseFloat(sliderStart.value);
      let e = parseTimeToSeconds(endValInput.value);
      if (e <= s) e = Math.min(totalDuration, s + 1);
      updateRangeUI(s, e);
    });

    syncStartBtn.addEventListener("click", () => {
      if (videoEl && !isNaN(videoEl.currentTime)) {
        let s = Math.floor(videoEl.currentTime);
        let e = parseFloat(sliderEnd.value);
        if (s >= e) e = Math.min(totalDuration, s + 30);
        updateRangeUI(s, e);
      }
    });

    syncEndBtn.addEventListener("click", () => {
      if (videoEl && !isNaN(videoEl.currentTime)) {
        let e = Math.floor(videoEl.currentTime);
        let s = parseFloat(sliderStart.value);
        if (e <= s) s = Math.max(0, e - 30);
        updateRangeUI(s, e);
      }
    });

    // Preset chips
    overlay.querySelectorAll(".clip-preset-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const type = chip.getAttribute("data-preset");
        const now = (videoEl && !isNaN(videoEl.currentTime)) ? Math.floor(videoEl.currentTime) : parseFloat(sliderStart.value);
        let s = 0;
        let e = 30;

        if (type === "prev15") {
          s = Math.max(0, now - 15);
          e = now;
        } else if (type === "prev30") {
          s = Math.max(0, now - 30);
          e = now;
        } else if (type === "prev60") {
          s = Math.max(0, now - 60);
          e = now;
        } else if (type === "next30") {
          s = now;
          e = Math.min(totalDuration, now + 30);
        }

        updateRangeUI(s, e);
      });
    });

    // Preview
    let previewCheckHandler = null;
    previewBtn.addEventListener("click", () => {
      if (!videoEl) return;
      const s = parseTimeToSeconds(startValInput.value);
      const e = parseTimeToSeconds(endValInput.value);

      if (previewCheckHandler) {
        videoEl.removeEventListener("timeupdate", previewCheckHandler);
      }

      videoEl.currentTime = s;
      videoEl.play();
      previewBtn.textContent = "⏸️ Oynatılıyor...";

      previewCheckHandler = () => {
        if (videoEl.currentTime >= e) {
          videoEl.pause();
          previewBtn.textContent = "▶️ Önizle";
          videoEl.removeEventListener("timeupdate", previewCheckHandler);
          previewCheckHandler = null;
        }
      };
      videoEl.addEventListener("timeupdate", previewCheckHandler);
    });

    // Copy to Clipboard Action
    copyBtn.addEventListener("click", async () => {
      const s = parseTimeToSeconds(startValInput.value);
      const e = parseTimeToSeconds(endValInput.value);

      if (e <= s) {
        showDynamicIslandMessage("⚠️ Bitiş zamanı başlangıçtan büyük olmalıdır.");
        return;
      }

      copyBtn.disabled = true;
      copyBtn.innerHTML = `${ICONS.spinner} <span>Kırpılıyor ve Hazırlanıyor...</span>`;

      cleanupModal();
      triggerCapture(sourceBtn || copyBtn, videoEl, "youtube", exactUrl, s, e);
    });
  }

  /**
   * Trigger Video Capture & Windows Clipboard Copy
   */
  async function triggerCapture(targetWrapper, videoEl, platform, exactUrl, startTime, endTime) {
    console.log("⚡ [CLIP] Capturing video...", platform, exactUrl, startTime, endTime);

    const hasTimeRange = startTime !== undefined && startTime !== null && endTime !== undefined && endTime !== null;
    const isPro = await checkIsPro();

    if (hasTimeRange) {
      const segDuration = endTime - startTime;
      if (!isPro && segDuration > 61) {
        showProModal(Math.round(segDuration), targetWrapper, videoEl, platform, exactUrl);
        return;
      }
    } else {
      if (!isPro && videoEl && !isNaN(videoEl.duration) && videoEl.duration > 61) {
        showProModal(Math.round(videoEl.duration), targetWrapper, videoEl, platform, exactUrl);
        return;
      }
    }

    if (targetWrapper.getAttribute("data-loading") === "true") return;
    targetWrapper.setAttribute("data-loading", "true");

    const circle = targetWrapper.querySelector(".clip-shorts-action-circle, .clip-tiktok-action-circle, .clip-action-circle, .clip-x-action-circle");
    const boltIcon = targetWrapper.querySelector(".clip-ext-icon-bolt");

    if (circle) circle.innerHTML = ICONS.spinner;
    if (boltIcon) boltIcon.innerHTML = ICONS.spinner;

    const targetUrl = exactUrl || window.location.href;
    const domSrc = videoEl ? (videoEl.currentSrc || videoEl.src) : null;
    const title = document.title || "Video";

    const safetyTimeout = setTimeout(() => {
      if (targetWrapper.getAttribute("data-loading") === "true") {
        targetWrapper.removeAttribute("data-loading");
        resetButtonState(targetWrapper);
        showDynamicIslandMessage("⚠️ İşlem zaman aşımına uğradı. Sayfayı yenileyip tekrar deneyin.");
      }
    }, 28000);

    try {
      chrome.runtime.sendMessage(
        {
          action: "RESOLVE_VIDEO",
          url: targetUrl,
          domSrc: domSrc,
          title: title,
          startTime: startTime,
          endTime: endTime
        },
        async (response) => {
          clearTimeout(safetyTimeout);
          targetWrapper.removeAttribute("data-loading");

          if (response && response.isProRequired) {
            resetButtonState(targetWrapper);
            showProModal(response.duration || 60, targetWrapper, videoEl, platform, exactUrl);
            return;
          }

          if (chrome.runtime.lastError || !response || !response.success) {
            const errText = (response && response.error) ? response.error : (chrome.runtime.lastError ? chrome.runtime.lastError.message : "Video yakalanamadı. 'start_clip.bat' servisini kontrol edin.");
            showDynamicIslandMessage(`⚠️ ${errText}`);
            resetButtonState(targetWrapper);
            return;
          }

          if (circle) circle.innerHTML = ICONS.check;
          if (boltIcon) boltIcon.innerHTML = ICONS.check;

          let preloadedFile = null;
          if (response.videoUrl) {
            try {
              const bRes = await fetch(response.videoUrl);
              const blob = await bRes.blob();
              preloadedFile = new File([blob], response.filename || "video.mp4", { type: "video/mp4" });
            } catch (err) {
              console.warn("[CLIP] Blob preload:", err);
            }
          }

          renderDynamicIsland(targetWrapper, response.videoUrl, platform, response.filename, response.filePath, preloadedFile);
        }
      );
    } catch (err) {
      clearTimeout(safetyTimeout);
      targetWrapper.removeAttribute("data-loading");
      resetButtonState(targetWrapper);
      showDynamicIslandMessage("⚠️ Eklenti güncellendi. Sayfayı yenileyip (Ctrl+F5) tekrar deneyin.");
    }
  }

  function resetButtonState(targetWrapper) {
    const circle = targetWrapper.querySelector(".clip-shorts-action-circle, .clip-tiktok-action-circle, .clip-action-circle, .clip-x-action-circle");
    const boltIcon = targetWrapper.querySelector(".clip-ext-icon-bolt");

    if (circle) circle.innerHTML = ICONS.bolt;
    if (boltIcon) boltIcon.innerHTML = ICONS.bolt;
  }

  /**
   * Render Unified Apple Dynamic Island Capsule at Top-Center
   */
  let islandDismissTimeout = null;

  function renderDynamicIsland(targetWrapper, videoUrl, platform, customFilename, filePath, preloadedFile) {
    const existing = document.querySelector(".clip-portal-capsule");
    if (existing) existing.remove();

    if (islandDismissTimeout) clearTimeout(islandDismissTimeout);

    const capsule = document.createElement("div");
    capsule.className = "clip-portal-capsule";

    capsule.addEventListener("pointerdown", (e) => e.stopPropagation());
    capsule.addEventListener("mousedown", (e) => e.stopPropagation());
    capsule.addEventListener("click", (e) => e.stopPropagation());

    const filename = customFilename || `CLIP_${platform || "video"}_${Date.now()}.mp4`;

    // 1. Status Indicator
    const statusSpan = document.createElement("span");
    statusSpan.className = "clip-island-status";
    statusSpan.innerHTML = `${ICONS.check} <span>Panoda Hazır (Ctrl+V)</span>`;

    // 2. Divider
    const div1 = document.createElement("span");
    div1.className = "clip-island-divider";

    // 3. Open Folder in Explorer Button
    const folderBtn = document.createElement("button");
    folderBtn.className = "clip-portal-icon-btn";
    folderBtn.title = "Klipler Klasörünü Aç (Windows Gezgini)";
    folderBtn.innerHTML = ICONS.folder;
    folderBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fetch("http://127.0.0.1:48123/open_file?path=" + encodeURIComponent(filePath || "")).catch(() => {
        fetch("http://127.0.0.1:48123/open_folder").catch(() => {});
      });
      statusSpan.innerHTML = `${ICONS.check} <span>Klasör Açıldı!</span>`;
    });

    // 4. Divider
    const div2 = document.createElement("span");
    div2.className = "clip-island-divider";

    // 5. Drag Handle Button
    const dragBtn = document.createElement("div");
    dragBtn.className = "clip-portal-drag-btn";
    dragBtn.setAttribute("draggable", "true");
    dragBtn.title = "WhatsApp veya Discord'a doğrudan sürükleyip bırakın!";
    dragBtn.innerHTML = `${ICONS.drag} <span>Sürükle</span>`;

    dragBtn.addEventListener("dragstart", (e) => {
      dragBtn.classList.add("dragging");
      if (preloadedFile) {
        e.dataTransfer.items.add(preloadedFile);
      }
      e.dataTransfer.setData("DownloadURL", `video/mp4:${filename}:${videoUrl}`);
      e.dataTransfer.effectAllowed = "copyMove";
    });

    dragBtn.addEventListener("dragend", () => {
      dragBtn.classList.remove("dragging");
    });

    // 6. Divider
    const div3 = document.createElement("span");
    div3.className = "clip-island-divider";

    // 7. Download Button
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "clip-portal-icon-btn";
    downloadBtn.title = "MP4 İndir";
    downloadBtn.innerHTML = ICONS.download;
    downloadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({
        action: "TRIGGER_DOWNLOAD",
        videoUrl: videoUrl,
        platform: platform
      });
      statusSpan.innerHTML = `${ICONS.check} <span>İndirme Başlatıldı!</span>`;
    });

    // 8. Close Button
    const closeBtn = document.createElement("button");
    closeBtn.className = "clip-portal-icon-btn clip-portal-close-btn";
    closeBtn.title = "Kapat";
    closeBtn.innerHTML = ICONS.close;
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissCapsule(capsule, targetWrapper);
    });

    capsule.appendChild(statusSpan);
    capsule.appendChild(div1);
    capsule.appendChild(folderBtn);
    capsule.appendChild(div2);
    capsule.appendChild(dragBtn);
    capsule.appendChild(div3);
    capsule.appendChild(downloadBtn);
    capsule.appendChild(closeBtn);

    document.body.appendChild(capsule);

    capsule.addEventListener("mouseenter", () => {
      if (islandDismissTimeout) clearTimeout(islandDismissTimeout);
    });
    capsule.addEventListener("mouseleave", () => {
      startDismissTimer(capsule, targetWrapper, 4000);
    });

    startDismissTimer(capsule, targetWrapper, 7000);
  }

  function startDismissTimer(capsule, targetWrapper, delay) {
    if (islandDismissTimeout) clearTimeout(islandDismissTimeout);
    islandDismissTimeout = setTimeout(() => {
      dismissCapsule(capsule, targetWrapper);
    }, delay);
  }

  function dismissCapsule(capsule, targetWrapper) {
    if (document.body.contains(capsule)) {
      capsule.style.opacity = "0";
      capsule.style.transform = "translate(-50%, -20px) scale(0.96)";
      capsule.style.transition = "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      setTimeout(() => {
        capsule.remove();
        if (targetWrapper) resetButtonState(targetWrapper);
      }, 300);
    }
  }

  function showDynamicIslandMessage(message) {
    const existing = document.querySelector(".clip-portal-capsule");
    if (existing) existing.remove();

    const capsule = document.createElement("div");
    capsule.className = "clip-portal-capsule";
    capsule.innerHTML = `
      <span class="clip-island-status" style="color: #f87171;">
        <span>${message}</span>
      </span>
      <span class="clip-island-divider"></span>
      <button class="clip-portal-icon-btn clip-portal-close-btn" title="Kapat">${ICONS.close}</button>
    `;

    capsule.querySelector(".clip-portal-close-btn").addEventListener("click", () => capsule.remove());
    document.body.appendChild(capsule);

    setTimeout(() => {
      dismissCapsule(capsule, null);
    }, 4500);
  }

  function showProModal(durationSec, targetWrapper, videoEl, platform, exactUrl) {
    const existing = document.getElementById("clip-pro-modal-overlay");
    if (existing) existing.remove();

    const formattedTime = durationSec ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}` : "1:00+";

    const overlay = document.createElement("div");
    overlay.id = "clip-pro-modal-overlay";
    overlay.className = "clip-pro-overlay";

    overlay.innerHTML = `
      <div class="clip-pro-card">
        <div class="clip-pro-badge">${ICONS.star} DİKEY KISA İÇERİK PLANI (MAKS. 60 SN)</div>
        <h3 class="clip-pro-title">Bu Video 1 Dakikadan Uzun (${formattedTime})</h3>
        <p class="clip-pro-desc">
          CLIP ücretsiz sürümü <strong>TikTok, YouTube Shorts, Instagram Reels</strong> gibi dikey kısa videolar için optimize edilmiştir (maksimum 60 saniye).
        </p>
        
        <div class="clip-pro-features">
          <div class="clip-pro-feature-item">
            <span class="clip-pro-feature-icon">✓</span>
            <span>1 dakikadan uzun videolar, podcastler ve uzun klipler</span>
          </div>
          <div class="clip-pro-feature-item">
            <span class="clip-pro-feature-icon">✓</span>
            <span>1080p Ultra HD doğrudan panoya kopyalama</span>
          </div>
          <div class="clip-pro-feature-item">
            <span class="clip-pro-feature-icon">✓</span>
            <span>Sınırsız eşzamanlı dönüştürme ve hızlı işleme</span>
          </div>
        </div>

        <div class="clip-pro-actions">
          <button class="clip-pro-primary-btn" id="clip-pro-buy-btn">
            ⭐ CLIP PRO'ya Yükselt
          </button>
          <button class="clip-pro-trial-btn" id="clip-pro-trial-btn">
            🎁 PRO Modunu Aktif Et (Test / Geliştirici Modu)
          </button>
          <button class="clip-pro-cancel-btn" id="clip-pro-close-btn">
            Şimdilik Kapat
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#clip-pro-close-btn").addEventListener("click", () => {
      overlay.remove();
      if (targetWrapper) resetButtonState(targetWrapper);
    });

    overlay.querySelector("#clip-pro-buy-btn").addEventListener("click", () => {
      showDynamicIslandMessage("🚀 CLIP PRO yakında! Şimdilik 'PRO Modunu Aktif Et' butonuna basarak deneyebilirsiniz.");
    });

    overlay.querySelector("#clip-pro-trial-btn").addEventListener("click", async () => {
      const data = await chrome.storage.local.get("settings");
      const current = data.settings || {};
      current.isPro = true;
      await chrome.storage.local.set({ settings: current });
      overlay.remove();
      showDynamicIslandMessage("✨ CLIP PRO aktif edildi! Video hazırlanıyor...");

      if (targetWrapper) {
        triggerCapture(targetWrapper, videoEl, platform, exactUrl);
      }
    });
  }

  function scanAll() {
    handleYouTubeShorts();
    handleTikTok();
    handleInstagram();
    handleTwitter();
    handleRegularYouTube();
  }

  scanAll();
  window.__CLIP_INTERVAL__ = setInterval(scanAll, 1000);

  window.__CLIP_OBSERVER__ = new MutationObserver(() => scanAll());
  window.__CLIP_OBSERVER__.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("yt-navigate-finish", scanAll);
  window.addEventListener("popstate", scanAll);

})();
