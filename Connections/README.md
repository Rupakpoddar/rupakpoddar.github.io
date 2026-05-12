# Connections — Offline PWA

A faithful, fully offline web app of the NYT Connections puzzle game. Works on iOS, Android, and desktop. Once you install it (or even just visit it once), it works without internet.

Built as a static site — drop the folder on GitHub Pages and you're done.

## Features

- **Daily puzzle** — deterministic pick from the archive based on the local date, so today's puzzle is the same on every device, no server needed.
- **Practice mode** — random puzzle from the archive, preferring puzzles you haven't played.
- **Archive** — browse and play any of 652 puzzles, with search by number or date.
- **Stats** — played, win %, current streak, max streak, perfect games, mistakes distribution. All stored locally.
- **In-progress save** — if you close the app mid-puzzle, your daily progress is restored when you return.
- **Shareable result** — emoji grid you can copy to clipboard.
- **One away / Already guessed** detection, just like the real game.
- **Shuffle, Deselect all, Submit** controls.
- **Light & dark mode** — follows your system preference.
- **Installable** — Add to Home Screen on iOS, Install on Android/desktop. Runs standalone like a real app.
- **Fully offline after first load** — service worker pre-caches every asset.

## Deploying to GitHub Pages

1. **Create a new repo** on GitHub (public). Name it whatever you want, e.g. `connections`.

2. **Upload all the files** in this folder to the repo root. Either:
   - Drag and drop them into the GitHub web UI ("Add file → Upload files"), or
   - Use git:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
     git push -u origin main
     ```

3. **Enable Pages**: in the repo, go to **Settings → Pages**. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main` / `(root)`
   - Click **Save**.

4. **Wait ~1 minute**. GitHub will publish your site to `https://YOUR-USERNAME.github.io/YOUR-REPO/`. The URL is shown at the top of the Pages settings once it's live.

5. **Open the URL on each device** you want to use it on. After the first load, the service worker caches everything for offline play.

### Installing on each device

After visiting the URL once:

- **iPhone / iPad** — open in **Safari** (must be Safari, not Chrome on iOS), tap the Share button, then **Add to Home Screen**.
- **Android (Chrome)** — Chrome will offer an "Install app" prompt automatically, or you can tap the ⋮ menu → **Install app** / **Add to Home Screen**. The app also has an "Install app" item in its in-app menu.
- **Desktop (Chrome, Edge, Brave, Arc)** — look for the install icon (⊕ or a small monitor with arrow) in the address bar, or use the in-app menu's "Install app" item.
- **Desktop (Safari on Mac)** — File → Add to Dock.
- **Firefox** — doesn't fully support PWA install, but it still works offline once cached. You can pin the tab.

Once installed, the app opens in its own window and works with no internet.

## Project structure

```
.
├── index.html              # App shell + UI markup
├── styles.css              # All styling (light/dark, mobile-first)
├── app.js                  # Game logic, state, stats, install prompt
├── data.json               # 652 puzzles (~282 KB)
├── manifest.webmanifest    # PWA install metadata
├── service-worker.js       # Offline caching (cache-first strategy)
├── icons/                  # PWA icons, favicons, apple-touch-icon
└── README.md
```

## How daily puzzles work

The "Daily" puzzle is chosen deterministically by hashing today's local date (`YYYY-MM-DD`) and using the result modulo 652 to pick from the archive. Every device computes the same daily for the same calendar day, with no server involvement. The displayed date in the header is the puzzle's **original NYT publication date** — it's there as metadata so you know which puzzle you're playing.

Streaks count consecutive days of completed daily puzzles. If you skip a day, the streak resets.

## Updating after you change files

If you change `app.js`, `index.html`, or anything else, bump the `CACHE_VERSION` string in `service-worker.js` (e.g. `'connections-v1'` → `'connections-v2'`). Otherwise existing installs will keep serving the old cached version.

## Resetting

In the app: **Menu → Reset progress** clears all stats and history. Or clear site data in your browser settings.

## Credits

Puzzle data sourced from a public archive of past NYT Connections puzzles. The game design is by The New York Times — this is an unaffiliated offline player for puzzles that have already been published.
