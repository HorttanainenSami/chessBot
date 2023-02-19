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

  const nextMiniMax = await miniMax(3, color);
  const end = Date.now();
  console.log(`Execution time: ${end - start} ms`);
  console.log(nextMiniMax);
  if (color === 'w') {
    console.log('called white piece');
  }
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
    let score = 0;
    let nextMove: Move | null = null;
    //white is positive
    //black is negative
    const initialState = getState();
    if (color === 'w') {
      maxi(depth, initialState);
    } else {
      mini(depth, initialState);
    }
    return nextMove ? resolve(nextMove) : reject(null);
    function maxi(depth: number, state: state) {
      if (depth === 0) return evaluate(state);
      let max = -9999999;

      for (let [fromBitIndex, pieceInfo] of getMoves({
        color: state.turn,
        state,
      })) {
        let possibleMoves = pieceInfo.moves;
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

          score = mini(depth - 1, updatedState);
          //score = mini(depth - 1, state);
          if (score > max) {
            max = score;
            nextMove = move;
          }
          possibleMoves = possibleMoves.and(Long.UONE.shl(toBitIndex).not());
        }
      }
      return max;
    }
    function mini(depth: number, state: state) {
      if (depth === 0) return -evaluate(state);
      let min = 9999999;
      for (let [fromBitIndex, pieceInfo] of getMoves({
        color: state.turn,
        state,
      })) {
        //depth-1 and state with moved piece
        let possibleMoves = pieceInfo.moves;

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

          score = maxi(depth - 1, updatedState);
          //score = maxi(depth - 1, state);
          if (score < min) {
            min = score;
            nextMove = move;
          }
          possibleMoves = possibleMoves.and(Long.UONE.shl(toBitIndex).not());
        }
      }
      return min;
    }
  });
};
