import { describe, expect, it } from 'vitest'
import { createGame, isGameComplete, scorePlayer, type DestinationTicket } from './game'

const ticket = (points: number, status: DestinationTicket['status']): DestinationTicket => ({
  id: `${points}-${status}`,
  points,
  status,
})

describe('scorePlayer', () => {
  it('adds completed tickets and subtracts failed tickets', () => {
    const game = createGame(['Ada', 'Grace'])
    const player = game.players[0]
    player.routeScore = 42
    player.tickets = [ticket(8, 'completed'), ticket(12, 'failed')]

    expect(scorePlayer(game, player)).toEqual({
      route: 42,
      tickets: -4,
      trainStations: 12,
      longestPath: 0,
      total: 50,
    })
  })

  it('awards four points for each remaining train station', () => {
    const game = createGame(['Ada', 'Grace'])
    const player = game.players[0]
    player.remainingTrainStations = 1

    expect(scorePlayer(game, player).trainStations).toBe(4)
    expect(scorePlayer(game, player).total).toBe(4)
  })

  it('awards the longest path bonus to every selected player', () => {
    const game = createGame(['Ada', 'Grace', 'Linus'])
    game.longestPathPlayerIds = [game.players[0].id, game.players[1].id]

    expect(scorePlayer(game, game.players[0]).longestPath).toBe(10)
    expect(scorePlayer(game, game.players[1]).longestPath).toBe(10)
    expect(scorePlayer(game, game.players[2]).longestPath).toBe(0)
  })
})

describe('game state', () => {
  it('requires 2 to 5 uniquely named players', () => {
    expect(() => createGame(['Solo'])).toThrow()
    expect(() => createGame(['Ada', 'ada'])).toThrow()
    expect(() => createGame(['A', 'B', 'C', 'D', 'E', 'F'])).toThrow()
  })

  it('tracks scoring completion independently from longest path', () => {
    const game = createGame(['Ada', 'Grace'])
    game.longestPathPlayerIds = game.players.map((player) => player.id)
    expect(isGameComplete(game)).toBe(false)

    game.players.forEach((player) => (player.scoringComplete = true))
    expect(isGameComplete(game)).toBe(true)
  })
})
