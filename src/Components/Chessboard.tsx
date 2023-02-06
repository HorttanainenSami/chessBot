import React, { useState } from 'react';
import { Chessboard as Cb } from 'react-chessboard';
import { makeMove } from '../bot/moves';
import useChess, { IMoves } from '../GameLogic/useChess';
import { logger, bitPieces, getBitPiece } from '../GameLogic/helpers';
import { Square, Piece, Color } from '../Types';

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
  const {
    makeMove: chessMove,
    loadFEN,
    clearBoard,
    gameState,
    getFEN,
    moves,
  } = useChess();
  const [optionSquares, setOptionSquares] = useState({});
  //@ts-ignore: next-line
  function onDrop(
    sourceSquare: Square,
    targetSquare: Square,
    piece: Piece
  ): boolean {
    //convert piece to enum that reprecents pieces
    const bitPiece = getBitPiece(piece);
    const move = chessMove({
      from: sourceSquare,
      to: targetSquare,
      piece: bitPiece,
      promotion: 'q',
      color: piece.charAt(0) as Color,
    });

    return move;
  }
  function getMoveOptions(move: IMoves) {
    const legalMoves = moves(move);
    //if zero return null

    const newSquares = {};
    if (!legalMoves) return null;
    legalMoves.map((move) => {
      //@ts-ignore: next-line
      newSquares[move] = {
        background:
          'radial-gradient(circle, rgba(255,0,0,0.6) 95%, transparent 5%)',
        borderRadius: '50%',
      };
      return move;
    });
    //@ts-ignore: next-line
    newSquares[move.square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
  }

  const showMoves = (piece: Piece, sourceSquare: Square) => {
    console.log('dragged', piece, sourceSquare);
    const bitPiece =
      bitPieces[
        (piece.charAt(0) === 'b'
          ? piece.charAt(1).toLowerCase()
          : piece.charAt(1).toLocaleUpperCase()) as keyof typeof bitPieces
      ];
    //@ts-ignore:next-line
    getMoveOptions({
      square: sourceSquare,
      piece: bitPiece,
      color: piece.charAt(0) as Color,
    });
  };

  return (
    <div style={boardWrapper}>
      <div>{getFEN()}</div>
      <Cb
        id='PlayVsRandom'
        position={getFEN()}
        onPieceDrop={onDrop}
        onPieceDragBegin={showMoves}
        onPieceDragEnd={() => setOptionSquares([])}
        customSquareStyles={{ ...optionSquares }}
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
          loadFEN(
            'rnbqkbnr/p1p1pppp/1p6/2Pp4/8/8/PP1P4/RNBQKBNR w KQkq d6 0 3'
          );
          //loadFEN('knBq1bnB/Q3pppp/1rp4K/2bN4/2B3R1/N3p2N/PPPPPPPR/BNBQ1BNB w - - 0 1');
        }}
      >
        loadFen
      </button>
    </div>
  );
};

export default Chessboard;
