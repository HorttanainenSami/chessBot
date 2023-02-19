import { logger } from './helpers';
import Long from 'long';
import { Color } from '../../frontend/src/Types';
import * as moveMasks from '../preCalculatedMoveMasks';
import {
  kingPseudoMoves,
  bishopLegalMoves,
  bishopAttacks,
  rookLegalMoves,
  rookLegalAttacks,
  pawnLegalMoves,
  pawnPseudoAttacks,
  pawnPseudoMoves,
  knightPseudoMoves,
} from './moveMask';

moveMasks.initializePreCalculatedMoves();

//**********************************KNIGHT*****************************************
describe('knightPseudoMoves', () => {
  it('should return the correct pseudo moves for a knight', () => {
    const fromBitIndex = 0;
    const expectedPseudoMoves = Long.fromString('20400', true, 16);
    expect(knightPseudoMoves({ fromBitIndex })).toEqual(expectedPseudoMoves);
  });

  it('should return the correct pseudo moves for a knight on the A file', () => {
    const fromBitIndex = 7;
    const expectedPseudoMoves = Long.fromString('402000', true, 16);
    expect(knightPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });

  it('should return the correct pseudo moves for a knight on the up-left corner', () => {
    const fromBitIndex = 56;
    const expectedPseudoMoves = Long.fromString('4020000000000', true, 16);
    expect(knightPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });
  it('should return the correct pseudo moves for a knight on the middle of board', () => {
    const fromBitIndex = 27;
    const expectedPseudoMoves = Long.fromString('142200221400', true, 16);
    expect(knightPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });
});
//**********************************BISHOP*****************************************
describe('bishopLegalAttacks', () => {
  it('should return all possible moves for bishop on D4 when mask contains one blocker', () => {
    const fromBitIndex = 35;
    const occupiedBits = Long.fromString('0x810000000', true, 16);
    const expectedMoves = Long.fromString('0x4122140014020100', true, 16);
    const result = bishopAttacks({ fromBitIndex, occupiedBits });
    expect(result).toEqual(expectedMoves);
  });
  it('should return all possible moves for bishop on D4 when board is empty ', () => {
    const fromBitIndex = 35;
    const occupiedBits = Long.fromString('0x800000000', true, 16);
    const expectedMoves = Long.fromString('0x4122140014224180', true, 16);
    const result = bishopAttacks({ fromBitIndex, occupiedBits });
    expect(result).toEqual(expectedMoves);
  });
  it('should return all possible moves for bishop on D4 when board is full', () => {
    const fromBitIndex = 35;
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const expectedMoves = Long.fromString('0x140014000000', true, 16);
    const result = bishopAttacks({ fromBitIndex, occupiedBits });
    expect(result).toEqual(expectedMoves);
  });
});
describe('bishopLegalMoves', () => {
  it('should return all possible moves for bishop on D4 when board is empty', () => {
    const color: Color = 'b';

    const fromBitIndex = 28;
    const bishopPosition = Long.fromString('0x10000000', true, 16);
    const occupiedBits = Long.fromString('0x10000000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x10000000', true, 16);
    const expectedMoves = Long.fromString('0x182442800284482', true, 16);
    const params = {
      bishopPosition,
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    };
    expect(bishopLegalMoves(params)).toEqual(expectedMoves);
  });

  it('should return all possible moves for bishop on D4 when board is not empty', () => {
    const color: Color = 'b';

    const fromBitIndex = 28;
    const bishopPosition = Long.fromString('0x10000000', true, 16);
    const occupiedBits = Long.fromString('0xffff0000100000ff', true, 16);
    const teammateOccupiedBits = Long.fromString('0x100000ff', true, 16);
    const expectedMoves = Long.fromString('0x82442800284400', true, 16);
    const params = {
      bishopPosition,
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    };

    expect(bishopLegalMoves(params)).toEqual(expectedMoves);
  });
  it('should return all possible moves for bishop on A8', () => {
    const color: Color = 'b';
    const fromBitIndex = 63;
    const bishopPosition = Long.fromString('0x8000000000000000', true, 16);
    const occupiedBits = Long.fromString('0x80000000ff00ff00', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x800000000000ff00',
      true,
      16
    );
    const expectedMoves = Long.fromString('0x40201008000000', true, 16);
    const params = {
      bishopPosition,
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    };

    expect(bishopLegalMoves(params)).toEqual(expectedMoves);
  });

  it('should return all possible moves for bishop on A8 when behind blocker there is empty squares', () => {
    const color: Color = 'b';
    const fromBitIndex = 28;
    const bishopPosition = Long.fromString('0x10000000', true, 16);
    const occupiedBits = Long.fromString('0x80402010ff0002', true, 16);
    const teammateOccupiedBits = Long.fromString('0x80000010ff0002', true, 16);
    const expectedMoves = Long.fromString('0x102042800000000', true, 16);
    const params = {
      bishopPosition,
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    };
    expect(bishopLegalMoves(params)).toEqual(expectedMoves);
  });
});

//**********************************KING*****************************************

describe('kingPseudoMoves', () => {
  it('should return all possible moves for king on D4', () => {
    const fromBitIndex = 28;
    const expectedMoves = Long.fromString('0x3828380000', true, 16);
    expect(kingPseudoMoves({ fromBitIndex })).toEqual(expectedMoves);
  });

  it('should return all possible moves for king on A8', () => {
    const fromBitIndex = 63;
    const expectedMoves = Long.fromString('0x40c0000000000000', true, 16);
    expect(kingPseudoMoves({ fromBitIndex })).toEqual(expectedMoves);
  });

  it('should return all possible moves for king on H8', () => {
    const fromBitIndex = 56;
    const expectedMoves = Long.fromString('0x203000000000000', true, 16);
    expect(kingPseudoMoves({ fromBitIndex })).toEqual(expectedMoves);
  });
});

//**********************************ROOK*****************************************

describe('RookLegalMoves', () => {
  it('should return all possible moves for rook on D4, full of teammates', () => {
    const color: Color = 'b';
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x10101010ff101010', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x10101010ff101010',
      true,
      16
    );
    const params = {
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
      color,
    };

    expect(rookLegalMoves(params)).toEqual(expectedMoves);
  });
  it('should return all possible moves for rook on D4, full of enemies', () => {
    const fromBitIndex = 28;
    const color: Color = 'b';
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const expectedMoves = Long.fromString('1028100000', true, 16);
    const teammateOccupiedBits = Long.fromString('10000000', true, 16);
    const params = {
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
      color,
    };

    expect(rookLegalMoves(params).toString(2)).toEqual(
      expectedMoves.toString(2)
    );
  });

  it('should return all possible moves for rook on D4, empty', () => {
    const fromBitIndex = 28;
    const color: Color = 'b';
    const occupiedBits = Long.fromString('10000000', true, 16);
    const expectedMoves = Long.fromString('10101010ef101010', true, 16);
    const teammateOccupiedBits = Long.fromString('10000000', true, 16);
    const params = {
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
      color,
    };
    const r = rookLegalMoves(params);
    expect(r).toEqual(expectedMoves);
  });
  it('should return all possible moves for rook on D4, some filled', () => {
    const fromBitIndex = 28;
    const color: Color = 'b';
    const occupiedBits = Long.fromString('0x10101000c3101010', true, 16);
    const expectedMoves = Long.fromString('0x106e000000', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x1000100091100010',
      true,
      16
    );
    const params = {
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
      color,
    };

    expect(rookLegalMoves(params).toString(2)).toEqual(
      expectedMoves.toString(2)
    );
  });
  it('should return all possible moves for rook on D4, some filled', () => {
    const fromBitIndex = 28;
    const color: Color = 'b';
    const occupiedBits = Long.fromString('0x10100000', true, 16);
    const expectedMoves = Long.fromString('0x10101010ef100000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x10000000', true, 16);

    const r = rookLegalMoves({
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
    });
    expect(r).toEqual(expectedMoves);
  });
  it('should return all possible moves for rook on b2, some filled', () => {
    const fromBitIndex = 13;
    const color: Color = 'w';
    const occupiedBits = Long.fromString('0x302000', true, 16);
    const expectedMoves = Long.fromString('0xdf20', true, 16);
    const teammateOccupiedBits = Long.fromString('0x300000', true, 16);
    const r = rookLegalMoves({
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
    });
    expect(r).toEqual(expectedMoves);
  });
});

describe('RookLegalAttacks', () => {
  it('should return all possible moves for rook on D4, empty', () => {
    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x10000000', true, 16);
    const expectedMoves = Long.fromString('0x10101010ef101010', true, 16);

    const params = {
      occupiedBits,
      fromBitIndex,
    };
    const r = rookLegalAttacks(params);
    expect(r).toEqual(expectedMoves);
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

    expect(pawnPseudoAttacks({ fromBitIndex, color })).toEqual(expectedAttacks);
  });

  it('returns the correct attack moves for a black pawn on H7', () => {
    const fromBitIndex = 48;
    const color = 'b';
    const expectedAttacks = Long.fromString('0x20000000000', true, 16);
    expect(pawnPseudoAttacks({ fromBitIndex, color })).toEqual(expectedAttacks);
  });

  it('returns the correct attack moves for a white pawn on A2', () => {
    const fromBitIndex = 15;
    const color = 'w';
    const expectedAttacks = Long.fromString('0x400000', true, 16);
    expect(pawnPseudoAttacks({ fromBitIndex, color })).toEqual(expectedAttacks);
  });

  it('returns the correct attack moves for a white pawn on H2', () => {
    const fromBitIndex = 8;
    const color = 'w';
    const expectedAttacks = Long.fromString('0x20000', true, 16);
    expect(pawnPseudoAttacks({ fromBitIndex, color })).toEqual(expectedAttacks);
  });
  it('returns the correct attack moves for a black pawn on B7', () => {
    const fromBitIndex = 54;
    const color = 'b';
    const expectedAttacks = Long.fromString('0xa00000000000', true, 16);
    expect(pawnPseudoAttacks({ fromBitIndex, color })).toEqual(expectedAttacks);
  });
  it('returns the correct attack moves for a white pawn on B2', () => {
    const fromBitIndex = 14;
    const color = 'w';
    const expectedAttacks = Long.fromString('0xa00000', true, 16);
    expect(pawnPseudoAttacks({ fromBitIndex, color })).toEqual(expectedAttacks);
  });
});

describe('pawnLegalMoves', () => {
  it('returns correct legal moves for a black pawn in the starting position', () => {
    const fromBitIndex = 48;
    const color = 'b';
    const enemyOccupied = Long.UZERO;
    const occupiedSquares = Long.fromString('0x1000000000000', true, 16);
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
    const occupiedSquares = Long.fromString('0xef003000000000', true, 16);
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
  it('returns correct legal moves for a white pawn that is in square to elpassant', () => {
    const fromBitIndex = 45;
    const color = 'w';
    const enemyOccupied = Long.fromString('0xef001000000000', true, 16);
    const occupiedSquares = Long.fromString('0xef201000000000', true, 16);
    const expected = Long.fromString('0x40000000000000', true, 16);
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
  it('returns correct legal moves for a black pawn that is in square to elpassant', () => {
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
