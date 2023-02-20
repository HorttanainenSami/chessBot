import { state } from '../GameLogic/gameStateChanger';
import Long from 'long';
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
  if (state.mate) {
    return state.turn === 'w'
      ? Number.NEGATIVE_INFINITY
      : Number.POSITIVE_INFINITY;
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
f(p) = 200(K-K')
       + 9(Q-Q')
       + 5(R-R')
       + 3(B-B' + N-N')
       + 1(P-P')
       - 0.5(D-D' + S-S' + I-I')
       + 0.1(M-M') + ...

KQRBNP = number of kings, queens, rooks, bishops, knights and pawns
D,S,I = doubled, blocked and isolated pawns
M = Mobility (the number of legal moves)
*/
  return positionalValue + piecePopulationEval;
};

function bitCount(n: Long) {
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
