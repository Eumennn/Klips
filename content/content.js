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
    star: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    scissors: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`
  };

  // Universal Video Clipboard (100% Free & Unlimited Open Source)



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
   * 2. TikTok Adapter (Aligned seamlessly in the right vertical action column above the Like button)
   * Natural flex-column flow, zero overlap with the profile avatar.
   */
  function handleTikTok() {
    if (!window.location.hostname.includes("tiktok.com")) return;

    // Clean up any stray buttons inside comments, headers, search bars
    document.querySelectorAll(
      "header .clip-tiktok-action-wrapper, " +
      "nav .clip-tiktok-action-wrapper, " +
      "form .clip-tiktok-action-wrapper, " +
      "[role='search'] .clip-tiktok-action-wrapper, " +
      "[data-e2e*='comment'] .clip-tiktok-action-wrapper, " +
      "[class*='Comment'] .clip-tiktok-action-wrapper, " +
      ".clip-tiktok-fixed-btn"
    ).forEach(el => el.remove());

    const videoEl = getActiveTikTokVideoElement();
    if (!videoEl) {
      document.querySelectorAll(".clip-tiktok-action-wrapper").forEach(el => el.remove());
      return;
    }

    // Find the Like button in the right action column
    const likeButtons = document.querySelectorAll(
      "[data-e2e='like-icon'], " +
      "[data-e2e='feed-like-icon'], " +
      "[data-e2e='like-button'], " +
      "[data-e2e*='like'], " +
      "button[aria-label*='like' i], " +
      "button[aria-label*='beğen' i], " +
      "div[role='button'][aria-label*='like' i], " +
      "div[role='button'][aria-label*='beğen' i]"
    );

    let injected = false;
    for (const likeBtn of likeButtons) {
      // Must not be in comments
      if (likeBtn.closest("[data-e2e*='comment'], [class*='Comment'], [class*='comment']")) continue;

      // Find unit container for the like button
      let targetUnit = likeBtn;
      const parentContainer = likeBtn.closest(
        "[class*='ActionItem'], " +
        "[class*='DivItemContainer'], " +
        "[class*='ItemContainer'], " +
        "[class*='DivActionItem'], " +
        "[class*='FeedAction'], " +
        "[data-e2e='browse-action-item'], " +
        "section"
      );

      if (parentContainer && likeBtn.parentElement !== parentContainer) {
        let cur = likeBtn;
        while (cur && cur.parentElement && cur.parentElement !== parentContainer) {
          cur = cur.parentElement;
        }
        if (cur) targetUnit = cur;
      }

      if (targetUnit.parentElement && targetUnit.parentElement.querySelector(".clip-tiktok-action-wrapper")) {
        injected = true;
        break;
      }

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-tiktok-action-wrapper";
      if (!isCompanionActive) btnWrapper.classList.add("clip-paused");
      btnWrapper.title = isCompanionActive
        ? "CLIP — TikTok'u Panoya Kopyala (WhatsApp / Discord)"
        : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
      btnWrapper.innerHTML = `<div class="clip-tiktok-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>`;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const curVideo = getActiveTikTokVideoElement() || videoEl;
        const exactUrl = findTikTokVideoUrl(targetUnit.closest("article, [class*='ItemContainer']") || document.body);
        console.log("⚡ [CLIP] TikTok captured exact URL:", exactUrl);
        triggerCapture(btnWrapper, curVideo, "tiktok", exactUrl);
      });

      // Insert directly ABOVE the Like button in the action column
      targetUnit.insertAdjacentElement("beforebegin", btnWrapper);
      injected = true;
      break;
    }

    // Clean up any extra tiktok buttons
    const allTk = document.querySelectorAll(".clip-tiktok-action-wrapper");
    if (allTk.length > 1) {
      for (let i = 1; i < allTk.length; i++) allTk[i].remove();
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
   * Helper: Resolve exact YouTube Shorts URL
   */
  function findYouTubeShortsUrl(reel, videoEl) {
    // 1. Direct shortcode in window.location (e.g. /shorts/v3cWqK-4X3c)
    const m = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (m && m[1]) {
      // If reel is active or only one reel on page, current URL is exact
      if (!reel || reel.hasAttribute("is-active") || document.querySelectorAll("ytd-reel-video-renderer").length <= 1) {
        return `https://www.youtube.com/shorts/${m[1]}`;
      }
    }

    // 2. Check reel container anchors with /shorts/
    if (reel) {
      const anchors = reel.querySelectorAll("a[href*='/shorts/']");
      for (const a of anchors) {
        const h = a.getAttribute("href") || a.href || "";
        const match = h.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) {
          return `https://www.youtube.com/shorts/${match[1]}`;
        }
      }

      // Check data attributes or id
      const dataId = reel.getAttribute("data-video-id");
      if (dataId && /^[a-zA-Z0-9_-]{11}$/.test(dataId)) {
        return `https://www.youtube.com/shorts/${dataId}`;
      }
    }

    // 3. Check active reel renderer in DOM
    const activeReel = document.querySelector("ytd-reel-video-renderer[is-active]");
    if (activeReel) {
      const a = activeReel.querySelector("a[href*='/shorts/']");
      if (a) {
        const match = (a.getAttribute("href") || a.href || "").match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) return `https://www.youtube.com/shorts/${match[1]}`;
      }
    }

    // 4. Fallback to window.location
    if (window.location.href.includes("/shorts/")) {
      const clean = window.location.href.match(/https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (clean) return clean[0];
      return window.location.href.split("?")[0];
    }

    return window.location.href;
  }

  /**
   * Helper: Format seconds to MM:SS or HH:MM:SS
   */
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const s = Math.floor(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Helper: Parse MM:SS or HH:MM:SS or raw seconds to float seconds
   */
  function parseTimeToSeconds(str) {
    if (typeof str === "number") return str;
    if (!str) return 0;
    const parts = str.trim().split(":").map(p => parseFloat(p) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }
    return 0;
  }

  /**
   * 5. YouTube Shorts Adapter (Strictly restricted to /shorts/ URLs)
   */
  function handleYouTubeShorts() {
    if (!window.location.hostname.includes("youtube.com")) return;

    // CRITICAL: Strictly run ONLY on /shorts/ paths!
    // On regular horizontal watch pages (/watch?v=...), clean up any Shorts buttons and return.
    if (!window.location.pathname.startsWith("/shorts")) {
      document.querySelectorAll(".clip-shorts-action-wrapper").forEach(el => el.remove());
      return;
    }

    // Strategy 1: Target all Like buttons inside Shorts action bars
    const likeButtons = document.querySelectorAll(
      "ytd-reel-player-overlay-renderer #like-button, " +
      "ytd-reel-video-renderer #like-button, " +
      "ytd-reel-video-renderer like-button-view-model, " +
      "ytd-reel-video-renderer yt-like-button-view-model, " +
      "ytd-reel-video-renderer ytd-like-button-renderer, " +
      "ytd-shorts #actions #like-button, " +
      "ytd-shorts #actions ytd-like-button-renderer, " +
      "ytd-shorts #actions like-button-view-model, " +
      "ytd-shorts #actions yt-like-button-view-model"
    );

    likeButtons.forEach(likeBtn => {
      let targetUnit = likeBtn;
      const actionsContainer = likeBtn.closest("#actions, [id='actions'], ytd-reel-player-overlay-renderer");
      if (actionsContainer && likeBtn.parentElement === actionsContainer) {
        targetUnit = likeBtn;
      } else if (actionsContainer) {
        let cur = likeBtn;
        while (cur && cur.parentElement && cur.parentElement !== actionsContainer) {
          cur = cur.parentElement;
        }
        if (cur && cur.parentElement === actionsContainer) {
          targetUnit = cur;
        }
      }

      if (targetUnit.previousElementSibling && targetUnit.previousElementSibling.classList.contains("clip-shorts-action-wrapper")) {
        return;
      }
      if (actionsContainer && actionsContainer.querySelector(".clip-shorts-action-wrapper")) {
        return;
      }

      const reel = targetUnit.closest("ytd-reel-video-renderer, ytm-reel-item-renderer, ytd-shorts, [class*='reel-video-renderer']") || document;
      const videoEl = reel.querySelector ? reel.querySelector("video") : document.querySelector("video");

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-shorts-action-wrapper";
      if (!isCompanionActive) btnWrapper.classList.add("clip-paused");
      btnWrapper.title = isCompanionActive
        ? "CLIP — Shorts'u Panoya Kopyala (WhatsApp / Discord)"
        : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
      btnWrapper.innerHTML = `
        <div class="clip-shorts-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const curVideo = (reel.querySelector ? reel.querySelector("video") : null) || videoEl || document.querySelector("video");
        const exactUrl = findYouTubeShortsUrl(reel, curVideo);
        console.log("⚡ [CLIP] YouTube Shorts captured URL:", exactUrl);

        triggerCapture(btnWrapper, curVideo, "shorts", exactUrl);
      });

      targetUnit.insertAdjacentElement("beforebegin", btnWrapper);
    });

    // Strategy 2: Target all #actions columns on Shorts
    const actionContainers = document.querySelectorAll(
      "ytd-reel-player-overlay-renderer #actions, " +
      "ytd-reel-video-renderer #actions, " +
      "ytd-shorts #actions"
    );

    actionContainers.forEach(container => {
      if (container.querySelector(".clip-shorts-action-wrapper")) return;

      const reel = container.closest("ytd-reel-video-renderer, ytm-reel-item-renderer, ytd-shorts") || document;
      const videoEl = reel.querySelector ? reel.querySelector("video") : document.querySelector("video");

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-shorts-action-wrapper";
      if (!isCompanionActive) btnWrapper.classList.add("clip-paused");
      btnWrapper.title = isCompanionActive
        ? "CLIP — Shorts'u Panoya Kopyala (WhatsApp / Discord)"
        : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
      btnWrapper.innerHTML = `
        <div class="clip-shorts-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const curVideo = (reel.querySelector ? reel.querySelector("video") : null) || videoEl || document.querySelector("video");
        const exactUrl = findYouTubeShortsUrl(reel, curVideo);
        console.log("⚡ [CLIP] YouTube Shorts captured URL:", exactUrl);

        triggerCapture(btnWrapper, curVideo, "shorts", exactUrl);
      });

      container.insertAdjacentElement("afterbegin", btnWrapper);
    });
  }

  /**
   * 6. YouTube Horizontal Video Adapter (/watch)
   * Places a 100% native-matching pill button right next to the Like/Dislike segmented button.
   * Clicking it opens a compact, floating trimmer flyout panel to select time and copy to clipboard.
   */
  function handleYouTubeWatch() {
    if (!window.location.hostname.includes("youtube.com")) return;

    const isWatch = window.location.pathname.startsWith("/watch") || window.location.search.includes("v=");
    if (!isWatch) {
      document.querySelectorAll(".clip-yt-watch-btn-wrapper").forEach(el => el.remove());
      return;
    }

    // Clean up any stray Shorts buttons that shouldn't be here
    document.querySelectorAll(".clip-shorts-action-wrapper").forEach(el => el.remove());

    // Target the primary action buttons container on YouTube
    const topLevelButtons = document.querySelector(
      "ytd-watch-metadata #top-level-buttons-computed, " +
      "#actions-inner #top-level-buttons-computed, " +
      "#actions #top-level-buttons-computed, " +
      "#top-level-buttons-computed"
    );

    if (!topLevelButtons) return;

    // Check if button already injected
    if (topLevelButtons.querySelector(".clip-yt-watch-btn-wrapper")) return;

    // Find Like/Dislike segmented button
    const likeSegment = topLevelButtons.querySelector(
      "segmented-like-dislike-button-view-model, " +
      "ytd-segmented-like-dislike-button-renderer, " +
      "like-button-view-model, " +
      "#segmented-like-button"
    );

    const btnWrapper = document.createElement("div");
    btnWrapper.className = "clip-yt-watch-btn-wrapper";

    const watchBtn = document.createElement("button");
    watchBtn.className = "clip-yt-watch-btn";
    if (!isCompanionActive) watchBtn.classList.add("clip-paused");
    watchBtn.setAttribute("type", "button");
    watchBtn.setAttribute("aria-label", "Klip Al (CLIP)");
    watchBtn.title = "CLIP — Videodan klip kırpıp panoya kopyala";
    watchBtn.innerHTML = `
      <span class="clip-yt-watch-icon">${ICONS.bolt}</span>
      <span class="clip-yt-watch-label">Klip Al</span>
    `;

    watchBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    watchBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    watchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleYouTubeWatchTrimmer(btnWrapper);
    });

    btnWrapper.appendChild(watchBtn);

    // Place right next to the Like/Dislike segmented button
    if (likeSegment && likeSegment.parentNode === topLevelButtons) {
      likeSegment.insertAdjacentElement("afterend", btnWrapper);
    } else {
      topLevelButtons.insertAdjacentElement("afterbegin", btnWrapper);
    }
  }

  /**
   * Compact Floating Clipper Flyout for YouTube Watch Videos
   */
  function toggleYouTubeWatchTrimmer(btnWrapper) {
    const existingFlyout = document.querySelector(".clip-yt-flyout-panel");
    const watchBtn = btnWrapper.querySelector(".clip-yt-watch-btn");

    if (existingFlyout) {
      existingFlyout.remove();
      if (watchBtn) watchBtn.classList.remove("active");
      return;
    }

    if (watchBtn) watchBtn.classList.add("active");

    const videoEl = document.querySelector("ytd-watch-flexy video, #movie_player video, video");
    const curTime = videoEl ? (videoEl.currentTime || 0) : 0;

    // Initial default: Last 30 seconds ending at current time
    let initEnd = Math.max(1, Math.floor(curTime));
    if (initEnd <= 0) initEnd = 30;
    let initStart = Math.max(0, initEnd - 30);

    const flyout = document.createElement("div");
    flyout.className = "clip-yt-flyout-panel";

    // Fixed coordinates relative to watchBtn to avoid any parent overflow:hidden clipping
    try {
      const rect = watchBtn.getBoundingClientRect();
      flyout.style.position = "fixed";
      flyout.style.top = (rect.bottom + 8) + "px";
      if (rect.right + 250 > window.innerWidth) {
        flyout.style.left = Math.max(12, rect.right - 360) + "px";
      } else {
        flyout.style.left = rect.left + "px";
      }
      flyout.style.zIndex = "2147483647";
    } catch (_) {}

    flyout.innerHTML = `
      <div class="clip-flyout-header">
        <div class="clip-flyout-title">
          <span class="clip-flyout-bolt">${ICONS.bolt}</span>
          <span>Klip Al (CLIP)</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="clip-flyout-time-tag" id="clip-cur-time-display">${formatTime(curTime)}</span>
          <button class="clip-flyout-close" type="button" title="Kapat">✕</button>
        </div>
      </div>

      <div class="clip-flyout-presets-label">Hızlı Süre Seçimi (Şu ana kadar):</div>
      <div class="clip-flyout-presets">
        <button type="button" class="clip-preset-pill" data-preset="15">Son 15s</button>
        <button type="button" class="clip-preset-pill active" data-preset="30">Son 30s</button>
        <button type="button" class="clip-preset-pill" data-preset="60">Son 60s</button>
        <button type="button" class="clip-preset-pill" data-preset="120">Son 2dk</button>
      </div>

      <div class="clip-flyout-range-grid">
        <div class="clip-time-col">
          <label>Başlangıç</label>
          <div class="clip-time-input-group">
            <input type="text" class="clip-time-inp" id="clip-start-inp" value="${formatTime(initStart)}" placeholder="00:00">
            <button type="button" class="clip-time-snap-btn" id="clip-snap-start" title="Videonun şu anki saniyesini başlangıç yap">🎯 Şimdi</button>
          </div>
        </div>
        <div class="clip-time-col">
          <label>Bitiş</label>
          <div class="clip-time-input-group">
            <input type="text" class="clip-time-inp" id="clip-end-inp" value="${formatTime(initEnd)}" placeholder="00:30">
            <button type="button" class="clip-time-snap-btn" id="clip-snap-end" title="Videonun şu anki saniyesini bitiş yap">🎯 Şimdi</button>
          </div>
        </div>
      </div>

      <div class="clip-flyout-summary">
        <span id="clip-duration-summary">⏱️ Klip Süresi: <strong>30 sn</strong></span>
        <span class="clip-summary-compat">✓ WhatsApp / Discord</span>
      </div>

      <button type="button" class="clip-flyout-submit-btn" id="clip-flyout-submit">
        <span class="clip-submit-icon">${ICONS.bolt}</span>
        <span class="clip-submit-text">Klibi Kopyala (Panoya Al)</span>
      </button>
    `;

    // Event Listeners for Flyout
    flyout.addEventListener("pointerdown", (e) => e.stopPropagation());
    flyout.addEventListener("mousedown", (e) => e.stopPropagation());
    flyout.addEventListener("click", (e) => e.stopPropagation());

    const closeBtn = flyout.querySelector(".clip-flyout-close");
    closeBtn.addEventListener("click", () => {
      flyout.remove();
      if (watchBtn) watchBtn.classList.remove("active");
    });

    const startInp = flyout.querySelector("#clip-start-inp");
    const endInp = flyout.querySelector("#clip-end-inp");
    const durationSummary = flyout.querySelector("#clip-duration-summary");
    const presetPills = flyout.querySelectorAll(".clip-preset-pill");
    const submitBtn = flyout.querySelector("#clip-flyout-submit");
    const curTimeDisplay = flyout.querySelector("#clip-cur-time-display");

    function updateSummary() {
      const s = parseTimeToSeconds(startInp.value);
      const e = parseTimeToSeconds(endInp.value);
      const diff = Math.max(0, e - s);
      const diffStr = diff >= 60 ? `${Math.floor(diff / 60)} dk ${Math.floor(diff % 60)} sn` : `${Math.floor(diff)} sn`;
      durationSummary.innerHTML = `⏱️ Klip Süresi: <strong>${diffStr}</strong>`;
    }

    // Time update ticker for header display
    const ticker = setInterval(() => {
      if (!document.body.contains(flyout)) {
        clearInterval(ticker);
        return;
      }
      if (videoEl && curTimeDisplay) {
        curTimeDisplay.textContent = formatTime(videoEl.currentTime || 0);
      }
    }, 500);

    // Preset Buttons
    presetPills.forEach(pill => {
      pill.addEventListener("click", () => {
        presetPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const secs = parseInt(pill.getAttribute("data-preset"), 10);
        const cur = videoEl ? (videoEl.currentTime || 0) : curTime;
        const e = Math.max(1, Math.floor(cur));
        const s = Math.max(0, e - secs);
        startInp.value = formatTime(s);
        endInp.value = formatTime(e);
        updateSummary();
      });
    });

    // Snap Buttons
    flyout.querySelector("#clip-snap-start").addEventListener("click", () => {
      presetPills.forEach(p => p.classList.remove("active"));
      const cur = videoEl ? (videoEl.currentTime || 0) : 0;
      startInp.value = formatTime(cur);
      updateSummary();
    });

    flyout.querySelector("#clip-snap-end").addEventListener("click", () => {
      presetPills.forEach(p => p.classList.remove("active"));
      const cur = videoEl ? (videoEl.currentTime || 0) : 0;
      endInp.value = formatTime(cur);
      updateSummary();
    });

    startInp.addEventListener("input", () => {
      presetPills.forEach(p => p.classList.remove("active"));
      updateSummary();
    });
    endInp.addEventListener("input", () => {
      presetPills.forEach(p => p.classList.remove("active"));
      updateSummary();
    });

    // Submit Action
    submitBtn.addEventListener("click", () => {
      const s = parseTimeToSeconds(startInp.value);
      const e = parseTimeToSeconds(endInp.value);

      if (e <= s) {
        alert("Bitiş süresi başlangıç süresinden büyük olmalıdır!");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.querySelector(".clip-submit-icon").innerHTML = ICONS.spinner;
      submitBtn.querySelector(".clip-submit-text").textContent = "Klip Çıkarılıyor & Panoya Alınıyor...";

      const cleanUrl = window.location.href.split("&")[0];
      console.log("⚡ [CLIP] Trimming YouTube clip:", cleanUrl, s, e);

      triggerCapture(btnWrapper, videoEl, "youtube", cleanUrl, s, e);

      // Close flyout after initiating capture
      setTimeout(() => {
        flyout.remove();
        if (watchBtn) watchBtn.classList.remove("active");
      }, 1200);
    });

    document.body.appendChild(flyout);

    // Click outside listener to dismiss
    const onOutsideClick = (e) => {
      if (!flyout.contains(e.target) && !watchBtn.contains(e.target)) {
        flyout.remove();
        if (watchBtn) watchBtn.classList.remove("active");
        document.removeEventListener("pointerdown", onOutsideClick);
      }
    };
    setTimeout(() => {
      document.addEventListener("pointerdown", onOutsideClick);
    }, 100);
  }



  /**
   * Trigger Video Capture & Windows Clipboard Copy
   */
  async function triggerCapture(targetWrapper, videoEl, platform, exactUrl, startTime, endTime) {
    if (!isCompanionActive) {
      showDynamicIslandMessage("⏸️ CLIP sistem tepsisinden kapalı. Açmak için sağ alttaki simgeye bir kez tıklayın.");
      return;
    }
    console.log("⚡ [CLIP] Capturing video...", platform, exactUrl, startTime, endTime);

    const hasTimeRange = startTime !== undefined && startTime !== null && endTime !== undefined && endTime !== null;

    if (targetWrapper.getAttribute("data-loading") === "true") return;
    targetWrapper.setAttribute("data-loading", "true");

    const circle = targetWrapper.querySelector(".clip-shorts-action-circle, .clip-tiktok-action-circle, .clip-action-circle, .clip-x-action-circle");
    const boltIcon = targetWrapper.querySelector(".clip-ext-icon-bolt");
    const watchIcon = targetWrapper.querySelector(".clip-yt-watch-icon");

    if (circle) circle.innerHTML = ICONS.spinner;
    if (boltIcon) boltIcon.innerHTML = ICONS.spinner;
    if (watchIcon) watchIcon.innerHTML = ICONS.spinner;

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

          if (chrome.runtime.lastError || !response || !response.success) {
            const errText = (response && response.error) ? response.error : (chrome.runtime.lastError ? chrome.runtime.lastError.message : "Video yakalanamadı. 'start_clip.bat' servisini kontrol edin.");
            showDynamicIslandMessage(`⚠️ ${errText}`);
            resetButtonState(targetWrapper);
            return;
          }

          if (circle) circle.innerHTML = ICONS.check;
          if (boltIcon) boltIcon.innerHTML = ICONS.check;
          if (watchIcon) watchIcon.innerHTML = ICONS.check;

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
    if (!targetWrapper) return;
    const circle = targetWrapper.querySelector(".clip-shorts-action-circle, .clip-tiktok-action-circle, .clip-action-circle, .clip-x-action-circle");
    const boltIcon = targetWrapper.querySelector(".clip-ext-icon-bolt");
    const watchIcon = targetWrapper.querySelector(".clip-yt-watch-icon");

    if (circle) circle.innerHTML = ICONS.bolt;
    if (boltIcon) boltIcon.innerHTML = ICONS.bolt;
    if (watchIcon) watchIcon.innerHTML = ICONS.bolt;
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
    handleYouTubeShorts();
    handleYouTubeWatch();
  }

  // Initial delayed scan
  scheduleScan(150);

  // Background interval: once every 1.5s, strictly paused during scroll
  window.__CLIP_INTERVAL__ = setInterval(() => {
    if (!isUserScrolling) scanAll();
  }, 1500);

  // Sync state with System Tray Companion (active vs paused/colorless)
  let isCompanionActive = true;
  async function syncCompanionState() {
    try {
      const res = await fetch("http://127.0.0.1:48123/health", { signal: AbortSignal.timeout(450) });
      if (res.ok) {
        const data = await res.json();
        const active = data.active !== false;
        if (isCompanionActive !== active) {
          isCompanionActive = active;
          document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-reels-action-wrapper, .clip-shorts-action-wrapper, .clip-x-action-wrapper, .clip-yt-watch-btn").forEach(el => {
            el.classList.toggle("clip-paused", !isCompanionActive);
            el.title = isCompanionActive 
              ? "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)" 
              : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
          });
        }
      }
    } catch (e) {}
  }
  setInterval(syncCompanionState, 1500);
  syncCompanionState();

  // Debounced MutationObserver: NEVER fires synchronously during scroll!
  window.__CLIP_OBSERVER__ = new MutationObserver(() => {
    scheduleScan(250);
  });
  window.__CLIP_OBSERVER__.observe(document.body || document.documentElement, { childList: true, subtree: true });

  // YouTube SPA & Playback hooks for instant button appearance
  window.addEventListener("yt-navigate-finish", () => scheduleScan(50));
  window.addEventListener("yt-page-data-updated", () => scheduleScan(80));
  window.addEventListener("yt-action", () => scheduleScan(80));
  document.addEventListener("play", () => scheduleScan(50), true);
  document.addEventListener("playing", () => scheduleScan(50), true);
  document.addEventListener("canplay", () => scheduleScan(50), true);

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
