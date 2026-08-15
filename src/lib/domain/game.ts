export const GAME_SCHEMA_VERSION = 2 as const
export const LONGEST_PATH_BONUS = 10
export const TRAIN_STATION_BONUS = 4
export const STARTING_TRAIN_STATIONS = 3

export type TicketStatus = 'completed' | 'failed'

export interface DestinationTicket {
  id: string
  points: number
  status: TicketStatus
}

export interface Player {
  id: string
  name: string
  routeScore: number
  remainingTrainStations: number
  tickets: DestinationTicket[]
  scoringComplete: boolean
}

export interface Game {
  schemaVersion: typeof GAME_SCHEMA_VERSION
  id: string
  createdAt: string
  updatedAt: string
  activePlayerId: string
  players: Player[]
  longestPathPlayerIds: string[]
}

export interface PlayerScore {
  route: number
  tickets: number
  trainStations: number
  longestPath: number
  total: number
}

const makeId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

export function createGame(names: string[], now = new Date()): Game {
  const cleanedNames = names.map((name) => name.trim()).filter(Boolean)
  if (cleanedNames.length < 2 || cleanedNames.length > 5) {
    throw new Error('A game needs 2 to 5 players.')
  }

  const normalized = cleanedNames.map((name) => name.toLocaleLowerCase())
  if (new Set(normalized).size !== normalized.length) {
    throw new Error('Player names must be unique.')
  }

  const players = cleanedNames.map<Player>((name) => ({
    id: makeId(),
    name,
    routeScore: 0,
    remainingTrainStations: STARTING_TRAIN_STATIONS,
    tickets: [],
    scoringComplete: false,
  }))
  const timestamp = now.toISOString()

  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    id: makeId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    activePlayerId: players[0].id,
    players,
    longestPathPlayerIds: [],
  }
}

export function createTicket(points = 1): DestinationTicket {
  return { id: makeId(), points, status: 'completed' }
}

export function scorePlayer(game: Game, player: Player): PlayerScore {
  const tickets = player.tickets.reduce(
    (sum, ticket) => sum + (ticket.status === 'completed' ? ticket.points : -ticket.points),
    0,
  )
  const trainStations = player.remainingTrainStations * TRAIN_STATION_BONUS
  const longestPath = game.longestPathPlayerIds.includes(player.id) ? LONGEST_PATH_BONUS : 0

  return {
    route: player.routeScore,
    tickets,
    trainStations,
    longestPath,
    total: player.routeScore + tickets + trainStations + longestPath,
  }
}

export function isGameComplete(game: Game): boolean {
  return game.players.every((player) => player.scoringComplete)
}

export function touchGame(game: Game, now = new Date()): void {
  game.updatedAt = now.toISOString()
}
