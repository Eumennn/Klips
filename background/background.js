/**
 * CLIP — Universal Video Clipboard (Chrome Extension MV3)
 * Background Service Worker
 */

const DEFAULT_SETTINGS = {
  maxDuration: 60,
  maxSizeMB: 50,
  showInPageBadge: true,
  preferredQuality: "720"
};

// Map for active tab media streams (short-lived, max 30 seconds)
const tabMediaStreams = new Map();

async function injectIntoExistingTabs() {
  try {
    const tabs = await chrome.tabs.query({
      url: [
        "*://*.tiktok.com/*",
        "*://*.instagram.com/*",
        "*://*.twitter.com/*",
        "*://*.x.com/*",
        "*://*.youtube.com/*"
      ]
    });
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["content/content.css"]
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content/content.js"]
        });
        console.log(`⚡ [CLIP] Injected content script into tab ${tab.id}: ${tab.url}`);
      } catch (err) {}
    }
  } catch (err) {
    console.warn("Failed to inject into existing tabs:", err);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get("settings");
  if (!existing.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS, clipHistory: [] });
  }
  console.log("⚡ [CLIP] Background Service Worker ready. Re-injecting open tabs...");
  await injectIntoExistingTabs();
});

// Also trigger injection when worker awakens
injectIntoExistingTabs();

chrome.tabs.onRemoved.addListener((tabId) => {
  tabMediaStreams.delete(tabId);
});

/**
 * Universal Media Sniffer
 * Listens to video stream requests for direct fallback, scoped strictly per tab
 */
if (chrome.webRequest && chrome.webRequest.onBeforeRequest) {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const { url, tabId } = details;
      if (!tabId || tabId <= 0) return;

      try {
        if (url.includes("tiktokcdn") || url.includes("byteoversea") || url.includes("tiktokcdn-us") || url.includes("tiktokv")) {
          if (url.includes(".mp4") || url.includes("mime_type=video_mp4") || url.includes("/video/tos/")) {
            tabMediaStreams.set(tabId, { videoUrl: url, platform: "tiktok", timestamp: Date.now() });
          }
        } else if (url.includes("cdninstagram.com") || url.includes("fbcdn.net")) {
          // STRICT FILTER: reject audio-only streams and segments
          const isAudio = url.includes("audio") || url.includes("dash_ln_heaac") || url.includes(".m4a");
          const isSegment = url.includes(".m4s") || url.includes(".mpd") || url.includes(".m3u8");
          const isImage = url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png") || url.includes(".webp");
          if (!isAudio && !isSegment && !isImage && (url.includes(".mp4") || url.includes("bytestart=") || url.includes("/v/t50") || url.includes("/v/t64") || url.includes("/v/t2") || url.includes("mime_type=video_mp4"))) {
            const cleanUrl = url
              .replace(/&bytestart=\d+/gi, "")
              .replace(/&byteend=\d+/gi, "")
              .replace(/bytestart=\d+&?/gi, "")
              .replace(/byteend=\d+&?/gi, "");
            tabMediaStreams.set(tabId, { videoUrl: cleanUrl, platform: "instagram", timestamp: Date.now() });
          }
        } else if (url.includes("video.twimg.com")) {
          // Twitter: only true .mp4 (never .m4s or .m3u8)
          if (url.includes(".mp4") && !url.includes(".m4s") && !url.includes(".m3u8")) {
            tabMediaStreams.set(tabId, { videoUrl: url, platform: "x", timestamp: Date.now() });
          }
        }
      } catch (err) {
        console.warn("[CLIP] Sniffer catch:", err);
      }
    },
    {
      urls: [
        "*://*.tiktokcdn.com/*",
        "*://*.tiktokcdn-us.com/*",
        "*://*.tiktokcdn-eu.com/*",
        "*://*.tiktokv.com/*",
        "*://*.tiktokv.us/*",
        "*://*.byteoversea.com/*",
        "*://*.ibytedtos.com/*",
        "*://*.myqcloud.com/*",
        "*://*.cdninstagram.com/*",
        "*://*.fbcdn.net/*",
        "*://*.twimg.com/*"
      ]
    }
  );
}

