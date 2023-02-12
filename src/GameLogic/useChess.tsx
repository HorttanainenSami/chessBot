import React, { useState } from 'react';
import Long from 'long';
import { bitPieces, SquareBit, logger, isNumeric, checkBitAt } from './helpers';
import { Square, Move, Color } from '../Types';

import useMove from './useMove';

export interface IMoves {
  square: Square;
  piece: bitPieces;
  color: Color;
}
const useChess = () => {
  // save gamestate as bitboard
  const {
    gameState,
    changeGameState,
    pawnLegalMoves,
    rookLegalMoves,
    bishopLegalMoves,
    checkingRays,
    knightPseudoMoves,
    kingLegalMoves,
    checked,
    elPassant,
    setElPassant,
    mate,
  } = useMove();
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  //checks if castling is possible '' means not possible
  const [castling, setCastling] = useState('KQkq');
  // can be used to set tie if reaches to 50
  const [halfMove, setHalfMove] = useState(0);
  const [fullMove, setFullMove] = useState(1);

  // returns all valid moves in Move[]
  // optional parameter /square/: Only return moves of given piece
  const moves = (p: IMoves | null) => {
    // determine if wanted all moves for color that is next in turn
    if (p === null) {
      return;
    }
    //wanted specific piece
    const legalMoves = move(p);
    //turn table for squareNotation array
    const algebricNotation = getBitIndexes(legalMoves);
    return algebricNotation;
  };
  //TODO to check discovered check and prevent movement if it occurs
  interface Imove extends IMoves {
    blackOccupiedBits?: Long;
    whiteOccupiedBits?: Long;
    occupiedBits?: Long;
    fromBitIndex?: number;
  }
  const move = ({
    square,
    piece,
    color,
    fromBitIndex = SquareBit[square],
    blackOccupiedBits = gameState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, new Long(0, 0, true)),
    occupiedBits = gameState.reduce(
      (acc, curr) => acc.or(curr),
      new Long(0x0, 0x0, true)
    ),
    whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits),
  }: Imove): Long => {
    if(mate) return Long.UZERO;
    switch (piece) {
      case 0: {
        const legalMoves = pawnLegalMoves({
          fromBitIndex,
          color,
          enemyOccupied: blackOccupiedBits,
          occupiedSquares: occupiedBits,
        });
        return legalMoves;
      }
      case 1: {
        const legalMoves = pawnLegalMoves({
          fromBitIndex,
          color,
          enemyOccupied: whiteOccupiedBits,
          occupiedSquares: occupiedBits,
        });
        return legalMoves;
      }
      case 2: {
        const legalMoves = rookLegalMoves({
          fromBitIndex,
          occupiedBits,
          teammateOccupiedBits: whiteOccupiedBits,
          color,
        });
        return legalMoves;
      }
      case 3: {
        const legalMoves = rookLegalMoves({
          fromBitIndex,
          occupiedBits,
          teammateOccupiedBits: blackOccupiedBits,
          color,
        });
        return legalMoves;
      }
      case 4: {
        return bishopLegalMoves({
          occupiedBits,
          fromBitIndex,
          teammateOccupiedBits: whiteOccupiedBits,
          color,
        });
      }
      case 5: {
        return bishopLegalMoves({
          occupiedBits,
          fromBitIndex,
          teammateOccupiedBits: blackOccupiedBits,
          color,
        });
      }
      case 6: {
        const pseudoMoves = knightPseudoMoves({ fromBitIndex });
        const legalMoves = pseudoMoves.and(whiteOccupiedBits.not());
        return legalMoves;
      }
      case 7: {
        const pseudoMoves = knightPseudoMoves({ fromBitIndex });
        const legalMoves = pseudoMoves.and(blackOccupiedBits.not());
        return legalMoves;
      }
      case 8: {
        const diagonalLegalMoves = bishopLegalMoves({
          occupiedBits,
          fromBitIndex,
          teammateOccupiedBits: whiteOccupiedBits,
          color,
        });
        const RlegalMoves = rookLegalMoves({
          fromBitIndex,
          occupiedBits,
          teammateOccupiedBits: whiteOccupiedBits,
          color
        });
        return diagonalLegalMoves.or(RlegalMoves);
      }
      case 9: {
        const diagonalLegalMoves = bishopLegalMoves({
          occupiedBits,
          fromBitIndex,
          teammateOccupiedBits: blackOccupiedBits,
          color,
        });

        const RlegalMoves = rookLegalMoves({
          fromBitIndex,
          occupiedBits,
          teammateOccupiedBits: blackOccupiedBits,
          color,
        });
        return diagonalLegalMoves.or(RlegalMoves);
      }
      case 10: {
        const legalMoves = kingLegalMoves({fromBitIndex, occupiedBits, enemyOccupied:blackOccupiedBits});
        // TODO add here also defended squares filter
        return legalMoves;
      }
      case 11: {
        const legalMoves = kingLegalMoves({fromBitIndex, occupiedBits, enemyOccupied:whiteOccupiedBits});
        // TODO add here also defended squares filter
        return legalMoves;
      }
      default:
        return new Long(0, 0, true);
    }
  };
  const updateGameState = ({ piece, color, from, to }: Move) => {
    const toBitIndex = SquareBit[to];
    const fromBitIndex = SquareBit[from];
    let moveBoard = gameState[piece] as Long;
    //update moved piece
    const toMask = Long.UONE.shiftLeft(toBitIndex);
    const fromMask = Long.UONE.shiftLeft(fromBitIndex);
    moveBoard = moveBoard.and(fromMask.not());
    moveBoard = moveBoard.or(toMask);
    //remove captured pieces
    const elPassantCapture = checkIfElpassant(toBitIndex, piece);
    const deletedPieces = elPassantCapture
      ? removeCapturedPiece(elPassantCapture.square, color)
      : removeCapturedPiece(toBitIndex, color);
    //promote pawn
    //set check or mate
    //set/remove elpassant
    if (
      (piece === 1 || piece === 0) &&
      (fromBitIndex - toBitIndex) % 16 === 0
    ) {
      const elPassantSquare =
        color === 'w' ? fromBitIndex + 8 : fromBitIndex - 8;
      setElPassant(elPassantSquare);
    } else {
      setElPassant(null);
    }

    //final state changes
    let modifiedGameState = gameState;
    const newTurn = turn === 'b'? 'w':'b';
    if (deletedPieces) {
      modifiedGameState[deletedPieces.i] = deletedPieces.pieces;
    }
    modifiedGameState[piece] = moveBoard;

    changeGameState(modifiedGameState, newTurn );
    //set if pawn moved or piece captured to 0 otherwise increment
    if (piece === 1 || piece === 0 || deletedPieces) {
      setHalfMove(0);
    } else {
      setHalfMove((r) => (r += 1));
    }

    if (turn === 'b') {
      setFullMove((r) => (r += 1));
    }
    setTurn(newTurn);
  };
  const checkIfElpassant = (toBitIndex: number, piece: bitPieces) => {
    // check if moved piece is pawn and its moved to elpassant square
    if (toBitIndex === elPassant && (piece === 0 || piece === 1)) {
      const rank = ~~(toBitIndex / 8);
      if (rank === 2) {
        return {
          square: toBitIndex + 8,
        };
      } else if (rank === 5) {
        return {
          square: toBitIndex - 8,
        };
      }
    }
  };
  const removeCapturedPiece = (fromBitIndex: number, color: Color) => {
    // white pieces is even and black odd in gamestate Array so we need to set this even for black odd
    const forHelper = color === 'w' ? 1 : 0;
    const capturedPiece = Long.UONE.shiftLeft(fromBitIndex);
    //logger(capturedPiece);
    //logger(capturedPiece);
    for (let i = forHelper; i < gameState.length; i += 2) {
      let pieces = gameState[i] as Long;
      //logger(pieces);
      //logger(capturedPiece.and(pieces));
      if (!capturedPiece.and(pieces).isZero()) {
        pieces = pieces.and(capturedPiece.not());
        //logger(pieces);
        return { i, pieces };
      }
    }
  };
  // Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
  const makeMove = (props: Move) => {
    const { piece, color, from, to } = props;
    const obj = {
      square: from,
      color,
      piece,
    };
    if (color !== turn) {
      return false;
    }
    const toBitIndex = SquareBit[to];
    const targetMask = Long.UONE.shiftLeft(toBitIndex);
    const validate = !move(obj).and(targetMask).isZero();
    if (validate) {
      updateGameState(props);
      return true;
    }
    return false;
  };
  // returns true if move is legal to perform
  // checked only when makeMove is performed
  const loadFEN = (Fen: string) => {
    const splittedFen = Fen.split(' ');
    if (splittedFen.length != 6) throw new Error('Fen not in correct form');

    const fstate = splittedFen[0] as string;
    const fturn = splittedFen[1] as 'w' | 'b';
    const fcastling = splittedFen[2] as string;
    const fElPassant = splittedFen[3] as keyof typeof SquareBit;
    const fhalfMoves = splittedFen[4] as string;
    const ffullMoves = splittedFen[5] as string;

    if (!isNumeric(ffullMoves))
      throw new Error('Fen fullMoves notated incorrectly');
    if (!isNumeric(fhalfMoves))
      throw new Error('Fen halfMoves notated incorrectly');

    //iterate fen
    type PieceIteration = {
      piece: string;
      bitIndex: number;
    };
    type emptyIteration = {
      zeros: number;
      bitIndex: number;
    };
    const newGame = Array(12).fill(new Long(0, 0, true));

    const iterator = (prop: PieceIteration | emptyIteration) => {
      //add either 1 or multiple 0's
      if ('zeros' in prop) {
        return;
      }

      const { piece, bitIndex } = prop;
      const bitOperator = new Long(1, 0x0, true).shiftLeft(bitIndex);
      switch (piece) {
        case 'P':
          //0
          newGame[0] = newGame[0].or(bitOperator);
          break;
        case 'p':
          //1
          newGame[1] = newGame[1].or(bitOperator);
          break;
        case 'R':
          //2
          newGame[2] = newGame[2].or(bitOperator);
          break;
        case 'r':
          //3
          newGame[3] = newGame[3].or(bitOperator);
          break;
        case 'B':
          //4
          newGame[4] = newGame[4].or(bitOperator);
          break;
        case 'b':
          //5
          newGame[5] = newGame[5].or(bitOperator);
          break;
        case 'N':
          //6
          newGame[6] = newGame[6].or(bitOperator);
          break;
        case 'n':
          //7
          newGame[7] = newGame[7].or(bitOperator);
          break;
        case 'Q':
          //8
          newGame[8] = newGame[8].or(bitOperator);
          break;
        case 'q':
          //9
          newGame[9] = newGame[9].or(bitOperator);
          break;
        case 'K':
          //10
          newGame[10] = newGame[10].or(bitOperator);
          break;
        case 'k':
          //11
          newGame[11] = newGame[11].or(bitOperator);
          break;
      }
    };
    let i = 63;
    for (let c of fstate) {
      if (c === '/') {
        continue;
      }
      if (isNumeric(c)) {
        iterator({ zeros: Number(c), bitIndex: i });
        i -= Number(c);
        continue;
      } else {
        iterator({ piece: c, bitIndex: i });
      }
      i--;
    }
    setTurn(fturn);
    changeGameState(newGame, turn);
    setHalfMove(Number(fhalfMoves));
    setFullMove(Number(ffullMoves));
    setElPassant(SquareBit[fElPassant]);
    setCastling(fcastling);

    return newGame;
  };

  const clearBoard = () =>
    changeGameState(new Array(12).fill(new Long(0x0, 0x0, true)), turn);

  //returns FEN notation of gamestate. Useful for testing
  const getFEN = () => {
    let Fen = '';
    const pieceBitboard = gameState.reduce(
      (acc, curr) => acc.or(curr),
      new Long(0x0, 0x0, true)
    );

    for (let idx = 8; idx > 0; idx--) {
      let empty = 0;
      for (let i = 7; i >= 0; i--) {
        const bitIndex = idx * 8 - (8 - i);
        if (!checkBitAt(pieceBitboard, bitIndex)) {
          empty++;
          continue;
        }

        //should check what bitboard contains 1 bit at bitIndex and add it to FEN string
        if (empty !== 0) {
          Fen = Fen.concat(empty.toString());
          empty = 0;
        }
        for (let x = 0; x < gameState.length; x++) {
          const bitBoard = gameState[x] as Long;
          if (!checkBitAt(bitBoard, bitIndex)) {
            continue;
          }
          const piece = bitPieces[x];
          if (!piece) throw new Error(`piece ${x} not found`);
          Fen = Fen.concat(piece);
          break;
        }
      }

      if (empty !== 0) {
        Fen = Fen.concat(empty.toString());
      }

      if (idx === 1) {
        break;
      }
      Fen = Fen.concat('/');
    }
    return Fen.concat(
      ` ${turn} ${castling} ${
        elPassant === null ? '-' : Object.values(SquareBit)[elPassant]
      } ${halfMove} ${fullMove}`
    );
  };

  return {
    loadFEN,
    clearBoard,
    getFEN,
    moves,
    gameState,
    makeMove,
    move,
    fullMove,
    turn,
    updateGameState,
    isCheck:checked,
    isMate:mate,
    checkingRays,
  };
};
const getBitIndexes = (bitString: Long) => {
  let algebricNotation: string[] = [];
  const bit = bitString.toString(2);

  for (let i = bit.length - bitString.countTrailingZeros(); i >= 0; i--) {
    const hexAtI = bit.charAt(i);
    switch (hexAtI) {
      case '1': {
        algebricNotation = [
          ...algebricNotation,
          SquareBit[bit.length - i - 1] as string,
        ];
        break;
      }
    }
  }

  return algebricNotation;
};
export default useChess;
