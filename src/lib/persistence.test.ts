import { describe, expect, it } from 'vitest'
import { createGame, GAME_SCHEMA_VERSION, STARTING_TRAIN_STATIONS, type Game } from './domain/game'
import { clearGame, GAME_STORAGE_KEY, loadGame, saveGame, type StorageLike } from './persistence'

class MemoryStorage implements StorageLike {
  protected values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

class ThrowingStorage extends MemoryStorage {
  constructor(private operation: 'get' | 'set' | 'remove') {
    super()
  }

  override getItem(key: string): string | null {
    if (this.operation === 'get') throw new DOMException('Storage blocked')
    return super.getItem(key)
  }

  override setItem(key: string, value: string): void {
    if (this.operation === 'set') throw new DOMException('Quota exceeded')
    super.setItem(key, value)
  }

  override removeItem(key: string): void {
    if (this.operation === 'remove') throw new DOMException('Storage blocked')
    super.removeItem(key)
  }
}

function validGame(): Game {
  return createGame(['Ada', 'Grace'], new Date('2026-08-13T08:00:00.000Z'))
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function storeValue(storage: StorageLike, value: unknown): void {
  storage.setItem(GAME_STORAGE_KEY, JSON.stringify(value))
}

describe('game persistence', () => {
  it('round-trips and clears a valid game', () => {
    const storage = new MemoryStorage()
    const game = validGame()

    expect(saveGame(game, storage)).toBe(true)
    expect(loadGame(storage)).toEqual(game)
    expect(clearGame(storage)).toBe(true)
    expect(loadGame(storage)).toBeNull()
  })

  it.each([
    ['get', () => loadGame(new ThrowingStorage('get'))],
    ['set', () => saveGame(validGame(), new ThrowingStorage('set'))],
    ['remove', () => clearGame(new ThrowingStorage('remove'))],
  ] as const)('handles failed %s operations without throwing', (_operation, run) => {
    expect(run()).toBeFalsy()
  })

  it('migrates saved games created before train stations were scored', () => {
    const storage = new MemoryStorage()
    const game = validGame()
    const legacyGame = {
      ...game,
      schemaVersion: 1,
      players: game.players.map(({ remainingTrainStations: _, ...player }) => player),
    }
    storeValue(storage, legacyGame)

    const loaded = loadGame(storage)
    expect(loaded?.schemaVersion).toBe(GAME_SCHEMA_VERSION)
    expect(
      loaded?.players.every((player) => player.remainingTrainStations === STARTING_TRAIN_STATIONS),
    ).toBe(true)
  })

  it.each<[string, (game: Record<string, unknown>) => void]>([
    ['an invalid timestamp', (game) => (game.updatedAt = 'soon')],
    ['a missing active player', (game) => (game.activePlayerId = 'missing')],
    ['too few players', (game) => (game.players = [])],
    [
      'duplicate player IDs',
      (game) => {
        const players = game.players as Record<string, unknown>[]
        players[1].id = players[0].id
      },
    ],
    [
      'duplicate longest-path IDs',
      (game) => {
        const players = game.players as Record<string, unknown>[]
        game.longestPathPlayerIds = [players[0].id, players[0].id]
      },
    ],
  ])('rejects a game with %s', (_label, mutate) => {
    const storage = new MemoryStorage()
    const candidate = clone(validGame()) as unknown as Record<string, unknown>
    mutate(candidate)
    storeValue(storage, candidate)

    expect(loadGame(storage)).toBeNull()
  })

  it.each<[string, (player: Record<string, unknown>) => void]>([
    ['a blank name', (player) => (player.name = ' ')],
    ['a negative route score', (player) => (player.routeScore = -1)],
    ['too many remaining stations', (player) => (player.remainingTrainStations = 4)],
    [
      'malformed tickets',
      (player) => (player.tickets = [{ id: '', points: -1, status: 'unknown' }]),
    ],
  ])('rejects a player with %s', (_label, mutate) => {
    const storage = new MemoryStorage()
    const candidate = clone(validGame()) as unknown as Record<string, unknown>
    mutate((candidate.players as Record<string, unknown>[])[0])
    storeValue(storage, candidate)

    expect(loadGame(storage)).toBeNull()
  })

  it('rejects malformed JSON and unsupported schemas', () => {
    const storage = new MemoryStorage()
    storage.setItem(GAME_STORAGE_KEY, '{not json')
    expect(loadGame(storage)).toBeNull()

    storeValue(storage, { ...validGame(), schemaVersion: GAME_SCHEMA_VERSION + 1 })
    expect(loadGame(storage)).toBeNull()
  })
})
