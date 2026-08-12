<script lang="ts">
  import {
    createTicket,
    isGameComplete,
    scorePlayer,
    touchGame,
    type Game,
    type Player,
    type TicketStatus
  } from '../lib/game';

  interface Props {
    game: Game;
    onNewGame: () => void;
  }

  let { game = $bindable(), onNewGame }: Props = $props();
  let trayExpanded = $state(true);
  let longestPathExpanded = $state(false);

  let activePlayer = $derived(
    game.players.find((player) => player.id === game.activePlayerId) ?? game.players[0]
  );
  let activeScore = $derived(scorePlayer(game, activePlayer));
  let completedCount = $derived(game.players.filter((player) => player.scoringComplete).length);

  function changed(): void {
    touchGame(game);
  }

  function selectPlayer(player: Player): void {
    game.activePlayerId = player.id;
    changed();
  }

  function updateRouteScore(value: string): void {
    activePlayer.routeScore = Math.max(0, Math.trunc(Number(value) || 0));
    changed();
  }

  function addTicket(): void {
    activePlayer.tickets.push(createTicket());
    changed();
  }

  function updateTicketPoints(ticketId: string, value: string): void {
    const ticket = activePlayer.tickets.find((candidate) => candidate.id === ticketId);
    if (!ticket) return;
    ticket.points = Math.max(0, Math.trunc(Number(value) || 0));
    changed();
  }

  function setTicketStatus(ticketId: string, status: TicketStatus): void {
    const ticket = activePlayer.tickets.find((candidate) => candidate.id === ticketId);
    if (!ticket) return;
    ticket.status = status;
    changed();
  }

  function removeTicket(ticketId: string): void {
    activePlayer.tickets = activePlayer.tickets.filter((ticket) => ticket.id !== ticketId);
    changed();
  }

  function toggleLongestPath(playerId: string): void {
    if (game.longestPathPlayerIds.includes(playerId)) {
      game.longestPathPlayerIds = game.longestPathPlayerIds.filter((id) => id !== playerId);
    } else {
      game.longestPathPlayerIds.push(playerId);
    }
    changed();
  }

  function toggleComplete(): void {
    activePlayer.scoringComplete = !activePlayer.scoringComplete;
    changed();
  }
</script>