/**
 * Universal Video Resolution
 */
async function resolveVideo(url, tabId, domSrc, inPageUrl, startTime, endTime) {
  const cleanUrl = (url || "").trim();
  const platform = detectPlatform(cleanUrl);

  // Substitute sniffed stream URL for blob: or missing stream on TikTok
  let effectiveDomSrc = domSrc;
  if ((!effectiveDomSrc || effectiveDomSrc.startsWith("blob:")) && tabId && tabMediaStreams.has(tabId)) {
    const streamRec = tabMediaStreams.get(tabId);
    if (streamRec && streamRec.videoUrl && streamRec.videoUrl.startsWith("http")) {
      effectiveDomSrc = streamRec.videoUrl;
      console.log("⚡ [CLIP] Substituted sniffed stream for blob:", effectiveDomSrc.slice(0, 80));
    }
  }

  // Filter out invalid/segmented/audio domSrc
  if (effectiveDomSrc) {
    const low = effectiveDomSrc.toLowerCase();
    if (low.includes(".m4s") || low.includes(".m3u8") || low.includes(".mpd") || low.includes("audio") || low.includes("dash_ln_heaac")) {
      effectiveDomSrc = null;
    }
  }

  // 1. Primary Engine: Local CLIP Helper Companion (port 48123)
  try {
    const healthCheck = await fetch("http://127.0.0.1:48123/health", { signal: AbortSignal.timeout(2000) });
    if (healthCheck.ok) {
      console.log(`⚡ [CLIP] Using local CLIP Helper service on port 48123 (Range: ${startTime}-${endTime})...`);
      
      let helperUrl = `http://127.0.0.1:48123/clip?url=${encodeURIComponent(cleanUrl)}&dom_src=${encodeURIComponent(effectiveDomSrc || "")}`;
      if (startTime !== undefined && startTime !== null && endTime !== undefined && endTime !== null) {
        helperUrl += `&start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`;
      }
      const clipRes = await fetch(helperUrl);
      if (clipRes.ok) {
        const data = await clipRes.json();
        if (data && data.success) {
          return {
            success: true,
            videoUrl: data.videoUrl,
            filename: data.filename,
            filePath: data.filePath,
            clipboardCopied: true,
            platform: platform,
            sourceUrl: cleanUrl
          };
        }
        if (data && !data.success && data.error) {
          return {
            success: false,
            error: data.error
          };
        }
      }
    }
  } catch (e) {
    // Helper service not reachable, proceed to browser fallbacks
  }

  // Helper: If local companion is running, ensure resolved video stream is copied to OS clipboard
  async function ensureClipboardCopied(result) {
    if (!result || !result.success || result.clipboardCopied) return result;
    if (!result.videoUrl) return result;

    try {
      const helperUrl = `http://127.0.0.1:48123/clip?url=${encodeURIComponent(result.videoUrl)}&dom_src=${encodeURIComponent(result.videoUrl)}`;
      const res = await fetch(helperUrl, { signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          console.log("⚡ [CLIP] Fallback stream successfully copied to OS clipboard via companion!");
          return {
            ...result,
            filename: data.filename || result.filename,
            filePath: data.filePath,
            clipboardCopied: true
          };
        }
      }
    } catch (_) {}

    return result;
  }

  // 2. Direct DOM video element source (Instagram, TikTok, X)
  if (effectiveDomSrc && effectiveDomSrc.startsWith("http") && !effectiveDomSrc.startsWith("blob:")) {
    return await ensureClipboardCopied({
      success: true,
      videoUrl: effectiveDomSrc,
      platform: platform,
      sourceUrl: cleanUrl
    });
  }

  // 3. Tab-specific sniffed stream (valid up to 30 seconds)
  if (tabId && tabMediaStreams.has(tabId)) {
    const rec = tabMediaStreams.get(tabId);
    if (Date.now() - rec.timestamp < 30000) {
      tabMediaStreams.delete(tabId);
      return await ensureClipboardCopied({
        success: true,
        videoUrl: rec.videoUrl,
        platform: rec.platform,
        sourceUrl: cleanUrl
      });
    }
  }

  // 5. Dedicated API Fallbacks (When helper is offline)
  // A) TikTok: TikWM API
  if (platform === "tiktok" && cleanUrl.includes("/video/")) {
    try {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
      const data = await res.json();
      if (data && data.data && data.data.play) {
        return await ensureClipboardCopied({
          success: true,
          videoUrl: data.data.play,
          platform: "tiktok",
          sourceUrl: cleanUrl
        });
      }
    } catch (e) {
      console.warn("TikWM failed:", e);
    }
  }

  // B) X (Twitter): vxTwitter
  if (platform === "x") {
    try {
      const tweetId = cleanUrl.match(/status\/(\d+)/)?.[1];
      if (tweetId) {
        const vxRes = await fetch(`https://api.vxtwitter.com/Twitter/status/${tweetId}`);
        const vxText = await vxRes.text();
        let directMp4 = null;
        try {
          const vxJson = JSON.parse(vxText);
          if (vxJson.media_extended && vxJson.media_extended.length > 0) {
            for (const m of vxJson.media_extended) {
              if (m.type === "video" && m.url && m.url.includes(".mp4")) {
                directMp4 = m.url;
                break;
              }
            }
          }
        } catch (_) {}
        if (!directMp4) {
          const matches = vxText.match(/https:\/\/[^"\s\\]+\.mp4(\?[^"\s\\]+)?/gi);
          if (matches && matches.length > 0) {
            directMp4 = matches[0];
          }
        }
        if (directMp4) {
          return await ensureClipboardCopied({
            success: true,
            videoUrl: directMp4.replace(/&amp;/g, "&"),
            platform: "x",
            sourceUrl: cleanUrl
          });
        }
      }
    } catch (e) {
      console.warn("vxTwitter failed:", e);
    }
  }

  // 6. Direct MP4 / WebM link
  if (cleanUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
    return await ensureClipboardCopied({
      success: true,
      videoUrl: cleanUrl,
      platform: "direct",
      sourceUrl: cleanUrl
    });
  }

  return {
    success: false,
    error: "Video akışı yakalanamadı. Lütfen sayfayı yenileyip tekrar deneyin."
  };
}

