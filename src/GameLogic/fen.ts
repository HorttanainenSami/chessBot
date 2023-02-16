import Long from 'long';
import { SquareBit, bitPieces, checkBitAt, isNumeric } from './helpers';
import { setFEN, getState } from './gameStateChanger';

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
        newGame[0] = newGame[0].or(bitOperator);
        break;
      case 'p':
        newGame[1] = newGame[1].or(bitOperator);
        break;
      case 'R':
        newGame[2] = newGame[2].or(bitOperator);
        break;
      case 'r':
        newGame[3] = newGame[3].or(bitOperator);
        break;
      case 'B':
        newGame[4] = newGame[4].or(bitOperator);
        break;
      case 'b':
        newGame[5] = newGame[5].or(bitOperator);
        break;
      case 'N':
        newGame[6] = newGame[6].or(bitOperator);
        break;
      case 'n':
        newGame[7] = newGame[7].or(bitOperator);
        break;
      case 'Q':
        newGame[8] = newGame[8].or(bitOperator);
        break;
      case 'q':
        newGame[9] = newGame[9].or(bitOperator);
        break;
      case 'K':
        newGame[10] = newGame[10].or(bitOperator);
        break;
      case 'k':
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
  return getState();
};

export const getFEN = () => {
  const { gameState, turn, castling, elPassant, halfMove, fullMove } =
    getState();
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
