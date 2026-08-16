import { useState, useEffect, useCallback } from "react";

const BIZ_WORDS = [
  "ASSET", "YIELD", "SHARE", "BRAND", "STAKE",
  "VALUE", "BOARD", "PITCH", "SCALE", "TRADE",
  "TRUST", "AUDIT", "INDEX", "PRICE", "QUOTA",
  "STOCK", "SALES", "BONUS", "FUNDS", "RATES",
  "TAXES", "CHART", "NICHE", "MERGE", "PROFIT",
].filter((w) => w.length === 5);

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

export default function Bizdle() {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState(Array(6).fill(""));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing");

  const startNewGame = useCallback(() => {
    setTargetWord(BIZ_WORDS[Math.floor(Math.random() * BIZ_WORDS.length)]);
    setGuesses(Array(6).fill(""));
    setCurrentGuessIndex(0);
    setGameStatus("playing");
  }, []);

  useEffect(() => { startNewGame(); }, [startNewGame]);

  const handleKeyPress = useCallback((key) => {
    if (gameStatus !== "playing") return;
    setGuesses((prev) => {
      const newGuesses = [...prev];
      const currentGuess = newGuesses[currentGuessIndex];
      if (key === "BACKSPACE") {
        newGuesses[currentGuessIndex] = currentGuess.slice(0, -1);
      } else if (key === "ENTER") {
        if (currentGuess.length === 5) {
          if (currentGuess === targetWord) setGameStatus("won");
          else if (currentGuessIndex === 5) setGameStatus("lost");
          setCurrentGuessIndex((i) => i + 1);
        }
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        newGuesses[currentGuessIndex] = currentGuess + key;
      }
      return newGuesses;
    });
  }, [currentGuessIndex, gameStatus, targetWord]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toUpperCase();
      if (key === "BACKSPACE") handleKeyPress("BACKSPACE");
      else if (key === "ENTER") handleKeyPress("ENTER");
      else if (/^[A-Z]$/.test(key)) handleKeyPress(key);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  const getRowStatuses = (guess) => {
    if (!guess) return Array(5).fill("empty");
    const statuses = Array(5).fill("absent");
    const targetLetters = targetWord.split("");
    for (let i = 0; i < 5; i++) {
      if (guess[i] === targetLetters[i]) { statuses[i] = "correct"; targetLetters[i] = ""; }
    }
    for (let i = 0; i < 5; i++) {
      if (statuses[i] !== "correct" && targetLetters.includes(guess[i])) {
        statuses[i] = "present";
        targetLetters[targetLetters.indexOf(guess[i])] = "";
      }
    }
    return statuses;
  };

  const getKeyStatus = (key) => {
    let status = null;
    for (let i = 0; i < currentGuessIndex; i++) {
      const guess = guesses[i];
      const statuses = getRowStatuses(guess);
      for (let j = 0; j < 5; j++) {
        if (guess[j] === key) {
          const s = statuses[j];
          if (s === "correct") return "correct";
          if (s === "present") status = "present";
          if (s === "absent" && status === null) status = "absent";
        }
      }
    }
    return status;
  };

  return (
    <div className="flex flex-col items-center bg-theme-card-bg/60 p-4 sm:p-6 rounded-2xl border border-theme-border/60 shadow-sm w-full mx-auto">
      <div className="flex w-full justify-between items-center mb-4 px-2">
        <h3 className="text-lg font-bold text-theme-fg uppercase tracking-widest">Bizdle</h3>
        <span className="text-xs font-semibold text-theme-muted uppercase tracking-widest">MBA Wordle</span>
      </div>

      <div className="grid grid-rows-6 gap-1.5 mb-6">
        {guesses.map((guess, rowIndex) => {
          const isSubmitted = rowIndex < currentGuessIndex;
          const statuses = isSubmitted ? getRowStatuses(guess) : Array(5).fill("empty");
          return (
            <div key={rowIndex} className="grid grid-cols-5 gap-1.5">
              {Array(5).fill("").map((_, colIndex) => {
                const letter = guess[colIndex] || "";
                let bgColor = "bg-theme-bg border-theme-border shadow-sm";
                let textColor = "text-theme-fg";
                if (isSubmitted) {
                  const s = statuses[colIndex];
                  if (s === "correct") { bgColor = "bg-green-600 border-green-700 shadow-sm"; textColor = "text-white"; }
                  else if (s === "present") { bgColor = "bg-yellow-500 border-yellow-600 shadow-sm"; textColor = "text-white"; }
                  else { bgColor = "bg-theme-selection-bg border-theme-border shadow-sm"; textColor = "text-theme-muted"; }
                } else if (letter) {
                  bgColor = "bg-theme-bg border-theme-accent shadow-sm";
                }
                return (
                  <div key={colIndex} className={`w-10 h-10 sm:w-12 sm:h-12 border-2 flex items-center justify-center text-xl sm:text-2xl font-bold uppercase transition-colors duration-300 ${bgColor} ${textColor} rounded`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="w-full flex flex-col gap-1.5 mb-4 max-w-[300px] sm:max-w-none">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5 w-full">
            {row.map((key) => {
              const status = getKeyStatus(key);
              let keyBg = "bg-theme-selection-bg hover:bg-theme-border shadow-sm";
              let keyText = "text-theme-fg";
              if (status === "correct") { keyBg = "bg-green-600 border-green-700 shadow-sm"; keyText = "text-white"; }
              else if (status === "present") { keyBg = "bg-yellow-500 border-yellow-600 shadow-sm"; keyText = "text-white"; }
              else if (status === "absent") { keyBg = "bg-theme-bg opacity-60 border-theme-border shadow-sm"; keyText = "text-theme-muted"; }
              const isAction = key === "ENTER" || key === "BACKSPACE";
              return (
                <button key={key} onClick={() => handleKeyPress(key)}
                  className={`${isAction ? "px-2 sm:px-3 text-[10px] sm:text-xs" : "w-7 sm:w-9 text-xs sm:text-sm"} h-10 sm:h-12 rounded border border-theme-border/40 font-bold transition-colors flex items-center justify-center ${keyBg} ${keyText}`}>
                  {key === "BACKSPACE" ? "⌫" : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="h-8 flex items-center justify-center">
        {gameStatus === "won" ? (
          <span className="font-bold text-green-500 uppercase tracking-widest text-sm animate-pulse">You Win!</span>
        ) : gameStatus === "lost" ? (
          <span className="font-bold text-red-500 uppercase tracking-widest text-sm">Word was: {targetWord}</span>
        ) : (
          <span className="text-theme-muted uppercase tracking-widest text-[10px]">Guess the 5-letter business term</span>
        )}
      </div>

      {(gameStatus === "won" || gameStatus === "lost") && (
        <button onClick={startNewGame} className="mt-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-theme-border hover:border-theme-fg rounded-full transition-colors cursor-pointer">
          Play Again
        </button>
      )}
    </div>
  );
}
