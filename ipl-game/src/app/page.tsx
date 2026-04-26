"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type TeamInfo = {
  team: string;
  years: string[];
};

type Player = {
  _id: string;
  name: string;
  role: string;
  batting: string;
  bowling: string;
  teams: TeamInfo[];
};

type BattlePlayer = {
  name: string;
  score: number;
  identity: string;
  ready: boolean;
};

function ThemeToggle({ darkMode, onClick }: { darkMode: boolean; onClick: () => void }) {
  return (
    <button className="theme-toggle" onClick={onClick} aria-label="Toggle theme">
      {darkMode ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

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
  const [options, setOptions] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<"hard" | "easy" | "teammates" | "battle" | null>(null);
  const [battleState, setBattleState] = useState<"entry" | "lobby" | "playing" | "finished" | null>(null);
  const [roomId, setRoomId] = useState<Id<"rooms_v2"> | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [identity, setIdentity] = useState("");
  const [timer, setTimer] = useState(60);
  const [battleIndex, setBattleIndex] = useState(0);

  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [seenPlayers, setSeenPlayers] = useState<Set<string>>(new Set());
  const [teammateClues, setTeammateClues] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(prefersDark);
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    let id = sessionStorage.getItem("player_id");
    if (!id) {
      id = Math.random().toString(36).substring(2);
      sessionStorage.setItem("player_id", id);
    }
    setIdentity(id);
  }, []);

  const startGame = (mode: "hard" | "easy" | "teammates" | "battle") => {
    if (mode === "battle") {
      setBattleState("entry");
    }
    setGameMode(mode);
  };

  const generateOptions = useCallback((correctPlayer: Player, allPlayers: Player[]) => {
    // Find players with similar roles
    const similar = allPlayers.filter(p => 
      p.name !== correctPlayer.name && 
      p.role === correctPlayer.role && 
      p.batting === correctPlayer.batting && 
      p.bowling === correctPlayer.bowling
    );

    // If not enough similar, just pick random ones
    let distractors = [...similar].sort(() => 0.5 - Math.random()).slice(0, 3);
    if (distractors.length < 3) {
      const remaining = allPlayers.filter(p => p.name !== correctPlayer.name && !distractors.find(d => d.name === p.name));
      distractors = [...distractors, ...remaining.sort(() => 0.5 - Math.random()).slice(0, 3 - distractors.length)];
    }

    const newOptions = [correctPlayer.name, ...distractors.map(p => p.name)].sort();
    setOptions(newOptions);
  }, []);

  const generateTeammateClues = useCallback((target: Player, allPlayers: Player[]) => {
    const clues: string[] = [];
    
    // Group all players by team and year for efficient lookup
    const squadMap: Record<string, string[]> = {};
    allPlayers.forEach(p => {
      p.teams.forEach(t => {
        t.years.forEach(y => {
          const key = `${t.team}_${y}`;
          if (!squadMap[key]) squadMap[key] = [];
          squadMap[key].push(p.name);
        });
      });
    });

    // For each team stint of the target player, find some teammates
    target.teams.forEach(t => {
      // Pick one random year from this team stint
      const randomYear = t.years[Math.floor(Math.random() * t.years.length)];
      const key = `${t.team}_${randomYear}`;
      const teammates = squadMap[key].filter(name => name !== target.name);
      
      if (teammates.length > 0) {
        // Pick 2 random teammates from this year/team
        const selected = teammates.sort(() => 0.5 - Math.random()).slice(0, 2);
        clues.push(`In ${randomYear}, he played with ${selected.join(" and ")}.`);
      }
    });

    // Return 2-3 distinct clues
    setTeammateClues(clues.sort(() => 0.5 - Math.random()).slice(0, 3));
  }, []);

  const pickRandomPlayer = useCallback(() => {
    if (!playersData || playersData.length === 0) return;

    let pool = playersData.filter(p => !seenPlayers.has(p._id));
    
    if (pool.length === 0) {
      setSeenPlayers(new Set());
      pool = [...playersData];
    }

    pool.sort((a, b) => b.teams.length - a.teams.length);

    const topPoolSize = Math.max(10, Math.floor(pool.length * 0.2));
    const randomIndex = Math.floor(Math.random() * Math.min(topPoolSize, pool.length));
    
    const picked = pool[randomIndex];
    setCurrentPlayer(picked);
    setSeenPlayers(prev => new Set(prev).add(picked._id));
    
    setGuess("");
    setResult(null);
    setRevealed(false);
    
    if (gameMode === "easy" || gameMode === "teammates") {
      generateOptions(picked, playersData);
    }
    
    if (gameMode === "teammates") {
      generateTeammateClues(picked, playersData);
    }
  }, [playersData, gameMode, generateOptions, generateTeammateClues, seenPlayers]);

  const createRoom = useMutation(api.rooms.create);
  const joinRoom = useMutation(api.rooms.join);
  const toggleReady = useMutation(api.rooms.toggleReady);
  const syncScore = useMutation(api.rooms.updateScore);
  const room = useQuery(roomCode ? api.rooms.get : (undefined as any), { code: roomCode });

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (room?.status === "starting" && room.startTime) {
      const interval = setInterval(() => {
        const diff = Math.ceil((room.startTime! - Date.now()) / 1000);
        if (diff <= 0) {
          setCountdown(null);
          setBattleState("playing");
          clearInterval(interval);
        } else {
          setCountdown(diff);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [room?.status, room?.startTime]);

  useEffect(() => {
    if (gameMode === "battle" && battleState === "playing" && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && battleState === "playing") {
      setBattleState("finished");
    }
  }, [gameMode, battleState, timer]);

  // Sync current player for battle mode
  useEffect(() => {
    if (gameMode === "battle" && battleState === "playing" && room && playersData) {
      const q = room.questions?.[battleIndex];
      if (q) {
        const player = playersData.find(p => p._id === q.playerId);
        if (player) {
          setCurrentPlayer(player);
          setOptions(q.options);
        }
      }
    }
  }, [gameMode, battleState, battleIndex, room, playersData]);

  const handleCreateRoom = async () => {
    const res = await createRoom({ name: "Player 1", identity });
    setRoomCode(res.code);
    setRoomId(res.roomId);
    setBattleState("lobby");
  };

  const handleJoinRoom = async (code: string) => {
    try {
      const id = await joinRoom({ code: code.toUpperCase(), name: "Player 2", identity });
      setRoomCode(code.toUpperCase());
      setRoomId(id);
      setBattleState("lobby");
    } catch (e) {
      alert("Room not found or full");
    }
  };

  const handleToggleReady = async () => {
    if (roomId) {
      await toggleReady({ roomId, identity });
    }
  };

  useEffect(() => {
    if (playersData && !currentPlayer && gameMode !== "battle") {
      pickRandomPlayer();
    }
  }, [playersData, currentPlayer, pickRandomPlayer, gameMode]);

  useEffect(() => {
    if (gameMode !== "battle") {
      if ((gameMode === "easy" || gameMode === "teammates") && currentPlayer && playersData) {
        generateOptions(currentPlayer, playersData);
      } 
      if (gameMode === "teammates" && currentPlayer && playersData) {
        generateTeammateClues(currentPlayer, playersData);
      }
    }
  }, [gameMode, currentPlayer, playersData, generateOptions, generateTeammateClues]);

  const handleGuess = (selectedName: string) => {
    if (!currentPlayer || revealed || isLocked) return;

    if (selectedName.trim().toLowerCase() === currentPlayer?.name.toLowerCase()) {
      setResult({ type: "success", message: `CORRECT: ${currentPlayer?.name}` });
      setAttempts((a) => a + 1);
      
      if (gameMode === "battle" && roomId) {
        syncScore({ roomId, identity, score: attempts + 1 });
        setBattleIndex(i => i + 1);
        setResult(null);
      } else {
        setTimeout(pickRandomPlayer, 2000);
      }
    } else {
      setResult({ type: "error", message: "TRY AGAIN" });
      if (gameMode === "battle") {
        setIsLocked(true);
        setResult({ type: "error", message: "WRONG! 2s PENALTY" });
        setTimeout(() => {
          setIsLocked(false);
          setResult(null);
        }, 2000);
      } else {
        setAttempts(0);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGuess(guess);
  };

  const handleReveal = () => {
    if (!currentPlayer || isLocked) return;
    setRevealed(true);
    setAttempts(0); // Reset streak on reveal
    setResult({ type: "error", message: `ANSWER: ${currentPlayer?.name}` });
    setTimeout(pickRandomPlayer, 3000);
  };

  if (!playersData) return (
    <main>
      <ThemeToggle darkMode={darkMode} onClick={toggleTheme} />
      <div className="loading-container"><h1>LOADING PLAYERS...</h1></div>
    </main>
  );

  if (playersData.length === 0) return (
    <main>
      <ThemeToggle darkMode={darkMode} onClick={toggleTheme} />
      <div className="loading-container">
        <h1>NO PLAYERS FOUND</h1>
        <div className="empty-state">
          <p>The database is empty. Make sure <code>npx convex dev</code> is running, then seed players by calling the <code>seedPlayers</code> mutation from the Convex dashboard.</p>
        </div>
      </div>
    </main>
  );

  return (
    <main className={!gameMode ? "no-scroll" : ""}>
      <ThemeToggle darkMode={darkMode} onClick={toggleTheme} />

      {!gameMode && (
        <div className="startup-overlay">
          <div className="startup-modal">
            <h1>Select Difficulty</h1>
            <div className="startup-options">
              <button onClick={() => startGame("hard")} className="hard-btn">
                HARD MODE
                <small>Type the name</small>
              </button>
              <button onClick={() => startGame("easy")} className="easy-btn">
                EASY MODE
                <small>4 Options</small>
              </button>
              <button onClick={() => startGame("teammates")} className="teammates-btn">
                TEAMMATES
                <small>Shared Dressing Room</small>
              </button>
              <button onClick={() => startGame("battle")} className="battle-btn">
                1V1 BATTLE
                <small>Real-time Race</small>
              </button>
            </div>
          </div>
        </div>
      )}

      {gameMode === "battle" && battleState === "entry" && (
        <div className="startup-overlay">
          <div className="startup-modal">
            <h1>1v1 Battle</h1>
            <div className="startup-options">
              <button onClick={handleCreateRoom} className="hard-btn">
                CREATE ROOM
                <small>Get a code to share</small>
              </button>
              <div className="join-box">
                <input 
                  type="text" 
                  placeholder="ENTER CODE..." 
                  className="join-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoinRoom(e.currentTarget.value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {gameMode === "battle" && battleState === "lobby" && (
        <div className="startup-overlay">
          <div className="startup-modal">
            <h1>Room: {roomCode}</h1>
            <div className="players-list">
              {room?.players.map((p: BattlePlayer, idx: number) => (
                <div key={idx} className="player-entry">
                  <div className="player-info-row">
                    <span>{p.name} {p.identity === identity && "(You)"}</span>
                    <span className={`ready-tag ${p.ready ? "is-ready" : ""}`}>
                      {p.ready ? "READY" : "NOT READY"}
                    </span>
                  </div>
                </div>
              ))}
              {room?.players.length === 1 && (
                <div className="waiting-text">Waiting for opponent...</div>
              )}
            </div>
            
            {countdown !== null ? (
              <div className="countdown-display">
                <div className="countdown-number">{countdown}</div>
                <small>GET READY!</small>
              </div>
            ) : room?.players.length === 2 ? (
              <button onClick={handleToggleReady} className={`easy-btn ${room.players.find((p: BattlePlayer) => p.identity === identity)?.ready ? "ready-active" : ""}`}>
                {room.players.find((p: BattlePlayer) => p.identity === identity)?.ready ? "CANCEL READY" : "I'M READY!"}
              </button>
            ) : (
              <div className="waiting-box">Need 2 players to start</div>
            )}
          </div>
        </div>
      )}

      {gameMode === "battle" && battleState === "finished" && (
        <div className="startup-overlay">
          <div className="startup-modal">
            <h1>Match Over!</h1>
            <div className="results-list">
              {room?.players.sort((a: BattlePlayer, b: BattlePlayer) => b.score - a.score).map((p: BattlePlayer, idx: number) => (
                <div key={idx} className="result-entry">
                  <span>{p.name}</span>
                  <strong>{p.score}</strong>
                </div>
              ))}
            </div>
            <button onClick={() => window.location.reload()} className="hard-btn">
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {!currentPlayer && gameMode !== "battle" ? (
        <div className="loading-container"><h1>INITIALIZING GAME...</h1></div>
      ) : (
        <div className={`game-content ${!gameMode || (gameMode === "battle" && battleState !== "playing") ? "blurred" : ""}`}>
          {gameMode === "battle" && battleState === "playing" && (
            <div className="battle-header">
              <div className="timer">{timer}s</div>
              <div className="battle-scores">
                {room?.players.map((p: BattlePlayer, idx: number) => (
                  <div key={idx} className={`score-badge ${p.identity === identity ? "me" : ""}`}>
                    {p.name}: {p.score}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="minimal-game">
            <header>
              <h1>Guess the Player</h1>
              <div className="player-details-clues">
                {currentPlayer?.role && <span>{currentPlayer?.role}</span>}
                {currentPlayer?.batting && <span>{currentPlayer?.batting}</span>}
                {currentPlayer?.bowling && <span>{currentPlayer?.bowling}</span>}
              </div>
            </header>

        {gameMode === "teammates" ? (
          <div className="teammate-clues-wrapper">
            {teammateClues.map((clue, idx) => (
              <div key={idx} className="teammate-clue-card">
                {clue}
              </div>
            ))}
            <div className="teammate-ask">Who is this player?</div>
          </div>
        ) : (
          <div className="teams-wrapper">
            {currentPlayer?.teams.map((teamInfo, idx) => {
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
        )}

        {gameMode === "easy" || gameMode === "teammates" || gameMode === "battle" ? (
          <div className="options-grid">
            {options.length > 0 ? options.map((name) => (
              <button 
                key={name} 
                onClick={() => handleGuess(name)}
                disabled={revealed || result?.type === "success" || isLocked}
              >
                {name}
              </button>
            )) : (
              <div className="error-text">No options available. Please create a new room.</div>
            )}
          </div>
        ) : (
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
        )}

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

      {gameMode !== "battle" && (
        <div className="stats-footer">
          <div><span>Streak</span> {attempts}</div>
        </div>
      )}
    </div>
    )}
  </main>
);
}
