<script lang="ts">
  interface Props {
    onStart: (names: string[]) => void;
  }

  interface Player {
    id: string;
    name: string;
  }

  let { onStart }: Props = $props();
  let playerNamePlaceholders = [
    'Ada',
    'Alex',
    'Casey',
    'Charlie',
    'Jordan',
  ];

  let players = $state<Player[]>([
    { id: crypto.randomUUID(), name: '' },
    { id: crypto.randomUUID(), name: '' },
  ]);
  let error = $state('');

  function addPlayer(): void {
    if (players.length < 5) players.push({ id: crypto.randomUUID(), name: '' });
  }

  function removePlayer(id: string): void {
    if (players.length > 2) players = players.filter((player) => player.id !== id);
  }

  function submit(event: SubmitEvent): void {
    event.preventDefault();
    const cleaned = players.map((player) => player.name.trim());

    if (cleaned.some((name) => !name)) {
      error = 'Enter a name for every player.';
      return;
    }
    if (new Set(cleaned.map((name) => name.toLocaleLowerCase())).size !== cleaned.length) {
      error = 'Use a different name for each player.';
      return;
    }

    error = '';
    onStart(cleaned);
  }
</script>

<main class="start-shell">
  <section class="start-card" aria-labelledby="start-title">
    <div class="eyebrow">Offline scorekeeper</div>
    <h1 id="start-title">Ticket to Ride: Europe</h1>
    <p class="intro">Add the travelers around the table. You can score routes and tickets after the game.</p>

    <form onsubmit={submit}>
      <fieldset>
        <legend>Players</legend>
        <div class="player-fields">
          {#each players as player, index (player.id)}
            <div class="player-field">
              <label for={`player-${player.id}`}>Player {index + 1}</label>
              <div class="input-row">
                <input
                  id={`player-${player.id}`}
                  type="text"
                  autocomplete="off"
                  maxlength="24"
                  placeholder={`e.g. ${playerNamePlaceholders[index]}`}
                  bind:value={player.name}
                  oninput={() => (error = '')}
                />
                {#if players.length > 2}
                  <button
                    class="icon-button"
                    type="button"
                    aria-label={`Remove player ${index + 1}`}
                    onclick={() => removePlayer(player.id)}
                  >×</button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </fieldset>

      {#if players.length < 5}
        <button class="text-button" type="button" onclick={addPlayer}>+ Add player</button>
      {/if}

      {#if error}<p class="form-error" role="alert">{error}</p>{/if}

      <button class="primary-button start-button" type="submit">Start scoring</button>
    </form>

    <p class="offline-note">Your game stays on this device and is saved as you score.</p>
  </section>
</main>
