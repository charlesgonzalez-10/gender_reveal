# Pokémon: The Great Gender Reveal

A private, browser-based gender reveal game inspired by the nostalgic look and
feel of classic Game Boy Advance monster-catching RPGs. Guests explore a small
original town, complete short challenges for Bulbasaur, Charmander, Squirtle,
and Pikachu, then trigger a dramatic final reveal.

**All visuals and audio are original, procedurally-generated placeholder
assets.** No official Pokémon artwork, maps, music, sprites, fonts, or sound
effects are copied, downloaded, or redistributed anywhere in this project —
see [Copyright & assets](#copyright--assets) below.

## Table of contents

- [Project overview](#project-overview)
- [Technology stack](#technology-stack)
- [Installation & local development](#installation--local-development)
- [Build & preview](#build--preview)
- [Running tests](#running-tests)
- [Setting the admin PIN](#setting-the-admin-pin)
- [Using /setup — how a trusted person enters the result](#using-setup--how-a-trusted-person-enters-the-result)
- [Resetting the reveal](#resetting-the-reveal)
- [Testing both endings safely (preview mode)](#testing-both-endings-safely-preview-mode)
- [How the shared reveal works & local progress storage](#how-the-shared-reveal-works--local-progress-storage)
- [Preventing spoilers](#preventing-spoilers)
- [Customizing names, titles, and messages](#customizing-names-titles-and-messages)
- [Replacing placeholder graphics](#replacing-placeholder-graphics)
- [Replacing placeholder audio](#replacing-placeholder-audio)
- [Deploying to Vercel](#deploying-to-vercel)
- [How the reveal API is structured](#how-the-reveal-api-is-structured)
- [Project structure](#project-structure)
- [Testing the full game before the event](#testing-the-full-game-before-the-event)
- [Event-day checklist](#event-day-checklist)
- [Copyright & assets](#copyright--assets)

## Project overview

The public game runs at `/`. Players name their trainer, meet an
original professor-style character, and explore a compact town to find four
Pokémon, each guarding a short mini-game:

| Pokémon    | Location                  | Mini-game                     | Clue        |
| ---------- | -------------------------- | ------------------------------ | ----------- |
| Bulbasaur  | Garden / tall grass        | Memory match                   | Leaf        |
| Charmander | Rocky/cave area            | Timing bar                     | Flame       |
| Squirtle   | Pond / shoreline            | Repeat-the-sequence            | Water       |
| Pikachu    | Electrical clearing         | Reaction / spark-connect       | Lightning   |

Once all four clues are collected, the final reveal location unlocks. The
player confirms everyone is gathered, then a countdown, mystery-object
animation, flash, and confetti lead into the reveal itself.

The gender result is **never** hard-coded. It's entered by a trusted person
through a private, PIN-protected `/setup` screen after the ultrasound/reveal
is known, and is never shown anywhere in the public game until the final
reveal sequence actually plays.

## Technology stack

- **React 19 + TypeScript** — UI, routing, dialogue/HUD overlays
- **Vite 8** — dev server & build
- **Phaser** — the tile-based town map, player movement, camera, and world
  entities
- **React Router** — `/` (public game) and `/setup` (protected admin screen),
  code-split so the ~1.4 MB Phaser bundle never loads on `/setup`
- **Vitest + Testing Library** — unit/integration tests for the
  security-sensitive reveal flow and game state
- Plain CSS (no UI framework) for the retro handheld frame, dialogue boxes,
  and menus

Mini-games and all overlay UI (dialogue, HUD, pause menu, final reveal) are
built as React components layered over the Phaser canvas rather than as
separate Phaser scenes — this kept the mini-game logic easy to test and
style with ordinary CSS while Phaser handles only what it's good at (the
tile map, movement, and camera).

## Installation & local development

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
# edit .env.local and set a real ADMIN_PIN (and, for the shared reveal API,
# connect a Redis/Upstash integration — see "Setting the admin PIN" and
# "How the shared reveal works" below)
npm run dev
```

Then open the printed local URL (e.g. `http://localhost:5173/`).

## Build & preview

```bash
npm run build     # type-checks and produces a production build in dist/
npm run preview   # serve the production build locally
```

## Running tests

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

The test suite focuses on the areas that matter most to get right for a
live event: the reveal provider (set/get/reset against a fake of the
serverless API, including the "already locked" 409 case), admin PIN
checking against the server, progress persistence, clue/challenge
tracking, and the full `/setup` flow (PIN gate → selection → confirmation
→ lock → reset-requires-PIN → preview mode never touching the real stored
value).

## Setting the admin PIN

The `/setup` screen is protected by a PIN checked **only on the server**,
inside the `api/reveal/*` serverless functions, via the `ADMIN_PIN`
environment variable. It is never bundled into client JavaScript — do not
prefix it with `VITE_`, and do not set `VITE_ADMIN_PIN` anywhere.

1. Copy `.env.example` to `.env.local` for local development.
2. Set `ADMIN_PIN` to a PIN only your trusted organizer(s) know, in your
   hosting provider's environment variable settings (e.g. Vercel Project
   Settings → Environment Variables). **Do not use `1234` or the
   placeholder `change-this-pin`** — the setup screen shows a warning if
   you forget to change it.
3. Optionally set `ADMIN_TOKEN_SECRET` to a separate long random value used
   to sign short-lived admin session tokens (defaults to `ADMIN_PIN` if
   unset).
4. Redeploy so the new value takes effect.

The server verifies the PIN with a constant-time comparison and rate-limits
repeated incorrect attempts (5 per 60 seconds per client, with a temporary
lockout) so it can't be brute-forced from the browser.

## Using /setup — how a trusted person enters the result

`/setup` is never linked from the public game. Share the URL directly with
whoever is handling the reveal (doctor, ultrasound tech, family member,
event organizer).

1. Open `/setup` and enter the admin PIN.
2. Select **Boy** or **Girl**.
3. A confirmation step appears: *"You selected [X]. Are you sure you want
   to lock this reveal?"* — confirm or cancel.
4. On confirm, the result is sealed and stored. The screen then shows only:
   *"The reveal has been securely set. The adventure is ready!"* — it does
   **not** redisplay which option was chosen.
5. The setup screen now shows a clear **LOCKED** status. The public game
   at `/` will now let players start.

If no result has been set yet, the setup screen shows a visible warning,
and the public title screen shows only a neutral message: *"The adventure
is not ready yet. Please ask the event organizer for help."*

## Resetting the reveal

From `/setup`, once locked, two admin-PIN-protected actions are available:

- **Change Selection** — re-enter the PIN, then pick a new Boy/Girl result
  and re-confirm/lock it.
- **Reset Reveal** — re-enter the PIN to clear the stored result entirely,
  returning to "Not Set."

Resetting a player's normal game progress (from the in-game pause menu) is
a *separate* action and never touches the sealed reveal — see
[How the shared reveal works](#how-the-shared-reveal-works--local-progress-storage).

## Testing both endings safely (preview mode)

The `/setup` screen (PIN-protected) includes a **Preview Mode** section with
two buttons: "Preview: Boy Ending" and "Preview: Girl Ending". These:

- Play the full final reveal animation and color treatment for that option.
- Are clearly labeled **PREVIEW MODE** on screen the whole time.
- Never read, write, or overwrite the real stored reveal value.
- Return you to the setup screen afterward.
- Never reveal which option is actually stored for the real event.

Use preview mode to check the visuals/animations look right on your event
device — never trigger the real final reveal as a test (see the
[event-day checklist](#event-day-checklist)).

## How the shared reveal works & local progress storage

The locked reveal result is **shared server-side** so every device — every
phone, every browser, in or out of private browsing — sees the exact same
outcome. It is stored in a small Redis (KV) database behind the
`api/reveal/*` serverless functions, not in any per-device browser storage:

- The sealed value is written as one of two **neutral** tokens,
  `"optionA"` or `"optionB"` — the words "boy" and "girl" are never sent to
  or stored in the database. The single place in the code that maps a
  token back to a human-facing word is `src/providers/revealMapping.ts`,
  and it's only consulted at the moment the final reveal sequence actually
  renders (or during an explicit preview).
- Locking is atomic ("set if not already set"), so if two people
  accidentally try to lock a result at the same time, the second request
  is rejected with *"The reveal has already been locked."* — there's no
  way for two devices to ever disagree about the official result.
- The public `/api/reveal/status` endpoint only ever returns
  `{ configured, locked }` — never the actual value. The value is only
  fetched, once, at the moment a player actually triggers the final reveal
  sequence.

Ordinary game progress (trainer name, collected clues, completed
challenges, last player position, sound/motion preferences) is a
*separate* concern and still lives in this device's own `localStorage`
under `grp_progress_v1` — that's expected and fine to be per-device, since
each player's walk through the game is their own. Resetting progress from
the in-game pause menu never touches the shared reveal.

## Preventing spoilers

Before the final reveal sequence actually plays, the result is designed to
never appear in: the URL, dialogue, menus, clue descriptions, the browser
console, error messages, browser storage or the shared database (as the
words "boy"/"girl"), asset or audio filenames, CSS class names, revealing
variable names, network request names, or public config files. All internal names use neutral
terms (`sealedReveal`, `optionA`/`optionB`, `revealProvider`,
`SealedRevealResult`). Reveal visuals (color treatment, headline) are
generated dynamically from the fetched token at the moment the final
sequence starts — there are no `boy-confetti`/`girl-confetti`/
`pink-reveal`/`blue-reveal` files anywhere.

## Customizing names, titles, and messages

Edit `src/config/eventConfig.ts`:

```ts
export const eventConfig = {
  gameTitle: "Pokémon: The Great Gender Reveal",
  parentNames: "Charles & Tiffany",
  babyName: "",
  defaultPlayerName: "Trainer",
  revealSubtitle: "A new little trainer is joining the adventure!",
  requireRevealBeforeStarting: true,
  enableAdminPin: true,
  enableMobileControls: true,
  enableChallenges: true,
  enableSound: true,
  estimatedGameLengthMinutes: 8,
};
```

This file intentionally has **no** gender field — the result only ever
comes from the `/setup` flow. NPC/sign dialogue lines live in
`src/game/scenes/TownScene.ts` if you want to tweak the flavor text (keep
them gender-neutral).

## Replacing placeholder graphics

Every sprite and tile is generated at runtime with Phaser's `Graphics` API
in `src/game/systems/textures.ts` — there are no image files to swap today,
by design (see [Copyright & assets](#copyright--assets)). The game code
never cares *how* a texture was made — `TownScene` and `Player` only ever
reference textures by string key — so dropping in your own artwork (fan
art you've licensed, commissioned art, or art you've drawn yourself) is a
localized change in exactly one file.

**Full list of texture keys the game expects:**

| Category | Keys | Expected size |
| --- | --- | --- |
| Player | `player-down-0`, `player-down-1`, `player-up-0`, `player-up-1`, `player-left-0`, `player-left-1`, `player-right-0`, `player-right-1` (the `-0`/`-1` pair is the walk-cycle) | 16×20 px |
| Professor | `professor` | 17×20 px |
| NPCs | `npc-townsfolk`, `npc-gardener` | 16×20 px |
| Pokémon | `pokemon-bulbasaur`, `pokemon-charmander`, `pokemon-squirtle`, `pokemon-pikachu` | 22×22 px |
| Tiles (16×16, tiled edge-to-edge) | `tile-grass`, `tile-path`, `tile-tallgrass`, `tile-water`, `tile-water2` (animation frame 2), `tile-sand`, `tile-tree`, `tile-rock`, `tile-flower`, `tile-fence`, `tile-building`, `tile-labfloor`, `tile-cavefloor`, `tile-sign`, `tile-gate`, `tile-finalfloor` | 16×16 px |

**To swap in real art:**

1. Add your image/spritesheet files under `src/assets/` (Vite will bundle
   them — `import playerSheet from "../../assets/player.png"`).
2. In `src/game/scenes/PreloadScene.ts`, replace the `generateAllTextures(this)`
   call with `this.load.image(...)` calls in a `preload()` method — the
   simplest path is to export each individual frame as its own PNG and
   load it directly under the exact key the game expects, e.g.:

   ```ts
   // src/game/scenes/PreloadScene.ts
   import playerDown0 from "../../assets/player-down-0.png";
   import grassTile from "../../assets/tiles/grass.png";
   // ...one import per file

   preload() {
     this.load.image("player-down-0", playerDown0);
     this.load.image("tile-grass", grassTile);
     // ...one load call per key in the table above
   }

   create() {
     const initData = this.registry.get("initialProgress");
     this.scene.start("Town", { progress: initData });
   }
   ```

   (If you'd rather work from a single packed spritesheet, use
   `this.load.spritesheet(sheetKey, path, { frameWidth, frameHeight })` and
   then create an alias texture per frame with
   `this.textures.get(sheetKey).get(frameIndex)` — but per-frame PNGs are
   simpler to get right for a project this size.)
3. Keep every key name identical to the table above; nothing else in the
   codebase needs to change.

The React-side icons (`src/components/PokemonIcon.tsx`,
`src/components/ClueIcon.tsx`, mini-game symbols in
`src/components/Minigames/GameSymbol.tsx`) are inline SVG — swap the SVG
markup or replace them with `<img>` tags pointing at your licensed artwork.
The final-reveal mystery object and confetti (`src/components/FinalReveal/FinalRevealSequence.tsx`)
are plain CSS — restyle freely.

## Replacing placeholder audio

All sound is synthesized at runtime via the Web Audio API in
`src/state/audio.ts` (`soundManager`) — there are no audio files shipped.
To use real audio:

1. Add licensed audio files under `src/assets/audio/`.
2. Replace the oscillator-based `playSfx`/`playMusic` implementations with
   an `<audio>`- or `Howler`-based player, keeping the same
   `soundManager.playSfx(name)` / `soundManager.playMusic(track)` call
   signatures so no other file needs to change.

## Deploying to Vercel

This is a Vite SPA plus a handful of Vercel serverless functions under
`api/reveal/*` that back the shared reveal store — it needs the API routes
and a Redis database, not just static hosting.

1. Import the repo in Vercel.
2. Framework preset: Vite. Build command `npm run build`, output directory
   `dist`.
3. In Settings → Git, confirm **Production Branch** is `main`. Vercel seeds
   this from the repository's default branch at import time, so if `main`
   isn't the GitHub default branch, production deploys won't track pushes
   to `main` until you set this explicitly.
4. From the Vercel Marketplace, connect a **Redis** (Upstash) integration
   to the project — this populates the `KV_REST_API_URL`/`KV_REST_API_TOKEN`
   (or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) environment
   variables automatically.
5. Add an `ADMIN_PIN` environment variable in the Vercel project settings
   (server-only — not `.env.local`, which isn't deployed, and never
   `VITE_ADMIN_PIN`). Optionally add `ADMIN_TOKEN_SECRET` too.
6. `vercel.json` already routes client-side navigation to `/index.html`
   while leaving `/api/*` alone:
   ```json
   { "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }
   ```

After every redeploy, re-verify `/setup` still requires your PIN and that
the reveal state you expect is present (see the checklist below).

## How the reveal API is structured

The whole app talks to the shared reveal store through one interface
(`src/types/reveal.ts`), implemented by `src/providers/ServerRevealProvider.ts`
and wired up in `src/providers/index.ts`:

```ts
export interface RevealProvider {
  getStatus(): Promise<RevealStatus>; // { configured, locked } — never the value
  getRevealValue(): Promise<SealedRevealResult | null>;
  verifyPin(pin: string): Promise<VerifyPinResult>;
  setReveal(result: SealedRevealResult, adminToken: string): Promise<RevealActionResult>;
  resetReveal(adminToken: string): Promise<RevealActionResult>;
}
```

It calls five serverless functions under `api/reveal/`: `status` and
`value` are public GET endpoints (status never exposes the value; value is
only fetched at the moment the final reveal actually triggers), while
`verify-pin`, `set`, and `reset` are POST endpoints — `set`/`reset` require
a short-lived signed token that `verify-pin` only issues after checking
`ADMIN_PIN` on the server (see `api/_lib/adminAuth.ts` and `api/_lib/kv.ts`).

## Project structure

```
src/
  assets/            (placeholder — no external asset files needed today)
  components/        React UI: dialogue box, HUD, mini-games, setup screens,
                     final reveal sequence
  config/            eventConfig.ts — editable event details
  game/
    scenes/          Phaser BootScene / PreloadScene / TownScene
    entities/        Player movement + collision
    systems/         Procedural texture generation
    maps/            Town tile-map data
    sceneEvents.ts   Typed event bridge between Phaser and React
  providers/         RevealProvider interface + Local/Server implementations,
                     admin PIN check, reveal token<->word mapping
  routes/            PublicGameRoute ("/"), SetupRoute ("/setup")
  state/             Game progress store/context, Web Audio sound manager
  styles/            Plain CSS for the retro frame, HUD, dialogue, menus
  types/             Shared TypeScript types
  test/              Vitest setup
```

## Testing the full game before the event

1. `npm run dev` and open the app locally.
2. Go to `/setup`, enter your PIN, and use **Preview Mode** to check both
   endings' visuals — this never touches the real stored result.
3. Reset the reveal (PIN required) so it's back to "Not Set."
4. On the public title screen, confirm you see the neutral "not ready"
   message and cannot start.
5. Go back to `/setup` and lock a **test** result (you'll reset it again
   before the real event).
6. Play through the full adventure once: name your trainer, talk to the
   professor, find and complete all four Pokémon challenges, confirm the
   clue tracker reaches 4/4, walk to the unlocked final area, and step
   through the real reveal sequence once so you've seen the whole flow.
7. Test on a phone or tablet in the browser to confirm the on-screen
   controls appear and are comfortable to use.
8. When you're satisfied, go to `/setup` and **reset** the reveal again so
   it's clean for the actual event, then lock the real result only once
   it's known (see the checklist below).

## Event-day checklist

1. Deploy the latest version.
2. Set a strong admin PIN (`ADMIN_PIN`, server-only) in your hosting
   provider's environment variables, not just locally, and confirm the
   Redis/KV integration is connected.
3. Open `/setup` on a private device.
4. Have the trusted person enter the gender.
5. Confirm the setup screen shows the reveal as **LOCKED**.
6. Close the setup page.
7. On the public device, confirm the title screen says the adventure is
   ready (not the "not ready yet" message).
8. **Do not** test the real final reveal on event day — use Preview Mode
   only if you need to double check visuals.
9. Put the game device into fullscreen (the title screen and pause menu
   both have a Fullscreen button; press `F` on desktop).
10. Enable sound (mute toggle on the title screen / pause menu, or press
    `M`).
11. Confirm mobile touch controls (or a connected keyboard/controller)
    respond correctly.
12. Start the game once guests are gathered.

## Copyright & assets

This project is inspired by the presentation and pacing of classic
handheld monster-catching RPGs, but contains **no** official Pokémon
assets:

- All sprites and tiles are generated at runtime with simple geometric
  shapes via Phaser's `Graphics` API (see `src/game/systems/textures.ts`)
  — no image files are bundled or downloaded.
- All icons in the React UI are original inline SVG shapes.
- All audio is synthesized at runtime with the Web Audio API
  (`src/state/audio.ts`) — no audio files are bundled or downloaded.
- The pixel-style display font is [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)
  (SIL Open Font License), bundled locally via `@fontsource/press-start-2p`.
- No maps, dialogue, music, or other assets from any official Pokémon game
  are copied or reproduced.

Everything here is meant as a clearly-labeled placeholder that a
family/event organizer can freely replace with their own licensed or
custom artwork and audio before or after the event.