<div class="app-shell" class:tray-collapsed={!trayExpanded}>
  <header class="app-header">
    <div>
      <div class="eyebrow">Ticket to Ride: Europe</div>
      <h1>Score the journey</h1>
    </div>
    <button class="secondary-button compact" type="button" onclick={onNewGame}>New game</button>
  </header>

  <nav class="player-tabs" aria-label="Players">
    {#each game.players as player}
      <button
        type="button"
        class:active={player.id === activePlayer.id}
        aria-current={player.id === activePlayer.id ? 'page' : undefined}
        onclick={() => selectPlayer(player)}
      >
        <span>{player.name}</span>
        <strong>{scorePlayer(game, player).total}</strong>
        {#if player.scoringComplete}<span class="done-dot" aria-label="Scoring complete">✓</span>{/if}
      </button>
    {/each}
  </nav>

  <main class="scoring-main">
    <section class="score-hero" aria-live="polite">
      <div>
        <p>Scoring for</p>
        <h2>{activePlayer.name}</h2>
      </div>
      <div class="hero-total">
        <span>Total</span>
        <strong>{activeScore.total}</strong>
      </div>
    </section>

    <section class="panel route-panel" aria-labelledby="route-heading">
      <div>
        <h3 id="route-heading">Board routes</h3>
        <p>Enter the route score already shown on the board.</p>
      </div>
      <label class="number-control">
        <span>Points</span>
        <input
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          value={activePlayer.routeScore}
          oninput={(event) => updateRouteScore(event.currentTarget.value)}
        />
      </label>
    </section>

    <section class="panel ticket-panel" aria-labelledby="tickets-heading">
      <div class="section-heading">
        <div>
          <h3 id="tickets-heading">Destination tickets</h3>
          <p>Add all tickets now, including failed ones.</p>
        </div>
        <span class:negative={activeScore.tickets < 0} class="subtotal">
          {activeScore.tickets > 0 ? '+' : ''}{activeScore.tickets}
        </span>
      </div>

      {#if activePlayer.tickets.length === 0}
        <div class="empty-state">No destination tickets entered for {activePlayer.name}.</div>
      {:else}
        <div class="ticket-list">
          {#each activePlayer.tickets as ticket, index (ticket.id)}
            <div class="ticket-row">
              <label class="ticket-points">
                <span>Ticket {index + 1} points</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputmode="numeric"
                  value={ticket.points}
                  oninput={(event) => updateTicketPoints(ticket.id, event.currentTarget.value)}
                />
              </label>
              <div class="status-toggle" aria-label={`Ticket ${index + 1} status`}>
                <button
                  type="button"
                  class:active={ticket.status === 'completed'}
                  onclick={() => setTicketStatus(ticket.id, 'completed')}
                >Completed</button>
                <button
                  type="button"
                  class:active={ticket.status === 'failed'}
                  class:failed={ticket.status === 'failed'}
                  onclick={() => setTicketStatus(ticket.id, 'failed')}
                >Failed</button>
              </div>
              <strong class:negative={ticket.status === 'failed'} class="ticket-value">
                {ticket.status === 'failed' ? '−' : '+'}{ticket.points}
              </strong>
              <button
                class="icon-button"
                type="button"
                aria-label={`Remove ticket ${index + 1}`}
                onclick={() => removeTicket(ticket.id)}
              >×</button>
            </div>
          {/each}
        </div>
      {/if}

      <button class="secondary-button add-ticket" type="button" onclick={addTicket}>+ Add ticket</button>
    </section>

    <section class="panel longest-panel">
      <button
        type="button"
        class="disclosure"
        aria-expanded={longestPathExpanded}
        onclick={() => (longestPathExpanded = !longestPathExpanded)}
      >
        <span>
          <strong>Longest Continuous Path</strong>
          <small>Global bonus · ties allowed</small>
        </span>
        <span class="bonus-summary">
          {game.longestPathPlayerIds.length === 0 ? 'None' : `${game.longestPathPlayerIds.length} selected`}
          <span aria-hidden="true">{longestPathExpanded ? '⌃' : '⌄'}</span>
        </span>
      </button>

      {#if longestPathExpanded}
        <div class="bonus-options">
          <p>Select every player tied for the longest path. Each receives +10.</p>
          {#each game.players as player}
            <label>
              <input
                type="checkbox"
                checked={game.longestPathPlayerIds.includes(player.id)}
                onchange={() => toggleLongestPath(player.id)}
              />
              <span>{player.name}</span>
              <strong>+10</strong>
            </label>
          {/each}
        </div>
      {/if}
    </section>

    <section class="completion-panel" class:complete={activePlayer.scoringComplete}>
      <div>
        <h3>{activePlayer.scoringComplete ? `${activePlayer.name} is done` : `Finished with ${activePlayer.name}?`}</h3>
        <p>This is separate from the Longest Path bonus.</p>
      </div>
      <button
        type="button"
        class={activePlayer.scoringComplete ? 'secondary-button' : 'primary-button'}
        onclick={toggleComplete}
      >{activePlayer.scoringComplete ? 'Mark incomplete' : 'Mark scoring complete'}</button>
    </section>

    {#if isGameComplete(game)}
      <section class="all-complete" aria-live="polite">
        <strong>Scoring complete</strong>
        <span>All players have been checked. Highest total wins!</span>
      </section>
    {/if}
  </main>

  <aside class="score-tray" aria-label="Current scores">
    <button
      class="tray-handle"
      type="button"
      aria-expanded={trayExpanded}
      onclick={() => (trayExpanded = !trayExpanded)}
    >
      <span>Scores <small>{completedCount}/{game.players.length} complete</small></span>
      <span aria-hidden="true">{trayExpanded ? '⌄' : '⌃'}</span>
    </button>
    {#if trayExpanded}
      <div class="tray-scores">
        {#each [...game.players].sort((a, b) => scorePlayer(game, b).total - scorePlayer(game, a).total) as player}
          <button type="button" onclick={() => selectPlayer(player)} class:active={player.id === activePlayer.id}>
            <span class="tray-name">
              {player.name}
              {#if game.longestPathPlayerIds.includes(player.id)}
                <span class="path-badge" title="Longest Continuous Path">LP</span>
              {/if}
              {#if player.scoringComplete}<span class="complete-badge" title="Scoring complete">✓</span>{/if}
            </span>
            <strong>{scorePlayer(game, player).total}</strong>
          </button>
        {/each}
      </div>
    {/if}
  </aside>
</div>
