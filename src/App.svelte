<script lang="ts">
  import { onMount } from 'svelte';
  import { registerSW } from 'virtual:pwa-register';
  import ScoringScreen from './components/ScoringScreen.svelte';
  import StartGame from './components/StartGame.svelte';
  import { createGame, isGameComplete, type Game } from './lib/game';
  import { clearGame, loadGame, saveGame } from './lib/persistence';

  let game = $state<Game | null>(loadGame());
  let updateAvailable = $state(false);
  let offlineReady = $state(false);
  let updateSW = $state<(reloadPage?: boolean) => Promise<void>>(async () => {});

  $effect(() => {
    if (game) saveGame($state.snapshot(game));
  });

  onMount(() => {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateAvailable = true;
      },
      onOfflineReady() {
        offlineReady = true;
        window.setTimeout(() => (offlineReady = false), 5000);
      }
    });
  });

  function startGame(names: string[]): void {
    game = createGame(names);
  }

  function newGame(): void {
    if (game && !isGameComplete(game)) {
      const confirmed = window.confirm(
        'This game is not finished. Starting a new game will permanently remove its saved scores. Continue?'
      );
      if (!confirmed) return;
    }

    clearGame();
    game = null;
  }

  async function applyUpdate(): Promise<void> {
    await updateSW(true);
  }
</script>

{#if game}
  <ScoringScreen bind:game onNewGame={newGame} />
{:else}
  <StartGame onStart={startGame} />
{/if}

{#if updateAvailable}
  <div class="pwa-toast" role="status">
    <div>
      <strong>Update available</strong>
      <span>A new version is ready. Your game is already saved.</span>
    </div>
    <button class="primary-button compact" type="button" onclick={applyUpdate}>Update now</button>
    <button class="text-button compact" type="button" onclick={() => (updateAvailable = false)}>Later</button>
  </div>
{:else if offlineReady}
  <div class="pwa-toast offline-toast" role="status">
    <div>
      <strong>Ready offline</strong>
      <span>This scorer will work without a connection.</span>
    </div>
  </div>
{/if}
