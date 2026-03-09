// CTA (Call To Action) end card for playable ads
// Shows after game over with an install/play button

import { mraidOpen } from "./mraid";

// Set this to your app store URL or landing page
const CTA_URL = "https://play.google.com/store/apps/details?id=YOUR_APP_ID";

let overlay: HTMLDivElement | null = null;
let onReplayCallback: (() => void) | null = null;

function createCTAOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  el.id = "ctaOverlay";
  el.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: none; align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
    z-index: 200; background: rgba(0,0,0,0.6);
    touch-action: none; font-family: Arial, sans-serif;
  `;

  // Title
  const title = document.createElement("div");
  title.textContent = "LIKE THIS GAME?";
  title.style.cssText = `
    font-size: 28px; font-weight: bold; color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.4);
  `;

  // Score
  const scoreEl = document.createElement("div");
  scoreEl.id = "ctaScore";
  scoreEl.style.cssText = `
    font-size: 20px; color: rgba(255,255,255,0.85);
  `;

  // Install button
  const installBtn = document.createElement("button");
  installBtn.textContent = "DOWNLOAD NOW";
  installBtn.style.cssText = `
    padding: 16px 40px; font-size: 22px; font-weight: bold;
    font-family: Arial, sans-serif;
    background: linear-gradient(135deg, #FF6B6B, #FF8E53);
    color: #fff; border: none; border-radius: 50px;
    cursor: pointer; touch-action: manipulation;
    box-shadow: 0 4px 20px rgba(255,107,107,0.4);
    animation: ctaPulse 1.5s ease-in-out infinite;
  `;

  // Replay link
  const replayBtn = document.createElement("button");
  replayBtn.textContent = "or play again";
  replayBtn.style.cssText = `
    padding: 8px 20px; font-size: 16px;
    font-family: Arial, sans-serif;
    background: transparent; color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.3); border-radius: 20px;
    cursor: pointer; touch-action: manipulation;
  `;

  // Pulse animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes ctaPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);

  installBtn.addEventListener("click", () => mraidOpen(CTA_URL));
  installBtn.addEventListener("touchend", (e) => { e.preventDefault(); mraidOpen(CTA_URL); });

  replayBtn.addEventListener("click", () => hideCTA());
  replayBtn.addEventListener("touchend", (e) => { e.preventDefault(); hideCTA(); });

  el.appendChild(title);
  el.appendChild(scoreEl);
  el.appendChild(installBtn);
  el.appendChild(replayBtn);
  document.body.appendChild(el);

  return el;
}

function hideCTA(): void {
  if (overlay) overlay.style.display = "none";
  if (onReplayCallback) onReplayCallback();
}

export function isPlayableMode(): boolean {
  return import.meta.env.VITE_PLAYABLE === true || import.meta.env.VITE_PLAYABLE === "true";
}

export function setCTAUrl(url: string): void {
  // Override CTA URL at runtime if needed
  const btn = overlay?.querySelector("button");
  if (btn) {
    btn.onclick = () => mraidOpen(url);
  }
}

export function showCTA(score: number, replayCallback: () => void): void {
  if (!overlay) overlay = createCTAOverlay();

  const scoreEl = document.getElementById("ctaScore");
  if (scoreEl) scoreEl.textContent = `Your Score: ${score}`;

  onReplayCallback = replayCallback;
  overlay.style.display = "flex";
}
