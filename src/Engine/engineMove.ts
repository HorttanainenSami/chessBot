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

interface transpositionI {
  depth: number;
  value: number;
  move: Move | null;
  alpha: number;
  beta: number;
}

let transpositionTable = new Map<number, transpositionI>();
export let polynomials: number[][][] = [];

export const move = async ({ color }: { color: Color }) => {
  try {
    const start = Date.now();

    console.log('start');
    transpositionTable.clear();
    const nextMiniMax = await enginesNextMove(4, color);
    const end = Date.now();
    console.log(`Execution time: ${end - start} ms`);

    return makeMove(nextMiniMax);
  } catch (e) {
    console.log(e, 'error');
  }
};

export const enginesNextMove = (depth: number, color: Color): Promise<Move> => {
  let leaves = 0;
  return new Promise((resolve, reject) => {
    const initialState = getState();
    let nextMove: Move | null = null;
    const evaluatioValue = alphaBeta(
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
    ): number {
      leaves++;
      if (depth === 0 || state.mate || state.staleMate || state.draw)
        return evaluate(state, depth);
      const hashNumber = bchHash(
        state.gameState,
        maximizingPlayer,
        state.castling,
        state.draw
      );

      const trans = transpositionTable.get(hashNumber);
      if (trans && trans.depth >= depth) {
        if (beta <= trans.alpha) {
          if (trans.move) nextMove = trans.move;
          return trans.alpha;
        }
        if (trans.beta <= alpha) {
          if (trans.move) nextMove = trans.move;
          return trans.beta;
        }
        alpha = Math.max(trans.alpha, alpha);
        beta = Math.min(trans.beta, beta);
      }

      if (maximizingPlayer) {
        let value = Number.NEGATIVE_INFINITY;
        let currBestMove: Move | null = null;
        const orderedMoves = getOrderedMoves(state);
        for (let move of orderedMoves) {
          const updatedState = getUpdatedState({ move, state });
          const evaluateValue = alphaBeta(
            depth - 1,
            updatedState,
            false,
            alpha,
            beta
          );
          if (value < evaluateValue) {
            value = evaluateValue;
            currBestMove = move;
          }
          alpha = Math.max(alpha, value);

          if (beta <= value) {
            break;
          }
        }

        if (currBestMove !== null) {
          nextMove = currBestMove;
        }
        transpositionTable.set(hashNumber, {
          value,
          move: currBestMove,
          alpha,
          beta,
          depth,
        });

        return value;
      } else {
        let value = Number.POSITIVE_INFINITY;
        let currBestMove: Move | null = null;
        const orderedMoves = getOrderedMoves(state);
        for (let move of orderedMoves) {
          const updatedState = getUpdatedState({ move, state });

          const evaluateValue = alphaBeta(
            depth - 1,
            updatedState,
            true,
            alpha,
            beta
          );

          if (value > evaluateValue) {
            value = evaluateValue;
            currBestMove = move;
          }
          beta = Math.min(beta, value);
          if (value <= alpha) {
            break;
          }
        }

        if (currBestMove !== null) {
          nextMove = currBestMove;
        }

        transpositionTable.set(hashNumber, {
          value,
          move: currBestMove,
          alpha,
          beta,
          depth,
        });

        return value;
      }
    }

    console.log(evaluatioValue);
    console.log(nextMove);
    if (nextMove) resolve(nextMove);
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
