import Long from 'long';
import { Piece } from '../Types';
import { state } from './gameStateChanger';

//help to log bitboard in console effeciently
export const logger = (l: Long, text?: string) => {
  if (text) {
    return console.log(
      `${text}\n${l
        .toString(2)
        .padStart(64, '0')
        .match(/.{1,8}/g)
        ?.join('\n')}`
    );
  }
  return console.log(
    l
      .toString(2)
      .padStart(64, '0')
      .match(/.{1,8}/g)
      ?.join('\n')
  );
};

export function isNumeric(expectedValue: any) {
  if (typeof expectedValue === 'number') return true;
  if (
    typeof expectedValue === 'string' &&
    !Number.isNaN(Number(expectedValue))
  ) {
    return true;
  }
  return false;
}
export function getBlackOccupiedBits(state: Long[]) {
  return state.reduce(
    (sum, acc, index) => (index % 2 !== 0 ? sum.or(acc) : sum),
    Long.UZERO
  );
}
export function getOccupiedBits(state: Long[]) {
  return state.reduce((sum, acc) => sum.or(acc), Long.UZERO);
}
export const checkBitAt = (long: Long, index: number) =>
  !long.shiftRightUnsigned(index).and(1).isZero();

//Lowercase represents black Uppercase white piece
export enum bitPieces {
  'P',
  'p',
  'R',
  'r',
  'B',
  'b',
  'N',
  'n',
  'Q',
  'q',
  'K',
  'k',
}
// convert square to its pointing bitindex
export enum SquareBit {
  'h1',
  'g1',
  'f1',
  'e1',
  'd1',
  'c1',
  'b1',
  'a1',
  'h2',
  'g2',
  'f2',
  'e2',
  'd2',
  'c2',
  'b2',
  'a2',
  'h3',
  'g3',
  'f3',
  'e3',
  'd3',
  'c3',
  'b3',
  'a3',
  'h4',
  'g4',
  'f4',
  'e4',
  'd4',
  'c4',
  'b4',
  'a4',
  'h5',
  'g5',
  'f5',
  'e5',
  'd5',
  'c5',
  'b5',
  'a5',
  'h6',
  'g6',
  'f6',
  'e6',
  'd6',
  'c6',
  'b6',
  'a6',
  'h7',
  'g7',
  'f7',
  'e7',
  'd7',
  'c7',
  'b7',
  'a7',
  'h8',
  'g8',
  'f8',
  'e8',
  'd8',
  'c8',
  'b8',
  'a8',
}
