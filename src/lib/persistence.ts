import {
  GAME_SCHEMA_VERSION,
  STARTING_TRAIN_STATIONS,
  type DestinationTicket,
  type Game,
  type Player,
} from './domain/game'

export const GAME_STORAGE_KEY = 'ttr-europe-scorer:active-game'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value))
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function hasUniqueIds(items: readonly { id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length
}

function isStoredTicket(value: unknown): value is DestinationTicket {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonNegativeInteger(value.points) &&
    (value.status === 'completed' || value.status === 'failed')
  )
}

function isStoredPlayer(value: unknown): value is Player {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonNegativeInteger(value.routeScore) &&
    isNonNegativeInteger(value.remainingTrainStations) &&
    value.remainingTrainStations <= STARTING_TRAIN_STATIONS &&
    typeof value.scoringComplete === 'boolean' &&
    Array.isArray(value.tickets) &&
    value.tickets.every(isStoredTicket) &&
    hasUniqueIds(value.tickets)
  )
}

function isStoredGame(value: unknown): value is Game {
  if (
    !isRecord(value) ||
    value.schemaVersion !== GAME_SCHEMA_VERSION ||
    !isNonEmptyString(value.id) ||
    !isIsoTimestamp(value.createdAt) ||
    !isIsoTimestamp(value.updatedAt) ||
    !isNonEmptyString(value.activePlayerId) ||
    !Array.isArray(value.players) ||
    value.players.length < 2 ||
    value.players.length > 5 ||
    !value.players.every(isStoredPlayer) ||
    !hasUniqueIds(value.players) ||
    !Array.isArray(value.longestPathPlayerIds) ||
    !value.longestPathPlayerIds.every(isNonEmptyString)
  ) {
    return false
  }

  const playerIds = new Set(value.players.map((player) => player.id))
  return (
    playerIds.has(value.activePlayerId) &&
    new Set(value.longestPathPlayerIds).size === value.longestPathPlayerIds.length &&
    value.longestPathPlayerIds.every((id) => playerIds.has(id))
  )
}

function migrateSchemaV1ToV2(game: UnknownRecord): Game | null {
  if (!Array.isArray(game.players)) return null

  const migrated = {
    ...game,
    schemaVersion: GAME_SCHEMA_VERSION,
    players: game.players.map((player) =>
      isRecord(player) ? { ...player, remainingTrainStations: STARTING_TRAIN_STATIONS } : player,
    ),
  }

  return isStoredGame(migrated) ? migrated : null
}

function migrateGame(value: unknown): Game | null {
  if (!isRecord(value)) return null

  switch (value.schemaVersion) {
    case GAME_SCHEMA_VERSION:
      return isStoredGame(value) ? value : null
    case 1:
      return migrateSchemaV1ToV2(value)
    default:
      return null
  }
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadGame(storage: StorageLike | null = browserStorage()): Game | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(GAME_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return migrateGame(parsed)
  } catch {
    return null
  }
}

export function saveGame(game: Game, storage: StorageLike | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(GAME_STORAGE_KEY, JSON.stringify(game))
    return true
  } catch {
    return false
  }
}

export function clearGame(storage: StorageLike | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.removeItem(GAME_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
