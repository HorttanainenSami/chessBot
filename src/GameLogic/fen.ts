import Long from 'long';
import { SquareBit, bitPieces, checkBitAt, isNumeric } from './helpers';
import { setFEN, getState } from './gameStateChanger';
import z from 'zod';
import { sortAndDeduplicateDiagnostics } from 'typescript';
import { Color, Square } from '../Types';

/**
 * Load gamestate that reprecents FEN notations board state
 * @param Fen {string} FEN notation of boardstate
 * @returns new state of game
 */
export const loadFEN = (Fen: string) => {
  const { state, turn, castling, elPassant, halfMoves, fullMoves } =
    parseFen.parse(Fen);

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
    const bitOperator = Long.UONE.shiftLeft(bitIndex);
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
  for (let c of state) {
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
    SquareBit[elPassant],
    castling,
    Number(halfMoves),
    Number(fullMoves),
    turn
  );
  return getState();
};
/**
 *  get Fen of current gamestate
 * @returns {string} returns FEN from gamestate
 */
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
      !elPassant ? '-' : Object.values(SquareBit)[elPassant]
    } ${halfMove} ${fullMove}`
  );
};

/**
 * parse frontend FEN input to be in correct form
 */
const parseFen = z.string().transform((val, ctx) => {
  const splitted = val.split(' ');
  if (splitted.length !== 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Fen in wrong format',
    });
    return z.NEVER;
  }
  const state = splitted[0].split('/');
  if (state.length !== 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Fen doesnt contain correct amounth of ranks',
    });
    return z.NEVER;
  }
  const turn = splitted[1];
  if (turn !== 'b' && turn !== 'w') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Fen must contain color in turn',
    });
    return z.NEVER;
  }
  const castling = splitted[2].match('(^[K]?[Q]?[k]?[q]?$)|^-$');
  if (!castling || castling === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Fen must contain castling rights ' + splitted[2],
    });
    return z.NEVER;
  }
  const elPassant = splitted[3].match('^([a-h][1-8])$|^-$');
  if (!elPassant) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Fen must contain elpassant or -',
    });
    return z.NEVER;
  }
  const halfMoves = Number(splitted[4]);
  if (isNaN(halfMoves)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Halfmoves must be number',
    });
    return z.NEVER;
  }
  const fullMoves = Number(splitted[5]);
  if (isNaN(fullMoves)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Fullmoves must be number',
    });
    return z.NEVER;
  }
  return {
    state: splitted[0],
    turn: turn as Color,
    castling: castling[0] as unknown as string,
    halfMoves,
    fullMoves,
    elPassant: elPassant[0] as unknown as Square,
  };
});
