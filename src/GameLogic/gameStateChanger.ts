import Long from 'long';
import { Color, Move } from '../Types';
import {
  gameState,
  setFEN,
  turn,
  castling,
  elPassant,
  halfMove,
  fullMove,
  setElPassant,
  setFullMove,
  setHalfMove,
  setTurn,
  changeGameState,
  pawnLegalMoves,
  kingLegalMoves,
  rookLegalMoves,
  bishopLegalMoves,
  knightPseudoMoves,
  mate,
} from './move';
import { SquareBit, isNumeric, checkBitAt, bitPieces } from './helpers';

export const loadFEN = (Fen: string) => {
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
  const newGame: Long[] = Array(12).fill(Long.UZERO);

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
  setFEN(
    newGame,
    SquareBit[fElPassant],
    fcastling,
    Number(fhalfMoves),
    Number(ffullMoves),
    fturn
  );
  return newGame;
};

export const getFEN = () => {
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
  if ((piece === 1 || piece === 0) && (fromBitIndex - toBitIndex) % 16 === 0) {
    const elPassantSquare = color === 'w' ? fromBitIndex + 8 : fromBitIndex - 8;
    setElPassant(elPassantSquare);
  } else {
    setElPassant(null);
  }

  //final state changes
  let modifiedGameState = gameState;
  const newTurn = turn === 'b' ? 'w' : 'b';
  if (deletedPieces) {
    modifiedGameState[deletedPieces.i] = deletedPieces.pieces;
  }
  modifiedGameState[piece] = moveBoard;

  changeGameState(modifiedGameState);
  //set if pawn moved or piece captured to 0 otherwise increment
  if (piece === 1 || piece === 0 || deletedPieces) {
    setHalfMove(0);
  } else {
    setHalfMove(halfMove + 1);
  }

  if (turn === 'b') {
    setFullMove(fullMove + 1);
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
export const makeMove = (props: Move) => {
  if (props.color !== turn) return false;

  return updateGameState(props);
};

export const getMoves = (color: Color) => {
  const blackOccupiedBits = gameState.reduce((acc, curr, i) => {
    if (i % 2 === 0) return acc;
    return acc.or(curr);
  }, Long.UZERO);
  const occupiedBits = gameState.reduce(
    (acc, curr) => acc.or(curr),
    Long.UZERO
  );
  const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
  const colorHelper = color === 'w' ? 0 : 1;
  const array = Array(64).fill(Long.UZERO);
  for (let piece = colorHelper; piece <= 11; piece += 2) {
    let pieces = gameState[piece];
    while (!pieces.isZero()) {
      const fromBitIndex = pieces.countTrailingZeros();
      const legalMove = move({
        fromBitIndex,
        piece,
        color,
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
      });

      array[fromBitIndex] = legalMove;
      pieces = pieces.and(Long.UONE.shl(fromBitIndex).not());
    }
  }
  return array;
};

const move = ({
  fromBitIndex,
  piece,
  color,
  blackOccupiedBits,
  occupiedBits,
  whiteOccupiedBits,
}: Imove): Long => {
  if (mate) return Long.UZERO;
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
        color,
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
      const legalMoves = kingLegalMoves({
        fromBitIndex,
        occupiedBits,
        enemyOccupied: blackOccupiedBits,
        teammateOccupied: whiteOccupiedBits,
        color,
      });
      // TODO add here also defended squares filter
      return legalMoves;
    }
    case 11: {
      const legalMoves = kingLegalMoves({
        fromBitIndex,
        occupiedBits,
        enemyOccupied: whiteOccupiedBits,
        teammateOccupied: blackOccupiedBits,
        color,
      });
      // TODO add here also defended squares filter
      return legalMoves;
    }
    default:
      return new Long(0, 0, true);
  }
};
interface Imove extends IMoves {
  blackOccupiedBits: Long;
  whiteOccupiedBits: Long;
  occupiedBits: Long;
  fromBitIndex: number;
}
export interface IMoves {
  piece: bitPieces;
  color: Color;
}
