# IPL Teams - Cricket Guessing Game

A full-stack IPL trivia game that tests your knowledge of player careers across 18 seasons (2008–2026). Guess players from their role, batting/bowling style, and team history — solo or in real-time 1v1 battles.

## Project Structure

```
iplteams/
├── core/               # Python data pipeline (scraping + processing)
│   ├── scraper.py      # Selenium scraper for ESPN Cricinfo squad pages
│   ├── process_data.py # Deduplication, normalization, team history grouping
│   ├── probe.py        # Debug utility for inspecting page source
│   └── data/           # Raw + processed player JSON files
├── ipl-game/           # Next.js web app
│   ├── src/app/        # Game UI (single-page React component)
│   ├── convex/         # Convex backend (players DB, multiplayer rooms)
│   └── public/         # Team logos and static assets
```

## Game Modes

- **Hard Mode** — Type the player's name with no hints
- **Easy Mode** — Pick from 4 multiple-choice options (smart distractors matched by role/style)
- **Teammates Mode** — Guess from clues like _"In 2019, he played with Virat Kohli and AB de Villiers"_
- **Battle Mode** — Real-time 1v1 with lobby codes, 60-second timer, streak scoring, and 2-second wrong-answer penalty

## Tech Stack

| Layer | Tech |
|-------|------|
| Scraper | Python, Selenium, Selenium Stealth |
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Convex (real-time serverless DB) |
| Styling | CSS (Outfit font, mobile-first) |

## Data Pipeline

```
ESPN Cricinfo → Selenium Scraper → ipl_players_detailed.json
                                         ↓
                                   process_data.py
                                         ↓
                                   processed_players.json → Convex DB → Game
```

Covers 1000+ unique players across all IPL franchises, with normalized team names (e.g. Delhi Daredevils → Delhi Capitals) and grouped year ranges.

## Getting Started

### Scraper (optional — data is already included)

```bash
cd core
pip install -r requirements.txt
python scraper.py
python process_data.py
```

### Game

```bash
cd ipl-game
npm install
```

Run in two terminals:

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

- **Player selection** is biased toward players with richer team histories (top 20% by team count get more airtime)
- **Option generation** prioritizes similar players (same role + batting + bowling style) for harder distractors
- **Battle mode** pre-generates 50 questions from the top 150 players so both competitors answer the same set
- **Streak scoring** rewards consecutive correct answers; revealing an answer resets the streak
