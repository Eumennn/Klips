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
  const IS_MAC = navigator.platform.toUpperCase().indexOf("MAC") >= 0 || navigator.userAgent.includes("Mac");
  const PASTE_KEY = IS_MAC ? "⌘V" : "Ctrl+V";
  const FILE_EXPLORER_NAME = IS_MAC ? "Finder" : "Dosya Gezgini";

  // System Companion State (Defaults to true at top level)
  let isCompanionActive = true;



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
   * 2a. TikTok Feed Adapter (For Home/ForYou/User Profile feeds)
   * Strictly places ONE button per video card, directly ABOVE the author's profile photo (avatar / PP).
   * Generous margin-bottom ensures ZERO overlap with the avatar. Never touches sidebar.
   */
  function handleTikTokFeed() {
    if (!window.location.hostname.includes("tiktok.com")) return;

    // Find all video cards in the feed
    const cards = document.querySelectorAll(
      "[data-e2e='recommend-list-item-container'], [class*='DivItemContainer'], [class*='ItemContainer'], article"
    );

    cards.forEach(card => {
      // Must NOT be inside a modal, dialog, or DM message popup
      if (card.closest("nav, aside, header, [role='navigation'], [role='search'], [role='dialog'], [data-e2e='browse-video'], [data-e2e='browse-video-container'], [class*='browse-video-container']")) return;

      const video = card.querySelector("video");
      if (!video) return;

      // Find the action column
      let actionCol = card.querySelector("[class*='ActionBar'], [class*='ActionItemContainer'], [class*='DivActionItemContainer'], [data-e2e*='action-bar']");
      if (!actionCol) {
        const likeBtn = card.querySelector("[data-e2e*='like'], button[aria-label*='like' i], button[aria-label*='beğen' i]");
        if (likeBtn) {
          let p = likeBtn.parentElement;
          while (p && p !== card && p !== document.body) {
            if (p.childElementCount >= 2 && (p.querySelector("[data-e2e*='comment']") || p.querySelector("[data-e2e*='share']"))) {
              actionCol = p;
              break;
            }
            p = p.parentElement;
          }
        }
      }
      if (!actionCol) return;

      // Ensure actionCol is visually a vertical column in the right half of the card, not in the top-left
      const colRect = actionCol.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      if (colRect.left < cardRect.left + cardRect.width * 0.40 || colRect.left < 200 || colRect.top < 80) return;

      // If already injected as first child of action col, enforce single button and return
      if (actionCol.firstElementChild && actionCol.firstElementChild.classList.contains("clip-tiktok-action-wrapper")) {
        let first = true;
        card.querySelectorAll(".clip-tiktok-action-wrapper").forEach(el => {
          if (first && el === actionCol.firstElementChild) { first = false; return; }
          el.remove();
        });
        return;
      }

      // Purge any rogue buttons in this card before injecting
      card.querySelectorAll(".clip-tiktok-action-wrapper").forEach(el => el.remove());

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-tiktok-action-wrapper";
      if (!isCompanionActive) btnWrapper.classList.add("clip-paused");
      btnWrapper.title = isCompanionActive 
        ? "CLIP — TikTok'u Panoya Kopyala (WhatsApp / Discord)" 
        : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
      btnWrapper.innerHTML = `<div class="clip-tiktok-action-circle" title="Panoya Kopyala">${ICONS.scissors}</div>`;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation(), { capture: true });
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation(), { capture: true });
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const exactUrl = findTikTokVideoUrl(card);
        console.log("⚡ [CLIP] TikTok Feed captured URL:", exactUrl);
        triggerCapture(btnWrapper, video, "tiktok", exactUrl);
      }, { capture: true });

      // Insert as FIRST child of action column = directly ABOVE the avatar!
      actionCol.insertBefore(btnWrapper, actionCol.firstElementChild);
    });
  }

  /**
   * Helper: Locate the upward-pointing navigation arrow (^) in TikTok modal/theater/DM video view.
   * Completely immune to TikTok class name obfuscation and single/pair button variations.
   */
  function findTikTokModalUpArrow() {
    // 1. Direct query with known selectors (strictly in the right-of-video zone)
    const exactSelectors = [
      "button[data-e2e='browse-arrow-up']",
      "button[data-e2e='arrow-up']",
      "button[data-e2e='video-arrow-up']",
      "button[data-e2e='video-arrow-prev']",
      "button[aria-label*='önceki' i]",
      "button[aria-label*='previous' i]",
      "button[aria-label*='yukarı' i]"
    ];
    for (const sel of exactSelectors) {
      const matches = document.querySelectorAll(sel);
      for (const el of matches) {
        if (el.closest(".clip-tiktok-action-wrapper, .clip-portal-capsule, .clip-dm-video-wrapper, .clip-tiktok-arrow-nav-btn")) continue;
        const r = el.getBoundingClientRect();
        // Strict boundary: must be right of center (40% - 92% of viewport width) and in middle vertical zone
        if (r.left > window.innerWidth * 0.40 && r.left < window.innerWidth * 0.92 &&
            r.top > 80 && r.bottom < window.innerHeight - 60) {
          return el;
        }
      }
    }

    // 2. Geometry Search: Find circular/pill navigation buttons in the right zone of the video
    const allButtons = Array.from(document.querySelectorAll("button, [role='button'], div[class*='Arrow'], div[class*='arrow']"));
    const arrowCandidates = allButtons.filter(el => {
      // Must not be our own injected element
      if (el.closest(".clip-tiktok-action-wrapper, .clip-portal-capsule, .clip-dm-video-wrapper, .clip-tiktok-arrow-nav-btn")) return false;

      const r = el.getBoundingClientRect();
      // Must be between 40% and 92% of viewport width (right of the video)
      if (r.left < window.innerWidth * 0.40 || r.left > window.innerWidth * 0.92) return false;
      // Must be in middle vertical zone
      if (r.top < 80 || r.bottom > window.innerHeight - 60) return false;
      // Dimensions: 24px - 68px
      if (r.width < 24 || r.width > 68 || r.height < 24 || r.height > 68) return false;

      // Must contain an SVG icon
      if (!el.querySelector("svg")) return false;

      // Must have NO visible text (rules out comments, counts, usernames)
      const text = el.textContent.trim();
      if (text.length > 0 && !/^[\s\n]*$/.test(text)) return false;

      // Strictly ignore close, more, or search buttons
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      const e2e = (el.getAttribute("data-e2e") || "").toLowerCase();
      if (aria.includes("close") || aria.includes("kapat") || aria.includes("more") || aria.includes("daha")) return false;
      if (e2e.includes("close") || e2e.includes("more")) return false;

      return true;
    });

    if (arrowCandidates.length === 0) return null;

    // If both up and down arrows are present, the UP arrow is physically the topmost one (smaller top)
    arrowCandidates.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    return arrowCandidates[0];
  }

  /**
   * 2b. TikTok Video Detail / Modal / DM Open Video Adapter
   * Covers: /video/ URL, VideoDetail DOM, AND videos opened from DM (/messages).
   * Strictly places ONE button directly ABOVE the UP arrow (^) on screen.
   * Completely purges ANY stray button at the top-left or near close buttons!
   */
  function handleTikTokModal() {
    if (!window.location.hostname.includes("tiktok.com")) return;

    // 1. ALWAYS PURGE ANY BUTTON AT TOP-LEFT OR FLOATING ROGUE (Sol üst temizliği)
    document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-dm-video-wrapper, .clip-tiktok-arrow-nav-btn").forEach(el => {
      const r = el.getBoundingClientRect();
      // Remove any button in top-left quadrant (< 38% of screen width or < 110px from top)
      if (r.left < window.innerWidth * 0.38 || r.top < 110) {
        el.remove();
      }
    });

    // 2. Find the UP arrow button on the right side of the video
    const upArrow = findTikTokModalUpArrow();
    if (!upArrow) return;

    const arrowRect = upArrow.getBoundingClientRect();
    const existingModalBtn = document.querySelector(".clip-tiktok-arrow-nav-btn");

    if (existingModalBtn) {
      const btnRect = existingModalBtn.getBoundingClientRect();
      // Verify it's within 30px horizontally and directly above the upArrow
      if (Math.abs(btnRect.left - arrowRect.left) < 30 && btnRect.top < arrowRect.top && (arrowRect.top - btnRect.bottom) <= 30 && (arrowRect.top - btnRect.bottom) >= -5) {
        // Enforce strict single button
        document.querySelectorAll(".clip-tiktok-arrow-nav-btn").forEach(el => {
          if (el !== existingModalBtn) el.remove();
        });
        return;
      }
      // If it's displaced or in the wrong place, remove it to re-align
      existingModalBtn.remove();
    }

    // Purge any extra modal buttons
    document.querySelectorAll(".clip-tiktok-arrow-nav-btn").forEach(el => el.remove());

    const btnWrapper = document.createElement("div");
    btnWrapper.className = "clip-tiktok-action-wrapper clip-tiktok-arrow-nav-btn";
    if (!isCompanionActive) btnWrapper.classList.add("clip-paused");
    btnWrapper.title = isCompanionActive 
      ? "CLIP — TikTok'u Panoya Kopyala (WhatsApp / Discord)" 
      : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
    btnWrapper.innerHTML = `
      <div class="clip-tiktok-action-circle" title="Panoya Kopyala" style="width: 40px !important; height: 40px !important;">
        ${ICONS.scissors}
      </div>
    `;

    btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation(), { capture: true });
    btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation(), { capture: true });
    btnWrapper.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const curVideo = getActiveTikTokVideoElement() || document.querySelector("video");
      const exactUrl = findTikTokVideoUrl(upArrow.closest("article, section, main") || document.body);
      console.log("⚡ [CLIP] TikTok Arrow Nav captured URL:", exactUrl);
      triggerCapture(btnWrapper, curVideo, "tiktok", exactUrl);
    }, { capture: true });

    // Try DOM flow insertion if arrowParent is a narrow vertical navigation strip
    const arrowParent = upArrow.parentElement;
    let placedInFlow = false;
    if (arrowParent && arrowParent.childElementCount <= 4) {
      const pRect = arrowParent.getBoundingClientRect();
      if (pRect.width < 120) {
        arrowParent.style.display = "flex";
        arrowParent.style.flexDirection = "column";
        arrowParent.style.alignItems = "center";
        upArrow.insertAdjacentElement("beforebegin", btnWrapper);
        const bRect = btnWrapper.getBoundingClientRect();
        if (Math.abs(bRect.left - arrowRect.left) < 25 && bRect.top < arrowRect.top) {
          placedInFlow = true;
        }
      }
    }

    // If not placed cleanly in flow, use direct fixed positioning centered above upArrow
    if (!placedInFlow) {
      btnWrapper.style.position = "fixed";
      btnWrapper.style.left = `${arrowRect.left + (arrowRect.width - 40) / 2}px`;
      btnWrapper.style.top = `${arrowRect.top - 48}px`;
      btnWrapper.style.zIndex = "2147483647";
      btnWrapper.style.margin = "0";
      if (!btnWrapper.parentElement) {
        document.body.appendChild(btnWrapper);
      }
    }

    // Strictly enforce single modal button
    document.querySelectorAll(".clip-tiktok-arrow-nav-btn").forEach(el => {
      if (el !== btnWrapper) el.remove();
    });
  }

  /**
   * 2c. TikTok DM / Messages Video Adapter
   * When a video is opened in TikTok DMs, it uses the exact same modal/theater player as /video/ detail pages.
   * Delegates directly to handleTikTokModal() so the button sits above the UP arrow (^) on the right, never at top-left.
   */
  function handleTikTokDMVideo() {
    handleTikTokModal();
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
        <div class="clip-action-circle" title="Panoya Kopyala">${ICONS.scissors}</div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => { e.stopPropagation(); e.stopImmediatePropagation(); }, { capture: true });
      btnWrapper.addEventListener("mousedown", (e) => { e.stopPropagation(); e.stopImmediatePropagation(); }, { capture: true });
      btnWrapper.addEventListener("touchstart", (e) => { e.stopPropagation(); e.stopImmediatePropagation(); }, { capture: true });

      let lastInstaTrigger = 0;
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const now = Date.now();
        if (now - lastInstaTrigger < 800) return;
        lastInstaTrigger = now;

        // Keep video playing — Instagram's click handler may pause it
        const wasPlaying = !videoEl.paused;
        if (wasPlaying) {
          for (const delay of [0, 20, 60, 150]) {
            setTimeout(() => { if (videoEl && videoEl.paused) videoEl.play().catch(() => {}); }, delay);
          }
        }

        const exactUrl = findInstagramVideoUrl(likeBtn, videoEl, postCard);
        console.log("⚡ [CLIP] Instagram resolved URL:", exactUrl);

        triggerCapture(btnWrapper, videoEl, "instagram", exactUrl);
      }, { capture: true });

      // Insert directly ABOVE the Like button
      targetUnit.insertAdjacentElement("beforebegin", btnWrapper);
    });
  }

  /**
   * Helper: Find Grok button / logo in tweet (whether at top-right header or in action group)
   */
  function findGrokElement(tweet) {
    if (!tweet) return null;

    // 1. Direct attribute match (Grok / Explain / Açıkla)
    const direct = tweet.querySelector(
      "[data-testid*='grok' i], " +
      "[data-testid*='Grok' i], " +
      "button[aria-label*='grok' i], " +
      "button[aria-label*='açıkla' i], " +
      "button[aria-label*='acikla' i], " +
      "button[aria-label*='explain' i], " +
      "div[aria-label*='grok' i], " +
      "div[aria-label*='açıkla' i], " +
      "div[aria-label*='explain' i], " +
      "a[href*='/i/grok']"
    );
    if (direct) {
      return direct.closest("button, [role='button']") || direct;
    }

    // 2. SVG path heuristics for Grok icon
    const allSvgs = tweet.querySelectorAll("svg");
    for (const svg of allSvgs) {
      const html = svg.innerHTML;
      if (
        html.includes("8.858") || html.includes("21.402") || 
        html.includes("9.67") || html.includes("5.08") ||
        (svg.getAttribute("aria-label") && /grok|açıkla|acikla|explain/i.test(svg.getAttribute("aria-label")))
      ) {
        return svg.closest("button, [role='button']") || svg;
      }
    }

    // 3. Tweet header button (top right area near username / timestamp)
    // The top-right header contains Grok and/or Caret. We identify Grok by excluding Caret.
    const userName = tweet.querySelector("[data-testid='User-Name']");
    const timeEl = tweet.querySelector("time");
    const headerRow = userName?.closest("div.css-175oi2r")?.parentElement || timeEl?.closest("div.css-175oi2r")?.parentElement;
    if (headerRow) {
      const btns = Array.from(headerRow.querySelectorAll("button, [role='button']"));
      const grokBtn = btns.find(b => {
        const testId = b.getAttribute("data-testid") || "";
        const label = (b.getAttribute("aria-label") || "").toLowerCase();
        if (testId === "caret" || label.includes("more") || label.includes("daha fazla")) return false;
        return true;
      });
      if (grokBtn) return grokBtn;
    }

    // 4. Action bar (div[role='group']) search for any Grok button
    const group = tweet.querySelector("div[role='group']");
    if (group) {
      const groupGrok = group.querySelector("[data-testid*='grok' i], [aria-label*='grok' i], [aria-label*='açıkla' i], [aria-label*='explain' i]");
      if (groupGrok) return groupGrok.closest("button, [role='button']") || groupGrok;
    }

    return null;
  }

  /**
   * 4. X / Twitter Adapter (Clean #350842 Pill Button placed directly to the LEFT of Grok logo)
   */
  function handleTwitter() {
    if (!window.location.hostname.includes("x.com") && !window.location.hostname.includes("twitter.com")) return;

    const tweets = document.querySelectorAll("article[data-testid='tweet'], article[role='article'], article");
    tweets.forEach(tweet => {
      if (tweet.querySelector(".clip-x-action-wrapper")) return;

      // Only add to tweets with video!
      const videoEl = tweet.querySelector("video");
      if (!videoEl) return;

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-x-action-wrapper";
      if (!isCompanionActive) btnWrapper.classList.add("clip-paused");
      btnWrapper.title = isCompanionActive
        ? "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)"
        : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
      btnWrapper.innerHTML = `
        <div class="clip-x-action-circle" title="Panoya Kopyala">
          <span>Klip</span>
        </div>
      `;

      btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
      btnWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const video = tweet.querySelector("video") || videoEl;
        let exactUrl = window.location.href;
        const statusAnchor = tweet.querySelector("a[href*='/status/']");
        if (statusAnchor && statusAnchor.href) {
          exactUrl = statusAnchor.href;
        }

        triggerCapture(btnWrapper, video, "x", exactUrl);
      });

      // User request: Move button to the LEFT of the Grok logo
      const grokEl = findGrokElement(tweet);
      if (grokEl) {
        let targetUnit = grokEl.closest("button, [role='button']") || grokEl;
        if (targetUnit.parentElement && targetUnit.parentElement.childElementCount === 1 && targetUnit.parentElement !== tweet) {
          targetUnit = targetUnit.parentElement;
        }
        targetUnit.insertAdjacentElement("beforebegin", btnWrapper);
        return;
      }

      // Fallback: If no Grok logo found, place in action toolbar before Bookmark or Share
      const group = tweet.querySelector("div[role='group']");
      if (group) {
        const shareOrBookmark = group.querySelector(
          "[data-testid='bookmark'], [data-testid='removeBookmark'], [aria-label*='Share' i], [aria-label*='Paylaş' i], [data-testid='share']"
        );
        if (shareOrBookmark) {
          const itemWrapper = shareOrBookmark.closest("div.css-175oi2r") || shareOrBookmark;
          itemWrapper.insertAdjacentElement("beforebegin", btnWrapper);
        } else if (group.lastElementChild) {
          group.insertBefore(btnWrapper, group.lastElementChild);
        } else {
          group.appendChild(btnWrapper);
        }
      }
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

    // STRICT: Only run when actively on a YouTube Shorts page URL
    const isShortsPage = window.location.pathname.startsWith("/shorts") || window.location.href.includes("/shorts/");
    if (!isShortsPage) {
      document.querySelectorAll(".clip-shorts-action-wrapper").forEach(el => el.remove());
      return;
    }

    // Clean up any rogue buttons that were mistakenly injected into actual comment boxes
    document.querySelectorAll(
      "#comments .clip-shorts-action-wrapper, " +
      "ytd-comments .clip-shorts-action-wrapper, " +
      "ytd-comment-view-model .clip-shorts-action-wrapper, " +
      "ytd-comment-thread-renderer .clip-shorts-action-wrapper, " +
      "ytd-comment-renderer .clip-shorts-action-wrapper"
    ).forEach(el => el.remove());

    const isCommentSection = (el) => el.closest(
      "#comments, ytd-comments, ytd-comment-view-model, ytd-comment-thread-renderer, ytd-comment-renderer, #comment-section-renderer"
    );

    // Strategy 1: Target Like button inside Shorts action bar (Primary & most reliable)
    const likeButtons = document.querySelectorAll(
      "ytd-shorts #actions like-button-view-model, " +
      "ytd-shorts #actions ytd-like-button-renderer, " +
      "ytd-shorts #actions #like-button, " +
      "ytd-reel-video-renderer #actions like-button-view-model, " +
      "ytd-reel-video-renderer #actions ytd-like-button-renderer, " +
      "ytd-reel-video-renderer #actions #like-button, " +
      "ytd-reel-player-overlay-renderer #actions like-button-view-model, " +
      "ytd-reel-player-overlay-renderer #actions #like-button, " +
      "ytd-reel-video-renderer like-button-view-model, " +
      "ytd-shorts like-button-view-model"
    );

    likeButtons.forEach(likeBtn => {
      if (isCommentSection(likeBtn)) return;
      const parent = likeBtn.parentElement;
      if (!parent || parent.querySelector(".clip-shorts-action-wrapper")) return;

      const reel = likeBtn.closest("ytd-reel-video-renderer, ytd-shorts") || document;
      const videoEl = reel.querySelector ? reel.querySelector("video") : document.querySelector("video");

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-shorts-action-wrapper";
      if (!isCompanionActive) btnWrapper.classList.add("clip-paused");
      btnWrapper.title = isCompanionActive
        ? "CLIP — Shorts'u Panoya Kopyala (WhatsApp / Discord)"
        : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
      btnWrapper.innerHTML = `
        <div class="clip-shorts-action-circle" title="Panoya Kopyala">${ICONS.scissors}</div>
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

      likeBtn.insertAdjacentElement("beforebegin", btnWrapper);
    });

    // Strategy 2: Target #actions containers on Shorts (Fallback if like button selector changes)
    const actionContainers = document.querySelectorAll(
      "ytd-shorts #actions, " +
      "ytd-reel-video-renderer #actions, " +
      "ytd-reel-player-overlay-renderer #actions, " +
      "#actions.ytd-reel-player-overlay-renderer, " +
      "#reel-actions"
    );

    actionContainers.forEach(container => {
      if (isCommentSection(container)) return;
      if (container.querySelector(".clip-shorts-action-wrapper")) return;

      const reel = container.closest("ytd-reel-video-renderer, ytd-shorts") || document;
      const videoEl = reel.querySelector ? reel.querySelector("video") : document.querySelector("video");

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-shorts-action-wrapper";
      if (!isCompanionActive) btnWrapper.classList.add("clip-paused");
      btnWrapper.title = isCompanionActive
        ? "CLIP — Shorts'u Panoya Kopyala (WhatsApp / Discord)"
        : "CLIP — Kapalı (Açmak için sağ alttaki simgeye tıklayın)";
      btnWrapper.innerHTML = `
        <div class="clip-shorts-action-circle" title="Panoya Kopyala">${ICONS.scissors}</div>
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

      if (container.firstElementChild) {
        container.insertBefore(btnWrapper, container.firstElementChild);
      } else {
        container.appendChild(btnWrapper);
      }
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

    // Also remove any CLIP buttons that ended up inside the comments section (failsafe)
    document.querySelectorAll("#comments .clip-yt-watch-btn-wrapper, ytd-comments .clip-yt-watch-btn-wrapper, ytd-comment-thread-renderer .clip-yt-watch-btn-wrapper, ytd-comment-renderer .clip-yt-watch-btn-wrapper").forEach(el => el.remove());

    // STRICT: Only target the video-level action bar — NEVER comment section buttons
    // ytd-watch-metadata is the metadata panel below the video (title + actions), never inside comments
    const topLevelButtons = (
      document.querySelector("ytd-watch-metadata #top-level-buttons-computed") ||
      document.querySelector("ytd-watch-flexy #top-level-buttons-computed") ||
      document.querySelector("#above-the-fold #top-level-buttons-computed") ||
      document.querySelector("#meta #top-level-buttons-computed")
    );

    // Extra guard: must be a descendant of the main watch page metadata, never inside ytd-comments
    if (!topLevelButtons) return;
    if (topLevelButtons.closest("ytd-comments, ytd-comment-thread-renderer, ytd-comment-renderer, #comments")) return;

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

    btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
    btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
    btnWrapper.addEventListener("click", (e) => e.stopPropagation());

    const watchBtn = document.createElement("button");
    watchBtn.className = "clip-yt-watch-btn";
    if (!isCompanionActive) watchBtn.classList.add("clip-paused");
    watchBtn.setAttribute("type", "button");
    watchBtn.setAttribute("aria-label", "Klip Al (CLIP)");
    watchBtn.title = "CLIP — Videodan klip kırpıp panoya kopyala";
    watchBtn.style.cssText = "height: 36px !important; min-height: 36px !important; max-height: 36px !important; padding: 0 16px !important; border-radius: 18px !important; background: #350842 !important; background-color: #350842 !important; color: #ffffff !important; fill: #ffffff !important; border: none !important; border-width: 0 !important; outline: none !important; box-shadow: 0 1px 4px rgba(53, 8, 66, 0.4) !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important; font-size: 14px !important; font-weight: 500 !important; cursor: pointer !important; user-select: none !important; box-sizing: border-box !important; vertical-align: middle !important; transition: all 0.18s ease !important;";
    watchBtn.innerHTML = `
      <span class="clip-yt-watch-icon" style="color:#f3e8ff !important;">${ICONS.scissors}</span>
      <span class="clip-yt-watch-label">Klip Al</span>
    `;

    watchBtn.addEventListener("mouseenter", () => {
      if (!watchBtn.classList.contains("active")) {
        watchBtn.style.setProperty("background-color", "#4d0d60", "important");
      }
    });
    watchBtn.addEventListener("mouseleave", () => {
      if (!watchBtn.classList.contains("active")) {
        watchBtn.style.setProperty("background-color", "#350842", "important");
      }
    });

    watchBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    watchBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    watchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleYouTubeWatchTrimmer(btnWrapper);
    });

    btnWrapper.appendChild(watchBtn);

    // Place directly to the LEFT of the Like/Dislike segmented button
    if (likeSegment) {
      let targetChild = likeSegment;
      while (targetChild && targetChild.parentElement && targetChild.parentElement !== topLevelButtons) {
        targetChild = targetChild.parentElement;
      }
      if (targetChild && targetChild.parentElement === topLevelButtons) {
        targetChild.insertAdjacentElement("beforebegin", btnWrapper);
      } else {
        topLevelButtons.insertAdjacentElement("afterbegin", btnWrapper);
      }
    } else {
      topLevelButtons.insertAdjacentElement("afterbegin", btnWrapper);
    }
  }

  function setWatchBtnActive(watchBtn, isActive) {
    if (!watchBtn) return;
    if (isActive) {
      watchBtn.classList.add("active");
      watchBtn.style.setProperty("background-color", "#6b1485", "important");
    } else {
      watchBtn.classList.remove("active");
      watchBtn.style.setProperty("background-color", "#350842", "important");
    }
  }

  /**
   * Compact Floating Clipper Flyout for YouTube Watch Videos (Zero-Overflow Inter UI)
   */
  function toggleYouTubeWatchTrimmer(btnWrapper) {
    const existingFlyout = document.querySelector(".clip-yt-flyout-panel");
    const watchBtn = btnWrapper.querySelector(".clip-yt-watch-btn");

    if (existingFlyout) {
      if (existingFlyout.__clip_cleanup) existingFlyout.__clip_cleanup();
      else existingFlyout.remove();
      setWatchBtnActive(watchBtn, false);
      return;
    }

    setWatchBtnActive(watchBtn, true);

    const videoEl = document.querySelector("ytd-watch-flexy video, #movie_player video, video");
    const curTime = videoEl ? (videoEl.currentTime || 0) : 0;

    // Initial default: Last 30 seconds ending at current time
    let initEnd = Math.max(1, Math.floor(curTime));
    if (initEnd <= 0) initEnd = 30;
    let initStart = Math.max(0, initEnd - 30);

    const flyout = document.createElement("div");
    flyout.className = "clip-yt-flyout-panel";

    // Fixed horizontal dock at bottom-center of viewport
    flyout.style.position = "fixed";
    flyout.style.bottom = "28px";
    flyout.style.left = "50%";
    flyout.style.transform = "translateX(-50%)";
    flyout.style.zIndex = "2147483647";

    flyout.innerHTML = `
      <div class="clip-flyout-top-row">
        <div class="clip-flyout-brand">
          <span class="clip-flyout-icon">${ICONS.scissors}</span>
          <span class="clip-flyout-title">Klip Al</span>
          <span class="clip-flyout-time-tag" id="clip-cur-time-display">${formatTime(curTime)}</span>
        </div>

        <div class="clip-flyout-presets-wrap">
          <span class="clip-presets-title">Süre:</span>
          <button type="button" class="clip-preset-pill" data-preset="15">15s</button>
          <button type="button" class="clip-preset-pill active" data-preset="30">30s</button>
          <button type="button" class="clip-preset-pill" data-preset="60">60s</button>
          <button type="button" class="clip-preset-pill" data-preset="120">2dk</button>
        </div>

        <button class="clip-flyout-close" type="button" title="Kapat">✕</button>
      </div>

      <div class="clip-flyout-main-row">
        <div class="clip-time-pill-group">
          <span class="clip-time-tag">BAŞLANGIÇ</span>
          <input type="text" class="clip-time-inp" id="clip-start-inp" value="${formatTime(initStart)}" placeholder="00:00">
          <button type="button" class="clip-time-snap-btn" id="clip-snap-start" title="Videonun şu anki saniyesini başlangıç yap">Şu An</button>
        </div>

        <div class="clip-time-pill-group">
          <span class="clip-time-tag">BİTİŞ</span>
          <input type="text" class="clip-time-inp" id="clip-end-inp" value="${formatTime(initEnd)}" placeholder="00:30">
          <button type="button" class="clip-time-snap-btn" id="clip-snap-end" title="Videonun şu anki saniyesini bitiş yap">Şu An</button>
        </div>

        <button type="button" class="clip-flyout-submit-btn" id="clip-flyout-submit">
          <span class="clip-submit-icon">${ICONS.scissors}</span>
          <span class="clip-submit-text">Klibi Kopyala</span>
        </button>
      </div>

      <div class="clip-flyout-bottom-row">
        <span id="clip-duration-summary">Klip Süresi: <strong>30 sn</strong></span>
        <span class="clip-summary-compat">WhatsApp / Discord için panoya kopyalanır</span>
      </div>
    `;

    // Event Listeners for Flyout
    flyout.addEventListener("pointerdown", (e) => e.stopPropagation());
    flyout.addEventListener("mousedown", (e) => e.stopPropagation());
    flyout.addEventListener("click", (e) => e.stopPropagation());

    const cleanupFlyout = () => {
      clearInterval(ticker);
      document.removeEventListener("pointerdown", onOutsideClick);
      if (document.body.contains(flyout)) flyout.remove();
      setWatchBtnActive(watchBtn, false);
    };
    flyout.__clip_cleanup = cleanupFlyout;

    const closeBtn = flyout.querySelector(".clip-flyout-close");
    closeBtn.addEventListener("click", cleanupFlyout);

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
      durationSummary.innerHTML = `Klip Süresi: <strong>${diffStr}</strong>`;
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
      submitBtn.querySelector(".clip-submit-text").textContent = "Klip Hazırlanıyor...";

      const cleanUrl = window.location.href.split("&")[0];
      console.log("⚡ [CLIP] Trimming YouTube clip:", cleanUrl, s, e);

      triggerCapture(btnWrapper, videoEl, "youtube", cleanUrl, s, e);

      // Close flyout after initiating capture
      setTimeout(() => {
        cleanupFlyout();
      }, 1200);
    });

    document.body.appendChild(flyout);

    // Click outside listener to dismiss
    const onOutsideClick = (e) => {
      if (!flyout.contains(e.target) && !btnWrapper.contains(e.target)) {
        cleanupFlyout();
      }
    };
    setTimeout(() => {
      document.addEventListener("pointerdown", onOutsideClick);
    }, 120);
  }



  /**
   * Helper: Scan performance resource timing for direct Instagram/Facebook CDN video stream
   */
  function findInstagramCdnStream() {
    try {
      const entries = performance.getEntriesByType("resource");
      for (let i = entries.length - 1; i >= 0; i--) {
        const name = entries[i].name || "";
        if (!name.startsWith("http")) continue;
        const low = name.toLowerCase();

        // Must be Instagram / Facebook video CDN
        const isCdn = low.includes("cdninstagram.com") || low.includes("fbcdn.net");
        if (!isCdn) continue;

        // Strictly reject audio streams, static images and scripts
        if (low.includes("audio") || low.includes("dash_ln_heaac") || low.includes(".m4a")) continue;
        if (low.includes(".jpg") || low.includes(".jpeg") || low.includes(".png") || low.includes(".webp") || low.includes(".js") || low.includes(".css")) continue;

        // Video signatures
        if (low.includes(".mp4") || low.includes("/v/t50") || low.includes("/v/t64") || low.includes("/v/t2") || low.includes("bytestart=") || low.includes("mime_type=video_mp4") || low.includes("efg=")) {
          return name
            .replace(/[?&]bytestart=\d+/gi, "")
            .replace(/[?&]byteend=\d+/gi, "")
            .replace(/\?&/g, "?")
            .replace(/&&+/g, "&")
            .replace(/[?&]$/, "");
        }
      }
    } catch (e) {}
    return null;
  }

  /**
   * Safe recursive property finder for React Fiber without throwing on circular structures
   */
  function safeExtractInstagramUrl(obj, depth = 0, seen = new WeakSet()) {
    if (!obj || depth > 5 || typeof obj !== "object") return null;
    if (seen.has(obj)) return null;
    seen.add(obj);

    if (typeof obj.playable_url === "string" && obj.playable_url.startsWith("http")) return obj.playable_url;
    if (typeof obj.playableUrl === "string" && obj.playableUrl.startsWith("http")) return obj.playableUrl;
    if (typeof obj.video_url === "string" && obj.video_url.startsWith("http")) return obj.video_url;
    if (typeof obj.videoUrl === "string" && obj.videoUrl.startsWith("http")) return obj.videoUrl;
    if (typeof obj.code === "string" && /^[A-Za-z0-9_-]{9,15}$/.test(obj.code)) {
      return `https://www.instagram.com/reel/${obj.code}/`;
    }

    if (Array.isArray(obj.video_versions) && obj.video_versions.length > 0) {
      const best = obj.video_versions[0];
      if (best && typeof best.url === "string") return best.url;
    }

    for (const key of Object.keys(obj)) {
      if (key === "_owner" || key === "stateNode" || key === "return" || key === "child" || key === "sibling") continue;
      const val = obj[key];
      if (typeof val === "string") {
        if ((val.includes("cdninstagram.com") || val.includes("fbcdn.net")) && (val.includes(".mp4") || val.includes("/v/t50"))) {
          return val;
        }
        const m = val.match(/"code":"([A-Za-z0-9_-]{9,15})"/);
        if (m) return `https://www.instagram.com/reel/${m[1]}/`;
      } else if (typeof val === "object" && val !== null) {
        const found = safeExtractInstagramUrl(val, depth + 1, seen);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Helper: Resolve Instagram URL from DM message, card or player
   */
  function findInstagramDirectUrl(videoEl) {
    if (!videoEl) return window.location.href;

    // 1. Direct CDN stream from performance resource timing
    const cdnStream = findInstagramCdnStream();
    if (cdnStream) return cdnStream;

    // 2. Direct video source if progressive http
    if (videoEl.currentSrc && videoEl.currentSrc.startsWith("http") && !videoEl.currentSrc.startsWith("blob:")) {
      return videoEl.currentSrc;
    }
    if (videoEl.src && videoEl.src.startsWith("http") && !videoEl.src.startsWith("blob:")) {
      return videoEl.src;
    }

    // 3. Check parent message hierarchy for Reel / Post links
    let cur = videoEl;
    for (let i = 0; i < 12 && cur && cur !== document.body; i++) {
      const anchors = cur.querySelectorAll("a[href*='/reel/'], a[href*='/p/'], a[href*='/reels/']");
      for (const a of anchors) {
        const h = a.getAttribute("href") || a.href || "";
        const m = h.match(/\/(?:reel|reels|p)\/([A-Za-z0-9_-]{9,15})/);
        if (m && m[1] && m[1] !== "reels") {
          return `https://www.instagram.com/reel/${m[1]}/`;
        }
      }
      cur = cur.parentElement;
    }

    // 4. React Fiber inspection
    try {
      cur = videoEl;
      for (let i = 0; i < 10 && cur && cur !== document.body; i++) {
        const fiberKey = Object.keys(cur).find(k => k.startsWith("__reactFiber$") || k.startsWith("__reactProps$"));
        if (fiberKey && cur[fiberKey]) {
          let fiber = cur[fiberKey];
          for (let f = 0; f < 8 && fiber; f++) {
            const props = fiber.memoizedProps || fiber.props;
            if (props) {
              const res = safeExtractInstagramUrl(props);
              if (res) return res;
            }
            fiber = fiber.return;
          }
        }
        cur = cur.parentElement;
      }
    } catch (e) {}

    // 5. Check if inside dialog / modal
    const dialog = videoEl.closest("div[role='dialog']");
    if (dialog) {
      const anchors = dialog.querySelectorAll("a[href*='/reel/'], a[href*='/p/']");
      for (const a of anchors) {
        const h = a.getAttribute("href") || a.href || "";
        const m = h.match(/\/(?:reel|reels|p)\/([A-Za-z0-9_-]{9,15})/);
        if (m && m[1]) return `https://www.instagram.com/reel/${m[1]}/`;
      }
    }

    // 6. Check window pathname
    const m = window.location.pathname.match(/\/(?:reel|reels|p)\/([A-Za-z0-9_-]{9,15})/);
    if (m && m[1] && m[1] !== "reels") {
      return `https://www.instagram.com/reel/${m[1]}/`;
    }

    return window.location.href;
  }

  /**
   * Adapter for Instagram DM / Direct Messages format
   * Injects sleek floating CLIP button onto video messages and shared Reel cards in DMs
   */
  function handleInstagramDM() {
    if (!window.location.hostname.includes("instagram.com")) return;

    // A. Handle <video> elements in DMs or non-feed views
    const allVideos = document.querySelectorAll("video");
    allVideos.forEach(videoEl => {
      // If already handled by Reels/Feed adapter with like button, skip
      const feedPost = videoEl.closest("article, [data-blade-container]");
      if (feedPost && feedPost.querySelector(".clip-reels-action-wrapper")) return;

      const rect = videoEl.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 40) return;

      // Locate outermost video container / message bubble
      let container = videoEl.parentElement;
      while (container && container.parentElement && container.parentElement !== document.body) {
        const pr = container.parentElement.getBoundingClientRect();
        if (Math.abs(pr.width - rect.width) < 25 && Math.abs(pr.height - rect.height) < 25) {
          container = container.parentElement;
        } else {
          break;
        }
      }
      if (!container || container === document.body) container = videoEl.parentElement;
      if (!container) return;

      if (container.querySelector(":scope > .clip-dm-video-wrapper")) {
        return;
      }

      const compPos = window.getComputedStyle(container).position;
      if (compPos === "static") {
        container.style.position = "relative";
      }

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "clip-dm-video-wrapper";
      btnWrapper.title = "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)";
      btnWrapper.innerHTML = `
        <div class="clip-dm-action-circle" title="Panoya Kopyala">
          ${ICONS.scissors}
        </div>
      `;

      // Absolute suppression of pointer / mouse down events in capture phase to prevent Instagram from pausing
      const stopEarly = (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      btnWrapper.addEventListener("pointerdown", stopEarly, { capture: true });
      btnWrapper.addEventListener("mousedown", stopEarly, { capture: true });
      btnWrapper.addEventListener("touchstart", stopEarly, { capture: true });

      let lastTriggerTime = 0;
      const doTrigger = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }

        const now = Date.now();
        if (now - lastTriggerTime < 800) return;
        lastTriggerTime = now;

        // Preserve playback state: ensure video doesn't get paused by Instagram click handlers
        const wasPlaying = !videoEl.paused;
        if (wasPlaying) {
          for (const delay of [0, 15, 50, 150, 300]) {
            setTimeout(() => {
              if (videoEl && videoEl.paused) videoEl.play().catch(() => {});
            }, delay);
          }
        }

        const exactUrl = findInstagramDirectUrl(videoEl);
        console.log("⚡ [CLIP] Instagram DM video resolved URL:", exactUrl);

        triggerCapture(btnWrapper, videoEl, "instagram", exactUrl);
      };

      btnWrapper.addEventListener("click", doTrigger, { capture: true });
      btnWrapper.addEventListener("pointerup", doTrigger, { capture: true });
      btnWrapper.addEventListener("touchend", doTrigger, { capture: true });

      container.appendChild(btnWrapper);
    });

    // B. Handle shared Reel preview cards in DMs before video is initiated
    if (window.location.pathname.includes("/direct/")) {
      const dmCards = document.querySelectorAll("a[href*='/reel/'], a[href*='/p/']");
      dmCards.forEach(cardAnchor => {
        if (cardAnchor.querySelector("video") || cardAnchor.querySelector(".clip-dm-video-wrapper")) return;
        const rect = cardAnchor.getBoundingClientRect();
        if (rect.width < 60 || rect.height < 60) return;

        const compPos = window.getComputedStyle(cardAnchor).position;
        if (compPos === "static") {
          cardAnchor.style.position = "relative";
        }

        const btnWrapper = document.createElement("div");
        btnWrapper.className = "clip-dm-video-wrapper";
        btnWrapper.title = "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)";
        btnWrapper.innerHTML = `
          <div class="clip-dm-action-circle" title="Panoya Kopyala">
            ${ICONS.scissors}
          </div>
        `;

        const stopEarly = (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        };
        btnWrapper.addEventListener("pointerdown", stopEarly, { capture: true });
        btnWrapper.addEventListener("mousedown", stopEarly, { capture: true });
        btnWrapper.addEventListener("touchstart", stopEarly, { capture: true });

        let lastTriggerTime = 0;
        const onCardAction = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }

          const now = Date.now();
          if (now - lastTriggerTime < 800) return;
          lastTriggerTime = now;

          const exactUrl = cardAnchor.href;
          console.log("⚡ [CLIP] Instagram DM card resolved URL:", exactUrl);
          triggerCapture(btnWrapper, null, "instagram", exactUrl);
        };

        btnWrapper.addEventListener("click", onCardAction, { capture: true });
        btnWrapper.addEventListener("pointerup", onCardAction, { capture: true });
        btnWrapper.addEventListener("touchend", onCardAction, { capture: true });

        cardAnchor.appendChild(btnWrapper);
      });
    }
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

    const circle = targetWrapper.querySelector(".clip-shorts-action-circle, .clip-tiktok-action-circle, .clip-action-circle, .clip-x-action-circle, .clip-dm-action-circle");
    const boltIcon = targetWrapper.querySelector(".clip-ext-icon-bolt");
    const watchIcon = targetWrapper.querySelector(".clip-yt-watch-icon");

    if (circle) circle.innerHTML = ICONS.spinner;
    if (boltIcon) boltIcon.innerHTML = ICONS.spinner;
    if (watchIcon) watchIcon.innerHTML = ICONS.spinner;

    let targetUrl = exactUrl || window.location.href;
    let domSrc = videoEl ? (videoEl.currentSrc || videoEl.src) : null;
    if (exactUrl && (exactUrl.includes("cdninstagram.com") || exactUrl.includes("fbcdn.net"))) {
      domSrc = exactUrl;
    }
    if (platform === "instagram") {
      const cdn = findInstagramCdnStream();
      if (cdn) {
        domSrc = cdn;
        if (!targetUrl || targetUrl.includes("/direct/")) {
          targetUrl = cdn;
        }
      }
    }
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
            const errText = (response && response.error) ? response.error : (chrome.runtime.lastError ? chrome.runtime.lastError.message : "Video yakalanamadı. Lütfen sayfayı yenileyip tekrar deneyin.");
            showDynamicIslandMessage(`⚠️ ${errText}`);
            resetButtonState(targetWrapper);
            return;
          }

          if (circle) circle.innerHTML = ICONS.check;
          if (boltIcon) boltIcon.innerHTML = ICONS.check;
          if (watchIcon) watchIcon.innerHTML = ICONS.check;

          // Helper servisi çalışıyorsa doğrudan sistem panosuna (Ctrl+V / Cmd+V) kopyalandı
          const clipboardReady = !!response.clipboardCopied;

          // Masaüstü servisi açık değilse otomatik doğrudan tarayıcı indirmesini tetikle
          if (!clipboardReady && response.videoUrl) {
            try {
              chrome.runtime.sendMessage({
                action: "TRIGGER_DOWNLOAD",
                videoUrl: response.videoUrl,
                platform: platform
              });
            } catch (_) {}
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
          setTimeout(() => resetButtonState(targetWrapper), 3000);
        }
      );
    } catch (err) {
      clearTimeout(safetyTimeout);
      targetWrapper.removeAttribute("data-loading");
      resetButtonState(targetWrapper);
      showDynamicIslandMessage("⚠️ Eklenti güncellendi. Sayfayı yenileyip tekrar deneyin.");
    }
  }

  function resetButtonState(targetWrapper) {
    if (!targetWrapper) return;
    const circle = targetWrapper.querySelector(".clip-shorts-action-circle, .clip-tiktok-action-circle, .clip-action-circle, .clip-x-action-circle, .clip-dm-action-circle");
    const boltIcon = targetWrapper.querySelector(".clip-ext-icon-bolt");
    const watchIcon = targetWrapper.querySelector(".clip-yt-watch-icon");

    if (circle) circle.innerHTML = ICONS.scissors;
    if (boltIcon) boltIcon.innerHTML = ICONS.scissors;
    if (watchIcon) watchIcon.innerHTML = ICONS.scissors;
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
      statusSpan.innerHTML = `${ICONS.check} <span>Panoda Hazır (${PASTE_KEY})</span>`;
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
    folderBtn.title = `Klipler Klasörünü Aç (${FILE_EXPLORER_NAME})`;
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

    // TikTok: run feed and modal adapters cleanly
    if (window.location.hostname.includes("tiktok.com")) {
      try { handleTikTokFeed(); } catch (e) { console.warn("[CLIP] TikTok Feed err:", e); }
      try { handleTikTokModal(); } catch (e) { console.warn("[CLIP] TikTok Modal err:", e); }
    }

    try { handleInstagram(); } catch (e) { console.warn("[CLIP] Instagram err:", e); }
    try { handleTwitter(); } catch (e) { console.warn("[CLIP] Twitter err:", e); }
    try { handleYouTubeShorts(); } catch (e) { console.warn("[CLIP] YouTube Shorts err:", e); }
    try { handleYouTubeWatch(); } catch (e) { console.warn("[CLIP] YouTube Watch err:", e); }
    try { handleInstagramDM(); } catch (e) { console.warn("[CLIP] Instagram DM err:", e); }
  }

  // Initial delayed scan
  scheduleScan(150);

  // Background interval: once every 1.5s, strictly paused during scroll
  window.__CLIP_INTERVAL__ = setInterval(() => {
    if (!isUserScrolling) scanAll();
  }, 1500);

  // Sync state with System Tray Companion (active vs paused/colorless)
  async function syncCompanionState() {
    try {
      const res = await fetch("http://127.0.0.1:48123/health", { signal: AbortSignal.timeout(450) });
      if (res.ok) {
        const data = await res.json();
        const active = data.active !== false;
        if (isCompanionActive !== active) {
          isCompanionActive = active;
          document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-reels-action-wrapper, .clip-shorts-action-wrapper, .clip-x-action-wrapper, .clip-yt-watch-btn, .clip-dm-video-wrapper").forEach(el => {
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
      document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-tiktok-arrow-nav-btn, .clip-tiktok-overlay-btn, .clip-tiktok-fixed-btn, .clip-dm-video-wrapper").forEach(el => el.remove());
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
