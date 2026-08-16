import { useState, useEffect } from "react";

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = checkWinner(board);
  const isDraw = !winner && board.every((sq) => sq !== null);

  useEffect(() => {
    if (!isXNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        const emptyIndices = board.map((sq, i) => (sq === null ? i : null)).filter((i) => i !== null);
        if (emptyIndices.length > 0) {
          let move = -1;
          for (const i of emptyIndices) {
            const temp = [...board]; temp[i] = "O";
            if (checkWinner(temp) === "O") { move = i; break; }
          }
          if (move === -1) {
            for (const i of emptyIndices) {
              const temp = [...board]; temp[i] = "X";
              if (checkWinner(temp) === "X") { move = i; break; }
            }
          }
          if (move === -1) move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const newBoard = [...board];
          newBoard[move] = "O";
          setBoard(newBoard);
          setIsXNext(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, board, winner, isDraw]);

  const handleClick = (index) => {
    if (board[index] || winner || !isXNext) return;
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsXNext(false);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex flex-col items-center bg-theme-card-bg/60 p-6 rounded-2xl border border-theme-border/60 shadow-sm">
      <h3 className="text-lg font-bold text-theme-fg mb-4 uppercase tracking-widest">Tic-Tac-Toe</h3>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`w-16 h-16 text-2xl font-bold rounded-xl transition-all duration-300 flex items-center justify-center shadow-sm
              ${!cell && !winner ? "hover:bg-theme-selection-bg hover:border-theme-accent/30 cursor-pointer bg-theme-bg border-2 border-theme-border" : "bg-theme-bg border-2 border-theme-border/60 cursor-default"}
              ${cell === "X" ? "text-theme-accent" : "text-theme-muted"}`}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="h-8 flex items-center justify-center">
        {winner ? (
          <span className="font-bold text-theme-accent uppercase tracking-widest text-sm animate-pulse">
            {winner === "X" ? "You Win!" : "Computer Wins!"}
          </span>
        ) : isDraw ? (
          <span className="font-bold text-theme-muted uppercase tracking-widest text-sm">It&apos;s a Draw!</span>
        ) : (
          <span className="text-theme-muted uppercase tracking-widest text-xs font-semibold">
            {isXNext ? "Your Turn (X)" : "Computer (O) is thinking..."}
          </span>
        )}
      </div>
      <button
        onClick={resetGame}
        className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-theme-border hover:border-theme-fg rounded-full transition-colors cursor-pointer"
      >
        Restart
      </button>
    </div>
  );
}
