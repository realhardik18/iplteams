"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type TeamInfo = {
  team: string;
  years: string[];
};

type Player = {
  name: string;
  role: string;
  batting: string;
  bowling: string;
  teams: TeamInfo[];
};

const TEAM_LOGOS: Record<string, string> = {
  "Mumbai Indians": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/500px-Mumbai_Indians_Logo.svg.png",
  "Royal Challengers Bengaluru": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/330px-Royal_Challengers_Bengaluru_Logo.svg.png",
  "Royal Challengers Bangalore": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/330px-Royal_Challengers_Bengaluru_Logo.svg.png",
  "Bangalore Royal Challengers": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/330px-Royal_Challengers_Bengaluru_Logo.svg.png",
  "Pune Warriors": "https://upload.wikimedia.org/wikipedia/en/4/4a/Pune_Warriors_India_IPL_Logo.png",
  "Delhi Capitals": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Delhi_Capitals.svg/500px-Delhi_Capitals.svg.png",
  "Delhi Daredevils": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Delhi_Capitals.svg/500px-Delhi_Capitals.svg.png",
  "Chennai Super Kings": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/500px-Chennai_Super_Kings_Logo.svg.png",
  "Sunrisers Hyderabad": "https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Sunrisers_Hyderabad_Logo.svg/1920px-Sunrisers_Hyderabad_Logo.svg.png",
  "Rajasthan Royals": "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg/500px-This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg.png",
  "Kolkata Knight Riders": "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/500px-Kolkata_Knight_Riders_Logo.svg.png",
  "Punjab Kings": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/500px-Punjab_Kings_Logo.svg.png",
  "Kings XI Punjab": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/500px-Punjab_Kings_Logo.svg.png",
  "Gujarat Titans": "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/500px-Gujarat_Titans_Logo.svg.png",
  "Lucknow Super Giants": "https://upload.wikimedia.org/wikipedia/en/thumb/3/34/Lucknow_Super_Giants_Logo.svg/3840px-Lucknow_Super_Giants_Logo.svg.png",
  "Deccan Chargers": "https://upload.wikimedia.org/wikipedia/en/a/a6/HyderabadDeccanChargers.png",
  "Rising Pune Supergiant": "https://upload.wikimedia.org/wikipedia/en/9/9a/Rising_Pune_Supergiant.png",
  "Rising Pune Supergiants": "https://upload.wikimedia.org/wikipedia/en/9/9a/Rising_Pune_Supergiant.png",
  "Gujarat Lions": "https://upload.wikimedia.org/wikipedia/en/c/c4/Gujarat_Lions.png",
  "Kochi Tuskers Kerala": "https://upload.wikimedia.org/wikipedia/en/thumb/9/96/Kochi_Tuskers_Kerala_Logo.svg/500px-Kochi_Tuskers_Kerala_Logo.svg.png"
};

export default function Home() {
  const playersData = useQuery(api.players.getPlayers, { minTeams: 2 });
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const pickRandomPlayer = useCallback(() => {
    if (!playersData || playersData.length === 0) return;

    // The data from Convex is already filtered by minTeams: 2 and sorted or we can sort here
    const pool = [...playersData];
    pool.sort((a, b) => b.teams.length - a.teams.length);

    const topPoolSize = Math.max(10, Math.floor(pool.length * 0.2));
    const randomIndex = Math.floor(Math.random() * topPoolSize);

    setCurrentPlayer(pool[randomIndex]);
    setGuess("");
    setResult(null);
    setRevealed(false);
  }, [playersData]);

  useEffect(() => {
    if (playersData && !currentPlayer) {
      pickRandomPlayer();
    }
  }, [playersData, currentPlayer, pickRandomPlayer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlayer || revealed) return;

    if (guess.trim().toLowerCase() === currentPlayer.name.toLowerCase()) {
      setResult({ type: "success", message: `CORRECT: ${currentPlayer.name}` });
      setScore((s) => s + 1);
      setAttempts((a) => a + 1);
      setTimeout(pickRandomPlayer, 2000);
    } else {
      setResult({ type: "error", message: "TRY AGAIN" });
      setAttempts(0); // Reset streak on wrong answer
    }
  };

  const handleReveal = () => {
    if (!currentPlayer) return;
    setRevealed(true);
    setAttempts(0); // Reset streak on reveal
    setResult({ type: "error", message: `ANSWER: ${currentPlayer.name}` });
    setTimeout(pickRandomPlayer, 3000);
  };

  if (!playersData) return <main><div className="loading-container"><h1>LOADING PLAYERS...</h1></div></main>;
  if (!currentPlayer) return <main><div className="loading-container"><h1>INITIALIZING GAME...</h1></div></main>;

  return (
    <main>
      <div className="minimal-game">
        <header>
          <h1>Guess the Player</h1>
          <div className="player-details-clues">
            {currentPlayer.role && <span>{currentPlayer.role}</span>}
            {currentPlayer.batting && <span>{currentPlayer.batting}</span>}
            {currentPlayer.bowling && <span>{currentPlayer.bowling}</span>}
          </div>
        </header>

        <div className="teams-wrapper">
          {currentPlayer.teams.map((teamInfo, idx) => {
            const formatYears = (years: string[]) => {
              if (years.length === 0) return "";
              const sorted = [...years].sort((a, b) => parseInt(a) - parseInt(b));
              const ranges: string[] = [];
              let start = sorted[0];
              let prev = sorted[0];

              for (let i = 1; i <= sorted.length; i++) {
                const current = sorted[i];
                if (current && parseInt(current) === parseInt(prev) + 1) {
                  prev = current;
                } else {
                  if (start === prev) {
                    ranges.push(start);
                  } else {
                    ranges.push(`${start} — ${prev}`);
                  }
                  start = current;
                  prev = current;
                }
              }
              return ranges.join(", ");
            };

            return (
              <div key={idx} className="team-row">
                <div className="team-info-main">
                  {TEAM_LOGOS[teamInfo.team] && (
                    <img
                      src={TEAM_LOGOS[teamInfo.team]}
                      alt={teamInfo.team}
                      className="team-logo"
                    />
                  )}
                  <span className="team-name">{teamInfo.team}</span>
                </div>
                <span className="team-years">{formatYears(teamInfo.years)}</span>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type name..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            autoFocus
            autoComplete="off"
          />
        </form>

        {result && (
          <div className={`result ${result.type}`}>
            {result.message}
          </div>
        )}

        {!revealed && !result?.message.includes("CORRECT") && (
          <div className="reveal-link" onClick={handleReveal}>
            Reveal answer
          </div>
        )}
      </div>

      <div className="stats-footer">
        <div><span>Score</span> {score}</div>
        <div><span>Streak</span> {attempts}</div>
      </div>
    </main>
  );
}
