/**
 * CLIP — Universal Video Clipboard
 * Extension Popup Logic
 */

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const urlInput = document.getElementById("video-url-input");
  const pasteBtn = document.getElementById("paste-btn");
  const processBtn = document.getElementById("process-btn");
  const inputSection = document.getElementById("input-section");
  const processingSection = document.getElementById("processing-section");
  const readySection = document.getElementById("ready-section");
  const previewVideo = document.getElementById("preview-video");
  const dragZone = document.getElementById("popup-drag-zone");
  const actionDownloadBtn = document.getElementById("action-download-btn");
  const actionRecopyBtn = document.getElementById("action-recopy-btn");
  const actionNewBtn = document.getElementById("action-new-btn");
  const historyList = document.getElementById("history-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const platformChips = document.querySelectorAll(".chip");
  const proTogglePill = document.getElementById("pro-toggle-pill");
  const proText = document.getElementById("pro-text");
  const proDot = document.getElementById("pro-dot");

  let currentResolvedData = null;

  // Platform detection helper
  function detectPlatform(url) {
    const u = (url || "").toLowerCase();
    if (u.includes("tiktok.com")) return "tiktok";
    if (u.includes("instagram.com")) return "instagram";
    if (u.includes("twitter.com") || u.includes("x.com")) return "x";
    return null;
  }

  function updatePlatformChips(url) {
    const platform = detectPlatform(url);
    platformChips.forEach(chip => {
      if (chip.getAttribute("data-platform") === platform) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  urlInput.addEventListener("input", (e) => {
    updatePlatformChips(e.target.value);
  });

  async function updateProUI() {
    const data = await chrome.storage.local.get("settings");
    const isPro = data?.settings?.isPro === true;
    if (proText && proDot) {
      if (isPro) {
        proText.textContent = "⭐ PRO";
        proText.style.color = "#fbbf24";
        proDot.style.background = "#fbbf24";
        if (proTogglePill) proTogglePill.style.borderColor = "rgba(251, 191, 36, 0.5)";
      } else {
        proText.textContent = "Free (60s)";
        proText.style.color = "#e9d5ff";
        proDot.style.background = "#a855f7";
        if (proTogglePill) proTogglePill.style.borderColor = "rgba(168, 85, 247, 0.3)";
      }
    }
  }

  await updateProUI();

  if (proTogglePill) {
    proTogglePill.addEventListener("click", async () => {
      const data = await chrome.storage.local.get("settings");
      const current = data?.settings || {};
      current.isPro = !current.isPro;
      await chrome.storage.local.set({ settings: current });
      await updateProUI();
    });
  }

  // Auto-detect active tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const activePlatform = detectPlatform(tab.url);
      if (activePlatform) {
        urlInput.value = tab.url;
        updatePlatformChips(tab.url);
      }
    }
  } catch (err) {
    console.warn("Tab URL query failed:", err);
  }

  // Paste from clipboard button
  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text;
        updatePlatformChips(text);
        urlInput.focus();
      }
    } catch (e) {
      console.warn("Clipboard read permission:", e);
    }
  });

  // Process Video Handler
  async function handleProcessVideo() {
    const url = urlInput.value.trim();
    if (!url) {
      urlInput.focus();
      return;
    }

    inputSection.style.display = "none";
    processingSection.style.display = "flex";

    chrome.runtime.sendMessage(
      { action: "RESOLVE_VIDEO", url: url },
      (response) => {
        processingSection.style.display = "none";

        if (response && response.isProRequired) {
          alert("⭐ Bu video 1 dakikadan uzun.\n\nCLIP ücretsiz sürümü dikey kısa içerikler (Shorts, TikTok, Reels, X) için 60 saniyeye kadar geçerlidir.\n\nSağ üstteki 'Free (60s)' butonuna basarak PRO modunu test amaçlı açabilirsiniz!");
          inputSection.style.display = "flex";
          return;
        }

        if (chrome.runtime.lastError || !response || !response.success) {
          alert((response && response.error) ? response.error : "Video çözülemedi. Lütfen 'start_clip.bat' servisinin açık olduğunu kontrol edin.");
          inputSection.style.display = "flex";
          return;
        }

        currentResolvedData = response;
        showReadyVideo(response);
        loadHistory();
      }
    );
  }

  processBtn.addEventListener("click", handleProcessVideo);
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleProcessVideo();
  });

  // Show ready video section
  function showReadyVideo(data) {
    readySection.style.display = "flex";
    previewVideo.src = data.videoUrl;

    // Configure Draggable Zone
    dragZone.ondragstart = (e) => {
      dragZone.classList.add("dragging");
      const filename = data.filename || `CLIP_${data.platform || "video"}_${Date.now()}.mp4`;

      const downloadPayload = `video/mp4:${filename}:${data.videoUrl}`;
      e.dataTransfer.setData("DownloadURL", downloadPayload);
      e.dataTransfer.setData("text/uri-list", data.videoUrl);
      e.dataTransfer.setData("text/plain", data.videoUrl);
      e.dataTransfer.effectAllowed = "copyMove";
    };

    dragZone.ondragend = () => {
      dragZone.classList.remove("dragging");
    };
  }

  // Action buttons
  actionDownloadBtn.addEventListener("click", () => {
    if (!currentResolvedData) return;
    chrome.runtime.sendMessage({
      action: "TRIGGER_DOWNLOAD",
      videoUrl: currentResolvedData.videoUrl,
      platform: currentResolvedData.platform
    });
  });

  const actionFolderBtn = document.getElementById("action-folder-btn");
  if (actionFolderBtn) {
    actionFolderBtn.addEventListener("click", () => {
      if (currentResolvedData && currentResolvedData.filePath) {
        fetch(`http://127.0.0.1:48123/open_file?path=${encodeURIComponent(currentResolvedData.filePath)}`).catch(() => {});
      } else {
        fetch("http://127.0.0.1:48123/open_folder").catch(() => {});
      }
    });
  }

  const openFolderBtn = document.getElementById("open-folder-btn");
  if (openFolderBtn) {
    openFolderBtn.addEventListener("click", () => {
      fetch("http://127.0.0.1:48123/open_folder").catch(() => {});
    });
  }

  actionRecopyBtn.addEventListener("click", async () => {
    if (!currentResolvedData) return;

    if (currentResolvedData.filePath) {
      try {
        await fetch(`http://127.0.0.1:48123/copy?path=${encodeURIComponent(currentResolvedData.filePath)}`);
      } catch (err) {
        console.warn("Copy to CF_HDROP failed:", err);
      }
    }

    actionRecopyBtn.textContent = "✓ Kopyalandı!";
    setTimeout(() => {
      actionRecopyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        Tekrar Kopyala
      `;
    }, 1800);
  });

  actionNewBtn.addEventListener("click", () => {
    readySection.style.display = "none";
    inputSection.style.display = "flex";
    previewVideo.pause();
    previewVideo.src = "";
    urlInput.value = "";
    updatePlatformChips("");
    currentResolvedData = null;
  });

  // History Management
  async function loadHistory() {
    const { clipHistory = [] } = await chrome.storage.local.get("clipHistory");
    historyList.innerHTML = "";

    if (clipHistory.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          Henüz kopyalanan video yok. Videodaki ⚡ ikonuna basarak anında panoya alabilirsiniz.
        </div>
      `;
      return;
    }

    clipHistory.forEach(item => {
      const itemEl = document.createElement("div");
      itemEl.className = "history-item";

      const timeAgo = formatTimeAgo(new Date(item.timestamp));

      itemEl.innerHTML = `
        <div class="history-item-left">
          <span>⚡</span>
          <span>${item.title || "Video"}</span>
        </div>
        <button type="button" class="history-item-btn">Kullan</button>
      `;

      itemEl.querySelector(".history-item-btn").addEventListener("click", () => {
        showReadyVideo(item);
        currentResolvedData = item;
        inputSection.style.display = "none";
      });

      historyList.appendChild(itemEl);
    });
  }

  clearHistoryBtn.addEventListener("click", async () => {
    try {
      await fetch("http://127.0.0.1:48123/clean");
    } catch (_) {}
    await chrome.storage.local.set({ clipHistory: [] });
    loadHistory();
  });

  function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "az önce";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    return `${hours} sa önce`;
  }

  loadHistory();
});
