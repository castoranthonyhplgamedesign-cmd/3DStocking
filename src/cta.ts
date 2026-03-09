// CTA (Call To Action) end card for playable ads
// Shows after game over with an install/play button
// Compatible with ironSource, Unity Ads, AppLovin, Meta, Vungle, etc.

import { isMRAID, mraidOpen } from "./mraid";

// Detect platform and return appropriate store URL for stacking games
export function getStoreURL(): string {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    return "https://apps.apple.com/app/stack/id1080487957";
  }
  return "https://play.google.com/store/apps/details?id=com.ketchapp.stack";
}

export function openStore(): void {
  if (isMRAID()) {
    mraidOpen(getStoreURL());
  } else {
    // Real <a> tag with target=_blank — browsers never block native link clicks
    const a = document.createElement("a");
    a.href = getStoreURL();
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  }
}

let overlay: HTMLDivElement | null = null;

function createCTAOverlay(): HTMLDivElement {
  const storeUrl = getStoreURL();

  // The entire overlay is one big <a> link — guaranteed to open new tab
  const el = document.createElement("div");
  el.id = "ctaOverlay";
  el.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: none; align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
    z-index: 200; background: rgba(0,0,0,0.65);
    touch-action: none; font-family: Arial, sans-serif;
    cursor: pointer;
  `;

  // Title
  const title = document.createElement("div");
  title.textContent = "LIKE THIS GAME?";
  title.style.cssText = `
    font-size: 7vw; font-weight: bold; color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    pointer-events: none;
  `;

  // Score
  const scoreEl = document.createElement("div");
  scoreEl.id = "ctaScore";
  scoreEl.style.cssText = `
    font-size: 5vw; color: rgba(255,255,255,0.85);
    pointer-events: none;
  `;

  // DOWNLOAD NOW — real <a> link
  const installLink = document.createElement("a");
  installLink.href = storeUrl;
  installLink.target = "_blank";
  installLink.rel = "noopener noreferrer";
  installLink.textContent = "DOWNLOAD NOW";
  installLink.style.cssText = `
    padding: 3.5vw 10vw; font-size: 5.5vw; font-weight: bold;
    font-family: Arial, sans-serif;
    background: linear-gradient(135deg, #FF6B6B, #FF8E53);
    color: #fff; border: none; border-radius: 50px;
    box-shadow: 0 4px 20px rgba(255,107,107,0.4);
    animation: ctaPulse 1.5s ease-in-out infinite;
    text-align: center; text-decoration: none;
    display: inline-block;
  `;

  // Play again — also real <a> link to store
  const replayLink = document.createElement("a");
  replayLink.href = storeUrl;
  replayLink.target = "_blank";
  replayLink.rel = "noopener noreferrer";
  replayLink.textContent = "or play again";
  replayLink.style.cssText = `
    padding: 2vw 5vw; font-size: 4vw;
    font-family: Arial, sans-serif;
    background: transparent; color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.3); border-radius: 20px;
    text-decoration: none; display: inline-block;
  `;

  // Pulse animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes ctaPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
  `;
  document.head.appendChild(style);

  // If MRAID, intercept clicks and use mraid.open() instead
  if (isMRAID()) {
    const intercept = (e: Event) => {
      e.preventDefault();
      mraidOpen(storeUrl);
    };
    installLink.addEventListener("click", intercept);
    replayLink.addEventListener("click", intercept);
    el.addEventListener("click", () => mraidOpen(storeUrl));
  }

  el.appendChild(title);
  el.appendChild(scoreEl);
  el.appendChild(installLink);
  el.appendChild(replayLink);
  document.body.appendChild(el);

  return el;
}

export function isPlayableMode(): boolean {
  return import.meta.env.VITE_PLAYABLE === true || import.meta.env.VITE_PLAYABLE === "true";
}

export function showCTA(score: number): void {
  if (!overlay) overlay = createCTAOverlay();

  const scoreEl = document.getElementById("ctaScore");
  if (scoreEl) scoreEl.textContent = `Your Score: ${score}`;

  overlay.style.display = "flex";
}
