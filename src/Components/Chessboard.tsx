import React, { useState } from 'react';
import { Chessboard as Cb } from 'react-chessboard';
import { makeMove } from '../bot/moves';
import useChess from '../GameLogic/useChess';
import { bitPieces} from '../GameLogic/helpers';
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
  //@ts-ignore: next-line

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

    // if illegal move
    // return false

    return true;
  }

  return (
    <div style={boardWrapper}>
      <div>
        {getFEN()}
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
          loadFEN('rnbqkbnr/p3pppp/4p3/8/2p3R1/8/PPPPPPPR/RNBQKBN1 w - - 0 1');
        }}
      >
        loadFen
      </button>
    </div>
  );
};


export default Chessboard;
