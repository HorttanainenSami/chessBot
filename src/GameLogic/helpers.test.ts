import {
  isNumeric,
  checkBitAt,
  removeBlockedMoves,
  SquareBit,
  bitPieces,
  getBitPiece,
  logger,
} from './helpers';
import Long from 'long';
import { Piece } from '../Types';

describe('isNumeric', () => {
  it('returns true for a string that can be converted to a number', () => {
    expect(isNumeric('123')).toBe(true);
    expect(isNumeric('123.456')).toBe(true);
  });

  it('returns false for a string that cannot be converted to a number', () => {
    expect(isNumeric('abc')).toBe(false);
    expect(isNumeric('123abc')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isNumeric(123)).toBe(false);
    expect(isNumeric(null)).toBe(false);
    expect(isNumeric(undefined)).toBe(false);
  });
});

describe('checkBitAt', () => {
  it('should return true if bit is set at index', () => {
    const long = Long.fromString('101', true, 2);
    const index = 1;
    expect(checkBitAt(long, index)).toBe(false);
  });
  it('should return false if bit is not set at index', () => {
    const long = Long.fromString('101', true, 2);
    const index = 0;
    expect(checkBitAt(long, index)).toBe(true);
  });
  it('should return true if bit is set at index', () => {
    const long = Long.fromString('10110101010100000000', true, 2);
    const index = 17;
    expect(checkBitAt(long, index)).toBe(true);
  });
});

describe('blockingPiece', () => {
  it('returns a mask with only the lowest set bit', () => {
    const attacks = Long.fromString('0x6', true, 16);
    const mask = Long.fromString('0xff', true, 16);
    const expected = Long.fromString('0x3', true, 16);
    const result = removeBlockedMoves(attacks, mask);
    expect(result).toEqual(expected);
  });

  it('returns a mask with only the highest set bit', () => {
    const attacks = Long.fromString('0x6', true, 16);
    const mask = Long.fromString('0xff', true, 16);
    const expected = Long.fromString('0xfc', true, 16);

    const result = removeBlockedMoves(attacks, mask, true);
    expect(result).toEqual(expected);
  });
});

describe('SquareBit', () => {
  it('has correct values', () => {
    expect(SquareBit.h1).toEqual(0);
    expect(SquareBit.g1).toEqual(1);
    expect(SquareBit.f1).toEqual(2);
    expect(SquareBit.e1).toEqual(3);
    expect(SquareBit.d1).toEqual(4);
    expect(SquareBit.c1).toEqual(5);
    expect(SquareBit.b1).toEqual(6);
    expect(SquareBit.a1).toEqual(7);
    expect(SquareBit.h2).toEqual(8);
    expect(SquareBit.g2).toEqual(9);
    expect(SquareBit.a8).toEqual(63);
  });
});

describe('getBitPiece', () => {
  it('should return the correct bit representation of the given piece', () => {
    const piece: Piece = 'bP';
    const result = getBitPiece(piece);
    expect(result).toEqual(bitPieces.p);
  });

  it('should return the correct bit representation of the given piece', () => {
    const piece: Piece = 'bN';
    const result = getBitPiece(piece);
    expect(result).toEqual(bitPieces.n);
  });
});
