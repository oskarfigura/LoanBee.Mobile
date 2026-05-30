import { storage } from '@/storage/mmkv';
import { STORAGE_KEYS } from '@/storage/keys';

// The journey cursor records which question a draft is paused on, keyed by loan
// id, so the drawer reopens exactly where the user left off. The saved loan
// itself holds all answered data — this is only the resume pointer.
type JourneyCursorMap = Record<string, string>;

const readCursors = (): JourneyCursorMap => {
  try {
    const raw = storage.getString(STORAGE_KEYS.MORTGAGE_JOURNEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as JourneyCursorMap) : {};
  } catch {
    return {};
  }
};

const writeCursors = (cursors: JourneyCursorMap) => {
  try {
    storage.set(STORAGE_KEYS.MORTGAGE_JOURNEY, JSON.stringify(cursors));
  } catch {
    // Resume is a convenience; the journey still works from the derived
    // fallback step if persistence is unavailable.
  }
};

export const getJourneyCursor = (loanId: string): string | null => readCursors()[loanId] ?? null;

export const setJourneyCursor = (loanId: string, stepId: string): void => {
  const cursors = readCursors();
  cursors[loanId] = stepId;
  writeCursors(cursors);
};

export const clearJourneyCursor = (loanId: string): void => {
  const cursors = readCursors();
  if (!(loanId in cursors)) return;
  delete cursors[loanId];
  writeCursors(cursors);
};
