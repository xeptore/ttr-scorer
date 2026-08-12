<script lang="ts">
  interface Props {
    onStart: (names: string[]) => void;
  }

  let { onStart }: Props = $props();
  let names = $state(['', '']);
  let error = $state('');

  function addPlayer(): void {
    if (names.length < 5) names.push('');
  }

  function removePlayer(index: number): void {
    if (names.length > 2) names.splice(index, 1);
  }

  function submit(event: SubmitEvent): void {
    event.preventDefault();
    const cleaned = names.map((name) => name.trim());

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
          {#each names as name, index}
            <div class="player-field">
              <label for={`player-${index}`}>Player {index + 1}</label>
              <div class="input-row">
                <input
                  id={`player-${index}`}
                  type="text"
                  autocomplete="off"
                  maxlength="24"
                  placeholder={index === 0 ? 'e.g. Morteza' : 'Player name'}
                  bind:value={names[index]}
                  oninput={() => (error = '')}
                />
                {#if names.length > 2}
                  <button
                    class="icon-button"
                    type="button"
                    aria-label={`Remove player ${index + 1}`}
                    onclick={() => removePlayer(index)}
                  >×</button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </fieldset>

      {#if names.length < 5}
        <button class="text-button" type="button" onclick={addPlayer}>+ Add player</button>
      {/if}

      {#if error}<p class="form-error" role="alert">{error}</p>{/if}

      <button class="primary-button start-button" type="submit">Start scoring</button>
    </form>

    <p class="offline-note">Your game stays on this device and is saved as you score.</p>
  </section>
</main>
