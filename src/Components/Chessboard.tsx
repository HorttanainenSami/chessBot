import React, { useState } from 'react';
import { Chessboard as Cb } from 'react-chessboard';
import { makeMove } from '../bot/moves';
import useChess, { IMoves } from '../GameLogic/useChess';
import { logger, bitPieces, getBitPiece } from '../GameLogic/helpers';
import Long from 'long';
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
    isCheck,
    getFEN,
    moves,
    turn,
    isMate,
    checkingRays
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
      {(!isMate &&isCheck) && <CheckBanner turn={turn} />}
      {isMate && <MateBanner turn={turn} />}
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
        onClick={() => loadFEN('rnbqkbnr/pppp2pp/8/8/4Bp2/8/PPPPQ3/RNB1K1NR w KQkq d6 0 3')}
      >
        loadFen
      </button>
      <button
        style={buttonStyle}
        onClick={() =>loadFEN('knBq1bnB/Q3pppp/1rp4K/2bN4/2B3R1/N3p2N/PPPPPPPR/BNBQ1BNB w - - 0 1')}
      >
        loadFen
      </button>
      <button
        style={buttonStyle}
        onClick={() =>loadFEN( '3r4/1b3b2/2pp4/rP1b3q/4R3/1b1P4/6b1/3q4 w KQkq d6 0 3')}
      >
        loadFen
      </button>
      <button
        style={buttonStyle}
        onClick={() => loadFEN( 'rQq1Qpnr/pp4Bp/1p1bbb2/Q1Pbkb1R/3bbb2/8/PP2PPPB/QN1QKPNR w KQkq d6 0 3')}
      >
        loadFen
      </button>
      <button
        style={buttonStyle}
        onClick={() =>loadFEN( 'rQq3nr/pp2p1Bp/1p1b1b2/P3k3/3b1b2/8/PP2PPPB/QN1QKPNR w KQkq d6 0 3')}
      >
        loadFen
      </button>
      <button
        style={buttonStyle}
        onClick={() => loadFEN('rnbqkbnr/p1p1pppp/1p6/2Pp4/8/8/PP1P4/RNBQKBNR w KQkq d6 0 3')}
      >
        loadFen
      </button>
      <button
        style={buttonStyle}
        onClick={() => loadFEN('8/8/8/8/4Bb2/8/8/8 w KQkq d6 0 3')}
      >
        loadFen
      </button>
      <button
        style={buttonStyle}
        onClick={() =>loadFEN( '8/8/8/8/2K5/2B5/8/2r4k w KQkq d6 0 3')}
      >
        loadFen
      </button>

    </div>
  );
};
const CheckBanner = ({turn}: {turn: Color}) => {
  const beingChecked = turn ==='b'
    ?'Black'
    :'White';

  return (
    <div>
      <p>{`${beingChecked} is in trouble`}</p>
    </div>
  );
};
const MateBanner = ({turn}: { turn: Color}) => {
  const beingChecked = turn ==='b'
    ?'Black'
    :'White';

  return (
    <div>
      <p>{`${beingChecked} lost in check mate`}</p>
    </div>
  );
};

export default Chessboard;
