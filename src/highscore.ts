const STORAGE_KEY = "stack3d_highscores";
const MAX_ENTRIES = 10;

export interface HighScoreEntry {
  name: string;
  score: number;
}

export function getHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HighScoreEntry[];
  } catch {
    return [];
  }
}

export function saveHighScore(name: string, score: number): HighScoreEntry[] {
  const scores = getHighScores();
  scores.push({ name: name.trim() || "???", score });
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function isHighScore(score: number): boolean {
  const scores = getHighScores();
  if (scores.length < MAX_ENTRIES) return score > 0;
  return score > scores[scores.length - 1].score;
}
