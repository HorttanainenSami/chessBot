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
import { clear } from 'console';

interface transpositionI {
  depth: number;
  value: number;
  move: Move;
}

let transpositionTable = new Map<number, transpositionI>();
export let polynomials: number[][][] = [];

export const move = async ({ color }: { color: Color }) => {
  try {
    const start = Date.now();

    console.log('start');
    clearTransposition();
    if (transpositionTable.size !== 0) console.log('not cleared');
    const nextMiniMax = await enginesNextMove(4, color);
    const end = Date.now();
    console.log(`Execution time: ${end - start} ms`);

    return makeMove(nextMiniMax.move);
  } catch (e) {
    console.log(e, 'error');
  }
};
interface Test extends Move {
  depth: number;
}
export const clearTransposition = () => transpositionTable.clear();
export const enginesNextMove = (
  depth: number,
  color: Color
): Promise<{ value: number; move: Move }> => {
  let leaves = 0;
  return new Promise((resolve, reject) => {
    const initialState = getState();
    let nextMove: Test | null = null;
    const maximizingPlayer = color === 'w' ? true : false;
    const evaluationValue = alphaBeta(
      depth,
      initialState,
      maximizingPlayer,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY
    );
    console.log(leaves, ' leaves calculated');
    function alphaBeta(
      initialDepth: number,
      state: state,
      maximizingPlayer: boolean,
      alpha: number,
      beta: number
    ): number {
      leaves++;
      if (initialDepth === 0 || state.mate || state.staleMate || state.draw)
        return evaluate(state, initialDepth);
      const hashNumber = bchHash(
        state.gameState,
        maximizingPlayer,
        state.castling,
        state.draw
      );
      //check if current position in transposition table
      const trans = transpositionTable.get(hashNumber);
      if (trans && trans.depth >= initialDepth) {
        //use saved values if position is reached earlier
        nextMove = { ...trans.move, depth: trans.depth };
        return trans.value;
      }

      if (maximizingPlayer) {
        let value = Number.NEGATIVE_INFINITY;
        let currBestMove: Move | null = null;
        const orderedMoves = getOrderedMoves(state);
        for (let move of orderedMoves) {
          const updatedState = getUpdatedState({ move, state });
          const evaluateValue = alphaBeta(
            initialDepth - 1,
            updatedState,
            false,
            alpha,
            beta
          );
          if (initialDepth === depth && value < evaluateValue) {
            currBestMove = move;
          }
          value = Math.max(value, evaluateValue);
          alpha = Math.max(alpha, value);

          if (beta <= value) {
            break;
          }
        }

        if (currBestMove !== null) {
          nextMove = { ...currBestMove, depth: initialDepth };
          if (value === Number.NEGATIVE_INFINITY) return value;

          transpositionTable.set(hashNumber, {
            value,
            move: currBestMove,
            depth: initialDepth,
          });
        }

        return value;
      } else {
        let value = Number.POSITIVE_INFINITY;
        let currBestMove: Move | null = null;
        const orderedMoves = getOrderedMoves(state);
        for (let move of orderedMoves) {
          const updatedState = getUpdatedState({ move, state });

          const evaluateValue = alphaBeta(
            initialDepth - 1,
            updatedState,
            true,
            alpha,
            beta
          );
          if (initialDepth === depth && value > evaluateValue) {
            currBestMove = move;
          }
          value = Math.min(value, evaluateValue);
          beta = Math.min(beta, value);
          if (value <= alpha) {
            break;
          }
        }

        if (currBestMove !== null) {
          nextMove = { ...currBestMove, depth: initialDepth };
          if (value === Number.POSITIVE_INFINITY) return value;

          transpositionTable.set(hashNumber, {
            value,
            move: currBestMove,
            depth: initialDepth,
          });
        }

        return value;
      }
    }

    if (nextMove) {
      resolve({ value: evaluationValue, move: nextMove });
    }
    reject(null);
  });
};

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
export const initializePolynomials = () => {
  const q = 2 ** 31; // A prime number slightly smaller than p
  const uniqueValues = new Set();

  const uniqueValue = () => {
    let value = Math.floor(Math.random() * q);
    while (uniqueValues.has(value)) {
      value = Math.floor(Math.random() * q);
    }
    uniqueValues.add(value);
    return value;
  };
  polynomials = Array.from({ length: 64 }, () =>
    Array.from({ length: 12 }, () =>
      Array.from({ length: 64 }, () => uniqueValue())
    )
  );
};
initializePolynomials();
