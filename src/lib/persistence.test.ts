import { describe, expect, it } from 'vitest';
import { createGame } from './game';
import { GAME_STORAGE_KEY, loadGame, saveGame } from './persistence';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('game persistence', () => {
  it('round-trips a valid game', () => {
    const storage = new MemoryStorage();
    const game = createGame(['Ada', 'Grace']);

    expect(saveGame(game, storage)).toBe(true);
    expect(loadGame(storage)).toEqual(game);
  });

  it('ignores malformed or internally inconsistent saves', () => {
    const storage = new MemoryStorage();
    const game = createGame(['Ada', 'Grace']);
    storage.setItem(GAME_STORAGE_KEY, JSON.stringify({ ...game, activePlayerId: 'missing' }));

    expect(loadGame(storage)).toBeNull();

    storage.setItem(GAME_STORAGE_KEY, '{not json');
    expect(loadGame(storage)).toBeNull();
  });
});
