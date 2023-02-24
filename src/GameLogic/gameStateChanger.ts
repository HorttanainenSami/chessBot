import Long from 'long';
import _ from 'lodash';
import { Color, Move } from '../Types';
import { bishopAttacks, moveMask, rookLegalAttacks } from './moveMask';
import { SquareBit, bitPieces, logger } from './helpers';
import { getMoves, kingIsAttackedFrom } from './move';
import { bchHash } from '../Engine/engineMove';
export let gameState: Long[] = [
  //pawns
  Long.fromString('0xff00', true, 16), //w
  Long.fromString('0xff000000000000', true, 16), //b
  //rooks
  Long.fromString('0x81', true, 16), //w
  Long.fromString('0x8100000000000000', true, 16), //b
  //bishops
  Long.fromString('0x24', true, 16), //w
  Long.fromString('0x2400000000000000', true, 16), //b
  //knights
  Long.fromString('0x42', true, 16), //w
  Long.fromString('0x4200000000000000', true, 16), //b
  //queens
  Long.fromString('0x10', true, 16), //w
  Long.fromString('0x1000000000000000', true, 16), //b
  //kings
  Long.fromString('0x8', true, 16), //w
  Long.fromString('0x800000000000000', true, 16), //b
];
export let moveHistory: number[] = [];
export let bchHistory: number[] = [];
export let elPassant: SquareBit | null = null;
export let pinned: Long = Long.UZERO;
export let check = false;
export let doubleCheck = false;
export let checkingRays = Long.UZERO;
export let mate = false;
export let turn: Color = 'w';
export let castling = 'KQkq';
export let staleMate = false;
// can be used to set tie if reaches to 50
export let halfMove = 0;
export let fullMove = 1;
export let botSide: null | Color = 'b';
export let lastMoves: Move[] = [];
export let draw = false;
export const setElPassant = (s: SquareBit | null) => (elPassant = s);
export const setHalfMove = (s: number) => (halfMove = s);
export const setFullMove = (s: number) => (fullMove = s);
export const setTurn = (s: Color) => (turn = s);
//helper for tests
export function reset() {
  gameState = [
    //pawns
    Long.fromString('0xff00', true, 16), //w
    Long.fromString('0xff000000000000', true, 16), //b
    //rooks
    Long.fromString('0x81', true, 16), //w
    Long.fromString('0x8100000000000000', true, 16), //b
    //bishops
    Long.fromString('0x24', true, 16), //w
    Long.fromString('0x2400000000000000', true, 16), //b
    //knights
    Long.fromString('0x42', true, 16), //w
    Long.fromString('0x4200000000000000', true, 16), //b
    //queens
    Long.fromString('0x10', true, 16), //w
    Long.fromString('0x1000000000000000', true, 16), //b
    //kings
    Long.fromString('0x8', true, 16), //w
    Long.fromString('0x800000000000000', true, 16), //b
  ];
  elPassant = null;
  pinned = Long.UZERO;
  check = false;
  doubleCheck = false;
  checkingRays = Long.UZERO;
  mate = false;
  turn = 'w';
  draw = false;
  staleMate = false;
  bchHistory = [];
}
export interface state {
  gameState: Long[];
  pinned: Long;
  check: boolean;
  doubleCheck: boolean;
  checkingRays: Long;
  mate: boolean;
  turn: Color;
  elPassant: SquareBit | null;
  halfMove: number;
  fullMove: number;
  castling: string;
  lastMoves: Move[];
  draw: boolean;
  bchHistory: number[];
  staleMate: boolean;
}
export const getState = (): state => ({
  gameState,
  pinned,
  check,
  doubleCheck,
  checkingRays,
  mate,
  turn,
  elPassant,
  halfMove,
  fullMove,
  castling,
  lastMoves,
  draw,
  bchHistory,
  staleMate,
});
export const getUpdatedState = ({
  move,
  state,
}: {
  move: Move;
  state: state;
}): state => {
  //const iState = structuredClone(state);
  const iState = _.cloneDeep<state>(state);

  const { piece, to, from, color } = move;
  const toBitIndex = SquareBit[to];
  const fromBitIndex = SquareBit[from];
  const toMask = Long.UONE.shiftLeft(toBitIndex);
  const fromMask = Long.UONE.shiftLeft(fromBitIndex);

  //if piece moved is king or rook remove castling
  if (piece === 10) {
    if (fromBitIndex === 3 && toBitIndex === 1) {
      if (!iState.gameState[2].and(Long.UONE).isZero()) {
        iState.gameState[2] = iState.gameState[2].and(Long.UONE.not());
        iState.gameState[2] = iState.gameState[2].or(Long.UONE.shl(2));
      }
    }
    if (fromBitIndex === 3 && toBitIndex === 5) {
      if (!iState.gameState[2].and(Long.UONE.shl(7)).isZero()) {
        iState.gameState[2] = iState.gameState[2].and(Long.UONE.shl(7).not());
        iState.gameState[2] = iState.gameState[2].or(Long.UONE.shl(4));
      }
    }
    iState.castling = iState.castling.replace('Q', '');
    iState.castling = iState.castling.replace('K', '');
  }
  if (piece === 11) {
    if (fromBitIndex === 59 && toBitIndex === 57) {
      if (!iState.gameState[3].and(Long.UONE.shl(56)).isZero()) {
        iState.gameState[3] = iState.gameState[3].and(Long.UONE.shl(56).not());
        iState.gameState[3] = iState.gameState[3].or(Long.UONE.shl(58));
      }
    }
    if (fromBitIndex === 59 && toBitIndex === 61) {
      if (!iState.gameState[3].and(Long.UONE.shl(63)).isZero()) {
        iState.gameState[3] = iState.gameState[3].and(Long.UONE.shl(63).not());
        iState.gameState[3] = iState.gameState[3].or(Long.UONE.shl(60));
      }
    }
    iState.castling = iState.castling.replace('k', '');
    iState.castling = iState.castling.replace('q', '');
  }
  if (piece === 2) {
    if (fromBitIndex === 0) iState.castling = iState.castling.replace('K', '');
    if (fromBitIndex === 7) iState.castling = iState.castling.replace('Q', '');
  }
  if (piece === 3) {
    if (fromBitIndex === 56) iState.castling = iState.castling.replace('k', '');
    if (fromBitIndex === 63) iState.castling = iState.castling.replace('q', '');
  }
  //TODO if move is rook remove castling rights of that side rook

  //make move
  iState.gameState[piece] = iState.gameState[piece].and(fromMask.not());
  iState.gameState[piece] = iState.gameState[piece].or(toMask);
  //remove captured pieces
  const elPassantCapture = checkIfElpassant(toBitIndex, piece);
  const deletedPieces = elPassantCapture
    ? removeCapturedPiece(elPassantCapture.square, color, iState.gameState)
    : removeCapturedPiece(toBitIndex, color, iState.gameState);
  //if pawn moves to last rank it will be promoted to Queen
  if (piece === 1 && ~~(toBitIndex / 8) === 0) {
    iState.gameState[9] = iState.gameState[9].or(toMask);
    iState.gameState[piece] = iState.gameState[piece].and(toMask.not());
  }
  if (piece === 0 && ~~(toBitIndex / 8) === 7) {
    iState.gameState[8] = iState.gameState[8].or(toMask);
    iState.gameState[piece] = iState.gameState[piece].and(toMask.not());
  }

  //set/remove elpassant
  if ((piece === 1 || piece === 0) && (fromBitIndex - toBitIndex) % 16 === 0) {
    const elPassantSquare = color === 'w' ? fromBitIndex + 8 : fromBitIndex - 8;
    iState.elPassant = elPassantSquare;
  } else {
    iState.elPassant = null;
  }

  //final state changes

  if (deletedPieces) {
    iState.gameState[deletedPieces.i] = deletedPieces.pieces;
  }
  // changeGameState(modifiedGameState, newTurn);
  //set if pawn moved or piece captured to 0 otherwise increment
  if (piece === 1 || piece === 0 || deletedPieces) {
    iState.halfMove = 0;
  } else {
    iState.halfMove += 1;
  }

  if (iState.turn === 'b') {
    iState.fullMove += 1;
  }
  iState.turn = iState.turn === 'b' ? 'w' : 'b';
  const { check, doubleCheck, checkingRays } = isCheck({
    color: iState.turn,
    state: iState.gameState,
  });
  const { pinned } = calculatePinned(iState.turn, iState.gameState);
  iState.check = check;
  iState.doubleCheck = doubleCheck;
  iState.pinned = pinned;
  iState.checkingRays = checkingRays;

  const mate = isMate({ color: iState.turn, state: iState });
  iState.mate = mate;
  const { hash, draw } = getHashAndDraw(iState);
  iState.bchHistory.push(hash);
  iState.draw = draw;
  return iState;
};
function getHashAndDraw(state: state) {
  //fetch current hash
  const hash = bchHash(
    state.gameState,
    state.turn === 'w',
    state.castling,
    state.draw
  );
  //check history of alike hashcodes
  const repetition = state.bchHistory.filter((r) => r === hash).length;
  //if repetition is greater than 2, return new hash with draw imbedded
  if (repetition >= 2) {
    return {
      hash: bchHash(state.gameState, state.turn === 'w', state.castling, true),
      draw: true,
    };
  }
  return { hash, draw: false };
}
/**
 * should be used to update gamestate, when making move
 * @param move front end apis given data
 */
