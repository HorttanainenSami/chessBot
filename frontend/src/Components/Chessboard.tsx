import React, { useState } from 'react';
import { Chessboard as Cb } from 'react-chessboard';
import useChess, { IMoves, getBitIndexes } from '../GameLogic/useChess';
import {
  logger,
  bitPieces,
  getBitPiece,
  SquareBit,
} from '../GameLogic/helpers';
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
    loadFEN,
    getFen,
    moves,
    isCheck,
    isMate,
    turn,
    makeMove: chessMove,
    clearBoard,
  } = useChess();
  const [optionSquares, setOptionSquares] = useState({});
  const [currentTimeout, setCurrentTimeout] = useState<NodeJS.Timeout>();
  function onDrop(
    sourceSquare: Square,
    targetSquare: Square,
    piece: Piece
  ): boolean {
    //convert piece to enum that reprecents pieces
    const bitPiece = getBitPiece(piece);
    const result = chessMove({
      from: sourceSquare,
      to: targetSquare,
      piece: bitPiece,
      promotion: 'q',
      color: piece.charAt(0) as Color,
    });

    return result;
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
      <div>{getFen}</div>
      <div style={{ position: 'relative' }}>
        {isMate && <MateBanner clearBoard={clearBoard} turn={turn} />}

        <Cb
          id='PlayVsRandom'
          position={getFen}
          onPieceDrop={onDrop}
          onPieceDragBegin={showMoves}
          onPieceDragEnd={() => setOptionSquares([])}
          customSquareStyles={{ ...optionSquares }}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
      {!isMate && isCheck && <CheckBanner turn={turn} />}
      <div>
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
          onClick={() =>
            loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0 1')
          }
        >
          loadpawnEat
        </button>
        <button
          style={buttonStyle}
          onClick={() =>
            loadFEN(
              'rnbqkbnr/ppp3pp/8/3p4/4Bp2/4Q3/PPPP4/RNB1K1NR w KQkq d6 0 4'
            )
          }
        >
          loadFen
        </button>
        <button
          style={buttonStyle}
          onClick={() =>
            loadFEN(
              'knBq1bnB/Q3pppp/1rp4K/2bN4/2B3R1/N3p2N/PPPPPPPR/BNBQ1BNB w - - 0 1'
            )
          }
        >
          loadFen
        </button>
        <button
          style={buttonStyle}
          onClick={() =>
            loadFEN('3r4/1b3b2/2pp4/rP1b3q/4R3/1b1P4/6b1/3q4 w KQkq d6 0 3')
          }
        >
          loadFen
        </button>
        <button
          style={buttonStyle}
          onClick={() =>
            loadFEN(
              'rQq1Qpnr/pp4Bp/1p1bbb2/Q1Pbkb1R/3bbb2/8/PP2PPPB/QN1QKPNR w K d6 0 3'
            )
          }
        >
          loadFen
        </button>
        <button
          style={buttonStyle}
          onClick={() =>
            loadFEN(
              'rQq3nr/pp2p1Bp/1p1b1b2/P3k3/3b1b2/8/PP2PPPB/QN1QKPNR w K d6 0 3'
            )
          }
        >
          loadFen
        </button>
        <button
          style={buttonStyle}
          onClick={() =>
            loadFEN(
              'rnbqkbnr/p1p1pppp/1p6/2Pp4/8/8/PP1P4/RNBQKBNR w KQkq d6 0 3'
            )
          }
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
          onClick={() => loadFEN('qqqqqqqq/8/8/8/2K5/2B5/8/qqq4k w - d6 0 3')}
        >
          loadFen
        </button>
        <button
          style={buttonStyle}
          onClick={() => loadFEN('r3k2r/8/8/5R2/8/8/8/R3K2R w KQkq - 0 1')}
        >
          loadFen
        </button>
      </div>
    </div>
  );
};
const CheckBanner = ({ turn }: { turn: Color }) => {
  const beingChecked = turn === 'b' ? 'Black' : 'White';

  return (
    <div>
      <p>{`${beingChecked} is in trouble`}</p>
    </div>
  );
};
const MateBanner = ({
  turn,
  clearBoard,
}: {
  clearBoard: () => void;
  turn: Color;
}) => {
  const beingChecked = turn === 'b' ? 'Black' : 'White';

  return (
    <>
      <div
        style={{
          padding: '50px',
          position: 'absolute',
          backgroundColor: 'black',
          width: '86%',
          height: '86%',
          opacity: 0.2,
          zIndex: 10,
        }}
      />
      <div
        style={{
          padding: '50px',
          backgroundColor: 'beige',
          zIndex: 20,
          position: 'absolute',
          width: '150px',
          height: '140px',
          left: '25%',
          top: '25%',
          borderRadius: '25px',
        }}
      >
        <p>{`${beingChecked} lost in check mate`}</p>
        <button
          style={buttonStyle}
          onClick={() => {
            clearBoard();
          }}
        >
          New game
        </button>
      </div>
    </>
  );
};

export default Chessboard;
