import {
  knightPseudoMoves,
  bishopPseudoMoves,
  kingPseudoMoves,
  bishopLegalMoves,
  checkForADiagonalBlockingPieces,
  checkForDiagonalBlockingPieces,
  rookPseudoMoves,
  rookLegalMoves,
  pawnPseudoMoves,
  pawnLegalMoves,
  pawnPseudoAttacks,
} from './moveMasks';
import { logger } from './helpers';
import Long from 'long';
//**********************************KNIGHT*****************************************
describe('knightPseudoMoves', () => {
  const mask = Long.UONE;
  it('should return the correct pseudo moves for a knight', () => {
    const fromBitIndex = 0;
    const knightPosition = mask.shiftLeft(fromBitIndex);
    const expectedPseudoMoves = new Long(0x20401, 0, true);
    expect(knightPseudoMoves({ knightPosition })).toEqual(expectedPseudoMoves);
  });

  it('should return the correct pseudo moves for a knight on the A file', () => {
    const fromBitIndex = 7;
    const knightPosition = mask.shiftLeft(fromBitIndex);
    const expectedPseudoMoves = new Long(0x402080, 0, true);
    expect(knightPseudoMoves({ knightPosition }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });

  it('should return the correct pseudo moves for a knight on the up-left corner', () => {
    const fromBitIndex = 56;
    const knightPosition = mask.shiftLeft(fromBitIndex);
    const expectedPseudoMoves = new Long(0, 0x1040200, true);
    expect(knightPseudoMoves({ knightPosition }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });
  it('should return the correct pseudo moves for a knight on the middle of board', () => {
    const fromBitIndex = 27;
    const knightPosition = mask.shiftLeft(fromBitIndex);
    const expectedPseudoMoves = new Long(0x8221400, 0x1422, true);
    expect(knightPseudoMoves({ knightPosition }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });
});
//**********************************BISHOP*****************************************

describe('bishopPseudoMoves', () => {
  it('should return the correct pseudo moves for a bishop at index 0', () => {
    const fromBitIndex = 0;
    const expectedPseudoMoves = new Long(0x8040201, 0x80402010, true);
    expect(bishopPseudoMoves({ fromBitIndex })).toEqual(expectedPseudoMoves);
  });

  it('should return the correct pseudo moves for a bishop at index 7', () => {
    const fromBitIndex = 7;
    const expectedPseudoMoves = new Long(0x10204080, 0x1020408, true);
    expect(bishopPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });

  it('should return the correct pseudo moves for a bishop at index 56', () => {
    const fromBitIndex = 56;
    const expectedPseudoMoves = new Long(0x10204080, 0x1020408, true);
    expect(bishopPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });
  it('should return the correct pseudo moves for a bishop at index 27', () => {
    const fromBitIndex = 27;
    const expectedPseudoMoves = new Long(0x8142241, 0x80412214, true);
    expect(bishopPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });
});

describe('bishopLegalMoves', () => {
  it('should return all possible moves for bishop on D4 when board is empty', () => {
    const fromBitIndex = 28;
    const bishopPosition = Long.fromString('0x10000000', true, 16);
    const occupiedBits = Long.fromString('0x10000000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x10000000', true, 16);
    const expectedMoves = Long.fromString('0x182442800284482', true, 16);
    const possibleMoves = bishopPseudoMoves({ fromBitIndex });
    const params = {
      possibleMoves,
      bishopPosition,
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
    };

    expect(bishopLegalMoves(params)).toEqual(expectedMoves);
  });

  it('should return all possible moves for bishop on D4 when board is not empty', () => {
    const fromBitIndex = 28;
    const bishopPosition = Long.fromString('0x10000000', true, 16);
    const occupiedBits = Long.fromString('0xffff0000100000ff', true, 16);
    const teammateOccupiedBits = Long.fromString('0x100000ff', true, 16);
    const expectedMoves = Long.fromString('0x82442800284400', true, 16);
    const possibleMoves = bishopPseudoMoves({ fromBitIndex });
    const params = {
      possibleMoves,
      bishopPosition,
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
    };

    expect(bishopLegalMoves(params)).toEqual(expectedMoves);
  });
  it('should return all possible moves for bishop on A8', () => {
    const fromBitIndex = 63;
    const bishopPosition = Long.fromString('0x8000000000000000', true, 16);
    const occupiedBits = Long.fromString('0x80000000ff00ff00', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x800000000000ff00',
      true,
      16
    );
    const expectedMoves = Long.fromString('0x40201008000000', true, 16);
    const possibleMoves = bishopPseudoMoves({ fromBitIndex });
    const params = {
      possibleMoves,
      bishopPosition,
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
    };

    expect(bishopLegalMoves(params)).toEqual(expectedMoves);
  });

  it('should return all possible moves for bishop on A8 when behind blocker there is empty squares', () => {
    const fromBitIndex = 28;
    const bishopPosition = Long.fromString('0x10000000', true, 16);
    const occupiedBits = Long.fromString('0x80402010ff0002', true, 16);
    const teammateOccupiedBits = Long.fromString('0x80000010ff0002', true, 16);
    const expectedMoves = Long.fromString('0x102042800000000', true, 16);
    const possibleMoves = bishopPseudoMoves({ fromBitIndex });
    const params = {
      possibleMoves,
      bishopPosition,
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
    };
    expect(bishopLegalMoves(params)).toEqual(expectedMoves);
  });
});

describe('checkForDiagonalBlockingPieces', () => {
  test('all pieces blocked', () => {
    const possibleMoves = Long.fromString('0x8040201008040201', true, 16);
    const occupiedSquares = Long.fromString('0x8040201008040201', true, 16);
    const blockedMoves = checkForDiagonalBlockingPieces({
      possibleMoves,
      occupiedSquares,
    });
    expect(blockedMoves).toEqual(occupiedSquares);
  });

  test('no pieces blocked', () => {
    const possibleMoves = Long.fromString('0x8040201008040201', true, 16);
    const occupiedSquares = Long.fromString('0x0', true, 16);
    const blockedMoves = checkForDiagonalBlockingPieces({
      possibleMoves,
      occupiedSquares,
    });
    expect(blockedMoves.toString(2)).toEqual(occupiedSquares.toString(2));
  });

  test('some pieces blocked', () => {
    const possibleMoves = Long.fromString('0x8040201008000000', true, 16);
    const occupiedSquares = Long.fromString('0x8000200000000000', true, 16);

    const blockedMoves = checkForDiagonalBlockingPieces({
      possibleMoves,
      occupiedSquares,
    });
    expect(blockedMoves.toString(2)).toEqual(possibleMoves.toString(2));
  });
});

describe('checkForADiagonalBlockingPieces', () => {
  test('all pieces blocked', () => {
    const possibleMoves = Long.fromString('0x102040810204080', true, 16);
    const occupiedSquares = Long.fromString('0x102040810204080', true, 16);
    const blockedMoves = checkForADiagonalBlockingPieces({
      possibleMoves,
      occupiedSquares,
    });
    expect(blockedMoves).toEqual(occupiedSquares);
  });

  test('no pieces blocked', () => {
    const possibleMoves = Long.fromString('0x102040810204080', true, 16);
    const occupiedSquares = Long.fromString('0x0', true, 16);
    const blockedMoves = checkForADiagonalBlockingPieces({
      possibleMoves,
      occupiedSquares,
    });
    expect(blockedMoves.toString(2)).toEqual(occupiedSquares.toString(2));
  });

  test('some pieces blocked', () => {
    const possibleMoves = Long.fromString('0x102040810000000', true, 16);
    const occupiedSquares = Long.fromString('0x100040000000000', true, 16);

    const blockedMoves = checkForADiagonalBlockingPieces({
      possibleMoves,
      occupiedSquares,
    });
    expect(blockedMoves.toString(2)).toEqual(possibleMoves.toString(2));
  });
});

//**********************************KING*****************************************

describe('kingPseudoMoves', () => {
  it('should return all possible moves for king on D4', () => {
    const kingPosition = Long.fromString('0x10000000', true, 16);
    const expectedMoves = Long.fromString('0x3828380000', true, 16);
    expect(kingPseudoMoves({ kingPosition })).toEqual(expectedMoves);
  });

  it('should return all possible moves for king on A8', () => {
    const kingPosition = Long.fromString('0x8000000000000000', true, 16);
    const expectedMoves = Long.fromString('0x40c0000000000000', true, 16);
    expect(kingPseudoMoves({ kingPosition })).toEqual(expectedMoves);
  });

  it('should return all possible moves for king on H8', () => {
    const kingPosition = Long.fromString('0x0100000000000000', true, 16);
    const expectedMoves = Long.fromString('0x203000000000000', true, 16);
    expect(kingPseudoMoves({ kingPosition })).toEqual(expectedMoves);
  });
  it('should return all possible moves for king on H8', () => {
    const kingPosition = Long.fromString('0x0100000000000000', true, 16);
    const expectedMoves = Long.fromString('0x203000000000000', true, 16);
    expect(kingPseudoMoves({ kingPosition })).toEqual(expectedMoves);
  });
});

//**********************************ROOK*****************************************

describe('RookPseudoMoves', () => {
  it('should return all possible moves for rook on D4', () => {
    const fromBitIndex = 28;
    const expectedMoves = Long.fromString('0x10101010ff101010', true, 16);
    expect(rookPseudoMoves({ fromBitIndex })).toEqual(expectedMoves);
  });

  it('should return all possible moves for rook on A8', () => {
    const fromBitIndex = 63;
    const expectedMoves = Long.fromString('0xff80808080808080', true, 16);
    expect(rookPseudoMoves({ fromBitIndex })).toEqual(expectedMoves);
  });

  it('should return all possible moves for rook on H8', () => {
    const fromBitIndex = 56;
    const expectedMoves = Long.fromString('0xff01010101010101', true, 16);
    expect(rookPseudoMoves({ fromBitIndex })).toEqual(expectedMoves);
  });
});

describe('RookLegalMoves', () => {
  it('should return all possible moves for rook on D4, empty', () => {
    const fromBitIndex = 28;
    const rookMoveMask = Long.fromString('0x10101010ff101010', true, 16);
    const occupiedSquares = Long.fromString('0x0', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x10101010ff101010',
      true,
      16
    );
    const params = {
      rookMoveMask,
      occupiedSquares,
      teammateOccupiedBits,
      fromBitIndex,
    };

    expect(rookLegalMoves(params)).toEqual(expectedMoves);
  });
  it('should return all possible moves for rook on D4, full of teammates', () => {
    const fromBitIndex = 28;
    const rookMoveMask = Long.fromString('0x10101010ff101010', true, 16);
    const occupiedSquares = Long.fromString('0xffffffffffffffff', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x10101010ff101010',
      true,
      16
    );
    const params = {
      rookMoveMask,
      occupiedSquares,
      teammateOccupiedBits,
      fromBitIndex,
    };

    expect(rookLegalMoves(params).toString(2)).toEqual(
      expectedMoves.toString(2)
    );
  });

  it('should return all possible moves for rook on D4, full of enemies', () => {
    const fromBitIndex = 28;
    const rookMoveMask = Long.fromString('0x10101010ff101010', true, 16);
    const occupiedSquares = Long.fromString('0xffffffffffffffff', true, 16);
    const expectedMoves = Long.fromString('0x1028100000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x10000000', true, 16);
    const params = {
      rookMoveMask,
      occupiedSquares,
      teammateOccupiedBits,
      fromBitIndex,
    };

    expect(rookLegalMoves(params).toString(2)).toEqual(
      expectedMoves.toString(2)
    );
  });
  it('should return all possible moves for rook on D4, some filled', () => {
    const fromBitIndex = 28;
    const rookMoveMask = Long.fromString('0x10101010ff101010', true, 16);
    const occupiedSquares = Long.fromString('0x10101000c3101010', true, 16);
    const expectedMoves = Long.fromString('0x106e000000', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x1000100081100010',
      true,
      16
    );
    const params = {
      rookMoveMask,
      occupiedSquares,
      teammateOccupiedBits,
      fromBitIndex,
    };

    expect(rookLegalMoves(params).toString(2)).toEqual(
      expectedMoves.toString(2)
    );
  });
});

//**********************************PAWN*****************************************
describe('pawnPseudoMoves', () => {
  it('should return correct move mask for white pawn in start position', () => {
    const fromBitIndex = 8;
    const color = 'w';
    const expectedMoveMask = Long.fromString('0x1010000', true, 16);

    expect(pawnPseudoMoves({ fromBitIndex, color })).toEqual(expectedMoveMask);
  });

  it('should return correct move mask for black pawn in start position', () => {
    const fromBitIndex = 48;
    const color = 'b';
    const expectedMoveMask = Long.fromString('0x10100000000', true, 16);
    expect(pawnPseudoMoves({ fromBitIndex, color })).toEqual(expectedMoveMask);
  });

  it('should return correct move mask for white pawn not in start position', () => {
    const fromBitIndex = 16;
    const color = 'w';
    const expectedMoveMask = Long.fromString('0x1000000', true, 16);

    expect(pawnPseudoMoves({ fromBitIndex, color })).toEqual(expectedMoveMask);
  });

  it('should return correct move mask for black pawn not in start position', () => {
    const fromBitIndex = 39;
    const color = 'b';
    const expectedMoveMask = Long.fromString('0x80000000', true, 16);

    expect(pawnPseudoMoves({ fromBitIndex, color })).toEqual(expectedMoveMask);
  });
});

describe('pawnPseudoAttacks', () => {
  it('returns the correct attack moves for a black pawn on A7', () => {
    const fromBitIndex = 55;
    const color = 'b';
    const expectedAttacks = Long.fromString('0x400000000000', true, 16);
    const result = pawnPseudoAttacks({ fromBitIndex, color });
    expect(result).toEqual(expectedAttacks);
  });

  it('returns the correct attack moves for a black pawn on H7', () => {
    const fromBitIndex = 48;
    const color = 'b';
    const expectedAttacks = Long.fromString('0x20000000000', true, 16);
    const result = pawnPseudoAttacks({ fromBitIndex, color });
    expect(result).toEqual(expectedAttacks);
  });

  it('returns the correct attack moves for a white pawn on A2', () => {
    const fromBitIndex = 15;
    const color = 'w';
    const expectedAttacks = Long.fromString('0x400000', true, 16);
    const result = pawnPseudoAttacks({ fromBitIndex, color });
    expect(result).toEqual(expectedAttacks);
  });

  it('returns the correct attack moves for a white pawn on H2', () => {
    const fromBitIndex = 8;
    const color = 'w';
    const expectedAttacks = Long.fromString('0x20000', true, 16);
    const result = pawnPseudoAttacks({ fromBitIndex, color });
    expect(result).toEqual(expectedAttacks);
  });
  it('returns the correct attack moves for a black pawn on B7', () => {
    const fromBitIndex = 54;
    const color = 'b';
    const expectedAttacks = Long.fromString('0xa00000000000', true, 16);
    const result = pawnPseudoAttacks({ fromBitIndex, color });
    expect(result).toEqual(expectedAttacks);
  });
  it('returns the correct attack moves for a white pawn on B2', () => {
    const fromBitIndex = 14;
    const color = 'w';
    const expectedAttacks = Long.fromString('0xa00000', true, 16);
    const result = pawnPseudoAttacks({ fromBitIndex, color });
    expect(result).toEqual(expectedAttacks);
  });
});

describe('pawnLegalMoves', () => {
  it('returns correct legal moves for a black pawn in the starting position', () => {
    const fromBitIndex = 48;
    const color = 'b';
    const enemyOccupied = Long.UZERO;
    const occupiedSquares = Long.fromString('0x100', true, 16);
    const expected = Long.fromString('0x10100000000', true, 16);
    const elPassant = null;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });

  it('returns correct legal moves for a white pawn in the starting position', () => {
    const fromBitIndex = 8;
    const color = 'w';
    const enemyOccupied = Long.UZERO;
    const occupiedSquares = Long.fromString('0x100', true, 16);
    const expected = Long.fromString('0x1010000', true, 16);
    const elPassant = null;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });

  it('returns correct legal moves for a black pawn that can only capture enemy pieces', () => {
    const fromBitIndex = 49;
    const color = 'b';
    const enemyOccupied = Long.fromString('0xff0000000000', true, 16);
    const occupiedSquares = Long.fromString('0x2ff0000000000', true, 16);
    const expected = Long.fromString('0x50000000000', true, 16);
    const elPassant = null;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });

  it('returns correct legal moves for a white pawn that can only capture enemy pieces', () => {
    const fromBitIndex = 9;
    const color = 'w';
    const enemyOccupied = Long.fromString('0xff0000', true, 16);
    const occupiedSquares = Long.fromString('0xff0200', true, 16);
    const expected = Long.fromString('0x50000', true, 16);
    const elPassant = null;
    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });

  it('returns correct legal moves for a black pawn that is blocked from quiet move', () => {
    const fromBitIndex = 49;
    const color = 'b';
    const enemyOccupied = Long.UZERO;
    const occupiedSquares = Long.fromString('0x2020000000000', true, 16);
    const expected = Long.fromString('0x0', true, 16);
    const elPassant = null;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });

  it('returns correct legal moves for a white pawn that is blocked from quiet move', () => {
    const fromBitIndex = 9;
    const color = 'w';
    const enemyOccupied = Long.UZERO;
    const occupiedSquares = Long.fromString('0x20200', true, 16);
    const expected = Long.fromString('0x0', true, 16);
    const elPassant = null;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });
  it('returns correct legal moves for a white pawn that is in position to elpassant', () => {
    const fromBitIndex = 37;
    const color = 'w';
    const enemyOccupied = Long.fromString('0xef001000000000', true, 16);
    const occupiedSquares = Long.fromString('0xcf003000000000', true, 16);
    const expected = Long.fromString('0x300000000000', true, 16);
    const elPassant = 44;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });
  it('returns correct legal moves for a white pawn that is not in square to elpassant', () => {
    const fromBitIndex = 45;
    const color = 'w';
    const enemyOccupied = Long.fromString('0xef001000000000', true, 16);
    const occupiedSquares = Long.fromString('0xcf201000000000', true, 16);
    const expected = Long.fromString('0x60000000000000', true, 16);
    const elPassant = 44;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });
  it('returns correct legal moves for a black pawn that is not in square to elpassant', () => {
    const fromBitIndex = 27;
    const color = 'b';
    const enemyOccupied = Long.fromString('0x1000ef00', true, 16);
    const occupiedSquares = Long.fromString('0x1800ef00', true, 16);
    const expected = Long.fromString('0x180000', true, 16);
    const elPassant = 20;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
        elPassant,
      })
    ).toEqual(expected);
  });
});
