import {
  squareIsAttacked,
  subsetOfMaskThatIsNotAttacked,
  getBishop,
  getRook,
  getKing,
  getKnight,
  getPawn,
  toIndexArray,
} from './move';
import { loadFEN } from './fen';
import { getState } from './gameStateChanger';
import Long from 'long';
import { Color } from '../Types';
import { SquareBit, getBlackOccupiedBits, getOccupiedBits } from './helpers';

//--------------------------------------------------------/
//AbsolutelyPinned
//--------------------------------------------------------/
describe('check if bishop is absolutely pinned', () => {
  it('should return zero possible moves for white bishop when its being absolutely pinned from south with rook', () => {
    loadFEN('k7/8/8/2K5/8/2B5/8/2r5 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = 21;

    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from west with rook', () => {
    const expectedMoves = Long.fromString('0x0', true, 16);

    loadFEN('k7/8/8/2r1B1K1/8/8/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = 35;

    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from east with Queen', () => {
    loadFEN('k7/8/8/2K1B1r1/8/8/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = 35;
    const friendlyKing = state.gameState[10];

    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return possible moves for white bishop when its not being pinned', () => {
    const fromBitIndex = 35;

    loadFEN('k7/8/6q1/2K1B3/8/8/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const expectedMoves = Long.fromString('4122140014224180', true, 16);
    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
});
describe('check if rook is absolutely pinned', () => {
  it('should return zero possible moves for white rook when its being absolutely pinned from southW with bishop', () => {
    loadFEN('k7/8/8/4K3/3R4/2b5/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];
    const fromBitIndex = 28;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getRook({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from Southeast with bishop', () => {
    loadFEN('k7/8/8/2K5/8/4R3/8/6b1 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = state.gameState[2].countTrailingZeros();

    const expectedMoves = Long.fromString('0x0', true, 16);
    expect(
      getRook({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from NorthEast with Queen', () => {
    loadFEN('k7/8/8/2q5/3R4/4K3/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = 28;

    const expectedMoves = Long.fromString('0x0', true, 16);
    expect(
      getRook({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white rook when its being absolutely pinned from NWest with Queen', () => {
    const fromBitIndex = 28;

    loadFEN('k7/8/8/4q3/3R4/2K5/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const expectedMoves = Long.fromString('0x0', true, 16);
    expect(
      getRook({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
});
describe('check if knight is absolutely pinned', () => {
  it('Knight is absolutely pinned from N', () => {
    loadFEN('k7/8/8/8/3q4/8/3N4/3K4 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = 12;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getKnight({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('Knight is absolutely pinned from NW', () => {
    loadFEN('k7/8/8/8/8/3q4/4N3/5K2 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = 11;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getKnight({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
});
describe('check if pawn is absolutely pinned', () => {
  it('Pawn is absolutely pinned from NW', () => {
    loadFEN('k7/8/8/8/2q5/8/4P3/5K2 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = 11;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });

  it('Pawn is absolutely pinned from E', () => {
    loadFEN('k7/8/8/8/8/8/8/3KP2q w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];
    const fromBitIndex = 3;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn is absolutely pinned from W', () => {
    loadFEN('k7/8/8/8/8/8/8/2r2P1K w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const color: Color = 'w';
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 2;
    const expectedMoves = Long.fromString('0x0', true, 16);
    const friendlyKing = state.gameState[10];

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn is absolutely pinned from NE', () => {
    loadFEN('k7/8/8/8/7b/8/5P2/4K3 w - - 0 1');
    const color: Color = 'w';
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const friendlyKing = state.gameState[10];

    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const fromBitIndex = 10;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn is absolutely pinned from SE', () => {
    loadFEN('k7/8/8/8/8/5K2/6P1/7q w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = 10;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn is absolutely pinned from SW', () => {
    loadFEN('k7/8/8/8/8/7K/6P1/5q2 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = 9;
    const expectedMoves = Long.fromString('0x0', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
});
//--------------------------------------------------------/
//PartiallyPinned
//--------------------------------------------------------/
describe('bishop partially pinned', () => {
  it('should return attack to pinner when pinner is in diagonal', () => {
    loadFEN('k7/8/8/2K5/3B4/8/5b2/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const friendlyKing = state.gameState[10];
    const color: Color = 'w';

    const fromBitIndex = state.gameState[4].countTrailingZeros();

    const expectedMoves = Long.fromString('80400', true, 16);
    const result = getBishop({
      blackOccupiedBits,
      whiteOccupiedBits,
      occupiedBits,
      fromBitIndex,
      color,
      state,
      friendlyKing,
    });

    expect(result).toEqual(expectedMoves);
  });

  it('should return attack to pinner when pinner is in diagonal', () => {
    loadFEN('k7/8/5b2/8/3B4/2K5/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];

    const fromBitIndex = state.gameState[4].countTrailingZeros();

    const expectedMoves = Long.fromString('40800000000', true, 16);
    const result = getBishop({
      blackOccupiedBits,
      whiteOccupiedBits,
      occupiedBits,
      fromBitIndex,
      color,
      state,
      friendlyKing,
    });

    expect(result).toEqual(expectedMoves);
  });
  it('should return zero possible moves for white bishop when its being absolutely pinned from east with Queen', () => {
    loadFEN('k7/8/8/2b5/3B4/8/5K2/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];
    const expectedMoves = Long.fromString('2000000000', true, 16);
    const fromBitIndex = state.gameState[4].countTrailingZeros();

    expect(
      getBishop({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
});
describe('rook partially pinned', () => {
  it('should return attack for pinner S', () => {
    loadFEN('k7/8/8/4K3/8/4R3/8/4r3 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];
    const fromBitIndex = state.gameState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('808', true, 16);

    expect(
      getRook({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return attack for pinner N', () => {
    loadFEN('k7/8/8/4r3/8/4R3/8/4K3 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];
    const fromBitIndex = state.gameState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('808000000', true, 16);

    expect(
      getRook({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return attack for pinner, E', () => {
    loadFEN('k7/8/8/r1R1K3/8/8/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];
    const fromBitIndex = state.gameState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('c000000000', true, 16);

    expect(
      getRook({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('should return attack for pinner W', () => {
    loadFEN('k7/8/8/K1R1r3/8/8/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const friendlyKing = state.gameState[10];
    const fromBitIndex = state.gameState[2].countTrailingZeros();
    const expectedMoves = Long.fromString('1800000000', true, 16);

    expect(
      getRook({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
});
describe('pawn partially pinned', () => {
  it('pawn can move forwards when pinned from S', () => {
    loadFEN('k7/8/8/4K3/8/4P3/8/4r3 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = state.gameState[0].countTrailingZeros();
    const friendlyKing = state.gameState[10];
    const expectedMoves = Long.fromString('8000000', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('pawn can move forwards when pinned from N', () => {
    loadFEN('k7/4r3/8/4P3/8/4K3/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = state.gameState[0].countTrailingZeros();
    const friendlyKing = state.gameState[10];
    const expectedMoves = Long.fromString('80000000000', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn can eat pinner', () => {
    loadFEN('k7/6q1/5P2/4K3/8/8/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = state.gameState[0].countTrailingZeros();
    const friendlyKing = state.gameState[10];
    const expectedMoves = Long.fromString('2000000000000', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
  it('Pawn can eat pinner', () => {
    loadFEN('k7/4q3/5P2/6K1/8/8/8/8 w - - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = state.gameState[0].countTrailingZeros();
    const friendlyKing = state.gameState[10];
    const expectedMoves = Long.fromString('8000000000000', true, 16);

    expect(
      getPawn({
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
        fromBitIndex,
        color,
        state,
        friendlyKing,
      })
    ).toEqual(expectedMoves);
  });
});
//--------------------------------------------------------/
//Check but piece can move within rules
//--------------------------------------------------------/
describe('isCheck and piece can come to block attack', () => {
  it('own pawn can block check', () => {
    loadFEN('k7/8/6K1/8/4qP2/8/8/8 w - - 0 1');

    const r1 = getState();
    const blackOccupiedBits = getBlackOccupiedBits(r1.gameState);
    const occupiedBits = getOccupiedBits(r1.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = r1.gameState[0].countTrailingZeros();
    const friendlyKing = r1.gameState[10];

    const expectedMoves = Long.fromString('400000000', true, 16);
    expect(r1.check).toEqual(true);
    expect(r1.doubleCheck).toEqual(false);
    expect(r1.mate).toEqual(false);

    expect(
      getPawn({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
        friendlyKing,
        state: r1,
      })
    ).toEqual(expectedMoves);
    //piece cannot move incase of doubleCheck
  });
  it('own bishop can block check', () => {
    loadFEN('k7/8/4B1K1/8/4q3/8/8/8 w - - 0 1');

    const r1 = getState();
    const blackOccupiedBits = getBlackOccupiedBits(r1.gameState);
    const occupiedBits = getOccupiedBits(r1.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = r1.gameState[4].countTrailingZeros();
    const friendlyKing = r1.gameState[10];

    const expectedMoves = Long.fromString('400000000', true, 16);

    expect(r1.check).toEqual(true);
    expect(r1.doubleCheck).toEqual(false);
    expect(r1.mate).toEqual(false);

    expect(
      getBishop({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
        friendlyKing,
        state: r1,
      })
    ).toEqual(expectedMoves);
  });

  it('own rook can block check', () => {
    loadFEN('k7/8/6K1/8/4q3/8/8/5R2 w - - 0 1');

    const r1 = getState();
    const blackOccupiedBits = getBlackOccupiedBits(r1.gameState);
    const occupiedBits = getOccupiedBits(r1.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = r1.gameState[2].countTrailingZeros();
    const friendlyKing = r1.gameState[10];
    const expectedMoves = Long.fromString('400000000', true, 16);
    expect(r1.check).toEqual(true);
    expect(r1.doubleCheck).toEqual(false);
    expect(r1.mate).toEqual(false);
    expect(
      getRook({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
        friendlyKing,
        state: r1,
      })
    ).toEqual(expectedMoves);
  });
  it('own knight can block check', () => {
    loadFEN('k7/8/6K1/8/4q3/4N3/8/8 w - - 0 1');

    const r1 = getState();
    const blackOccupiedBits = getBlackOccupiedBits(r1.gameState);
    const occupiedBits = getOccupiedBits(r1.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';
    const fromBitIndex = r1.gameState[6].countTrailingZeros();
    const friendlyKing = r1.gameState[10];
    const expectedMoves = Long.fromString('400000000', true, 16);

    expect(r1.check).toEqual(true);
    expect(r1.doubleCheck).toEqual(false);
    expect(r1.mate).toEqual(false);
    expect(
      getKnight({
        whiteOccupiedBits,
        fromBitIndex,
        blackOccupiedBits,
        occupiedBits,
        color,
        friendlyKing,
        state: r1,
      })
    ).toEqual(expectedMoves);
  });
});
describe('isCheck and king can move to non attacked square', () => {
  it('should return only non attacked squares', () => {
    loadFEN('k7/8/6K1/4q3/8/8/8/8 w - - 0 1');
    const state = getState();

    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';

    const fromBitIndex = state.gameState[10].countTrailingZeros();

    expect(state.check).toEqual(false);
    expect(state.doubleCheck).toEqual(false);
    expect(state.mate).toEqual(false);
    const expectedMoves = Long.fromString('5010000000000', true, 16);
    expect(
      getKing({
        color,
        whiteOccupiedBits,
        blackOccupiedBits,
        occupiedBits,
        fromBitIndex,
        state,
      })
    ).toEqual(expectedMoves);
  });
  it('should return only non attacked squares', () => {
    loadFEN('k3n1r1/8/6K1/8/4b3/8/8/8 w - - 0 1');
    const state = getState();

    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';

    const fromBitIndex = state.gameState[10].countTrailingZeros();

    expect(state.check).toEqual(true);
    expect(state.doubleCheck).toEqual(true);
    expect(state.mate).toEqual(false);
    const expectedMoves = Long.fromString('4010100000000', true, 16);

    expect(
      getKing({
        color,
        whiteOccupiedBits,
        blackOccupiedBits,
        occupiedBits,
        fromBitIndex,
        state,
      })
    ).toEqual(expectedMoves);
  });
  it('should return only non attacked squares', () => {
    loadFEN('k2rr3/4K3/5r2/8/8/8/8/8 w - - 0 1');
    const state = getState();

    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const color: Color = 'w';

    const fromBitIndex = state.gameState[10].countTrailingZeros();
    expect(state.check).toEqual(true);
    expect(state.doubleCheck).toEqual(false);
    expect(state.mate).toEqual(false);
    const expectedMoves = Long.fromString('40000000000', true, 16);

    expect(
      getKing({
        color,
        whiteOccupiedBits,
        blackOccupiedBits,
        occupiedBits,
        fromBitIndex,
        state,
      })
    ).toEqual(expectedMoves);
  });
});
describe('subsetOfMaskThatIsNotAttacked', () => {
  it('should return correct mask', () => {
    loadFEN('k7/8/6K1/4q3/8/8/8/8 w - - 0 1');
    const { gameState } = getState();
    const occupiedBits = getOccupiedBits(gameState);
    const color: Color = 'w';
    const moveMask = Long.fromString('7050700000000', true, 16);
    const expectedMoves = Long.fromString('5010000000000', true, 16);
    expect(
      subsetOfMaskThatIsNotAttacked({
        moveMask,
        occupiedBits,
        color,
        gameState,
      })
    ).toEqual(expectedMoves);
  });
});

describe('squareIsAttacked', () => {
  it('if pawn is attacking', () => {
    loadFEN('k7/8/8/8/8/8/6p1/K7 w - - 0 1');
    const { gameState } = getState();
    const occupiedBits = getOccupiedBits(gameState);

    const friendlyColor: Color = 'w';
    const fromBitIndex = 0;

    expect(
      squareIsAttacked({
        friendlyColor,
        occupiedBits,
        fromBitIndex,
        gameState,
      })
    ).toEqual(true);
  });
  it('if own pawn is blocking queen attack', () => {
    const friendlyColor: Color = 'b';

    loadFEN('k7/8/8/8/4Q3/8/6p1/K7 b - - 0 1');
    const { gameState } = getState();
    const occupiedBits = getOccupiedBits(gameState);

    const fromBitIndex = 0;

    expect(
      squareIsAttacked({
        friendlyColor,
        occupiedBits,
        fromBitIndex,
        gameState,
      })
    ).toEqual(false);
  });

  it('if own pawn is blocking but knight attacks over', () => {
    loadFEN('k7/8/8/8/4Q3/6N1/6p1/K7 b - - 0 1');
    const { gameState } = getState();
    const occupiedBits = getOccupiedBits(gameState);

    const friendlyColor: Color = 'b';

    const fromBitIndex = 0;

    expect(
      squareIsAttacked({
        friendlyColor,
        occupiedBits,
        fromBitIndex,
        gameState,
      })
    ).toEqual(true);
  });
});

//--------------------------------------------------------/
//toArrayIndexes
//--------------------------------------------------------/
describe('toIndexArray', () => {
  it('should return correct array to empty', () => {
    const result = toIndexArray(Long.UZERO);
    const expectedResult: SquareBit[] = [];
    expect(result).toEqual(expectedResult);
  });
  it('should return correct array to full BB', () => {
    const result = toIndexArray(Long.MAX_UNSIGNED_VALUE);
    const expectedResult: SquareBit[] = Array.from({ length: 64 }, (_, i) => i);
    expect(result).toEqual(expectedResult);
  });
  it('should return correct array to containing one in different indexes', () => {
    const result = toIndexArray(Long.UONE);
    const expectedResult: SquareBit[] = [0];
    const result1 = toIndexArray(Long.UONE.shl(4));
    const expectedResult1: SquareBit[] = [4];
    const result2 = toIndexArray(Long.UONE.shl(53));
    const expectedResult2: SquareBit[] = [53];
    const result3 = toIndexArray(Long.UONE.shl(63));
    const expectedResult3: SquareBit[] = [63];
    const result4 = toIndexArray(Long.UONE.shl(35));
    const expectedResult4: SquareBit[] = [35];
    expect(result).toEqual(expectedResult);
    expect(result1).toEqual(expectedResult1);
    expect(result2).toEqual(expectedResult2);
    expect(result3).toEqual(expectedResult3);
    expect(result4).toEqual(expectedResult4);
  });
  it('should return correct array to containing multiple in different indexes', () => {
    const result = toIndexArray(Long.fromString('8040201008040201', true, 16));
    const expectedResult: SquareBit[] = [0, 9, 18, 27, 36, 45, 54, 63];
    const result1 = toIndexArray(Long.fromString('2020040020000000', true, 16));
    const expectedResult1: SquareBit[] = [29, 42, 53, 61];
    expect(result).toEqual(expectedResult);
    expect(result1).toEqual(expectedResult1);
  });
});
