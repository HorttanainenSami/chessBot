import { state } from '../GameLogic/gameStateChanger';
import Long from 'long';
import { getMove } from '../GameLogic/move';
import { move } from './engineMove';
import { Color } from '../Types';
const P = 100;
const N = 320;
const B = 330;
const R = 500;
const Q = 900;
const K = 20000;
//prettier-ignore
const pawnSG=[
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
const wPawn = pawnMG.reverse();

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
const wknight = knight.reverse();

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
const wBishop = bishop.reverse();

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
const wRooks = rooks.reverse();

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
const wQueen = queen.reverse();

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
const wKingMG = kingMG.reverse();

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
const wKingEG = kingEG.reverse();

export const evaluate = (state: state) => {
  //pieces in board
  //mobility
  //pawn structure
  //piece position
  /*
  //king safety
  pawn shelter
  king mobility
  */
  //transpositional table
  //quescene search
  if (state.mate) {
    return state.turn === 'w' ? -Number.MAX_VALUE : Number.MAX_VALUE;
  }
  if (state.draw) {
    console.log('draw');
    return state.turn === 'w' ? -Number.MAX_VALUE : Number.MAX_VALUE;
  }
  const wK = state.gameState[10];
  const bK = state.gameState[11];
  const wQ = state.gameState[8];
  const bQ = state.gameState[9];
  const wR = state.gameState[2];
  const bR = state.gameState[3];
  const wB = state.gameState[4];
  const bB = state.gameState[5];
  const wN = state.gameState[6];
  const bN = state.gameState[7];
  const wP = state.gameState[0];
  const bP = state.gameState[1];
  const kingEvaluation = K * (bitCount(wK) - bitCount(bK));
  const QueenEvaluation = Q * (bitCount(wQ) - bitCount(bQ));
  const RookEvaluation = R * (bitCount(wR) - bitCount(bR));
  const bishopAndKnightEvaluation =
    B * (bitCount(wB.or(wN)) - bitCount(bB.or(bN)));
  const pawnEvaluation = P * (bitCount(wP) - bitCount(bP));
  const piecePopulationEval =
    kingEvaluation +
    QueenEvaluation +
    RookEvaluation +
    bishopAndKnightEvaluation +
    pawnEvaluation;

  const kingPositionalValue =
    getPositionEval(wKingMG, wK) - getPositionEval(kingMG, bK);
  const QueenPositonalValue =
    getPositionEval(wQueen, wQ) - getPositionEval(queen, bQ);
  const RookPositionalValue =
    getPositionEval(wRooks, wR) - getPositionEval(rooks, bR);
  const BishopPositionalValue =
    getPositionEval(wBishop, wB) - getPositionEval(bishop, bB);
  const KnightPositionalValue =
    getPositionEval(wknight, wN) - getPositionEval(knight, bN);
  const PawnPositionalValue =
    getPositionEval(wPawn, wP) - getPositionEval(pawnMG, bP);
  const positionalValue =
    kingPositionalValue +
    QueenPositonalValue +
    RookPositionalValue +
    BishopPositionalValue +
    KnightPositionalValue +
    PawnPositionalValue;

  /*
    blackOccupiedBits: Long;
    whiteOccupiedBits: Long;
    occupiedBits: Long;
    fromBitIndex: number;
}
export interface IMoves {
  piece: bitPieces;
  color: Color;
  */
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

  const Mobility =
    10 *
    (QueenMobility +
      RookMobility +
      BishopMobility +
      KnightMobility +
      KingMobility);

  /*
f(p) = 200(K-K')
       + 9(Q-Q')
       + 5(R-R')
       + 3(B-B' + N-N')
       + 1(P-P')
       - 0.5(D-D' + S-S' + I-I')
       + 0.1(M-M') + ...

- 50*D,S,I = doubled, blocked and isolated pawns

*/
  const checkValue = state.check ? (state.turn === 'w' ? 500 : -500) : 0;
  return positionalValue + piecePopulationEval + Mobility + checkValue;
};
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
