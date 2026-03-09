// MRAID (Mobile Rich Media Ad Interface Definitions) bridge
// Provides compatibility with ad network containers (ironSource, Unity Ads, Meta, etc.)

declare global {
  interface Window {
    mraid?: {
      getState(): string;
      addEventListener(event: string, callback: () => void): void;
      removeEventListener(event: string, callback: () => void): void;
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

    const onReady = () => {
      mraid.removeEventListener("ready", onReady);
      resolve();
    };
    mraid.addEventListener("ready", onReady);
  });
}

export function mraidOpen(url: string): void {
  if (isMRAID()) {
    window.mraid!.open(url);
  } else {
    window.open(url, "_blank");
  }
}
