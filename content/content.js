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
   * Helper: Find the TikTok vertical navigation up/down arrow buttons on the right side
   */
  function findTikTokNavTarget() {
    const candidates = [
      "button[data-e2e='arrow-up']",
      "button[data-e2e='arrow-left']",
      "button[data-e2e='arrow-prev']",
      "button[data-e2e='arrow-pre']",
      "button[data-e2e='video-arrow-up']",
      "button[data-e2e='video-arrow-pre']",
      "button[data-e2e*='arrow-up']",
      "button[data-e2e*='arrow-prev']",
      "button[data-e2e='browse-up']",
      "button[data-e2e='browse-arrow-up']",
      "button[data-e2e='swipe-up']",
      "button[aria-label*='previous' i]",
      "button[aria-label*='önceki' i]",
      "button[aria-label*='yukarı' i]",
      "button[aria-label*='up' i]",
      "button[aria-label*='scroll up' i]",
      "div[role='button'][aria-label*='up' i]",
      "div[role='button'][aria-label*='previous' i]",
      "[class*='ButtonVideoArrow']",
      "[class*='ArrowButton']",
      "[class*='ButtonArrow']",
      "[class*='VideoArrow']",
      "[class*='DivArrowItem']"
    ];

    for (const sel of candidates) {
      try {
        const el = document.querySelector(sel);
        if (el && !el.closest("[data-e2e*='comment'], [class*='Comment'], [class*='comment'], header, nav, [data-e2e*='search'], form")) {
          return el;
        }
      } catch (e) {}
    }

    const arrowContainers = document.querySelectorAll(
      "div[class*='ArrowContainer'], div[class*='DivArrowContainer'], div[class*='NavigationContainer'], div[class*='DivNavigation'], div[class*='FeedNavigation'], div[data-e2e*='arrow'], div[data-e2e*='navigation']"
    );
    for (const container of arrowContainers) {
      if (container.closest("[data-e2e*='comment'], [class*='Comment'], [class*='comment'], header, nav, [data-e2e*='search'], form")) continue;
      const firstBtn = container.querySelector("button, div[role='button']");
      if (firstBtn) return firstBtn;
    }

    // Deep heuristic: scan circular buttons on the right side of the screen
    const allButtons = document.querySelectorAll("button, div[role='button']");
    const rightThreshold = window.innerWidth * 0.65;
    const rightButtons = [];

    for (const btn of allButtons) {
      if (btn.closest("[data-e2e*='comment'], [class*='Comment'], [class*='comment'], header, nav, [data-e2e*='search'], form, .clip-tiktok-action-wrapper")) continue;
      if (btn.classList.contains("clip-tiktok-action-wrapper")) continue;

      const svg = btn.querySelector("svg");
      if (!svg) continue;

      const rect = btn.getBoundingClientRect();
      if (rect.width >= 24 && rect.width <= 70 && rect.height >= 24 && rect.height <= 70) {
        if (rect.left >= rightThreshold && rect.top > 80 && rect.bottom < window.innerHeight - 30) {
          rightButtons.push({ btn, top: rect.top });
        }
      }
    }

    if (rightButtons.length > 0) {
      rightButtons.sort((a, b) => a.top - b.top);
      return rightButtons[0].btn;
    }

    // Secondary fallback: if up button hidden on first video, check down arrow
    const downArrow = document.querySelector("button[data-e2e*='arrow-down'], button[data-e2e='browse-down'], button[data-e2e='swipe-down'], button[aria-label*='next' i], button[aria-label*='aşağı' i]");
    if (downArrow && !downArrow.closest("[data-e2e*='comment'], header, nav, [data-e2e*='search']")) {
      return downArrow;
    }

    return null;
  }

  /**
   * 2. TikTok Adapter (Single button strictly ABOVE the vertical navigation arrows on the right)
   */
  function handleTikTok() {
    if (!window.location.hostname.includes("tiktok.com")) return;

    // Clean up any stray buttons inside comments, headers, search bars, or top area
    document.querySelectorAll(
      "[data-e2e*='comment'] .clip-tiktok-action-wrapper, " +
      "[class*='Comment'] .clip-tiktok-action-wrapper, " +
      "[class*='comment'] .clip-tiktok-action-wrapper, " +
      "header .clip-tiktok-action-wrapper, " +
      "nav .clip-tiktok-action-wrapper, " +
      "form .clip-tiktok-action-wrapper, " +
      "[data-e2e*='search'] .clip-tiktok-action-wrapper, " +
      "[class*='search' i] .clip-tiktok-action-wrapper, " +
      "[class*='Header' i] .clip-tiktok-action-wrapper"
    ).forEach(el => el.remove());

    // Also sweep any buttons placed in the top 85px (search bar zone)
    document.querySelectorAll(".clip-tiktok-action-wrapper").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < 85 && r.left > window.innerWidth * 0.15 && r.left < window.innerWidth * 0.85) {
        el.remove();
      }
    });

    // Primary: Find vertical navigation arrows (Right-side ^ and v column)
    const navArrow = findTikTokNavTarget();

    if (navArrow) {
      const parent = navArrow.parentElement;
      if (parent && !parent.querySelector(".clip-tiktok-arrow-nav-btn")) {
        // Remove any other tiktok buttons on the page
        document.querySelectorAll(".clip-tiktok-action-wrapper, .clip-tiktok-overlay-btn, .clip-tiktok-fixed-btn").forEach(el => el.remove());

        const btnWrapper = document.createElement("div");
        btnWrapper.className = "clip-tiktok-action-wrapper clip-tiktok-arrow-nav-btn";
        btnWrapper.title = "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)";
        btnWrapper.innerHTML = `<div class="clip-tiktok-action-circle" title="Panoya Kopyala">${ICONS.bolt}</div>`;

        btnWrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
        btnWrapper.addEventListener("mousedown", (e) => e.stopPropagation());
        btnWrapper.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const videoEl = document.querySelector("video");
          const exactUrl = findTikTokVideoUrl(parent.closest("article, [class*='ItemContainer']") || document.body);
          triggerCapture(btnWrapper, videoEl, "tiktok", exactUrl);
        });

        // Insert directly ABOVE the up arrow
        navArrow.insertAdjacentElement("beforebegin", btnWrapper);
      }

      // If arrow button is present, make sure no rogue buttons exist elsewhere (especially search bar or like button)
      document.querySelectorAll(".clip-tiktok-action-wrapper:not(.clip-tiktok-arrow-nav-btn)").forEach(el => el.remove());
      return;
    }

    // Fallback: If arrows not yet detected in DOM, place fixed button at right side where the arrows sit
    if (!document.querySelector(".clip-tiktok-fixed-btn, .clip-tiktok-arrow-nav-btn")) {
      const fixedBtn = document.createElement("div");
      fixedBtn.className = "clip-tiktok-fixed-btn";
      fixedBtn.title = "CLIP — Videoyu Panoya Kopyala (WhatsApp / Discord)";
      fixedBtn.innerHTML = `<div class="clip-tiktok-action-circle">${ICONS.bolt}</div>`;

      fixedBtn.style.cssText = `
        position: fixed !important;
        right: 20px !important;
        top: 42% !important;
        z-index: 2147483647 !important;
        cursor: pointer !important;
      `;
      fixedBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
      fixedBtn.addEventListener("mousedown", (e) => e.stopPropagation());
      fixedBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const videoEl = document.querySelector("video");
        const exactUrl = findTikTokVideoUrl(document.body);
        triggerCapture(fixedBtn, videoEl, "tiktok", exactUrl);
      });
      document.body.appendChild(fixedBtn);
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

  window.addEventListener("popstate", () => {
    // On TikTok SPA navigation, clean up single-page-specific buttons and rescan
    if (window.location.hostname.includes("tiktok.com")) {
      document.querySelectorAll(".clip-tiktok-arrow-nav-btn, .clip-tiktok-overlay-btn, .clip-tiktok-fixed-btn").forEach(el => el.remove());
    }
    scheduleScan(50);
  });

})();
