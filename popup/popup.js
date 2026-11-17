/**
 * CLIP — Modern Minimalist Popup Controller
 */

document.addEventListener("DOMContentLoaded", async () => {
  const IS_MAC = navigator.platform.toUpperCase().indexOf("MAC") >= 0 || navigator.userAgent.includes("Mac");
  const PASTE_KEY = IS_MAC ? "⌘V" : "Ctrl+V";

  const pasteKbd = document.getElementById("paste-kbd");
  if (pasteKbd) pasteKbd.textContent = PASTE_KEY;

  document.querySelectorAll(".paste-target-key").forEach(el => {
    el.textContent = PASTE_KEY;
  });

  const urlInput = document.getElementById("video-url-input");
  const pasteBtn = document.getElementById("paste-btn");
  const clearInputBtn = document.getElementById("clear-input-btn");
  const processBtn = document.getElementById("process-btn");

  const inputSection = document.getElementById("input-section");
  const processingSection = document.getElementById("processing-section");
  const readySection = document.getElementById("ready-section");
  const previewVideo = document.getElementById("preview-video");
  const dragZone = document.getElementById("popup-drag-zone");

  const actionDownloadBtn = document.getElementById("action-download-btn");
  const actionFolderBtn = document.getElementById("action-folder-btn");
  const actionRecopyBtn = document.getElementById("action-recopy-btn");
  const actionNewBtn = document.getElementById("action-new-btn");

  const historyList = document.getElementById("history-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");
  const openFolderBtn = document.getElementById("open-folder-btn");
  const openWizardBtn = document.getElementById("open-wizard-btn");

  let currentResolvedData = null;

  const PLATFORMS = {
    shorts: { name: "YouTube", icon: "▶", matches: (u) => u.includes("youtube.com") || u.includes("youtu.be") },
    tiktok: { name: "TikTok", icon: "♪", matches: (u) => u.includes("tiktok.com") },
    instagram: { name: "Instagram", icon: "◎", matches: (u) => u.includes("instagram.com") },
    x: { name: "X", icon: "𝕏", matches: (u) => u.includes("twitter.com") || u.includes("x.com") }
  };

  function detectPlatform(url) {
    const u = (url || "").toLowerCase();
    for (const [key, p] of Object.entries(PLATFORMS)) {
      if (p.matches(u)) return { key, ...p };
    }
    return null;
  }

  urlInput.addEventListener("input", (e) => {
    if (clearInputBtn) clearInputBtn.style.display = e.target.value.trim() ? "block" : "none";
  });

  if (clearInputBtn) {
    clearInputBtn.addEventListener("click", () => {
      urlInput.value = "";
      clearInputBtn.style.display = "none";
      urlInput.focus();
    });
  }

  // Health check
  async function checkCompanionStatus() {
    try {
      const res = await fetch("http://127.0.0.1:48123/health", { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const data = await res.json();
        if (data.active !== false) {
          if (statusText) statusText.textContent = "Hazır";
          if (statusDot) {
            statusDot.className = "status-pulse";
            statusDot.style.background = "#10b981";
          }
        } else {
          if (statusText) statusText.textContent = "Duraklatıldı";
          if (statusDot) {
            statusDot.className = "status-pulse offline";
            statusDot.style.background = "#f59e0b";
          }
        }
        return;
      }
    } catch (_) {}

    if (statusText) statusText.textContent = "Kapalı";
    if (statusDot) {
      statusDot.className = "status-pulse offline";
      statusDot.style.background = "#ef4444";
    }
  }

  await checkCompanionStatus();

  // Tab auto-detect
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const p = detectPlatform(tab.url);
      if (p) {
        urlInput.value = tab.url;
        if (clearInputBtn) clearInputBtn.style.display = "block";
      }
    }
  } catch (_) {}

  // Paste shortcut
  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        if (clearInputBtn) clearInputBtn.style.display = "block";
        urlInput.focus();
      }
    } catch (_) {
      urlInput.focus();
    }
  });

  // Process Video
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

        if (chrome.runtime.lastError || !response || !response.success) {
          alert((response && response.error) ? response.error : "Video indirilemedi. Lütfen masaüstü servisinin açık olduğunu kontrol edin.");
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

  // Ready State View
  function showReadyVideo(data) {
    readySection.style.display = "flex";
    previewVideo.src = data.videoUrl;

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

  actionDownloadBtn.addEventListener("click", () => {
    if (!currentResolvedData) return;
    chrome.runtime.sendMessage({
      action: "TRIGGER_DOWNLOAD",
      videoUrl: currentResolvedData.videoUrl,
      platform: currentResolvedData.platform
    });
  });

  if (actionFolderBtn) {
    actionFolderBtn.addEventListener("click", () => {
      if (currentResolvedData && currentResolvedData.filePath) {
        fetch(`http://127.0.0.1:48123/open_file?path=${encodeURIComponent(currentResolvedData.filePath)}`).catch(() => {});
      } else {
        fetch("http://127.0.0.1:48123/open_folder").catch(() => {});
      }
    });
  }

  if (openFolderBtn) {
    openFolderBtn.addEventListener("click", () => {
      fetch("http://127.0.0.1:48123/open_folder").catch(() => {});
    });
  }

  if (openWizardBtn) {
    openWizardBtn.addEventListener("click", () => {
      fetch("http://127.0.0.1:48123/open_wizard").catch(() => {});
    });
  }

  actionRecopyBtn.addEventListener("click", async () => {
    if (!currentResolvedData) return;
    if (currentResolvedData.filePath) {
      try {
        await fetch(`http://127.0.0.1:48123/copy?path=${encodeURIComponent(currentResolvedData.filePath)}`);
      } catch (_) {}
    }
    actionRecopyBtn.textContent = "✓ Panoda!";
    setTimeout(() => { actionRecopyBtn.textContent = "📋 Tekrar Kopyala"; }, 1600);
  });

  actionNewBtn.addEventListener("click", () => {
    readySection.style.display = "none";
    inputSection.style.display = "flex";
    previewVideo.pause();
    previewVideo.src = "";
    urlInput.value = "";
    if (clearInputBtn) clearInputBtn.style.display = "none";
    currentResolvedData = null;
  });

  // Recent Clips History (Row-based list)
  async function loadHistory() {
    const { clipHistory = [] } = await chrome.storage.local.get("clipHistory");
    historyList.innerHTML = "";

    if (clipHistory.length === 0) {
      historyList.innerHTML = `
        <div class="empty-hint">
          Henüz klip yok. Videolardaki ⚡ butonuna basarak anında panoya alabilirsiniz.
        </div>
      `;
      return;
    }

    clipHistory.forEach(item => {
      const row = document.createElement("div");
      row.className = "clip-row";

      const pInfo = detectPlatform(item.url || item.sourceUrl || item.platform);
      const icon = pInfo ? pInfo.icon : "⚡";
      const timeAgo = formatTimeAgo(new Date(item.timestamp || Date.now()));

      row.innerHTML = `
        <div class="row-left">
          <span class="row-icon">${icon}</span>
          <div class="row-meta">
            <span class="row-title" title="${item.title || "Video"}">${item.title || "Video"}</span>
            <span class="row-time">${timeAgo}</span>
          </div>
        </div>
        <div class="row-actions">
          <button type="button" class="row-btn" title="Panoya Kopyala">Kopyala</button>
        </div>
      `;

      row.addEventListener("click", async () => {
        if (item.filePath) {
          try {
            await fetch(`http://127.0.0.1:48123/copy?path=${encodeURIComponent(item.filePath)}`);
          } catch (_) {}
        }
        showReadyVideo(item);
        currentResolvedData = item;
        inputSection.style.display = "none";
      });

      const copyBtn = row.querySelector(".row-btn");
      copyBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (item.filePath) {
          try {
            await fetch(`http://127.0.0.1:48123/copy?path=${encodeURIComponent(item.filePath)}`);
          } catch (_) {}
        }
        copyBtn.textContent = "✓ Panoda";
        setTimeout(() => { copyBtn.textContent = "Kopyala"; }, 1500);
      });

      historyList.appendChild(row);
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
    const s = Math.floor((new Date() - date) / 1000);
    if (s < 60) return "az önce";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    return `${h} sa önce`;
  }

  loadHistory();
});
