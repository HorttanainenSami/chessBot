import {
  getState,
  getUpdatedState,
  makeMove,
} from '../GameLogic/gameStateChanger';
import { SquareBit, logger } from '../GameLogic/helpers';
import { getMoves } from '../GameLogic/move';
import { Color, Move, PieceSymbol, Square } from '../Types';
import Long from 'long';
import { state } from '../GameLogic/gameStateChanger';
import { evaluate } from './evaluation';

enum type {
  EXACT,
  UPPER,
  LOWER,
}
interface transpositionI {
  depth: number;
  value: number;
  move: Move;
  alpha: number;
  beta: number;
  type: type;
}

let transpositionTable = new Map<number, transpositionI>();
export let polynomials: number[][][] = [];

export const move = async ({ color }: { color: Color }) => {
  try {
    const start = Date.now();

    console.log('start');

    const nextMiniMax = await enginesNextMove(4, color);
    const end = Date.now();
    console.log(`Execution time: ${end - start} ms`);

    return makeMove(nextMiniMax);
  } catch (e) {
    console.log(e, 'error');
  }
};

const enginesNextMove = (depth: number, color: Color): Promise<Move> => {
  let leaves = 0;
  return new Promise((resolve, reject) => {
    const initialState = getState();
    let nextMove: Move | null = null;
    const evals = alphaBeta(
      depth,
      initialState,
      color === 'w' ? true : false,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY
    );
    console.log(leaves, ' leaves calculated');
    function alphaBeta(
      depth: number,
      state: state,
      maximizingPlayer: boolean,
      alpha: number,
      beta: number
    ) {
      leaves++;
      if (depth === 0 || state.mate) return evaluate(state);
      const hashNumber = bchHash(
        state.gameState,
        maximizingPlayer,
        state.castling,
        state.draw
      );

      const trans = transpositionTable.get(hashNumber);
      if (trans && trans.depth >= depth) {
        if (trans.type === type.EXACT) {
          nextMove = trans.move;
          return trans.value;
        } else if (trans.type === type.LOWER) {
          alpha = Math.max(trans.alpha, alpha);
        } else if (trans.type === type.UPPER) {
          beta = Math.min(trans.beta, beta);
        }
        if (beta <= alpha) {
          nextMove = trans.move;
          return trans.value;
        }
      }

      if (maximizingPlayer) {
        let maxEval = Number.NEGATIVE_INFINITY;
        let funcMove: Move | null = null;
        const orderedMoves = getOrderedMoves(state);
        for (let move of orderedMoves) {
          const updatedState = getUpdatedState({ move, state });
          const evaluate = alphaBeta(
            depth - 1,
            updatedState,
            false,
            alpha,
            beta
          );

          if (maxEval < evaluate) {
            maxEval = evaluate;
            funcMove = move;
          }
          alpha = Math.max(alpha, evaluate);

          if (beta <= alpha) {
            break;
          }
        }

        if (funcMove) {
          nextMove = funcMove;

          updateTranspositionTable({
            hashNumber,
            value: maxEval,
            move: funcMove,
            alpha,
            beta,
            depth,
          });
        }

        return maxEval;
      } else {
        let minEval = Number.POSITIVE_INFINITY;
        let funcMove: Move | null = null;
        const orderedMoves = getOrderedMoves(state);
        for (let move of orderedMoves) {
          const updatedState = getUpdatedState({ move, state });

          const evaluate = alphaBeta(
            depth - 1,
            updatedState,
            true,
            alpha,
            beta
          );

          if (minEval > evaluate) {
            minEval = evaluate;

            funcMove = move;
          }
          beta = Math.min(beta, evaluate);
          if (beta <= alpha) {
            break;
          }
        }

        if (funcMove) {
          nextMove = funcMove;

          updateTranspositionTable({
            hashNumber,
            value: minEval,
            move: funcMove,
            alpha,
            beta,
            depth,
          });
        }

        return minEval;
      }
    }

    console.log(evals);
    console.log(nextMove);
    if (nextMove) resolve(nextMove);
    reject(null);
  });
};
interface updateTranspositionTableI {
  hashNumber: number;
  depth: number;
  value: number;
  alpha: number;
  beta: number;
  move: Move;
}
function updateTranspositionTable({
  hashNumber,
  depth,
  value,
  alpha,
  beta,
  move,
}: updateTranspositionTableI) {
  let initialType = type.EXACT;
  if (value <= alpha) {
    initialType = type.UPPER;
  } else if (value >= beta) {
    initialType = type.LOWER;
  }
  transpositionTable.set(hashNumber, {
    value,
    type: initialType,
    depth,
    beta,
    alpha,
    move,
  });
}

/**
 *  gets all moves for side in turn to move and orders them by attacking moves for first in array
 * @param state {state} current state of board
 * @returns {Move[]}
 */
export function getOrderedMoves(state: state) {
  const allPossibleMovesForColor = getMoves({
    color: state.turn,
    state,
  }).entries();
  const orderedMoves: Move[] = [];
  const orderedAttacks: Move[] = [];
  let pieceInfo = allPossibleMovesForColor.next();
  //first order attacks and quiet moves to own lists
  while (!pieceInfo.done) {
    const initialMoveObject = {
      from: SquareBit[pieceInfo.value[0]] as Square,
      promotion: 'q' as PieceSymbol,
      color: pieceInfo.value[1].color,
      piece: pieceInfo.value[1].piece,
    };
    orderedMoves.push(
      ...pieceInfo.value[1].algebricMoves.map(
        (r) => ({ ...initialMoveObject, to: SquareBit[r] as Square } as Move)
      )
    );
    orderedAttacks.push(
      ...pieceInfo.value[1].algebricAttacks.map(
        (r) => ({ ...initialMoveObject, to: SquareBit[r] as Square } as Move)
      )
    );
    pieceInfo = allPossibleMovesForColor.next();
  }
  //append attack and move lists so attacks are first in list
  return [...orderedAttacks, ...orderedMoves];
}

export function bchHash(
  gameState: Long[],
  isBlackTurn: boolean,
  castling: string,
  draw: boolean
) {
  // Define the parameters of the hash function
  const p = 2 ** 31 - 1; // A large prime number
  const m = 64; // The number of squares on the chess board
  const n = 12; // The number of chess pieces

  let h = 0;

  // Include state variables in the hash value
  if (isBlackTurn) h = (h + 1) % p;
  if (castling.includes('K')) h = (h + 2) % p;
  if (castling.includes('Q')) h = (h + 4) % p;
  if (castling.includes('k')) h = (h + 8) % p;
  if (castling.includes('q')) h = (h + 16) % p;
  if (draw) h = (h + 32) % p;

  // Calculate the hash value for the game state
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const piece = gameState[j];
      const bitboard = piece.and(Long.UONE.shl(i));
      if (!bitboard.isZero()) {
        for (let k = 0; k < 64; k++) {
          if (!bitboard.and(Long.UONE.shl(k)).isZero()) {
            h = (h + polynomials[i][j][k]) % p;
          }
        }
      }
    }
  }

  // Return the hash value
  return h;
}
initializePolynomials();
export function initializePolynomials() {
  const q = 2 ** 31; // A prime number slightly smaller than p

  polynomials = Array.from({ length: 64 }, () =>
    Array.from({ length: 12 }, () =>
      Array.from({ length: 64 }, () => Math.floor(Math.random() * q))
    )
  );
}
