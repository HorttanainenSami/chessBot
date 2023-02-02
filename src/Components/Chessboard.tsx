import React, { useState } from 'react';
import { Chessboard as Cb } from 'react-chessboard';
import { makeMove } from '../bot/moves';
import useChess, { IMoves } from '../GameLogic/useChess';
import { logger, bitPieces} from '../GameLogic/helpers';
import { Square, Piece, Color } from '../Types';
import Long from 'long';

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
  const { makeMove: chessMove, loadFEN, clearBoard, gameState, getFEN, moves } = useChess();
  const [optionSquares, setOptionSquares] = useState({});
  //@ts-ignore: next-line
  function onDrop(sourceSquare: Square, targetSquare: Square, piece: Piece) : boolean {
    //convert piece to enum that reprecents pieces
    const bitPiece = bitPieces[(piece.charAt(0)==='b'?piece.charAt(1).toLowerCase():piece.charAt(1).toLocaleUpperCase())as keyof typeof bitPieces];
    const move1 = chessMove({
      from: sourceSquare,
      to: targetSquare,
      piece: bitPiece,
      promotion:'q',
      color: piece.charAt(0) as Color,
    });

    // if illegal move
    // return false

    return true;
  }
  function getMoveOptions(move:IMoves) {
    const legalMoves = moves(move);
    //if zero return null

    const newSquares = {};
    if(!legalMoves) return null;
    legalMoves.map((move) => {
      //@ts-ignore: next-line
      newSquares[move] = {
        background: 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)',
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
    const bitPiece = bitPieces[(piece.charAt(0)==='b'?piece.charAt(1).toLowerCase():piece.charAt(1).toLocaleUpperCase())as keyof typeof bitPieces];
    //@ts-ignore:next-line
    getMoveOptions ({
      square: sourceSquare,
      piece: bitPiece,
      color: piece.charAt(0) as Color
    });
  };

  return (
    <div style={boardWrapper}>
      <div>
        {getFEN()}
      </div>
      <Cb
        id="PlayVsRandom"
        position={getFEN()}
        onPieceDrop={onDrop}
        onPieceDragBegin={showMoves}
        onPieceDragEnd={() => setOptionSquares([])}
        customSquareStyles={{...optionSquares}}
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
          loadFEN('BnBqkbnB/Q3pppp/3rp3/2Qq4/2Q3R1/4p3/PPPPPPPR/BNBQKBNB w - - 0 1');
        }}
      >
        loadFen
      </button>
    </div>
  );
};


export default Chessboard;
