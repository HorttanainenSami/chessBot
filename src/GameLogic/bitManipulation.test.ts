import {
  bitScanBackwards,
  bitScanForward,
  removeBlockedMovesBackwards,
  removeBlockedMovesForward,
} from './bitManipulation';
import Long from 'long';

describe('RemoveBlockedMovesBackwards', () => {
  it('should return all possible moves for Emask, without any blockers from D4', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x10000000', true, 16);
    const moveMask = Long.fromString('0x1f000000', true, 16);
    const expectedMoves = Long.fromString('0x1f000000', true, 16);
    expect(
      removeBlockedMovesBackwards(fromBitIndex, moveMask, occupiedBits)
    ).toEqual(expectedMoves);
  });
  it('should return all possible moves for Smask, without any blockers from d4', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x10000000', true, 16);
    const moveMask = Long.fromString('0x1010101010000000', true, 16);
    const expectedMoves = Long.fromString('0x1010101010000000', true, 16);
    expect(
      removeBlockedMovesBackwards(fromBitIndex, moveMask, occupiedBits)
    ).toEqual(expectedMoves);
  });
  it('should return all possible moves for Emask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const moveMask = Long.fromString('0x1f000000', true, 16);
    const expectedMoves = Long.fromString('0x18000000', true, 16);
    expect(
      removeBlockedMovesBackwards(fromBitIndex, moveMask, occupiedBits)
    ).toEqual(expectedMoves);
  });
  it('should return all possible moves for Emask on D4, full, remove blockers', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const moveMask = Long.fromString('0x1f000000', true, 16);
    const expectedMoves = Long.fromString('0x10000000', true, 16);
    expect(
      removeBlockedMovesBackwards(fromBitIndex, moveMask, occupiedBits, true)
    ).toEqual(expectedMoves);
  });
  it('should return all possible moves for Smask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const moveMask = Long.fromString('0x10101010', true, 16);
    const expectedMoves = Long.fromString('0x10100000', true, 16);
    expect(
      removeBlockedMovesBackwards(fromBitIndex, moveMask, occupiedBits)
    ).toEqual(expectedMoves);
  });
  it('should return all possible moves for Smask on D4, full', () => {
    const fromBitIndex = 48;
    const occupiedBits = Long.fromString('0x1000000000000', true, 16);
    const moveMask = Long.fromString('0x10100000000', true, 16);
    const expectedMoves = Long.fromString('0x10100000000', true, 16);
    const result = removeBlockedMovesBackwards(
      fromBitIndex,
      moveMask,
      occupiedBits
    );
    expect(result).toEqual(expectedMoves);
  });
  it('should return all possible moves for Smask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x1000000000000', true, 16);
    const moveMask = Long.fromString('0x10100000000', true, 16);
    const expectedMoves = Long.fromString('0x10100000000', true, 16);
    expect(
      removeBlockedMovesForward(fromBitIndex, moveMask, occupiedBits, true)
    ).toEqual(expectedMoves);
  });
});

describe('RemoveBlockedMovesForward', () => {
  it('should return all possible moves for positive Wmask from D4', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x10000000', true, 16);
    const moveMask = Long.fromString('0xf0000000', true, 16);
    const expectedMoves = Long.fromString('0xf0000000', true, 16);
    expect(
      removeBlockedMovesForward(fromBitIndex, moveMask, occupiedBits)
    ).toEqual(expectedMoves);
  });
  it('should return all possible moves for positive Nmask from D4', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x10000000', true, 16);
    const moveMask = Long.fromString('0x1010101010000000', true, 16);
    const expectedMoves = Long.fromString('0x1010101010000000', true, 16);
    expect(
      removeBlockedMovesForward(fromBitIndex, moveMask, occupiedBits)
    ).toEqual(expectedMoves);
  });
  it('should return all possible moves for Nmask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const moveMask = Long.fromString('0x1010101010000000', true, 16);
    const expectedMoves = Long.fromString('0x1010000000', true, 16);
    expect(
      removeBlockedMovesForward(fromBitIndex, moveMask, occupiedBits)
    ).toEqual(expectedMoves);
  });
  it('should return all possible moves for Wmask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const moveMask = Long.fromString('0xf0000000', true, 16);
    const expectedMoves = Long.fromString('0x30000000', true, 16);
    expect(
      removeBlockedMovesForward(fromBitIndex, moveMask, occupiedBits)
    ).toEqual(expectedMoves);
  });
});
describe('bitScanForward', () => {
  it('should return all possible moves for positive Wmask from D4', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('ffffffffffffffff', true, 16);
    const moveMask = Long.fromString('18000000', true, 16);
    const expectedMoves = Long.fromString(
      '8000000',
      true,
      16
    ).countTrailingZeros();
    expect(bitScanForward(fromBitIndex, moveMask, occupiedBits)).toEqual(
      expectedMoves
    );
  });
  it('should return all possible moves for positive Nmask from D4', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('ffffefefffffffff', true, 16);
    const moveMask = Long.fromString('1010101010000000', true, 16);
    const expectedMoves = Long.fromString(
      '10000000000000',
      true,
      16
    ).countTrailingZeros();
    expect(bitScanForward(fromBitIndex, moveMask, occupiedBits)).toEqual(
      expectedMoves
    );
  });
  it('should return all possible moves for Nmask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('81010110000000', true, 16);
    const moveMask = Long.fromString('80402010000000', true, 16);
    const expectedMoves = Long.fromString(
      '80000000000000',
      true,
      16
    ).countTrailingZeros();
    expect(bitScanForward(fromBitIndex, moveMask, occupiedBits)).toEqual(
      expectedMoves
    );
  });
  it('should return all possible moves for Wmask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('1083412110000000', true, 16);
    const moveMask = Long.fromString('1010101010000000', true, 16);
    const expectedMoves = Long.fromString(
      '1000000000000000',
      true,
      16
    ).countTrailingZeros();
    expect(bitScanForward(fromBitIndex, moveMask, occupiedBits)).toEqual(
      expectedMoves
    );
  });
});

describe('bitScanBackwards', () => {
  it('should return all possible moves for positive Wmask from D4', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('1083412110000010', true, 16);
    const moveMask = Long.fromString('10101010', true, 16);
    const expectedMoves = Long.fromString('10', true, 16).countTrailingZeros();
    expect(bitScanBackwards(fromBitIndex, moveMask, occupiedBits)).toEqual(
      expectedMoves
    );
  });
  it('should return all possible moves for positive Nmask from D4', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('ffffffffffffffff', true, 16);
    const moveMask = Long.fromString('10101010', true, 16);
    const expectedMoves = Long.fromString(
      '100000',
      true,
      16
    ).countTrailingZeros();
    expect(bitScanBackwards(fromBitIndex, moveMask, occupiedBits)).toEqual(
      expectedMoves
    );
  });
  it('should return all possible moves for Nmask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('fffffffff1ffffff', true, 16);
    const moveMask = Long.fromString('1f000000', true, 16);
    const expectedMoves = Long.fromString(
      '1000000',
      true,
      16
    ).countTrailingZeros();
    expect(bitScanBackwards(fromBitIndex, moveMask, occupiedBits)).toEqual(
      expectedMoves
    );
  });
  it('should return all possible moves for Wmask on D4, full', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('fffffffff1070307', true, 16);
    const moveMask = Long.fromString('10080402', true, 16);
    const expectedMoves = Long.fromString('2', true, 16).countTrailingZeros();
    expect(bitScanBackwards(fromBitIndex, moveMask, occupiedBits)).toEqual(
      expectedMoves
    );
  });
});