function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("twitter.com") || host.includes("x.com")) return "x";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "shorts";
    return "other";
  } catch {
    return "other";
  }
}

async function saveToHistory(clipItem) {
  try {
    const { clipHistory = [] } = await chrome.storage.local.get("clipHistory");
    const updated = [
      {
        id: "clip_" + Date.now(),
        timestamp: new Date().toISOString(),
        ...clipItem
      },
      ...clipHistory.filter(item => item.sourceUrl !== clipItem.sourceUrl)
    ].slice(0, 10);

    await chrome.storage.local.set({ clipHistory: updated });
  } catch (err) {
    console.error("Failed to save history:", err);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "RESOLVE_VIDEO") {
    const tabId = sender.tab ? sender.tab.id : null;
    resolveVideo(message.url, tabId, message.domSrc, message.inPageUrl, message.startTime, message.endTime)
      .then(async (result) => {
        if (result && result.success) {
          await saveToHistory({
            videoUrl: result.videoUrl,
            sourceUrl: result.sourceUrl,
            platform: result.platform,
            title: message.title || "CLIP Video"
          });
        }
        sendResponse(result || { success: false, error: "Bilinmeyen sonuç." });
      })
      .catch((err) => {
        console.error("resolveVideo error:", err);
        sendResponse({ success: false, error: err.message || "İşlem sırasında hata oluştu." });
      });
    return true;
  }

  if (message.action === "FETCH_BLOB") {
    // Fetch video as base64 from background (bypasses content-script CORS restrictions)
    (async () => {
      try {
        const res = await fetch(message.url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuf);
        // Convert to base64 in chunks to avoid call stack overflow
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < uint8.length; i += chunkSize) {
          binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        sendResponse({ success: true, base64, mimeType: "video/mp4" });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === "TRIGGER_DOWNLOAD") {
    chrome.downloads.download({
      url: message.videoUrl,
      filename: `CLIP_${message.platform || "video"}_${Date.now()}.mp4`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
    return true;
  }
});
