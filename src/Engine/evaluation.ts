import { state } from '../GameLogic/gameStateChanger';
import Long from 'long';
import { getMove } from '../GameLogic/move';
import { Color } from '../Types';
import { mayMove } from '../preCalculatedMoveMasks';
const P = 100;
const N = 320;
const B = 330;
const R = 500;
const Q = 900;
const K = 20000;

//prettier-ignore
const pawnMG=[
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];
//prettier-ignore
const pawnEG=[
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  30, 30, 30, 30, 30, 30, 30, 30,
  10, 10, 10, 10, 10, 10, 10, 10,
  -20, -20, -20, -20, -20, -20, -20, -20,
  -30, -30, -30, -30, -30, -30, -30, -30, 
  -40, -40, -40, -40, -40, -40, -40, -40,
  -50, -50, -50, -50, -50, -50, -50, -50,
  0,  0,  0,  0,  0,  0,  0,  0
];

//prettier-ignore
const knight = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

// prettier-ignore
const bishop=[
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

// prettier-ignore
const rooks = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

//prettier-ignore
const queen = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

//prettier-ignore
const kingMG=[
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

//prettier-ignore

const kingEG =[
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50
];

export const evaluate = (state: state, depth: number) => {
  if (state.mate) {
    return state.turn === 'w' ? -20000 + depth * -1000 : 20000 + depth * 1000;
  }
  if (state.draw || state.staleMate) {
    return 0;
  }

  const wValue =
    bitCount(state.gameState[8]) * Q +
    bitCount(state.gameState[2]) * R +
    bitCount(state.gameState[4]) * B +
    bitCount(state.gameState[6]) * N +
    bitCount(state.gameState[0]) * P;
  const bValue =
    bitCount(state.gameState[9]) * Q +
    bitCount(state.gameState[3]) * R +
    bitCount(state.gameState[5]) * B +
    bitCount(state.gameState[7]) * N +
    bitCount(state.gameState[1]) * P;

  const piecePopulationEval = wValue - bValue;
  function isMG() {
    //if pieces values are less than 1330 its endgame
    return wValue <= 1330 && bValue <= 1330;
  }
  const positionalValue = getPositionalValue(state.gameState, isMG());
  let bOcc = Long.UZERO;
  let wOcc = Long.UZERO;
  let occ = Long.UZERO;
  for (let i = 0; i < 12; i++) {
    const pieces = state.gameState[i];
    if (i % 2 == 0) {
      bOcc = bOcc.or(pieces);
    } else {
      wOcc = wOcc.or(pieces);
    }
    occ = occ.or(pieces);
  }

  const mobility = getMobility(wOcc, bOcc, occ, state);
  const structureValue = getPawnStructureValue(state.gameState, occ);

  return (
    positionalValue +
    piecePopulationEval +
    getCastlingValue(state.castling) +
    mobility -
    structureValue
  );
};
export function getCastlingValue(castling: String) {
  const K = castling.includes('K') ? 100 : 0;
  const Q = castling.includes('Q') ? 100 : 0;
  const k = castling.includes('k') ? 100 : 0;
  const q = castling.includes('q') ? 100 : 0;
  return K + Q - (k + q);
}
export function getPositionalValue(state: Long[], isMiddleGame: boolean) {
  const kingPositionalValue =
    getPositionEval(isMiddleGame ? kingMG : kingEG, state[10]) -
    getPositionEval(
      isMiddleGame ? kingMG.reverse() : kingEG.reverse(),
      state[11]
    );
  const QueenPositonalValue =
    getPositionEval(queen, state[8]) -
    getPositionEval(queen.reverse(), state[9]);
  const RookPositionalValue =
    getPositionEval(rooks, state[2]) -
    getPositionEval(rooks.reverse(), state[3]);
  const BishopPositionalValue =
    getPositionEval(bishop, state[4]) -
    getPositionEval(bishop.reverse(), state[5]);
  const KnightPositionalValue =
    getPositionEval(knight, state[6]) -
    getPositionEval(knight.reverse(), state[7]);
  const PawnPositionalValue =
    getPositionEval(isMiddleGame ? pawnMG : pawnEG, state[0]) -
    getPositionEval(
      isMiddleGame ? pawnMG.reverse() : pawnEG.reverse(),
      state[1]
    );

  return (
    kingPositionalValue +
    QueenPositonalValue +
    RookPositionalValue +
    BishopPositionalValue +
    KnightPositionalValue +
    PawnPositionalValue
  );
}
const isolationMask = [
  Long.fromString('202020202020202', true, 16),
  Long.fromString('505050505050505', true, 16),
  Long.fromString('a0a0a0a0a0a0a0a', true, 16),
  Long.fromString('1414141414141414', true, 16),
  Long.fromString('2828282828282828', true, 16),
  Long.fromString('5050505050505050', true, 16),
  Long.fromString('a0a0a0a0a0a0a0a0', true, 16),
  Long.fromString('4040404040404040', true, 16),
];

export function pawnStructure(
  friendlyPawns: Long,
  enemyPawns: Long,
  occupied: Long,
  color: Color
) {
  let doubled = 0;
  let blocked = 0;
  let isolated = 0;
  let wp = friendlyPawns;
  const direction = color === 'w' ? 8 : -8;
  while (!wp.isZero()) {
    const pawnInSq = wp.countTrailingZeros();
    const pawnsWOexaminedPawn = friendlyPawns.xor(Long.UONE.shl(pawnInSq));
    const from = pawnInSq % 8;
    const to = 56 + from;
    if (!mayMove({ from, to, occupied: pawnsWOexaminedPawn })) {
      doubled++;
    }
    if (!mayMove({ from: pawnInSq, to: pawnInSq + direction, occupied })) {
      blocked++;
    }
    if (friendlyPawns.and(isolationMask[from]).isZero()) {
      isolated++;
    }
    wp = wp.and(Long.UONE.shl(pawnInSq).not());
  }
  //blocked
  //isolated
  return { doubled, blocked, isolated };
}
export function getMobility(bOcc: Long, wOcc: Long, occ: Long, state: state) {
  const QueenMobility =
    countMobilityOfPiece(bOcc, wOcc, occ, 8, state.gameState[8], state) -
    countMobilityOfPiece(bOcc, wOcc, occ, 9, state.gameState[9], state);
  const RookMobility =
    countMobilityOfPiece(bOcc, wOcc, occ, 2, state.gameState[2], state) -
    countMobilityOfPiece(bOcc, wOcc, occ, 3, state.gameState[3], state);
  const BishopMobility =
    countMobilityOfPiece(bOcc, wOcc, occ, 4, state.gameState[4], state) -
    countMobilityOfPiece(bOcc, wOcc, occ, 5, state.gameState[5], state);
  const KnightMobility =
    countMobilityOfPiece(bOcc, wOcc, occ, 6, state.gameState[6], state) -
    countMobilityOfPiece(bOcc, wOcc, occ, 7, state.gameState[7], state);
  const KingMobility =
    countMobilityOfPiece(bOcc, wOcc, occ, 10, state.gameState[10], state) -
    countMobilityOfPiece(bOcc, wOcc, occ, 11, state.gameState[11], state);

  return (
    10 *
    (QueenMobility +
      RookMobility +
      BishopMobility +
      KnightMobility +
      KingMobility)
  );
}
export function getPawnStructureValue(state: Long[], occ: Long) {
  const wPstructure = pawnStructure(state[0], state[1], occ, 'w');
  const bPstructure = pawnStructure(state[1], state[0], occ, 'b');
  const structureValue =
    -50 *
    (wPstructure.blocked -
      bPstructure.blocked +
      wPstructure.doubled -
      bPstructure.doubled +
      wPstructure.isolated -
      bPstructure.isolated);
  return structureValue;
}
function countMobilityOfPiece(
  bOcc: Long,
  wOcc: Long,
  occ: Long,
  piece: number,
  pieceBB: Long,
  state: state
) {
  let mobilityScore = 0;

  const moveObject = {
    color: piece % 2 == 0 ? 'w' : ('b' as Color),
    blackOccupiedBits: bOcc,
    whiteOccupiedBits: wOcc,
    occupiedBits: occ,
    piece,
  };
  let i = pieceBB;
  while (!i.isZero()) {
    const fromBitIndex = i.countTrailingZeros();

    getMove({ move: { ...moveObject, fromBitIndex }, state });
    i = i.and(Long.UONE.shl(fromBitIndex).not());
  }

  return mobilityScore;
}
export function bitCount(n: Long) {
  let bits = 0;
  bits += bitCount32(n.low);
  bits += bitCount32(n.high);
  return bits;
}
function getPositionEval(evalArray: number[], pieceBB: Long) {
  let points = 0;
  let iteratedBB = pieceBB;
  let i = iteratedBB.countTrailingZeros();
  while (i < 64) {
    if (!pieceBB.and(Long.UONE.shl(i)).isZero()) {
      points += evalArray[i];
    }
    iteratedBB = iteratedBB.and(Long.UONE.shl(i).not());
    i = iteratedBB.countTrailingZeros();
  }
  return points;
}
/**
 * below not my own functions
 */
function bitCount32(n: number) {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
