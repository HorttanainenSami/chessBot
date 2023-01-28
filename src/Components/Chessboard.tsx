import React, { useState } from 'react';
import { Chessboard as Cb } from 'react-chessboard';
import { Chess } from 'chess.js';
import { makeMove } from '../bot/moves';
import useChess, { bitPieces } from '../GameLogic/useChess';
import { Square, Piece } from '../Types';

const buttonStyle = {
  cursor: 'pointer',
  padding: '10px 20px',
  margin: '10px 10px 0px 0px',
  borderRadius: '6px',
  backgroundColor: '#f0d9b5',
  border: 'none',
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)',
};

const boardWrapper = {
  width: '70vw',
  maxWidth: '70vh',
  margin: '3rem auto',
};

const Chessboard = () => {
  const { makeMove: chessMove, loadFEN, clearBoard, gameState, getFEN } = useChess();
  const [game, setGame] = useState(new Chess());
  const [currentTimeout, setCurrentTimeout] = useState<NodeJS.Timeout|undefined>();
  //@ts-ignore: next-line
  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  function makeRandomMove() {
    const possibleMoves = game.moves();
    const positionsInFen = game.fen();

    // exit if the game is over
    if (game.game_over() || game.in_draw() || possibleMoves.length === 0) return;

    const botNextMove = makeMove({ possibleMoves, positionsInFen });
    //@ts-ignore: next-line
    safeGameMutate((game) => {
      game.move(botNextMove);
    });
  }
  //@ts-ignore: next-line
  function onDrop(sourceSquare: Square, targetSquare: Square, piece: Piece) : boolean {
    //convert piece to enum that reprecents pieces
    const bitPiece = bitPieces[(piece.charAt(0)==='b'?piece.charAt(1).toLowerCase():piece.charAt(1).toLocaleUpperCase())as keyof typeof bitPieces];
    const move1 = chessMove({
      from: sourceSquare,
      to: targetSquare,
      piece: bitPiece,
      promotion:'q',
      color: piece.charAt(0) === 'b'? 'black': 'white',
    });
    const gameCopy = { ...game };
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to a queen for example simplicity
    });
    setGame(gameCopy);

    // illegal move
    if (move === null) return false;

    // store timeout so it can be cleared on undo/reset so computer doesn't execute move
    const newTimeout = setTimeout(makeRandomMove, 200);
    setCurrentTimeout(newTimeout);
    return true;
  }

  return (
    <div style={boardWrapper}>
      <div>
        {getFEN()}
      </div>
      <div>
        {game.fen()}
      </div>
      <Cb
        id="PlayVsRandom"
        position={getFEN()}
        onPieceDrop={onDrop}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
        }}
      />
      
      <button
        style={buttonStyle}
        onClick={() => {
          //@ts-ignore: next-line
          clearBoard();
        }}
      >
        clear
      </button>
      <button
        style={buttonStyle}
        onClick={() => {
          loadFEN('rnbqkbnr/p3pppp/4p3/8/2p3Rp/8/PPPPPPPR/RNBQKBN1 w - - 0 1');
        }}
      >
        loadFen
      </button>
      <button
        style={buttonStyle}
        onClick={() => {
          //@ts-ignore: next-line
          safeGameMutate((game) => {
            game.undo();
          });
          clearTimeout(currentTimeout);
        }}
      >
        undo
      </button>
    </div>
  );
};


export default Chessboard;