export const updateGameState = (move: Move) => {
  const s = getUpdatedState({ move, state: getState() });
  gameState = s.gameState;
  pinned = s.pinned;
  check = s.check;
  doubleCheck = s.doubleCheck;
  checkingRays = s.checkingRays;
  mate = s.mate;
  turn = s.turn;
  elPassant = s.elPassant;
  halfMove = s.halfMove;
  fullMove = s.fullMove;
  castling = s.castling;
  bchHistory = s.bchHistory;
  draw = s.draw;
  return true;
};

export const checkIfElpassant = (toBitIndex: number, piece: bitPieces) => {
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

export const removeCapturedPiece = (
  fromBitIndex: number,
  color: Color,
  state: Long[]
) => {
  // white pieces is even and black odd in gamestate Array so we need to set this even for black odd
  const forHelper = color === 'w' ? 1 : 0;
  const capturedPiece = Long.UONE.shiftLeft(fromBitIndex);
  for (let i = forHelper; i < state.length; i += 2) {
    let pieces = state[i] as Long;
    if (!capturedPiece.and(pieces).isZero()) {
      pieces = pieces.and(capturedPiece.not());
      return { i, pieces };
    }
  }
};

// Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
export const makeMove = (props: Move) => {
  if (props.color !== turn) return false;
  return updateGameState(props);
};

export const calculatePinned = (color: Color, state: Long[]) => {
  const blackOccupiedBits = state.reduce((acc, curr, i) => {
    if (i % 2 === 0) return acc;
    return acc.or(curr);
  }, Long.UZERO);
  const occupiedBits = state.reduce((acc, curr) => acc.or(curr), Long.UZERO);
  const teammateOccupiedBits =
    color === 'w' ? occupiedBits.xor(blackOccupiedBits) : blackOccupiedBits;
  const initialPinned = pinnedPieces(
    color,
    teammateOccupiedBits,
    occupiedBits,
    state
  );
  return { pinned: initialPinned };
};

export function pinnedPieces(
  color: Color,
  teammateOccupiedBits: Long,
  occupied: Long,
  state: Long[]
) {
  const colorHelper = color === 'w' ? 1 : 0;
  const enemyColor = color === 'w' ? 0 : 1;
  const kingPosition = state[11 - colorHelper] as Long;
  const kingSquare = kingPosition.countTrailingZeros();

  if (kingSquare === 64) return Long.UZERO;
  const eRook = state[3 - enemyColor] as Long;
  const eBishop = state[5 - enemyColor] as Long;
  const eQueen = state[9 - enemyColor] as Long;
  let pinned = Long.UZERO;

  let pinner = xrayRookAttacks({
    occupied,
    blockers: teammateOccupiedBits,
    fromBitIndex: kingSquare,
  });
  while (!pinner.isZero()) {
    let pinnerSq = pinner.countTrailingZeros();
    let pinnerPosition = Long.UONE.shiftLeft(pinnerSq);
    if (pinnerSq === 64) break;
    //check if pinnerSq contains enemy queen or rook
    if (pinnerPosition.and(eQueen.or(eRook)).isZero()) {
      pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
      continue;
    }
    const obstructedBB = moveMask.obstructed(kingSquare, pinnerSq, occupied);
    if (obstructedBB === null) break;
    const pieceBeingPinned = obstructedBB.and(teammateOccupiedBits);
    pinned = pinned.or(pieceBeingPinned);
    pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
  }
  pinner = xrayBishopAttacks({
    occupied,
    blockers: teammateOccupiedBits,
    fromBitIndex: kingSquare,
  });
  while (!pinner.isZero()) {
    let pinnerSq = pinner.countTrailingZeros();
    if (pinnerSq === 64) break;
    const pinnerPosition = Long.UONE.shiftLeft(pinnerSq);
    //check if pinnerSq contains enemy queen or bishop
    if (pinnerPosition.and(eQueen.or(eBishop)).isZero()) {
      pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
      continue;
    }

    const obstructedBB = moveMask.obstructed(kingSquare, pinnerSq, occupied);
    if (obstructedBB === null) break;
    const pieceBeingPinned = obstructedBB.and(teammateOccupiedBits);
    //check if piece is bishop or queen its partiallyPinned
    pinned = pinned.or(pieceBeingPinned);
    pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
  }
  return pinned;
}
/**
 *  Should get next blocker behind current blocker in rook move mask
 * @param occupied {Long} all occupied squares
 * @param blockers {Long} current blockers witch is wanted to be xrayed for example teammateOccupied to check if piece is absolutely pinned
 * @param square {number} index of square that is wanted to be examined
 * @returns {Long} attackmask when current blocker is removed
 */

export function xrayRookAttacks({
  occupied,
  blockers,
  fromBitIndex,
}: {
  occupied: Long;
  blockers: Long;
  fromBitIndex: number;
}) {
  const occupiedWOSelf = occupied.xor(Long.UONE.shiftLeft(fromBitIndex));
  const attack = rookLegalAttacks({
    fromBitIndex: fromBitIndex,
    occupiedBits: occupied,
  }).and(occupiedWOSelf);
  const onlyBlockers = blockers.and(attack);
  const attacksBehindBlockers = rookLegalAttacks({
    fromBitIndex: fromBitIndex,
    occupiedBits: occupied.xor(onlyBlockers),
  }).and(occupiedWOSelf);
  return attack.xor(attacksBehindBlockers);
}
/**
 *  Should get next blocker behind current blocker in bishop move mask
 * @param occupied {Long} all occupied squares
 * @param blockers {Long} current blockers witch is wanted to be xrayed for example teammateOccupied to check if piece is absolutely pinned
 * @param square {number} index of square that is wanted to be examined
 * @returns {Long} attackmask when current blocker is removed
 */

export function xrayBishopAttacks({
  occupied,
  blockers,
  fromBitIndex,
}: {
  occupied: Long;
  blockers: Long;
  fromBitIndex: number;
}) {
  const occupiedWOSelf = occupied.xor(Long.UONE.shiftLeft(fromBitIndex));
  const attack = bishopAttacks({
    fromBitIndex: fromBitIndex,
    occupiedBits: occupied,
  }).and(occupiedWOSelf);
  const onlyBlockers = blockers.and(attack);
  const attacksBehindBlockers = bishopAttacks({
    fromBitIndex: fromBitIndex,
    occupiedBits: occupied.xor(onlyBlockers),
  }).and(occupiedWOSelf);
  return attack.xor(attacksBehindBlockers);
}
export const setFEN = (
  state: Long[],
  elpassantP: SquareBit | null,
  castlingP: string,
  halfMoveP: number,
  fullMoveP: number,
  color: Color
) => {
  gameState = state;
  elPassant = elpassantP;
  castling = castlingP;
  halfMove = halfMoveP;
  fullMove = fullMoveP;
  check = false;
  doubleCheck = false;
  mate = false;
  turn = color;
  draw = false;
  bchHistory = [];
  changeGameState(getState(), color);
};
export const changeGameState = (state: state, color: Color) => {
  //if color is given as parameter or get next players color
  const initialPinned = calculatePinned(color, state.gameState);
  const initialCheck = isCheck({ color, state: state.gameState });

  check = initialCheck.check;
  checkingRays = initialCheck.checkingRays;
  doubleCheck = initialCheck.doubleCheck;
  pinned = initialPinned.pinned;
  const initialMate = isMate({ color, state: getState() });
  mate = initialMate;
};

export function isMate({ color, state }: { color: Color; state: state }) {
  const allMoves = getMoves({ color, state });
  for (let asd of allMoves) {
    if (!asd[1].moves.isZero()) {
      return false;
    }
  }

  return true;
}
interface isCheckReturn {
  check: boolean;
  doubleCheck: boolean;
  checkingRays: Long;
}
export function isCheck({
  color,
  state,
}: {
  color: Color;
  state: Long[];
}): isCheckReturn {
  const occupiedBits = state.reduce((acc, curr) => acc.or(curr), Long.UZERO);
  const kingPosition =
    color === 'b' ? (state[11] as Long) : (state[10] as Long);
  const fromBitIndex = kingPosition.countTrailingZeros();
  if (fromBitIndex === 64)
    return {
      check: false,
      doubleCheck: false,
      checkingRays: Long.UZERO,
    };

  const { rays, check, doubleCheck } = kingIsAttackedFrom({
    occupiedBits,
    fromBitIndex,
    state,
    color,
  });
  //trigger mate checking function
  return {
    doubleCheck,
    checkingRays: rays,
    check,
  };
}

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
