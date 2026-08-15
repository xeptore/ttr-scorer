# Ticket to Ride: Europe Scorer

An offline-first Progressive Web App for scoring Ticket to Ride: Europe games.

## Features

- Score routes, destination tickets, remaining Train Stations, and tied Longest Path bonuses.
- Autosave locally and restore compatible saved-game schemas.
- Installable PWA with user-controlled updates.

## Development

```sh
pnpm install
pnpm run dev
pnpm run check
pnpm run test:coverage
pnpm run format:check
pnpm run icons:check
pnpm run build
```

Set `VITE_BASE` when validating a subpath deployment, for example
`VITE_BASE=/ttr-scorer/ pnpm run build`.

## Architecture

- `src/lib/domain`: pure game types and scoring rules.
- `src/lib/components`: reusable Svelte UI components.
- `src/lib/persistence.ts`: versioned, validated device-local storage.
- `src/lib/pwa.ts`: service-worker lifecycle registration.
- `src/App.svelte`: application orchestration and screen composition.

## Deployment

Pushes to `main` run formatting, icon, type, coverage, and production-build checks before
publishing to GitHub Pages.

## License

MIT. Ticket to Ride is a trademark of Days of Wonder. This is an unofficial, non-affiliated
fan project.
