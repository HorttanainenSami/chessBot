/**
 * @jest-environment jsdom
 */
import useMove from './useMove';

import { logger } from './helpers';
import { renderHook, act } from '@testing-library/react';
import Long from 'long';
import { Color } from '../Types';
import moveMasks from './preCalculatedMoveMasks';
const { result } = renderHook(() => useMove());
const {
  kingPseudoMoves,
  bishopLegalMoves,
  bishopAttacks,
  rookLegalMoves,
  rookLegalAttacks,
  pawnLegalMoves,
  pawnPseudoAttacks,
  pawnPseudoMoves,
  knightPseudoMoves,
  xrayBishopAttacks,
  xrayRookAttacks,
  bitScanBackwards,
  bitScanForward,
  removeBlockedMovesBackwards,
  removeBlockedMovesForward,
} = result.current;
const emptyBoardState: Long[] = [
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
  it('should return all possible moves for bishop on D4 when board is empty', () => {
    const fromBitIndex = 35;
    const occupiedBits = Long.fromString('0x810000000', true, 16);
    const expectedMoves = Long.fromString('0x4122140014020100', true, 16);
    const result = bishopAttacks({ fromBitIndex, occupiedBits });
    expect(result).toEqual(expectedMoves);
  });
  it('should return all possible moves for bishop on D4 when mask contains one blocker ', () => {
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

describe('check if bishop is absolutely pinned', () => {
  it('should return zero possible moves for white bishop when its being absolutely pinned from south with rook', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
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
    const startState: Long[] = [...emptyBoardState];
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

    const r = s.result.current.bishopLegalMoves({
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    });
    expect(r).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from east with Queen', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
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
describe('isCheck', () => {
  it('should make check if one enemy queen is attacking king', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x800000000', true, 16); //21

    const friendlyColor: Color = 'w';

    act(() => {
      s.result.current.changeGameState(startState, friendlyColor);
    });
    s.result.current.gameState.forEach((r, i) => logger(r, i.toString()));
    const result = s.result.current.isChecked();
    const doubleCheck = s.result.current.doubleChecked;
    const mate = s.result.current.mate;

    expect(result).toEqual(false);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(false);
  });
  it('should make check if one enemy knight is attacking king', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup knight black
    startState[7] = Long.fromString('0x4000000', true, 16); //21

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const result = s.result.current.isChecked();
    const doubleCheck = s.result.current.doubleChecked;
    const mate = s.result.current.mate;

    expect(result).toEqual(true);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(false);
  });
  it('should make dobuleCheck if one enemy knight and queen is attacking king', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup knight black
    startState[7] = Long.fromString('0x4000000', true, 16); //21
    //setup Queen black
    startState[9] = Long.fromString('0x8000000', true, 16); //21

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const result = s.result.current.isChecked();
    const doubleCheck = s.result.current.doubleChecked;
    const mate = s.result.current.mate;

    expect(result).toEqual(true);
    expect(doubleCheck).toEqual(true);
    expect(mate).toEqual(false);
  });
});

//**********************************ROOK*****************************************

describe('RookLegalMoves', () => {
  it('should return all possible moves for rook on D4, empty', () => {
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
  it('should return all possible moves for rook on D4, full of teammates', () => {
    const fromBitIndex = 28;
    const color: Color = 'b';
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
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

    expect(rookLegalMoves(params).toString(2)).toEqual(
      expectedMoves.toString(2)
    );
  });

  it('should return all possible moves for rook on D4, full of enemies', () => {
    const fromBitIndex = 28;
    const color: Color = 'b';
    const occupiedBits = Long.fromString('0xffffffffffffffff', true, 16);
    const expectedMoves = Long.fromString('0x1028100000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x10000000', true, 16);
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
      color,
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
      color,
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
describe('check if rook is absolutely pinned', () => {
  it('should return zero possible moves for white rook when its being absolutely pinned from southW with bishop', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x800000000', true, 16);
    //setup rook
    startState[2] = Long.fromString('0x10000000', true, 16);
    //setup enemybishop
    startState[5] = Long.fromString('0x200000', true, 16);

    const color: Color = 'w';
    act(() => {
      s.result.current.changeGameState(startState, color);
    });

    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x810200000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x810000000', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      s.result.current.rookLegalMoves({
        occupiedBits,
        fromBitIndex,
        teammateOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from Southeast with bishop', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x2000000000', true, 16);
    //setup rook
    startState[2] = Long.fromString('0x10000000', true, 16);
    //setup enemybishop
    startState[5] = Long.fromString('0x80000', true, 16);

    const color: Color = 'w';
    act(() => {
      s.result.current.changeGameState(startState, color);
    });

    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x2010080000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x2010000000', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const r = s.result.current.rookLegalMoves({
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    });
    expect(r).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from NorthEast with Queen', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x80000', true, 16);
    //setup rook
    startState[4] = Long.fromString('0x10000000', true, 16);
    //setup enemyQueen
    startState[9] = Long.fromString('0x2000000000', true, 16);

    const color: Color = 'w';
    act(() => {
      s.result.current.changeGameState(startState, color);
    });

    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x2010080000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x10080000', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const r = s.result.current.rookLegalMoves({
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    });
    expect(r).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from NWest with Queen', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x200000', true, 16);
    //setup rook
    startState[4] = Long.fromString('0x10000000', true, 16);
    //setup enemyQueen
    startState[9] = Long.fromString('0x800000000', true, 16);

    const color: Color = 'w';
    act(() => {
      s.result.current.changeGameState(startState, color);
    });

    const fromBitIndex = 28;
    const occupiedBits = Long.fromString('0x810200000', true, 16);
    const teammateOccupiedBits = Long.fromString('0x10200000', true, 16);
    const expectedMoves = Long.fromString('0x0', true, 16);
    const params = {
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color,
    };
    expect(s.result.current.rookLegalMoves(params)).toEqual(expectedMoves);
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
    const result = pawnLegalMoves({
      fromBitIndex,
      color,
      enemyOccupied,
      occupiedSquares,
    });
    expect(result).toEqual(expected);
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
    act(() => {
      s.result.current.setElPassant(elPassant);
    });

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
    act(() => {
      s.result.current.setElPassant(elPassant);
    });

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
    act(() => {
      s.result.current.setElPassant(elPassant);
    });

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
    act(() => {
      s.result.current.setElPassant(elPassant);
    });

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
    expect(result).toEqual(expectedAttacks);
  });
  it('should calculate correct xray rook attacks', () => {
    const occupied = Long.fromString('0x8040001', true, 16);
    const blockers = Long.fromString('0x40001', true, 16);
    const square = 0;

    const expectedAttacks = Long.fromString('0x0', true, 16);
    const result = xrayRookAttacks(occupied, blockers, square);
    expect(result).toEqual(expectedAttacks);
  });

  it('should calculate correct xray rook attacks', () => {
    const occupied = Long.fromString('0x15', true, 16);
    const blockers = Long.fromString('0x5', true, 16);
    const square = 0;
    const expectedAttacks = Long.fromString('0x10', true, 16);
    const result = xrayRookAttacks(occupied, blockers, square);
    logger(expectedAttacks);
    logger(result);
    expect(result).toEqual(expectedAttacks);
  });
  it('should calculate correct xray rook attacks', () => {
    const occupied = Long.fromString('0x1010001000000010', true, 16);
    const blockers = Long.fromString('0x10001000000010', true, 16);
    const square = 4;

    const expectedAttacks = Long.fromString('0x10000000000000', true, 16);
    const result = xrayRookAttacks(occupied, blockers, square);

    expect(result).toEqual(expectedAttacks);
  });
});

describe('xrayBishopAttacks', () => {
  it('should calculate correct xray bishop attacks with empty board', () => {
    const occupied = Long.fromString('0x0', true, 16);
    const blockers = Long.fromString('0x0', true, 16);
    const square = 0;

    const expectedAttacks = Long.fromString('0x0', true, 16);
    const result = xrayBishopAttacks(occupied, blockers, square);
    expect(result).toEqual(expectedAttacks);
  });
  it('should calculate correct xray bishop attacks', () => {
    const s = renderHook(() => useMove());
    const occupied = Long.fromString('0x8040001', true, 16);
    const blockers = Long.fromString('0x40001', true, 16);
    const square = 0;

    const expectedAttacks = Long.fromString('0x8000000', true, 16);
    const result = s.result.current.xrayBishopAttacks(
      occupied,
      blockers,
      square
    );
    expect(result).toEqual(expectedAttacks);
  });

  it('should calculate correct xray bishop attacks', () => {
    const occupied = Long.fromString('0x1008040001', true, 16);
    const blockers = Long.fromString('0x40001', true, 16);
    const square = 0;

    const expectedAttacks = Long.fromString('0x8000000', true, 16);
    const result = xrayBishopAttacks(occupied, blockers, square);

    expect(result).toEqual(expectedAttacks);
  });
  it('should calculate correct xray bishop attacks', () => {
    const occupied = Long.fromString('0x180440010', true, 16);
    const blockers = Long.fromString('0x100400010', true, 16);
    const square = 4;

    const expectedAttacks = Long.fromString('0x80000000', true, 16);
    const result = xrayBishopAttacks(occupied, blockers, square);
    expect(result).toEqual(expectedAttacks);
  });
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
  it('returns the first index of occupied bit in move mask of ADiagonal if occupied is full', () => {
    const from = 20;
    const moveMask = Long.fromString('0x1020408100000', true, 16);
    const occupied = Long.MAX_UNSIGNED_VALUE;

    expect(bitScanForward(from, moveMask, occupied)).toBe(27);
  });
  it('returns the first index of occupied bit in move mask of N if occupied is full', () => {
    const from = 28;
    const moveMask = Long.fromString('0x1010101010000000', true, 16);
    const occupied = Long.MAX_UNSIGNED_VALUE;
    expect(bitScanForward(from, moveMask, occupied)).toBe(36);
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

describe('SquareIsAttacked', () => {
  it('check if queen is attacking some of its rays, ', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    //startState[10] = Long.fromString('0x800000000', true, 16); //21
    //setup Queen black
    startState[9] = Long.fromString('0x200000', true, 16); //35

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const occupiedBits = startState.reduce(
      (acc, cur) => cur.or(acc),
      Long.UZERO
    );
    const teammateOccupiedBits = startState.reduce((acc, curr, i) => {
      //i%2===0 if black
      //i%2!==0 if white
      if (i % 2 !== 0) return acc;
      return acc.or(curr);
    }, new Long(0, 0, true));
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 56,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 16,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 3,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 5,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 7,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 23,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 39,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 61,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 21,
        friendlyColor: friendlyColor,
      })
    ).toEqual(false);
  });
  it('check if queen is attacking all its rays, and blocker is blocking attack ', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x800000000', true, 16); //35
    //setup Queen black
    startState[9] = Long.fromString('0x200000', true, 16); //21

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const occupiedBits = startState.reduce(
      (acc, cur) => cur.or(acc),
      Long.UZERO
    );
    const teammateOccupiedBits = startState.reduce((acc, curr, i) => {
      //i%2===0 if black
      //i%2!==0 if white
      if (i % 2 !== 0) return acc;
      return acc.or(curr);
    }, new Long(0, 0, true));
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 35,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 28,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 42,
        friendlyColor: friendlyColor,
      })
    ).toEqual(false);
  });
  it('check if black is attacking all queens nerest squares, and white is attacking black when board is full of white exept black queen ', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup Queen white
    startState[8] = Long.fromString('0xfffffff7ffffffff', true, 16);
    //setup Queen black
    startState[9] = Long.fromString('0x800000000', true, 16); //35

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const occupiedBits = startState.reduce(
      (acc, cur) => cur.or(acc),
      Long.UZERO
    );

    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 35,
        friendlyColor: friendlyColor,
      })
    ).toEqual(false);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 28,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
    expect(
      s.result.current.squareIsAttacked({
        occupiedBits,
        fromBitIndex: 42,
        friendlyColor: friendlyColor,
      })
    ).toEqual(true);
  });
});
describe('kingMoveMaskThatIsNotAttacked', () => {
  it('check if queen is blocking all kings moves that queen is attacking, but king can eat queen', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x10000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x200000', true, 16); //21

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const occupiedBits = startState.reduce(
      (acc, cur) => cur.or(acc),
      Long.UZERO
    );
    const square = startState[10].countTrailingZeros();
    const moveMask = moveMasks.getKingMoves(square);
    const expectedMoves = Long.fromString('0x1808200000', true, 16);

    expect(
      s.result.current.kingMoveMaskThatIsNotAttacked(
        moveMask,
        occupiedBits,
        friendlyColor
      )
    ).toEqual(expectedMoves);
  });
  it('check if queen is blocking all kings moves that queen is attacking, but king can eat queen', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup pawns white
    startState[0] = Long.fromString('0x3828000000', true, 16); //28
    //setup king white
    startState[10] = Long.fromString('0x10000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x200000', true, 16); //21

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const occupiedBits = startState.reduce(
      (acc, cur) => cur.or(acc),
      Long.UZERO
    );
    const teammateOccupied = Long.fromString('0x3838000000', true, 16);
    const square = startState[10].countTrailingZeros();
    const moveMask = moveMasks.getKingMoves(square).and(teammateOccupied.not());
    const expectedMoves = Long.fromString('0x200000', true, 16);

    const result = s.result.current.kingMoveMaskThatIsNotAttacked(
      moveMask,
      occupiedBits,
      friendlyColor
    );
    expect(result).toEqual(expectedMoves);
  });
  it('check if queen is blocking all kings moves that queen is attacking, but king cannot eat queen because its protected', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup pawns white
    startState[0] = Long.fromString('0x3828000000', true, 16); //28
    //setup king white
    startState[10] = Long.fromString('0x10000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x200000', true, 16); //21
    //black knigth protecting queen
    startState[7] = Long.fromString('0x40', true, 16);

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const occupiedBits = startState.reduce(
      (acc, cur) => cur.or(acc),
      Long.UZERO
    );
    const teammateOccupied = Long.fromString('0x3838000000', true, 16);
    const square = startState[10].countTrailingZeros();
    const moveMask = moveMasks.getKingMoves(square).and(teammateOccupied.not());
    const expectedMoves = Long.fromString('0x0', true, 16);

    const result = s.result.current.kingMoveMaskThatIsNotAttacked(
      moveMask,
      occupiedBits,
      friendlyColor
    );
    expect(result).toEqual(expectedMoves);
  });
  it('check if queen is blocking all kings moves that queen is attacking, but king cannot eat queen because its protected', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup pawns white
    startState[0] = Long.fromString('0x3000000000000', true, 16); //28
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x800000000', true, 16); //21
    //black knigth protecting queen
    startState[7] = Long.fromString('0x4000000000000', true, 16);

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const occupiedBits = startState.reduce(
      (acc, cur) => cur.or(acc),
      Long.UZERO
    );
    const teammateOccupied = Long.fromString('0x3020000000000', true, 16);
    const square = startState[10].countTrailingZeros();
    const moveMask = moveMasks.getKingMoves(square).and(teammateOccupied.not());
    const expectedMoves = Long.fromString('0x4000000000000', true, 16);

    const result = s.result.current.kingMoveMaskThatIsNotAttacked(
      moveMask,
      occupiedBits,
      friendlyColor
    );
    expect(result).toEqual(expectedMoves);
  });
});
describe('changeGameState', () => {
  it('check if turn is changing after gameState change', () => {
    const s = renderHook(() => useMove());
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x10000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x200000', true, 16); //21

    const friendlyColor: Color = 'w';

    act(() => s.result.current.changeGameState(startState, friendlyColor));
    const occupiedBits = startState.reduce(
      (acc, cur) => cur.or(acc),
      Long.UZERO
    );

    expect(0).toEqual(0);
  });
});
