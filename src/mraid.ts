// MRAID (Mobile Rich Media Ad Interface Definitions) bridge
// Provides compatibility with ad network containers (ironSource, Unity Ads, Meta, etc.)

declare global {
  interface Window {
    mraid?: {
      getState(): string;
      addEventListener(event: string, callback: (...args: unknown[]) => void): void;
      removeEventListener(event: string, callback: (...args: unknown[]) => void): void;
      open(url: string): void;
      close(): void;
      isViewable(): boolean;
    };
  }
}

export function isMRAID(): boolean {
  return typeof window.mraid !== "undefined";
}

export function waitForMRAIDReady(): Promise<void> {
  return new Promise((resolve) => {
    if (!isMRAID()) {
      resolve();
      return;
    }

    const mraid = window.mraid!;
    if (mraid.getState() === "ready") {
      resolve();
      return;
    }

    const onReady = (() => {
      mraid.removeEventListener("ready", onReady);
      resolve();
    }) as (...args: unknown[]) => void;
    mraid.addEventListener("ready", onReady);
  });
}

export function mraidOpen(url: string): void {
  if (isMRAID()) {
    window.mraid!.open(url);
  } else {
    // Use a real <a> tag click — browsers never block this
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// Viewability tracking — ad networks REQUIRE pausing when ad is not visible
type ViewableCallback = (isViewable: boolean) => void;
const viewableCallbacks: ViewableCallback[] = [];
let mraidListenerRegistered = false;

export function onViewableChange(callback: ViewableCallback): void {
  viewableCallbacks.push(callback);

  if (!isMRAID() || mraidListenerRegistered) return;
  mraidListenerRegistered = true;

  window.mraid!.addEventListener("viewableChange", ((viewable: unknown) => {
    const isViewable = viewable === true || viewable === "true";
    for (const cb of viewableCallbacks) cb(isViewable);
  }) as (...args: unknown[]) => void);
}

export function isCurrentlyViewable(): boolean {
  if (!isMRAID()) return true;
  try {
    return window.mraid!.isViewable();
  } catch {
    return true;
  }
}
