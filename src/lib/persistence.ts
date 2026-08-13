import {
  GAME_SCHEMA_VERSION,
  STARTING_TRAIN_STATIONS,
  type DestinationTicket,
  type Game,
  type Player
} from './game';

export const GAME_STORAGE_KEY = 'ttr-europe-scorer:active-game';

function isStoredTicket(value: unknown): value is DestinationTicket {
  if (!value || typeof value !== 'object') return false;
  const ticket = value as Partial<DestinationTicket>;
  return (
    typeof ticket.id === 'string' &&
    typeof ticket.points === 'number' &&
    Number.isInteger(ticket.points) &&
    ticket.points >= 0 &&
    (ticket.status === 'completed' || ticket.status === 'failed')
  );
}

function isStoredPlayer(value: unknown): value is Player {
  if (!value || typeof value !== 'object') return false;
  const player = value as Partial<Player>;
  return (
    typeof player.id === 'string' &&
    typeof player.name === 'string' &&
    player.name.length > 0 &&
    typeof player.routeScore === 'number' &&
    Number.isInteger(player.routeScore) &&
    player.routeScore >= 0 &&
    typeof player.remainingTrainStations === 'number' &&
    Number.isInteger(player.remainingTrainStations) &&
    player.remainingTrainStations >= 0 &&
    player.remainingTrainStations <= STARTING_TRAIN_STATIONS &&
    typeof player.scoringComplete === 'boolean' &&
    Array.isArray(player.tickets) &&
    player.tickets.every(isStoredTicket)
  );
}

function isStoredGame(value: unknown): value is Game {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<Game>;
  if (
    game.schemaVersion === GAME_SCHEMA_VERSION &&
    typeof game.id === 'string' &&
    typeof game.createdAt === 'string' &&
    typeof game.updatedAt === 'string' &&
    typeof game.activePlayerId === 'string' &&
    Array.isArray(game.players) &&
    game.players.length >= 2 &&
    game.players.length <= 5 &&
    game.players.every(isStoredPlayer) &&
    Array.isArray(game.longestPathPlayerIds) &&
    game.longestPathPlayerIds.every((id) => typeof id === 'string')
  ) {
    const playerIds = new Set(game.players.map((player) => player.id));
    return (
      playerIds.has(game.activePlayerId) &&
      game.longestPathPlayerIds.every((id) => playerIds.has(id))
    );
  }
  return false;
}

function migrateSchemaV1ToV2(game: Record<string, unknown>): Game | null {
  if (!Array.isArray(game.players)) return null;

  const migrated = {
    ...game,
    schemaVersion: GAME_SCHEMA_VERSION,
    players: game.players.map((player) =>
      player && typeof player === 'object'
        ? { ...player, remainingTrainStations: STARTING_TRAIN_STATIONS }
        : player
    )
  };

  return isStoredGame(migrated) ? migrated : null;
}

function migrateGame(value: unknown): Game | null {
  // A missing or non-object value is not a saved game, so there is nothing to restore.
  if (!value || typeof value !== 'object') return null;
  const game = value as Record<string, unknown>;

  switch (game.schemaVersion) {
    case GAME_SCHEMA_VERSION:
      // The save is already current; only restore it when it is internally valid.
      return isStoredGame(game) ? game : null;

    case 1:
      // Schema v1 did not store remaining Train Stations. Add the three stations
      // each player starts with, then validate the completed v2 save.
      return migrateSchemaV1ToV2(game);

    default:
      // Unknown, missing, malformed, or newer schema versions are not restored.
      return null;
  }
}

export function loadGame(storage: Storage = localStorage): Game | null {
  try {
    const raw = storage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return migrateGame(parsed);
  } catch {
    return null;
  }
}

export function saveGame(game: Game, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(GAME_STORAGE_KEY, JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
}

export function clearGame(storage: Storage = localStorage): boolean {
  try {
    storage.removeItem(GAME_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
