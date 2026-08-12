import {
  GAME_SCHEMA_VERSION,
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

export function loadGame(storage: Storage = localStorage): Game | null {
  try {
    const raw = storage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredGame(parsed) ? parsed : null;
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
