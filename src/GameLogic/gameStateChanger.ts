import Long from 'long';
import _ from 'lodash';
import { Color, Move } from '../Types';
import { bishopAttacks, moveMask, rookLegalAttacks } from './moveMask';
import {
  SquareBit,
  bitPieces,
  getBlackOccupiedBits,
  getOccupiedBits,
  logger,
} from './helpers';
import { getMoves, kingIsAttackedFrom } from './move';
import { bchHash } from '../Engine/engineMove';
//declare
let gameState: Long[] = [
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
let bchHistory: number[] = [];
let elPassant: SquareBit | null = null;
let pinned: Long = Long.UZERO;
let check = false;
let doubleCheck = false;
let checkingRays = Long.UZERO;
let mate = false;
let turn: Color = 'w';
let castling = 'KQkq';
let staleMate = false;
// can be used to set tie if reaches to 50
let halfMove = 0;
let fullMove = 1;
let lastMoves: Move[] = [];
let draw = false;
export const setElPassant = (s: SquareBit | null) => (elPassant = s);
export const setHalfMove = (s: number) => (halfMove = s);
export const setFullMove = (s: number) => (fullMove = s);
export const setTurn = (s: Color) => (turn = s);
/**
 * Helper for tests for reseting state
 */
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
  castling = 'KQkq';
  halfMove = 0;
  fullMove = 1;
  lastMoves = [];
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
/**
 * make given move in given state
 * @param move {Move}
   @param state {state}
 * @returns {state} updated state
 */
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

  const { castling, gameState, captured, elPassant } = movePiece(
    iState,
    piece,
    fromBitIndex,
    toBitIndex,
    color
  );
  iState.gameState = gameState;
  iState.castling = castling;
  iState.elPassant = elPassant;

  // changeGameState(modifiedGameState, newTurn);
  //set if pawn moved or piece captured to 0 otherwise increment
  if (piece === 1 || piece === 0 || captured !== null) {
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
    gameState: iState.gameState,
  });
  const { pinned } = getPinnedPieces(iState.turn, iState.gameState);
  iState.check = check;
  iState.doubleCheck = doubleCheck;
  iState.pinned = pinned;
  iState.checkingRays = checkingRays;

  const mate = isMate({ color: iState.turn, state: iState });
  iState.mate = mate;
  const { hash, draw } = getHashAndDraw(iState);
  iState.staleMate = isStaleMate({ color: iState.turn, state: iState });
  iState.bchHistory.push(hash);
  iState.draw = draw;
  return iState;
};
/**
 * Function to make move, castling, update castling rights, delete captured pieces and promote pawn
 * @param state {state} current state of game
 * @param piece {number} moved piece
 * @param fromBitIndex {number} index of square where move is made
 * @param toBitIndex {number}
 * @param color
 * @returns
 */
export const movePiece = (
  state: state,
  piece: number,
  fromBitIndex: number,
  toBitIndex: number,
  color: Color
) => {
  const iState = _.cloneDeep(state);
  const toMask = Long.UONE.shiftLeft(toBitIndex);
  const fromMask = Long.UONE.shiftLeft(fromBitIndex);
  //remove captured pieces
  //remove castling right if rook is captured
  const elPassantCapture = checkIfElpassant(toBitIndex, piece);
  const { capturedState, captured } = elPassantCapture
    ? removeCapturedPiece(elPassantCapture.square, color, iState.gameState)
    : removeCapturedPiece(toBitIndex, color, iState.gameState);
  iState.gameState = capturedState;
  //make castling
  const { gameState, castling } = updateCastlingRights(
    iState,
    fromBitIndex,
    toBitIndex,
    piece,
    captured
  );
  iState.gameState = gameState;
  iState.castling = castling;

  //if pawn moves to last rank it will be promoted to Queen
  //make move
  iState.gameState[piece] = iState.gameState[piece].and(fromMask.not());
  iState.gameState[piece] = iState.gameState[piece].or(toMask);
  //set/remove elpassant
  iState.gameState = promotePawn(iState.gameState, toBitIndex, piece);

  if ((piece === 1 || piece === 0) && (fromBitIndex - toBitIndex) % 16 === 0) {
    const elPassantSquare = color === 'w' ? fromBitIndex + 8 : fromBitIndex - 8;
    iState.elPassant = elPassantSquare;
  } else {
    iState.elPassant = null;
  }

  return { ...iState, captured };
};
/**
 * get hash of current gamestate and check if current boardstate is occurred in current game
 * @param state {state} current game state
 * @returns {hash:number, draw:boolean} returns hash of current state and if state is repetition
 */
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
 * @param move {Move} move data for next move
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
  staleMate = s.staleMate;
};
/**
 * promote pawn to queen if pawn is in last rank
 * @param state {state} current state of game
 * @param toBitIndex {number} index of square where piece is moved
 * @param piece  {number} number of piece
 * @returns  {state} updated state
 */
export const promotePawn = (
  state: Long[],
  toBitIndex: number,
  piece: number
) => {
  const gameState = _.clone(state);
  const to = Long.UONE.shl(toBitIndex);
  if (piece === 1 && ~~(toBitIndex / 8) === 0) {
    gameState[9] = gameState[9].or(to);
    gameState[1] = gameState[1].and(to.not());
  }
  if (piece === 0 && ~~(toBitIndex / 8) === 7) {
    gameState[8] = gameState[8].or(to);
    gameState[0] = gameState[0].and(to.not());
  }
  return gameState;
};
/**
 *  if moved piece is king or rook, update castling rights and make move also make castling move
 * @param iState {state} current gamestate
 * @param fromBitIndex {number} index of square
 * @param toBitIndex {number} index of square
 * @param piece {number} number of piece
 * @returns {castling: string, gameState: Long[]} returns updated castling rights and updated piece positions if castling occurs
 */
