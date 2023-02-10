/**
 * @jest-environment jsdom
 */
import useMove from './useMove';

import { logger } from './helpers';
import { renderHook, act } from '@testing-library/react';
import Long from 'long';
import { Color } from '../Types';
const { result } = renderHook(() => useMove());
const {
  kingPseudoMoves,
  bishopLegalMoves,
  rookLegalMoves,
  pawnLegalMoves,
  pawnPseudoAttacks,
  pawnPseudoMoves,
  knightPseudoMoves,
  xrayBishopAttacks,
  xrayRookAttacks,
  bitScanBackwards,
  bitScanForward,
} = result.current;
const emptyBoardState: Long[] =[
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
  Long.UZERO,
];

//**********************************KNIGHT*****************************************
describe('knightPseudoMoves', () => {
  it('should return the correct pseudo moves for a knight', () => {
    const fromBitIndex = 0;
    const expectedPseudoMoves = new Long(0x20401, 0, true);
    expect(knightPseudoMoves({ fromBitIndex })).toEqual(expectedPseudoMoves);
  });

  it('should return the correct pseudo moves for a knight on the A file', () => {
    const fromBitIndex = 7;
    const expectedPseudoMoves = new Long(0x402080, 0, true);
    expect(knightPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });

  it('should return the correct pseudo moves for a knight on the up-left corner', () => {
    const fromBitIndex = 56;
    const expectedPseudoMoves = new Long(0, 0x1040200, true);
    expect(knightPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });
  it('should return the correct pseudo moves for a knight on the middle of board', () => {
    const fromBitIndex = 27;
    const expectedPseudoMoves = new Long(0x8221400, 0x1422, true);
    expect(knightPseudoMoves({ fromBitIndex }).toString(2)).toEqual(
      expectedPseudoMoves.toString(2)
    );
  });
});
//**********************************BISHOP*****************************************

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

describe('check if bishop is absolutely pinned', () => {
  it('should return zero possible moves for white bishop when its being absolutely pinned from south with rook', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] =[...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x2000000000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('0x200000', true, 16);
    //setup enemyrook
    startState[3] = Long.fromString('0x20', true, 16);

    const color: Color = 'w';
    act(() => {
      s.result.current.changeGameState(startState, color);
    });

    const fromBitIndex = 21;
    const occupiedBits = Long.fromString('0x2000200020', true, 16);
    const teammateOccupiedBits = Long.fromString('0x2000200000', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const params = {
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    };
    expect(s.result.current.bishopLegalMoves(params)).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from west with rook', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] =[...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x200000000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('0x800000000', true, 16);
    //setup enemyrook
    startState[3] = Long.fromString('0x2000000000', true, 16);

    const color: Color = 'w';
    act(() => {
      s.result.current.changeGameState(startState, color);
    });

    const fromBitIndex = 35;
    const occupiedBits = Long.fromString('0x2a00000000', true, 16);
    const teammateOccupiedBits = Long.fromString('0xa00000000', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const params = {
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    };
    expect(s.result.current.bishopLegalMoves(params)).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from east with Queen', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] =[...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x2000000000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('0x800000000', true, 16);
    //setup enemyQueen
    startState[9] = Long.fromString('0x200000000', true, 16);

    const color: Color = 'w';
    act(() => {
      s.result.current.changeGameState(startState, color);
    });

    const fromBitIndex = 35;
    const occupiedBits = Long.fromString('0x2a00000000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x2800000000', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const params = {
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    };
    expect(s.result.current.bishopLegalMoves(params)).toEqual(expectedMoves);
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
  it('should return all possible moves for rook on D4, empty', () => {
    const color:Color= 'b';
    const fromBitIndex = 28;
    const pseudoMoves = Long.fromString('0x10101010ff101010', true, 16);
    const occupiedBits = Long.fromString('0x0', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x10101010ff101010',
      true,
      16
    );
    const params = {
      pseudoMoves,
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
      color,
    };

    expect(rookLegalMoves(params)).toEqual(expectedMoves);
  });
  it('should return all possible moves for rook on D4, full of teammates', () => {
    const fromBitIndex = 28;
    const color:Color= 'b';
    const pseudoMoves = Long.fromString('0x10101010ff101010', true, 16);
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x10101010ff101010',
      true,
      16
    );
    const params = {
      pseudoMoves,
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
      color,
    };

    expect(rookLegalMoves(params).toString(2)).toEqual(
      expectedMoves.toString(2)
    );
  });

  it('should return all possible moves for rook on D4, full of enemies', () => {
    const fromBitIndex = 28;
    const color:Color= 'b';
    const pseudoMoves = Long.fromString('0x10101010ff101010', true, 16);
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const expectedMoves = Long.fromString('0x1028100000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x10000000', true, 16);
    const params = {
      pseudoMoves,
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
    const color:Color= 'b';
    const pseudoMoves = Long.fromString('0x10101010ff101010', true, 16);
    const occupiedBits = Long.fromString('0x10101000c3101010', true, 16);
    const expectedMoves = Long.fromString('0x106e000000', true, 16);
    const teammateOccupiedBits = Long.fromString(
      '0x1000100091100010',
      true,
      16
    );
    const params = {
      pseudoMoves,
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
      color,
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
    const occupiedSquares = Long.fromString('0x100', true, 16);
    const expected = Long.fromString('0x10100000000', true, 16);
    const elPassant = null;

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
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
      })
    ).toEqual(expected);
  });

  it('returns correct legal moves for a black pawn that can only capture enemy pieces', () => {
    const fromBitIndex = 49;
    const color = 'b';
    const enemyOccupied = Long.fromString('0xff0000000000', true, 16);
    const occupiedSquares = Long.fromString('0x2ff0000000000', true, 16);
    const expected = Long.fromString('0x50000000000', true, 16);
    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
      })
    ).toEqual(expected);
  });

  it('returns correct legal moves for a white pawn that can only capture enemy pieces', () => {
    const fromBitIndex = 9;
    const color = 'w';
    const enemyOccupied = Long.fromString('0xff0000', true, 16);
    const occupiedSquares = Long.fromString('0xff0200', true, 16);
    const expected = Long.fromString('0x50000', true, 16);
    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
      })
    ).toEqual(expected);
  });

  it('returns correct legal moves for a black pawn that is blocked from quiet move', () => {
    const fromBitIndex = 49;
    const color = 'b';
    const enemyOccupied = Long.UZERO;
    const occupiedSquares = Long.fromString('0x2020000000000', true, 16);
    const expected = Long.fromString('0x0', true, 16);

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
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
    const s = renderHook(() => useMove());
    act(() =>{ s.result.current.setElPassant(elPassant);});

    expect(
      pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
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
    const s = renderHook(() => useMove());
    act(() =>{ s.result.current.setElPassant(elPassant);});
    expect(
      s.result.current.pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
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
    const s = renderHook(() => useMove());
    act(() =>{ s.result.current.setElPassant(elPassant);});
    
    expect(
      s.result.current.pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
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
    const s = renderHook(() => useMove());
    act(() =>{ s.result.current.setElPassant(elPassant);});
    

    expect(
      s.result.current.pawnLegalMoves({
        fromBitIndex,
        color,
        enemyOccupied,
        occupiedSquares,
      })
    ).toEqual(expected);
  });
});
/////////////////////////////////////////////////FUNCTIONS//////////////////////////////

describe('xrayRookAttacks', () => {
  it('should calculate correct xray rook attacks with enpty board', () => {
    const occupied = Long.fromString('0x0', true, 16);
    const blockers = Long.fromString('0x0', true, 16);
    const square = 0;

    const expectedAttacks = Long.fromString('0x0', true, 16);
    const result = xrayRookAttacks(occupied, blockers, square);
    expect(result.equals(expectedAttacks)).toBe(true);
  });
  /*
  it('should calculate correct xray rook attacks', () => {
    const s = renderHook(() => useMove());
    const occupied = Long.fromString('0x8040001', true, 16);
    const blockers = Long.fromString('0x40001', true, 16);
    const square = 0;

    const expectedAttacks = Long.fromString('0x8000000', true, 16);
    const result = s.result.current.xrayRookAttacks(occupied, blockers, square);
    logger(expectedAttacks);
    logger(result);
    expect(result.equals(expectedAttacks)).toBe(true);
  });
  it('should calculate correct xray rook attacks', () => {
    const occupied = Long.fromString('0x1008040001', true, 16);
    const blockers = Long.fromString('0x40001', true, 16);
    const square = 0;

    const expectedAttacks = Long.fromString('0x8000000', true, 16);
    const result = xrayRookAttacks(occupied, blockers, square);
    expect(result.equals(expectedAttacks)).toBe(true);
  });
  it('should calculate correct xray rook attacks', () => {
    const occupied = Long.fromString('0x180440010', true, 16);
    const blockers = Long.fromString('0x100400010', true, 16);
    const square = 4;
    
   
    const expectedAttacks = Long.fromString('0x80040000', true, 16);
    const result = xrayRookAttacks(occupied, blockers, square);

    expect(result.equals(expectedAttacks)).toBe(true);
  });
  */
});
describe('bitScanForward', () => {
  it('returns -1 if moveMask is 0', () => {
    const from = 3;
    const moveMask = Long.UZERO;
    const occupied = Long.UZERO;
    expect(bitScanForward(from, moveMask, occupied)).toBe(-1);
  });

  it('returns the first index of moveMask without the from square if occupied is 0', () => {
    const from = 0;
    const moveMask = Long.fromString('0x8040201008040201', true, 16);
    const occupied = Long.fromString('0x20000042201', true, 16);
    expect(bitScanForward(from, moveMask, occupied)).toBe(9);
  });

  it('returns the first index of moveMask that is in moveMask if occupied is same as moveMask', () => {
    const from = 4;
    const moveMask = Long.fromString('0x182442810', true, 16);
    const occupied = moveMask;
    expect(bitScanForward(from, moveMask, occupied)).toBe(11);
  });
  it('returns the first index of moveMask that is in moveMask if occupied is full', () => {
    const from = 4;
    const moveMask = Long.fromString('0x182442810', true, 16);
    const occupied = Long.MAX_UNSIGNED_VALUE;
    
    expect(bitScanForward(from, moveMask, occupied)).toBe(11);
  });
  it('returns the first index of moveMask that is in moveMask if occupied is full', () => {
    const from = 20;
    const moveMask = Long.fromString('0x1020408100000', true, 16);
    const occupied = Long.MAX_UNSIGNED_VALUE;
    
    expect(bitScanForward(from, moveMask, occupied)).toBe(27);
  });
});
describe('bitScanBackwards', () => {
  it('should return -1 when no blocking piece is found', () => {
    const from = 5;
    const moveMask = Long.fromString('0x1000000000', true, 16);
    const occupied = Long.fromString('0x0', true, 16);

    const result = bitScanBackwards(from, moveMask, occupied);
    expect(result).toBe(-1);
  });

  it('should return -1 when there is no blockers', () => {
    const from = 5;
    const moveMask = Long.fromString('0x1000000000', true, 16);
    const occupied = Long.fromString('0x10000000000', true, 16);

    const result = bitScanBackwards(from, moveMask, occupied);
    expect(result).toBe(-1);
  });
  it('should return -1 when there is no blockers and all other squares are filled', () => {
    const from = 28;
    const moveMask = Long.fromString('0x10080402', true, 16);
    const occupied = Long.fromString('0xfffffffffff7fbfd', true, 16);

    const result = bitScanBackwards(from, moveMask, occupied);
    expect(result).toBe(-1);
  });
  it('should return correct index of blocker', () => {
    const from = 28;
    const moveMask = Long.fromString('0x10080402', true, 16);
    const occupied = Long.MAX_UNSIGNED_VALUE;

    const result = bitScanBackwards(from, moveMask, occupied);
    expect(result).toBe(19);
  });
});



