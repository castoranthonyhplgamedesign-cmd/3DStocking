import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import type { HighScoreEntry } from "./highscore";
import { getHighScores } from "./highscore";

export interface UIElements {
  scoreText: TextBlock;
  startPanel: StackPanel;
  startLeaderboard: TextBlock;
  gameOverPanel: StackPanel;
  finalScoreText: TextBlock;
  restartButton: Button;
  leaderboardText: TextBlock;
  comboText: TextBlock;
  powerUpText: TextBlock;
  activePowerUpsText: TextBlock;
  nameInputOverlay: HTMLDivElement;
  nameInput: HTMLInputElement;
  nameSubmitBtn: HTMLButtonElement;
  onNameSubmit: (callback: (name: string) => void) => void;
  refresh: () => void;
}

// All sizes are relative to this reference width — GUI auto-scales to actual screen
const REF_WIDTH = 600;

function formatLeaderboard(scores: HighScoreEntry[], maxShow = 5): string {
  if (scores.length === 0) return "";
  const lines = scores.slice(0, maxShow).map(
    (e, i) => `${i + 1}. ${e.name}  -  ${e.score}`
  );
  return lines.join("\n");
}

function createNameInputOverlay(): { overlay: HTMLDivElement; input: HTMLInputElement; btn: HTMLButtonElement } {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: none; align-items: center; justify-content: center;
    z-index: 100; background: rgba(0,0,0,0.4);
    touch-action: none;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    background: #fff; border-radius: 16px; padding: 28px 24px;
    text-align: center; font-family: Arial, sans-serif;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    max-width: 320px; width: 85%;
  `;

  const heading = document.createElement("div");
  heading.textContent = "NEW HIGH SCORE!";
  heading.style.cssText = `
    font-size: 22px; font-weight: bold; color: #2d2d2d;
    margin-bottom: 6px;
  `;

  const subtext = document.createElement("div");
  subtext.id = "nameInputScore";
  subtext.style.cssText = `
    font-size: 16px; color: #666; margin-bottom: 18px;
  `;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter your name";
  input.maxLength = 12;
  input.autocomplete = "off";
  input.style.cssText = `
    width: 100%; padding: 12px 14px; font-size: 18px;
    border: 2px solid #ddd; border-radius: 10px;
    outline: none; text-align: center;
    font-family: Arial, sans-serif; color: #2d2d2d;
    margin-bottom: 14px; box-sizing: border-box;
  `;

  const btn = document.createElement("button");
  btn.textContent = "SAVE";
  btn.style.cssText = `
    width: 100%; padding: 12px; font-size: 18px;
    font-weight: bold; font-family: Arial, sans-serif;
    background: #4ECDC4; color: #fff; border: none;
    border-radius: 10px; cursor: pointer;
    touch-action: manipulation;
  `;

  card.appendChild(heading);
  card.appendChild(subtext);
  card.appendChild(input);
  card.appendChild(btn);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  return { overlay, input, btn };
}

export function createUI(): UIElements {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI("ui");
  // Let Babylon.js GUI auto-scale everything relative to reference width
  ui.idealWidth = REF_WIDTH;

  // Score display
  const scoreText = new TextBlock("score", "0");
  scoreText.color = "#2d2d2d";
  scoreText.fontSize = 96;
  scoreText.fontFamily = "Arial, sans-serif";
  scoreText.fontWeight = "bold";
  scoreText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  scoreText.top = "40px";
  scoreText.outlineWidth = 5;
  scoreText.outlineColor = "rgba(255,255,255,0.5)";
  scoreText.isVisible = false;
  ui.addControl(scoreText);

  // Combo text (center, animated popup)
  const comboText = new TextBlock("combo", "");
  comboText.color = "#FF6B6B";
  comboText.fontSize = 48;
  comboText.fontFamily = "Arial, sans-serif";
  comboText.fontWeight = "bold";
  comboText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  comboText.top = "-50px";
  comboText.outlineWidth = 4;
  comboText.outlineColor = "rgba(255,255,255,0.6)";
  comboText.isVisible = false;
  ui.addControl(comboText);

  // Power-up pickup text (center, brief notification)
  const powerUpText = new TextBlock("puText", "");
  powerUpText.color = "#6C5CE7";
  powerUpText.fontSize = 38;
  powerUpText.fontFamily = "Arial, sans-serif";
  powerUpText.fontWeight = "bold";
  powerUpText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  powerUpText.top = "30px";
  powerUpText.outlineWidth = 4;
  powerUpText.outlineColor = "rgba(255,255,255,0.6)";
  powerUpText.isVisible = false;
  ui.addControl(powerUpText);

  // Active power-ups indicator (top-right)
  const activePowerUpsText = new TextBlock("activePU", "");
  activePowerUpsText.color = "#2d2d2d";
  activePowerUpsText.fontSize = 20;
  activePowerUpsText.fontFamily = "Arial, sans-serif";
  activePowerUpsText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  activePowerUpsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  activePowerUpsText.top = "40px";
  activePowerUpsText.left = "-16px";
  activePowerUpsText.outlineWidth = 2;
  activePowerUpsText.outlineColor = "rgba(255,255,255,0.5)";
  activePowerUpsText.isVisible = false;
  ui.addControl(activePowerUpsText);

  // --- Start screen ---
  const startPanel = new StackPanel("startPanel");
  startPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  ui.addControl(startPanel);

  const title = new TextBlock("title", "STACK");
  title.color = "#2d2d2d";
  title.fontSize = 96;
  title.fontFamily = "Arial, sans-serif";
  title.fontWeight = "bold";
  title.height = "120px";
  title.outlineWidth = 5;
  title.outlineColor = "rgba(255,255,255,0.5)";
  startPanel.addControl(title);

  const tapText = new TextBlock("tap", "Tap to Start");
  tapText.color = "rgba(60,60,60,0.8)";
  tapText.fontSize = 30;
  tapText.fontFamily = "Arial, sans-serif";
  tapText.height = "50px";
  startPanel.addControl(tapText);

  const startLeaderboard = new TextBlock("startLb", "");
  startLeaderboard.color = "#2d2d2d";
  startLeaderboard.fontSize = 22;
  startLeaderboard.fontFamily = "Arial, sans-serif";
  startLeaderboard.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  startLeaderboard.textWrapping = true;
  startLeaderboard.height = "180px";
  startLeaderboard.top = "30px";
  startLeaderboard.outlineWidth = 0;
  startPanel.addControl(startLeaderboard);

  // --- Game Over screen ---
  const gameOverPanel = new StackPanel("gameOverPanel");
  gameOverPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  gameOverPanel.isVisible = false;
  ui.addControl(gameOverPanel);

  const goTitle = new TextBlock("goTitle", "GAME OVER");
  goTitle.color = "#2d2d2d";
  goTitle.fontSize = 72;
  goTitle.fontFamily = "Arial, sans-serif";
  goTitle.fontWeight = "bold";
  goTitle.height = "95px";
  goTitle.outlineWidth = 5;
  goTitle.outlineColor = "rgba(255,255,255,0.5)";
  gameOverPanel.addControl(goTitle);

  const finalScoreText = new TextBlock("finalScore", "Score: 0");
  finalScoreText.color = "#2d2d2d";
  finalScoreText.fontSize = 44;
  finalScoreText.fontFamily = "Arial, sans-serif";
  finalScoreText.height = "65px";
  finalScoreText.outlineWidth = 3;
  finalScoreText.outlineColor = "rgba(255,255,255,0.5)";
  gameOverPanel.addControl(finalScoreText);

  const leaderboardText = new TextBlock("leaderboard", "");
  leaderboardText.color = "#2d2d2d";
  leaderboardText.fontSize = 22;
  leaderboardText.fontFamily = "Arial, sans-serif";
  leaderboardText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  leaderboardText.textWrapping = true;
  leaderboardText.height = "170px";
  leaderboardText.top = "6px";
  gameOverPanel.addControl(leaderboardText);

  const restartButton = Button.CreateSimpleButton("restart", "PLAY AGAIN");
  restartButton.width = "240px";
  restartButton.height = "65px";
  restartButton.color = "#2d2d2d";
  restartButton.background = "rgba(0,0,0,0.1)";
  restartButton.cornerRadius = 14;
  restartButton.fontSize = 26;
  restartButton.fontFamily = "Arial, sans-serif";
  restartButton.thickness = 2;
  gameOverPanel.addControl(restartButton);

  // --- HTML name input overlay ---
  const { overlay, input, btn } = createNameInputOverlay();

  let submitCallback: ((name: string) => void) | null = null;

  const doSubmit = () => {
    const name = input.value.trim() || "???";
    overlay.style.display = "none";
    input.value = "";
    if (submitCallback) {
      submitCallback(name);
      submitCallback = null;
    }
  };

  btn.addEventListener("click", doSubmit);
  btn.addEventListener("touchend", (e) => { e.preventDefault(); doSubmit(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSubmit();
  });

  const onNameSubmit = (callback: (name: string) => void) => {
    submitCallback = callback;
  };

  // Refresh is no longer needed since idealWidth handles scaling,
  // but keep the interface for compatibility
  const refresh = () => {};

  return {
    scoreText, startPanel, startLeaderboard, gameOverPanel,
    finalScoreText, restartButton, leaderboardText,
    comboText, powerUpText, activePowerUpsText,
    nameInputOverlay: overlay, nameInput: input, nameSubmitBtn: btn,
    onNameSubmit, refresh,
  };
}

export function updateScore(ui: UIElements, score: number): void {
  ui.scoreText.text = score.toString();
}

export function showComboText(ui: UIElements, comboCount: number): void {
  const multiplier = 1 + (comboCount - 1) * 0.5;
  ui.comboText.text = `PERFECT x${comboCount}!  (${multiplier.toFixed(1)}x)`;
  ui.comboText.isVisible = true;
  setTimeout(() => { ui.comboText.isVisible = false; }, 1200);
}

export function showPowerUpText(ui: UIElements, label: string): void {
  ui.powerUpText.text = `+ ${label}`;
  ui.powerUpText.isVisible = true;
  setTimeout(() => { ui.powerUpText.isVisible = false; }, 1500);
}

export function updateActivePowerUps(ui: UIElements, active: string[]): void {
  if (active.length === 0) {
    ui.activePowerUpsText.isVisible = false;
    return;
  }
  ui.activePowerUpsText.text = active.join("\n");
  ui.activePowerUpsText.isVisible = true;
}

export function showNameInput(ui: UIElements, score: number): void {
  const el = document.getElementById("nameInputScore");
  if (el) el.textContent = `Score: ${score}`;
  ui.nameInputOverlay.style.display = "flex";
  ui.nameInput.value = "";
  setTimeout(() => ui.nameInput.focus(), 100);
}

export function showGameOver(ui: UIElements, score: number, scores: HighScoreEntry[]): void {
  ui.gameOverPanel.isVisible = true;
  ui.finalScoreText.text = `Score: ${score}`;
  ui.scoreText.isVisible = false;
  ui.comboText.isVisible = false;
  ui.powerUpText.isVisible = false;
  ui.activePowerUpsText.isVisible = false;
  ui.leaderboardText.text = formatLeaderboard(scores);
}

export function hideGameOver(ui: UIElements): void {
  ui.gameOverPanel.isVisible = false;
}

export function showStartScreen(ui: UIElements): void {
  ui.startPanel.isVisible = true;
  ui.scoreText.isVisible = false;
  ui.comboText.isVisible = false;
  ui.powerUpText.isVisible = false;
  ui.activePowerUpsText.isVisible = false;
  const scores = getHighScores();
  ui.startLeaderboard.text = scores.length > 0
    ? "-- HIGH SCORES --\n" + formatLeaderboard(scores)
    : "";
}

export function hideStartScreen(ui: UIElements): void {
  ui.startPanel.isVisible = false;
  ui.scoreText.isVisible = true;
}
