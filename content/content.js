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
   * Helper: Find the actively playing / centered TikTok video element
   */
  function getActiveTikTokVideoElement() {
    const videos = Array.from(document.querySelectorAll("video"));
    if (videos.length === 0) return null;
    if (videos.length === 1) return videos[0];

    // Priority 1: video that is actively unpaused and playing
    const playing = videos.find(v => !v.paused && v.readyState >= 2 && v.currentTime > 0);
    if (playing) return playing;

    // Priority 2: video closest to vertical center of viewport
    const centerY = window.innerHeight / 2;
    let best = null;
    let minDiff = Infinity;
    for (const v of videos) {
      const rect = v.getBoundingClientRect();
      if (rect.height < 50 || rect.width < 50) continue;
      const mid = rect.top + rect.height / 2;
      const diff = Math.abs(mid - centerY);
      if (diff < minDiff) {
        minDiff = diff;
        best = v;
      }
    }
    return best || videos[0];
  }

  /**
   * Helper: Extract exact TikTok video URL or 19-digit ID from container or active video
   */
  function findTikTokVideoUrl(targetEl) {
    // 1. Direct standalone video URL in address bar (clean canonical URL without query string)
    if (window.location.href.includes("/video/")) {
      const m = window.location.href.match(/https?:\/\/(?:www\.)?tiktok\.com\/@[^/?#]+\/video\/\d+/);
      if (m) return m[0];
      return window.location.href;
    }

    // 2. Check all inputs/textareas on page (e.g. TikTok share/copy link input in right sidebar)
    const allInputs = document.querySelectorAll("input, textarea");
    for (const inp of allInputs) {
      const val = (inp.value || inp.getAttribute("value") || "").trim();
      if (val.includes("tiktok.com") && val.includes("/video/")) {
        const m = val.match(/https?:\/\/(?:www\.)?tiktok\.com\/@[^/]+\/video\/(\d{18,20})/);
        if (m) return m[0];
        const m2 = val.match(/\/video\/(\d{18,20})/);
        if (m2) return `https://www.tiktok.com/@tiktok/video/${m2[1]}`;
      }
    }

    // 3. Find active playing video and inspect its hierarchy
    const activeVideo = getActiveTikTokVideoElement();
    const candidateContainers = [
      targetEl ? targetEl.closest("article, [data-e2e='recommend-list-item-container'], [data-e2e='browse-video-container'], [class*='DivItemContainer'], [class*='ItemContainer']") : null,
      activeVideo ? activeVideo.closest("article, [data-e2e='recommend-list-item-container'], [data-e2e='browse-video-container'], [class*='DivItemContainer'], [class*='ItemContainer'], section") : null,
      activeVideo ? activeVideo.parentElement : null
    ];

    for (const container of candidateContainers) {
      if (!container) continue;

      // 3a. Check direct video anchors inside container
      const videoAnchor = container.querySelector("a[href*='/video/']");
      if (videoAnchor && videoAnchor.href) return videoAnchor.href;

      // 3b. Check all anchors inside container
      for (const a of container.querySelectorAll("a[href]")) {
        if (a.href && a.href.includes("/video/")) return a.href;
      }

      // 3c. Check HTML attributes & regex for 18-20 digit TikTok ID
      try {
        const html = container.outerHTML;
        const match = html.match(/\/video\/(\d{18,20})/);
        if (match && match[1]) {
          const userA = container.querySelector("a[href*='/@']");
          const uMatch = userA ? userA.href.match(/@([^/?]+)/) : null;
          const uName = uMatch ? `@${uMatch[1]}` : "@tiktok";
          return `https://www.tiktok.com/${uName}/video/${match[1]}`;
        }
        const idMatch = html.match(/data-video-id="(\d{18,20})"/);
        if (idMatch && idMatch[1]) {
          return `https://www.tiktok.com/@tiktok/video/${idMatch[1]}`;
        }
        const xgMatch = html.match(/xgwrapper-\d+-(\d{18,20})/);
        if (xgMatch && xgMatch[1]) {
          return `https://www.tiktok.com/@tiktok/video/${xgMatch[1]}`;
        }
      } catch (e) {}

      // 3d. Inspect React Fiber on activeVideo / container
      try {
        let cur = activeVideo || container;
        for (let step = 0; step < 8 && cur; step++) {
          const fiberKey = Object.keys(cur).find(k => k.startsWith("__reactFiber$") || k.startsWith("__reactProps$"));
          if (fiberKey && cur[fiberKey]) {
            let f = cur[fiberKey];
            for (let depth = 0; depth < 6 && f; depth++) {
              const props = f.memoizedProps || f.props;
              if (props) {
                const s = JSON.stringify(props, (k, v) => (typeof v === 'string' || typeof v === 'number' ? v : (typeof v === 'object' && v !== null && k !== 'children' ? v : undefined)));
                const m = s && (s.match(/"(?:id|itemId|videoId)":"(\d{18,20})"/i) || s.match(/\/video\/(\d{18,20})/));
                if (m && m[1]) {
                  return `https://www.tiktok.com/@tiktok/video/${m[1]}`;
                }
              }
              f = f.return;
            }
          }
          cur = cur.parentElement;
        }
      } catch (e) {}
    }

    // 4. Check all visible anchors on screen with /video/ closest to viewport center
    const allVideoAnchors = Array.from(document.querySelectorAll("a[href*='/video/']"));
    if (allVideoAnchors.length > 0) {
      const centerY = window.innerHeight / 2;
      let bestA = null;
      let minDiff = Infinity;
      for (const a of allVideoAnchors) {
        const r = a.getBoundingClientRect();
        const diff = Math.abs(r.top + r.height / 2 - centerY);
        if (diff < minDiff) {
          minDiff = diff;
          bestA = a;
        }
      }
      if (bestA && bestA.href) return bestA.href;
    }

    // 5. Check rehydration state script
    try {
      const script = document.getElementById("__UNIVERSAL_DATA_FOR_REHYDRATION__") || document.getElementById("SIGI_STATE");
      if (script && script.textContent) {
        const ids = Array.from(script.textContent.matchAll(/"(?:id|itemId)":"(\d{18,20})"/g), m => m[1]);
        if (ids.length > 0) {
          return `https://www.tiktok.com/@tiktok/video/${ids[0]}`;
        }
      }
    } catch (e) {}

    // 6. Regex search in body HTML
    try {
      const bodyHtml = document.body.innerHTML;
      const bMatch = bodyHtml.match(/https?:\/\/(?:www\.)?tiktok\.com\/@[^"'\s<>]+\/video\/(\d{18,20})/);
      if (bMatch) return bMatch[0];
      const anyMatch = bodyHtml.match(/\/video\/(\d{18,20})/);
      if (anyMatch && anyMatch[1]) {
        return `https://www.tiktok.com/@tiktok/video/${anyMatch[1]}`;
      }
    } catch (e) {}

    return window.location.href;
  }

  /**
   * Helper: Check if element is inside TikTok comments drawer, list or comment card
   */
  function isCommentElement(el) {
    if (!el) return false;
    return !!el.closest("[data-e2e*='comment-item'], [data-e2e*='comment-level'], [class*='DivCommentItem'], [class*='CommentItem'], [class*='comment-item'], [class*='comment-level'], [class*='ReplyItem'], [data-e2e*='reply-item'], [class*='CommentList'], [data-e2e*='comment-list']");
  }

  /**
   * Helper: Check if an element is a real TikTok standalone vertical navigation arrow button
   */
  function isValidTikTokArrow(el) {
    if (!el) return false;
    if (el.classList.contains("clip-tiktok-action-wrapper") || el.classList.contains("clip-tiktok-fixed-btn")) return false;

    // 0. Must be visible
    try {
      const comp = window.getComputedStyle(el);
      if (comp.display === "none" || comp.visibility === "hidden" || comp.opacity === "0") {
        return false;
      }
    } catch (e) {}

    // 1. Must contain an SVG
    if (!el.querySelector("svg")) return false;

    // 2. Must NEVER be inside comment cards
    if (isCommentElement(el)) return false;

    // 3. Must NOT be in search bar, header, nav, or video player controls
    // NOTE: NEVER check class*='search' or data-e2e*='search' on ancestors,
    // because videos opened from search have search-level parent containers!
    if (el.closest("header, [role='banner'], nav, form, [role='search'], [data-e2e='search-box'], [class*='SearchBox'], [class*='SearchBar']")) {
      return false;
    }
    if (el.querySelector("input, textarea")) return false;

    if (el.closest("[data-e2e*='video-control'], [class*='control' i], [class*='seekbar' i], [class*='SeekBar']")) {
      return false;
    }

    // 4. Must NOT be Like, Bookmark, Share, Audio/Mute, Play/Pause, Fullscreen, Close, More
    const allAttrs = ((el.className || "") + " " + (el.getAttribute("data-e2e") || "") + " " + (el.getAttribute("aria-label") || "") + " " + (el.title || "")).toLowerCase();
    if (/like|beğen|bookmark|kaydet|favorite|favori|share|paylaş|heart|mute|ses|volume|play|oynat|fullscreen|tam ekran|speed|hız|close|kapat|more|daha/i.test(allAttrs)) {
      return false;
    }

    // 5. Must be roughly circular/square (width & height between 24px and 68px)
    const rect = el.getBoundingClientRect();
    if (rect.width < 24 || rect.width > 68 || rect.height < 24 || rect.height > 68) {
      return false;
    }
    if (Math.abs(rect.width - rect.height) > 16) {
      return false;
    }

    // 6. Must be in the main vertical view area (between top 95px and bottom 35px)
    // Excludes top header/search area entirely (rect.top < 95)
    if (rect.top < 95 || rect.bottom > window.innerHeight - 35) {
      return false;
    }

    // 7. Must NOT be near the far right edge of the screen (where comment likes live: right > innerWidth - 65)
    // The navigation arrows sit to the left of the comments panel
    if (rect.right > window.innerWidth - 65) {
      return false;
    }
    if (rect.left < 60) {
      return false;
    }

    return true;
  }

  /**
   * Helper: Find the TikTok vertical navigation up/down arrow buttons
   * Strictly matches the real arrow buttons beside the video player (never comment likes!)
   */
  function findTikTokNavTarget() {
    // 1. Check all explicit arrow button selectors on TikTok
    const arrowSelectors = [
      "button[data-e2e='arrow-up']",
      "button[data-e2e='arrow-down']",
      "button[data-e2e*='arrow-up']",
      "button[data-e2e*='arrow-down']",
      "button[data-e2e*='browse-up']",
      "button[data-e2e*='browse-down']",
      "button[data-e2e*='swipe-up']",
      "button[data-e2e*='swipe-down']",
      "button[data-e2e*='video-arrow']",
      "button[data-e2e*='arrow']",
      "div[role='button'][data-e2e*='arrow']",
      "button[aria-label*='previous' i]",
      "button[aria-label*='next' i]",
      "button[aria-label*='önceki' i]",
      "button[aria-label*='sonraki' i]",
      "button[aria-label*='yukarı' i]",
      "button[aria-label*='aşağı' i]",
      "[class*='ButtonVideoArrow']",
      "[class*='ArrowButton']",
      "[class*='VideoArrow']",
      "[class*='DivArrowItem']",
      "[class*='ArrowItem']",
      "[class*='NavigationContainer'] button",
      "[class*='DivArrowContainer'] button"
    ];

    const matched = [];
    for (const sel of arrowSelectors) {
      for (const el of document.querySelectorAll(sel)) {
        if (isValidTikTokArrow(el) && !matched.includes(el)) {
          matched.push(el);
        }
      }
    }

    // 2. Also check all buttons on page that pass isValidTikTokArrow
    const allBtns = Array.from(document.querySelectorAll("button, div[role='button']"));
    for (const btn of allBtns) {
      if (isValidTikTokArrow(btn) && !matched.includes(btn)) {
        matched.push(btn);
      }
    }

    if (matched.length > 0) {
      // Sort by top ascending -> topmost is up arrow (or down arrow if only one)
      matched.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      return matched[0];
    }

    return null;
  }

  /**
   * 2. TikTok Adapter (Single button strictly ABOVE the vertical navigation arrows on the right)
   * ONLY active when a video is open/playing during feed scrolling
   */
  function handleTikTok() {
    if (!window.location.hostname.includes("tiktok.com")) return;

    // Clean up any stray buttons inside comments, headers, search bars, or old fixed buttons
    document.querySelectorAll(
      "header .clip-tiktok-action-wrapper, " +
      "nav .clip-tiktok-action-wrapper, " +
      "form .clip-tiktok-action-wrapper, " +
      "[role='search'] .clip-tiktok-action-wrapper, " +
      "[data-e2e*='comment-item'] .clip-tiktok-action-wrapper, " +
      "[data-e2e*='comment-level'] .clip-tiktok-action-wrapper, " +
      "[class*='CommentItem'] .clip-tiktok-action-wrapper, " +
      "[class*='comment-item'] .clip-tiktok-action-wrapper, " +
      "[class*='ReplyItem'] .clip-tiktok-action-wrapper, " +
      "[class*='Header' i] .clip-tiktok-action-wrapper, " +
      ".clip-tiktok-fixed-btn"
    ).forEach(el => el.remove());

    // Strict safety: remove any button in the top header / search bar zone (top < 90)
    document.querySelectorAll(".clip-tiktok-action-wrapper").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top > 0 && r.top < 90) el.remove();
    });

    // REQUIREMENT: "sadece kaydırırken video açıkken gelsin"
    // Only show if there is an active video element visible on the page
    const videoEl = getActiveTikTokVideoElement();
    if (!videoEl) {
      document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-tiktok-arrow-nav-btn").forEach(el => el.remove());
      return;
    }

    const vRect = videoEl.getBoundingClientRect();
    if (vRect.width < 100 || vRect.height < 100) {
      document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-tiktok-arrow-nav-btn").forEach(el => el.remove());
      return;
    }

    // Primary: Find vertical navigation arrows (Right-side ^ and v column)
    const navArrow = findTikTokNavTarget();

    if (navArrow) {
      // Target element to place before: either navArrow or its single-child wrapper item
      let targetEl = navArrow;
      const parent = navArrow.parentElement;
      if (parent && parent.children.length === 1 && parent.parentElement && (parent.parentElement.querySelectorAll("button, [role='button']").length >= 1)) {
        targetEl = parent;
      }
      const container = targetEl.parentElement;

      if (container && !container.querySelector(".clip-tiktok-arrow-nav-btn")) {
        // Remove any other tiktok buttons on the page
        document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-tiktok-overlay-btn, .clip-tiktok-fixed-btn").forEach(el => el.remove());

        const btnWrapper = document.createElement("div");
        btnWrapper.className = "clip-tiktok-action-wrapper clip-tiktok-arrow-nav-btn";
        btnWrapper.title = "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)";
        btnWrapper.innerHTML = `<div class="clip-tiktok-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>`;

        // If targetEl is absolutely/fixed positioned, match its positioning
        try {
          const comp = window.getComputedStyle(targetEl);
          if (comp.position === "absolute" || comp.position === "fixed") {
            btnWrapper.style.position = comp.position;
            btnWrapper.style.left = (targetEl.offsetLeft || 0) + "px";
            btnWrapper.style.top = ((targetEl.offsetTop || 0) - (targetEl.offsetHeight || 40) - 8) + "px";
          }
        } catch (e) {}

        // Make sure container doesn't clip
        try {
          const cComp = window.getComputedStyle(container);
          if (cComp.overflow === "hidden" || cComp.overflowY === "hidden") {
            container.style.overflow = "visible";
          }
        } catch (e) {}

        btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
        btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
        btnWrapper.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const curVideo = getActiveTikTokVideoElement() || videoEl;
          const exactUrl = findTikTokVideoUrl(targetEl.closest("article, [class*='ItemContainer']") || document.body);
          console.log("⚡ [CLIP] TikTok captured exact URL:", exactUrl);
          triggerCapture(btnWrapper, curVideo, "tiktok", exactUrl);
        });

        // Insert directly ABOVE the navigation arrow (inside green circle area)
        targetEl.insertAdjacentElement("beforebegin", btnWrapper);
      }

      // If arrow button is present, make sure no rogue buttons exist elsewhere
      document.querySelectorAll(".clip-tiktok-action-wrapper:not(.clip-tiktok-arrow-nav-btn)").forEach(el => el.remove());
    } else {
      // No navigation arrows found: do NOT inject any fallback button
      document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-tiktok-fixed-btn").forEach(el => el.remove());
    }
  }

  /**
   * Helper: Resolve exact Instagram Reel/Post URL even from generic feed / profile URLs
   */
  function findInstagramVideoUrl(likeBtn, videoEl, postCard) {
    // 1. Direct shortcode in window.location (e.g. /reel/Deq97_KI_CW/ or /p/Deq97_KI_CW/)
    const pathMatch = window.location.pathname.match(/\/(?:reel|reels|p)\/([A-Za-z0-9_-]{9,15})\/?/);
    if (pathMatch && pathMatch[1] && pathMatch[1] !== "reels") {
      return `https://www.instagram.com/reel/${pathMatch[1]}/`;
    }

    // 2. Search postCard, dialog, article, and document
    const containers = [
      postCard,
      likeBtn ? likeBtn.closest("div[role='dialog'], article, section, main") : null,
      videoEl ? videoEl.closest("div[role='dialog'], article, section, main") : null,
      document.querySelector("div[role='dialog']"),
      document.body
    ];

    for (const c of containers) {
      if (!c) continue;

      // Anchors with /reel/ or /p/
      const anchors = c.querySelectorAll("a[href*='/reel/'], a[href*='/p/'], a[href*='/reels/']");
      for (const a of anchors) {
        const h = a.getAttribute("href") || a.href || "";
        const m = h.match(/\/(?:reel|reels|p)\/([A-Za-z0-9_-]{9,15})\/?/);
        if (m && m[1] && m[1] !== "reels") {
          return `https://www.instagram.com/reel/${m[1]}/`;
        }
      }

      // Time tag links (Instagram timestamps)
      const times = c.querySelectorAll("time");
      for (const t of times) {
        const a = t.closest("a");
        if (a) {
          const h = a.getAttribute("href") || a.href || "";
          const m = h.match(/\/(?:reel|reels|p)\/([A-Za-z0-9_-]{9,15})\/?/);
          if (m && m[1]) {
            return `https://www.instagram.com/reel/${m[1]}/`;
          }
        }
      }
    }

    return window.location.href;
  }

  /**
   * 3. Instagram Reels Adapter (Directly ABOVE the Like / Beğeni button, ZERO rogue buttons)
   */
  function handleInstagram() {
    if (!window.location.hostname.includes("instagram.com")) return;

    // Clean up any rogue buttons inside comments or lists
    document.querySelectorAll("ul .clip-reels-action-wrapper, [role='list'] .clip-reels-action-wrapper, [class*='Comment'] .clip-reels-action-wrapper, [class*='comment'] .clip-reels-action-wrapper, [data-testid*='comment'] .clip-reels-action-wrapper").forEach(el => el.remove());

    // 1. Instantly remove any rogue buttons that are not positioned right above a Like button
    document.querySelectorAll(".clip-reels-action-wrapper").forEach(el => {
      if (el.closest("ul, [role='list'], [class*='Comment'], [class*='comment'], [data-testid*='comment']")) {
        el.remove();
        return;
      }
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
      // STRICT FILTER: Ignore comment likes (comments are inside lists, comment threads, dialog forms or have tiny dimensions)
      if (svg.closest("ul, [role='list'], [class*='Comment'], [class*='comment'], [data-testid*='comment'], form, div[role='dialog'] ul, div[role='dialog'] form") || (svg.clientWidth && svg.clientWidth < 20)) {
        return;
      }

      const likeBtn = svg.closest("button, div[role='button'], span[role='button']") || svg.parentElement;
      if (!likeBtn) return;
      if (likeBtn.closest("ul, [role='list'], [class*='Comment'], [class*='comment'], [data-testid*='comment']")) return;

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

        const exactUrl = findInstagramVideoUrl(likeBtn, videoEl, postCard);
        console.log("⚡ [CLIP] Instagram resolved URL:", exactUrl);

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

          // Helper servisi çalışıyorsa clipboard'a kopyalandı, yoksa otomatik indir
          const clipboardReady = !!response.clipboardCopied;

          // Helper servisi yoksa: arka planda otomatik indir (İndirilenler klasörüne düşer)
          if (!clipboardReady && response.videoUrl) {
            chrome.runtime.sendMessage({
              action: "TRIGGER_DOWNLOAD",
              videoUrl: response.videoUrl,
              platform: platform
            });
          }

          // Drag & drop için blob'u yükle (sadece küçük/erişilebilir URL'ler için)
          let preloadedFile = null;
          if (response.videoUrl) {
            fetch(response.videoUrl, { mode: "cors", credentials: "omit" })
              .then(r => r.blob())
              .then(raw => {
                const blob = new Blob([raw], { type: "video/mp4" });
                preloadedFile = new File([blob], response.filename || `CLIP_${platform}_${Date.now()}.mp4`, { type: "video/mp4" });
              })
              .catch(() => { /* CORS engellediyse preloadedFile null kalır */ });
          }

          renderDynamicIsland(targetWrapper, response.videoUrl, platform, response.filename, response.filePath, preloadedFile, clipboardReady);
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

  function renderDynamicIsland(targetWrapper, videoUrl, platform, customFilename, filePath, preloadedFile, clipboardReady) {
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
    if (clipboardReady) {
      statusSpan.innerHTML = `${ICONS.check} <span>Panoda Hazır (Ctrl+V)</span>`;
    } else {
      // Auto-download already triggered above; guide user to WhatsApp attach
      statusSpan.innerHTML = `${ICONS.check} <span>İndirildi — WhatsApp'ta 📎 ile yükle</span>`;
    }

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
      if (videoUrl) {
        chrome.runtime.sendMessage({ action: "TRIGGER_DOWNLOAD", videoUrl, platform });
        statusSpan.innerHTML = `${ICONS.check} <span>İndiriliyor…</span>`;
      }
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
          CLIP ücretsiz sürümü <strong>TikTok, Instagram Reels, X</strong> gibi kısa videolar için optimize edilmiştir (maksimum 60 saniye).
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

  /* ==========================================================================
     Intelligent Scroll-Aware Engine (Zero Layout Shifts / Zero Scroll Glitches)
     ========================================================================== */
  let isUserScrolling = false;
  let scrollDebounceTimer = null;
  let scanDebounceTimer = null;

  function onUserScrollActivity() {
    isUserScrolling = true;
    if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = setTimeout(() => {
      isUserScrolling = false;
      scheduleScan(100);
    }, 250);
  }

  // Detect any user scrolling or paging (wheel, scroll, touch, or arrow keys)
  window.addEventListener("wheel", onUserScrollActivity, { passive: true });
  window.addEventListener("scroll", onUserScrollActivity, { passive: true });
  window.addEventListener("touchmove", onUserScrollActivity, { passive: true });
  window.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Space"].includes(e.code)) {
      onUserScrollActivity();
    }
  }, { passive: true });

  function scheduleScan(delay = 180) {
    if (isUserScrolling) return; // Strictly freeze all DOM modifications during active scroll
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(() => {
      scanDebounceTimer = null;
      if (!isUserScrolling) {
        scanAll();
      }
    }, delay);
  }

  function scanAll() {
    if (isUserScrolling) return;
    handleTikTok();
    handleInstagram();
    handleTwitter();
  }

  // Initial delayed scan
  scheduleScan(150);

  // Background interval: once every 1.5s, strictly paused during scroll
  window.__CLIP_INTERVAL__ = setInterval(() => {
    if (!isUserScrolling) scanAll();
  }, 1500);

  // Debounced MutationObserver: NEVER fires synchronously during scroll!
  window.__CLIP_OBSERVER__ = new MutationObserver(() => {
    scheduleScan(250);
  });
  window.__CLIP_OBSERVER__.observe(document.body || document.documentElement, { childList: true, subtree: true });

  // SPA Navigation hooks (TikTok search -> video modal -> feed)
  const cleanTikTokButtons = () => {
    if (window.location.hostname.includes("tiktok.com")) {
      document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-tiktok-arrow-nav-btn, .clip-tiktok-overlay-btn, .clip-tiktok-fixed-btn").forEach(el => el.remove());
    }
  };

  const origPushState = history.pushState;
  history.pushState = function() {
    origPushState.apply(this, arguments);
    cleanTikTokButtons();
    scheduleScan(60);
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function() {
    origReplaceState.apply(this, arguments);
    cleanTikTokButtons();
    scheduleScan(60);
  };

  window.addEventListener("popstate", () => {
    cleanTikTokButtons();
    scheduleScan(50);
  });

})();
