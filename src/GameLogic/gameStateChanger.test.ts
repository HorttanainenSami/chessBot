import Long from 'long';
import {
  changeGameState,
  gameState,
  checked,
  mate,
  doubleChecked,
  turn,
  setElPassant,
  reset,
  xrayBishopAttacks,
  xrayRookAttacks,
  squareIsAttacked,
  subsetOfMaskThatIsNotAttacked,
  getBishop,
  getRook,
  getKing,
  getKnight,
  getPawn,
  updateGameState,
  getState,
} from './gameStateChanger';
import { Color } from '../Types';
import { logger } from './helpers';
const emptyBoardState: Long[] = Array(12).fill(Long.UZERO);
//--------------------------------------------------------/
//AbsolutelyPinned
//--------------------------------------------------------/
describe('check if bishop is absolutely pinned', () => {
  it('should return zero possible moves for white bishop when its being absolutely pinned from south with rook', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x2000000000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('0x200000', true, 16);
    //setup enemyrook
    startState[3] = Long.fromString('0x20', true, 16);
    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = 21;

    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from west with rook', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x200000000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('0x800000000', true, 16);
    //setup enemyrook
    startState[3] = Long.fromString('0x2000000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = 35;
    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from east with Queen', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x2000000000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('0x800000000', true, 16);
    //setup enemyQueen
    startState[9] = Long.fromString('0x200000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = 35;
    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const expectedMoves = Long.fromString('0x0', true, 16);
    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return possible moves for white bishop when its not being pinned', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x2000000000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('0x800000000', true, 16);
    //setup enemyQueen
    startState[9] = Long.fromString('20000000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = 35;
    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const expectedMoves = Long.fromString('4122140014224180', true, 16);
    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
      })
    ).toEqual(expectedMoves);
  });
});
describe('check if rook is absolutely pinned', () => {
  it('should return zero possible moves for white rook when its being absolutely pinned from southW with bishop', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x800000000', true, 16);
    //setup rook
    startState[2] = Long.fromString('0x10000000', true, 16);
    //setup enemybishop
    startState[5] = Long.fromString('0x200000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 28;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getRook({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from Southeast with bishop', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x2000000000', true, 16);
    //setup rook
    startState[2] = Long.fromString('0x10000000', true, 16);
    //setup enemybishop
    startState[5] = Long.fromString('0x80000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = 28;

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const expectedMoves = Long.fromString('0x0', true, 16);
    expect(
      getRook({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from NorthEast with Queen', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x80000', true, 16);
    //setup rook
    startState[4] = Long.fromString('0x10000000', true, 16);
    //setup enemyQueen
    startState[9] = Long.fromString('0x2000000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = 28;

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const expectedMoves = Long.fromString('0x0', true, 16);
    expect(
      getRook({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from NWest with Queen', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x200000', true, 16);
    //setup rook
    startState[4] = Long.fromString('0x10000000', true, 16);
    //setup enemyQueen
    startState[9] = Long.fromString('0x800000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = 28;

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const expectedMoves = Long.fromString('0x0', true, 16);
    expect(
      getRook({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
});
describe('check if knight is absolutely pinned', () => {
  it('Knight is absolutely pinned from N', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('8', true, 16);
    //setup knight
    startState[2] = Long.fromString('800', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('8000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 11;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getKnight({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('Knight is absolutely pinned from NW', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('4', true, 16);
    //setup knight
    startState[2] = Long.fromString('800', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('20000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 11;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getKnight({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
});
describe('check if pawn is absolutely pinned', () => {
  it('Pawn is absolutely pinned from NW', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('4', true, 16);
    //setup knight
    startState[0] = Long.fromString('800', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('20000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 11;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });

  it('Pawn is absolutely pinned from E', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('8', true, 16);
    //setup pawn
    startState[0] = Long.fromString('4', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('1', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 2;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn is absolutely pinned from W', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('1', true, 16);
    //setup pawn
    startState[0] = Long.fromString('4', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('8', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 2;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn is absolutely pinned from NE', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('8', true, 16);
    //setup pawn
    startState[0] = Long.fromString('400', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('1000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 10;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn is absolutely pinned from SE', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('80000', true, 16);
    //setup pawn
    startState[0] = Long.fromString('400', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('2', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 10;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn is absolutely pinned from SW', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('20000', true, 16);
    //setup pawn
    startState[0] = Long.fromString('400', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('8', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 10;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
});
//--------------------------------------------------------/
//PartiallyPinned
//--------------------------------------------------------/
describe('bishop partially pinned', () => {
  it('should return attack to pinner when pinner is in diagonal', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('2000000000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('10000000', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('400', true, 16);
    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = startState[4].countTrailingZeros();

    const expectedMoves = Long.fromString('80400', true, 16);
    const result = getBishop({
      blackOccupiedBits,
      whiteOccupiedBits,
      occupiedBits,
      fromBitIndex,
      color,
    });

    expect(result).toEqual(expectedMoves);
  });

  it('should return attack to pinner when pinner is in diagonal', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('200000', true, 16);
    //setup bishop
    startState[4] = Long.fromString('10000000', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('40000000000', true, 16);
    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = startState[4].countTrailingZeros();

    const expectedMoves = Long.fromString('40800000000', true, 16);
    const result = getBishop({
      blackOccupiedBits,
      whiteOccupiedBits,
      occupiedBits,
      fromBitIndex,
      color,
    });

    expect(result).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from east with Queen', () => {
    const startState: Long[] = [...emptyBoardState];
    startState[10] = Long.fromString('400', true, 16);
    //setup bishop
    startState[4] = Long.fromString('10000000', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('2000000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = startState[4].countTrailingZeros();

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const expectedMoves = Long.fromString('2000000000', true, 16);

    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
      })
    ).toEqual(expectedMoves);
  });
});
describe('rook partially pinned', () => {
  it('should return attack for pinner S', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x800000000', true, 16);
    //setup rook
    startState[2] = Long.fromString('80000', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('8', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = gameState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('808', true, 16);

    expect(
      getRook({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return attack for pinner N', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('8', true, 16);
    //setup rook
    startState[2] = Long.fromString('80000', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('0x800000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = gameState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('808000000', true, 16);

    expect(
      getRook({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return attack for pinner, E', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x800000000', true, 16);
    //setup rook
    startState[2] = Long.fromString('2000000000', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('8000000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = gameState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('c000000000', true, 16);

    expect(
      getRook({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('should return attack for pinner W', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('8000000000', true, 16);
    //setup rook
    startState[2] = Long.fromString('2000000000', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('0x800000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = gameState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('1800000000', true, 16);

    expect(
      getRook({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
});
describe('pawn partially pinned', () => {
  it('pawn can move forwards when pinned from S', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('0x800000000', true, 16);
    //setup pawn
    startState[0] = Long.fromString('80000', true, 16);
    //setup enemy pawn
    startState[1] = Long.fromString('14000000', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('800', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = gameState[0].countTrailingZeros();
    const expectedMoves = Long.fromString('8000000', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('pawn can move forwards when pinned from N', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('8000000', true, 16);
    //setup pawn
    startState[0] = Long.fromString('800000000', true, 16);
    //setup enemy pawn
    startState[1] = Long.fromString('140000000000', true, 16);
    //setup enemy rook
    startState[3] = Long.fromString('8000000000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = gameState[0].countTrailingZeros();
    const expectedMoves = Long.fromString('80000000000', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn can eat pinner', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('800000000', true, 16);
    //setup pawn
    startState[0] = Long.fromString('40000000000', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('2000000000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = gameState[0].countTrailingZeros();
    const expectedMoves = Long.fromString('2000000000000', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn can eat pinner', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king
    startState[10] = Long.fromString('200000000', true, 16);
    //setup pawn
    startState[0] = Long.fromString('40000000000', true, 16);
    //setup enemy bishop
    startState[5] = Long.fromString('8000000000000', true, 16);

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = gameState[0].countTrailingZeros();
    const expectedMoves = Long.fromString('8000000000000', true, 16);

    expect(
      getPawn({
        occupiedBits,
        fromBitIndex,
        whiteOccupiedBits,
        blackOccupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
});
//--------------------------------------------------------/
// Check
//--------------------------------------------------------/
describe('isCheck', () => {
  it('should not make check if one enemy queen is not attacking king', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x800000000', true, 16); //21

    const friendlyColor: Color = 'w';

    changeGameState(startState, friendlyColor);
    const result = checked;
    const doubleCheck = doubleChecked;

    expect(result).toEqual(false);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(false);
  });

  it('should make check if one enemy knight is attacking king', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup knight black
    startState[7] = Long.fromString('0x4000000', true, 16); //21

    const friendlyColor: Color = 'w';

    changeGameState(startState, friendlyColor);
    const result = checked;
    const doubleCheck = doubleChecked;

    expect(result).toEqual(true);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(false);
  });

  it('should make doubleCheck if one enemy rook and queen is attacking king', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup rook black
    startState[3] = Long.fromString('80000000000', true, 16); //21
    //setup Queen black
    startState[9] = Long.fromString('0x8000000', true, 16); //21

    const friendlyColor: Color = 'w';

    changeGameState(startState, friendlyColor);
    expect(turn).toEqual(friendlyColor);
    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(true);
    expect(mate).toEqual(false);
  });

  it('should make doubleCheck if one enemy knight and queen is attacking king', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup knight black
    startState[7] = Long.fromString('0x4000000', true, 16); //21
    //setup Queen black
    startState[9] = Long.fromString('0x8000000', true, 16); //21

    const friendlyColor: Color = 'w';

    changeGameState(startState, friendlyColor);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(true);
    expect(mate).toEqual(false);
  });
  it('should make doubleCheck if one enemy bishop and queen is attacking king', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup bishop black
    startState[5] = Long.fromString('800000000000000', true, 16); //21
    //setup Queen black
    startState[9] = Long.fromString('0x8000000', true, 16); //21

    const friendlyColor: Color = 'w';

    changeGameState(startState, friendlyColor);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(true);
    expect(mate).toEqual(false);
  });
  it('should not be DobuleCheck if one enemy bishop behind queen witch is attacking king', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup bishop black
    startState[5] = Long.fromString('2000', true, 16); //21
    //setup Queen black
    startState[9] = Long.fromString('0x8000000', true, 16); //21

    const friendlyColor: Color = 'w';

    changeGameState(startState, friendlyColor);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(false);
    expect(mate).toEqual(false);
  });
});
describe('isCheck and piece can come to block attack, but not when doubleCheck', () => {
  it('own pawn can block check', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup pawn white
    startState[0] = Long.fromString('4000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('8000000', true, 16); //21

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = startState[0].countTrailingZeros();
    const expectedMoves = Long.fromString('400000000', true, 16);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(false);
    expect(mate).toEqual(false);

    expect(
      getPawn({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
    //piece cannot move incase of doubleCheck
    startState[9] = Long.fromString('a000000', true, 16); //21
    changeGameState(startState, color);
    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(true);
    expect(mate).toEqual(false);
    expect(
      getPawn({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(Long.fromString('0', true, 16));
  });
  it('own bishop can block check', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup bishop white
    startState[4] = Long.fromString('80000000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('8000000', true, 16); //21

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = startState[4].countTrailingZeros();
    const expectedMoves = Long.fromString('400000000', true, 16);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(false);
    expect(mate).toEqual(false);
    expect(
      getBishop({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
    //piece cannot move incase of doubleCheck
    startState[9] = Long.fromString('a000000', true, 16); //21
    changeGameState(startState, color);
    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(true);
    expect(mate).toEqual(false);
    expect(
      getBishop({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(Long.fromString('0', true, 16));
  });
  it('own rook can block check', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup rook white
    startState[2] = Long.fromString('4', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('8000000', true, 16); //21

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = startState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('400000000', true, 16);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(false);
    expect(mate).toEqual(false);
    expect(
      getRook({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
    //piece cannot move incase of doubleCheck
    startState[9] = Long.fromString('a000000', true, 16); //21
    changeGameState(startState, color);
    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(true);
    expect(mate).toEqual(false);
    expect(
      getRook({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(Long.fromString('0', true, 16));
  });
  it('own knight can block check', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup knightwhite
    startState[6] = Long.fromString('80000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('8000000', true, 16); //21

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = startState[6].countTrailingZeros();
    const expectedMoves = Long.fromString('400000000', true, 16);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(false);
    expect(mate).toEqual(false);
    expect(
      getKnight({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
    //piece cannot move incase of doubleCheck
    startState[9] = Long.fromString('a000000', true, 16); //21
    changeGameState(startState, color);
    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(true);
    expect(mate).toEqual(false);
    expect(
      getKnight({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(Long.fromString('0', true, 16));
  });
});
describe('isCheck and king can move to non attacked square', () => {
  it('should return only non attacked squares', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x800000000', true, 16); //21

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = startState[10].countTrailingZeros();
    const result = checked;
    const doubleCheck = doubleChecked;

    expect(result).toEqual(false);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(false);
    const expectedMoves = Long.fromString('5010000000000', true, 16);
    expect(
      getKing({
        color,
        whiteOccupiedBits,
        blackOccupiedBits,
        occupiedBits,
        fromBitIndex,
      })
    ).toEqual(expectedMoves);
  });
  it('should return only non attacked squares', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup knight black
    startState[7] = Long.fromString('800000000000000', true, 16); //21
    //rook
    startState[3] = Long.fromString('200000000000000', true, 16); //21
    //bishop
    startState[5] = Long.fromString('8000000', true, 16); //21

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = startState[10].countTrailingZeros();

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(true);
    expect(mate).toEqual(false);
    const expectedMoves = Long.fromString('4010100000000', true, 16);

    expect(
      getKing({
        color,
        whiteOccupiedBits,
        blackOccupiedBits,
        occupiedBits,
        fromBitIndex,
      })
    ).toEqual(expectedMoves);
  });
  it('should return only non attacked squares', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('4000000000000', true, 16); //28
    //rook
    startState[3] = Long.fromString('c00020000000000', true, 16); //21

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    changeGameState(startState, color);

    const fromBitIndex = startState[10].countTrailingZeros();

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(false);
    expect(mate).toEqual(false);
    const expectedMoves = Long.fromString('20000000000', true, 16);

    expect(
      getKing({
        color,
        whiteOccupiedBits,
        blackOccupiedBits,
        occupiedBits,
        fromBitIndex,
      })
    ).toEqual(expectedMoves);
  });
});
describe('subsetOfMaskThatIsNotAttacked', () => {
  it('should return correct mask', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('0x20000000000', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('0x800000000', true, 16); //21

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    changeGameState(startState, color);
    const moveMask = Long.fromString('7050700000000', true, 16);
    const expectedMoves = Long.fromString('5010000000000', true, 16);
    expect(
      subsetOfMaskThatIsNotAttacked(moveMask, occupiedBits, color)
    ).toEqual(expectedMoves);
  });
});

describe('squareIsAttacked', () => {
  it('if pawn is attacking', () => {
    const startState: Long[] = [...emptyBoardState];
    startState[1] = Long.fromString('200', true, 16); //21

    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const friendlyColor: Color = 'w';
    changeGameState(startState, friendlyColor);

    const fromBitIndex = 0;

    expect(
      squareIsAttacked({
        friendlyColor,
        occupiedBits,
        fromBitIndex,
      })
    ).toEqual(true);
  });
  it('if own pawn is attacking', () => {
    const startState: Long[] = [...emptyBoardState];
    startState[1] = Long.fromString('200', true, 16); //21

    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const friendlyColor: Color = 'b';
    changeGameState(startState, friendlyColor);

    const fromBitIndex = 0;

    expect(
      squareIsAttacked({
        friendlyColor,
        occupiedBits,
        fromBitIndex,
      })
    ).toEqual(false);
  });
  it('if own pawn is blocking queen attack', () => {
    const startState: Long[] = [...emptyBoardState];
    startState[1] = Long.fromString('200', true, 16); //21
    startState[8] = Long.fromString('8000000', true, 16); //21

    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const friendlyColor: Color = 'b';
    changeGameState(startState, friendlyColor);

    const fromBitIndex = 0;

    expect(
      squareIsAttacked({
        friendlyColor,
        occupiedBits,
        fromBitIndex,
      })
    ).toEqual(false);
  });
  it('if own pawn is blocking but knight attacks over', () => {
    const startState: Long[] = [...emptyBoardState];
    startState[1] = Long.fromString('200', true, 16); //21
    startState[8] = Long.fromString('8000000', true, 16); //21
    startState[6] = Long.fromString('20000', true, 16); //21
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const friendlyColor: Color = 'b';
    changeGameState(startState, friendlyColor);

    const fromBitIndex = 0;

    expect(
      squareIsAttacked({
        friendlyColor,
        occupiedBits,
        fromBitIndex,
      })
    ).toEqual(true);
  });
});

//--------------------------------------------------------/
//Mate
//--------------------------------------------------------/

describe('isMate', () => {
  it('two queens can mate', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('1', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('300000000000000', true, 16); //21

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = startState[10].countTrailingZeros();
    const expectedMoves = Long.fromString('0', true, 16);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(false);
    expect(mate).toEqual(true);
    expect(
      getKing({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
  it('', () => {
    const startState: Long[] = [...emptyBoardState];
    //setup king white
    startState[10] = Long.fromString('1', true, 16); //28
    //setup Queen black
    startState[9] = Long.fromString('300000000000000', true, 16); //21

    const color: Color = 'w';
    changeGameState(startState, color);

    const blackOccupiedBits = startState.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, Long.UZERO);
    const occupiedBits = startState.reduce(
      (acc, curr) => acc.or(curr),
      Long.UZERO
    );
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = startState[10].countTrailingZeros();
    const expectedMoves = Long.fromString('0', true, 16);

    expect(checked).toEqual(true);
    expect(doubleChecked).toEqual(false);
    expect(mate).toEqual(true);
    expect(
      getKing({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
      })
    ).toEqual(expectedMoves);
  });
});
