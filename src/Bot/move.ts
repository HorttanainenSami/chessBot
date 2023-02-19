import {
  getState,
  getUpdatedState,
  makeMove,
} from '../GameLogic/gameStateChanger';
import { SquareBit, logger } from '../GameLogic/helpers';
import { IAllMoves, getMoves, getMovesReturn } from '../GameLogic/move';
import { Color, Move, PieceSymbol, Square } from '../Types';
import Long from 'long';
import { state } from '../GameLogic/gameStateChanger';
import { evaluate } from './evaluation';

export const move = async ({ color }: { color: Color }) => {
  //const nextMove = await mini(color);
  const start = Date.now();
  console.log('start');
  const nextMiniMax = await miniMax(4, color);
  const end = Date.now();
  console.log(`Execution time: ${end - start} ms`);

  return makeMove(nextMiniMax);
};

export const getBitIndexes = (bitString: Long) => {
  let algebricNotation: string[] = [];
  const bit = bitString.toString(2);
  for (let i = bit.length - bitString.countTrailingZeros(); i >= 0; i--) {
    const hexAtI = bit.charAt(i);
    switch (hexAtI) {
      case '1': {
        algebricNotation = [
          ...algebricNotation,
          SquareBit[bit.length - i - 1] as string,
        ];
        break;
      }
    }
  }

  return algebricNotation;
};

const miniMax = (depth: number, color: Color): Promise<Move> => {
  return new Promise((resolve, reject) => {
    const initialState = getState();
    let nextMove: Move | null = null;

    mm(
      depth,
      initialState,
      color === 'w' ? true : false,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY
    );
    function mm(
      depth: number,
      state: state,
      maximixingPlayer: boolean,
      alpha: number,
      beta: number
    ) {
      if (depth === 0 || state.mate) return evaluate(state);

      if (maximixingPlayer) {
        let maxEval = Number.NEGATIVE_INFINITY;
        let funcMove: Move | null = null;

        for (let [fromBitIndex, pieceInfo] of getMoves({
          color: state.turn,
          state,
        })) {
          let possibleMoves = pieceInfo.moves;
          let possibleAttacks = pieceInfo.attacks;

          while (!possibleMoves.isZero()) {
            const toBitIndex = possibleMoves.countTrailingZeros();
            const move = {
              from: SquareBit[fromBitIndex] as Square,
              to: SquareBit[toBitIndex] as Square,
              promotion: 'q' as PieceSymbol,
              color: pieceInfo.color,
              piece: pieceInfo.piece,
            };
            const updatedState = getUpdatedState({ move, state });
            const evaluate = mm(depth - 1, updatedState, false, alpha, beta);
            if (maxEval < evaluate) {
              maxEval = evaluate;
              funcMove = move;
            }
            alpha = Math.max(alpha, maxEval);
            if (beta <= alpha) break;
            possibleMoves = possibleMoves.and(Long.UONE.shl(toBitIndex).not());
          }
        }
        nextMove = funcMove;
        return maxEval;
      } else {
        let minEval = Number.POSITIVE_INFINITY;
        let funcMove: Move | null = null;

        for (let [fromBitIndex, pieceInfo] of getMoves({
          color: state.turn,
          state,
        })) {
          let possibleMoves = pieceInfo.moves;
          let possibleAttacks = pieceInfo.attacks;
          while (!possibleMoves.isZero()) {
            const toBitIndex = possibleMoves.countTrailingZeros();
            const move = {
              from: SquareBit[fromBitIndex] as Square,
              to: SquareBit[toBitIndex] as Square,
              promotion: 'q' as PieceSymbol,
              color: pieceInfo.color,
              piece: pieceInfo.piece,
            };
            const updatedState = getUpdatedState({ move, state });

            const evaluate = mm(depth - 1, updatedState, true, alpha, beta);
            if (minEval > evaluate) {
              minEval = evaluate;
              beta = Math.min(alpha, minEval);
              funcMove = move;
            }
            beta = Math.min(alpha, minEval);
            if (beta <= alpha) break;
            possibleMoves = possibleMoves.and(Long.UONE.shl(toBitIndex).not());
          }
        }

        nextMove = funcMove;
        return minEval;
      }
    }
    if (nextMove) resolve(nextMove);
    reject(null);
  });
};