export const updateCastlingRights = (
  state: state,
  fromBitIndex: number,
  toBitIndex: number,
  piece: number,
  captured: number | null
) => {
  const iState = _.cloneDeep<state>(state);
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
  if (captured === 2) {
    if (toBitIndex === 0) iState.castling = iState.castling.replace('K', '');
    if (toBitIndex === 7) iState.castling = iState.castling.replace('Q', '');
  }
  if (piece === 3) {
    if (fromBitIndex === 56) iState.castling = iState.castling.replace('k', '');
    if (fromBitIndex === 63) iState.castling = iState.castling.replace('q', '');
  }
  if (captured === 3) {
    if (toBitIndex === 56) iState.castling = iState.castling.replace('k', '');
    if (toBitIndex === 63) iState.castling = iState.castling.replace('q', '');
  }

  return { castling: iState.castling, gameState: iState.gameState };
};

/**
 * returns square index where elpassant can be performed
 * @param toBitIndex {number} index of square where piece is moved
 * @param piece {number} piece number
 * @returns {number} elpassant square index
 */
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
/**
 *  remove captured pieces from state
 * @param toBitIndex {number} index of square where piece is moved
 * @param color {Color} color of moved piece
 * @param state {state} current state of game
 * @returns { capturedState: state, captured: number} returns updated state and captured piece number
 */
export const removeCapturedPiece = (
  toBitIndex: number,
  color: Color,
  state: Long[]
) => {
  // white pieces is even and black odd in gamestate Array so we need to set this even for black odd
  const forHelper = color === 'w' ? 1 : 0;
  const iState = _.clone(state);
  let captured = null;
  const capturedPiece = Long.UONE.shiftLeft(toBitIndex);
  for (let i = forHelper; i < state.length; i += 2) {
    let pieces = state[i] as Long;
    if (!capturedPiece.and(pieces).isZero()) {
      pieces = pieces.and(capturedPiece.not());
      iState[i] = pieces;
      captured = i;
    }
  }
  return { capturedState: iState, captured };
};

/**
 * make move in current state
 * @param props {move}
 */
export const makeMove = (props: Move) => {
  if (props.color !== turn) return false;
  return updateGameState(props);
};
/**
 * get pieces that are pinned against king
 * @param color {Color}
 * @param state {state} current state of game
 * @returns {pinned: Long} bitboard representation of pieces that are pinned
 */
export const getPinnedPieces = (color: Color, state: Long[]) => {
  const blackOccupiedBits = getBlackOccupiedBits(state);
  const occupiedBits = getOccupiedBits(state);
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
/**
 * gets pieces that are pinned against king so they cannot move away from line of attack
 * @param color {Color} color whose turn it is
 * @param teammateOccupiedBits {Long} BB of teammate bits
 * @param occupied {Long} BB of occupied bits
 * @param state {state} current state of game
 * @returns {Long} bb of all pinned pieces
 */
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
  const occupiedWOSelf = occupied.and(Long.UONE.shiftLeft(fromBitIndex).not());
  const attack = rookLegalAttacks({
    fromBitIndex,
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
  const occupiedWOSelf = occupied.and(Long.UONE.shiftLeft(fromBitIndex).not());
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
  staleMate = false;
  bchHistory = [];
  changeGameState(getState(), color);
};
export const changeGameState = (state: state, color: Color) => {
  //if color is given as parameter or get next players color
  const initialPinned = getPinnedPieces(color, state.gameState);
  const initialCheck = isCheck({ color, gameState: state.gameState });
  check = initialCheck.check;
  checkingRays = initialCheck.checkingRays;
  doubleCheck = initialCheck.doubleCheck;
  pinned = initialPinned.pinned;
  const initialMate = isMate({ color, state: getState() });
  const initialStaleMate = isStaleMate({ color, state });
  mate = initialMate;
  staleMate = initialStaleMate;
};
/**
 * checks if game is in mate
 * @param color {Color} color whose turn is it
 * @param state {state} current stat of game
 * @returns {boolean}
 */
export function isMate({ color, state }: { color: Color; state: state }) {
  if (!canMove({ color, state }) && state.check) {
    return true;
  }
  return false;
}
/**
 * checks if game is in stalemate
 * @param color {Color} color whose turn is it
 * @param state {state} current stat of game
 * @returns {boolean}
 */
export function isStaleMate({ color, state }: { color: Color; state: state }) {
  if (!canMove({ color, state }) && !state.check) {
    return true;
  }
  return false;
}
/**
 * checks if side can make move
 * @param color {Color} color whose turn is it
 * @param state {state} current stat of game
 * @returns {boolean}
 */
export function canMove({ color, state }: { color: Color; state: state }) {
  const allMoves = getMoves({ color, state });
  for (let [, info] of allMoves) {
    if (info.algebricAttacks.length !== 0 || info.algebricMoves.length !== 0) {
      return true;
    }
  }
  return false;
}
interface isCheckReturn {
  check: boolean;
  doubleCheck: boolean;
  checkingRays: Long;
}
/**
 * checks if game is in check
 * @param color {Color} color whose turn is it
 * @param state {state} current stat of game
 * @returns {boolean}
 */
export function isCheck({
  color,
  gameState,
}: {
  color: Color;
  gameState: Long[];
}): isCheckReturn {
  const occupiedBits = getOccupiedBits(gameState);
  const kingPosition =
    color === 'b' ? (gameState[11] as Long) : (gameState[10] as Long);
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
    gameState,
    color,
  });
  //trigger mate checking function
  return {
    doubleCheck,
    checkingRays: rays,
    check,
  };
}
