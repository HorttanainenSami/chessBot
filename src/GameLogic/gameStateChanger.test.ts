import Long from 'long';
import {
  changeGameState,
  isCheck,
  turn,
  reset,
  xrayBishopAttacks,
  xrayRookAttacks,
  getState,
  makeMove,
} from './gameStateChanger';
import { Color } from '../Types';
import { logger } from './helpers';
import { loadFEN } from './fen';
const emptyBoardState: Long[] = Array(12).fill(Long.UZERO);
beforeEach(() => reset());

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
    loadFEN('k7/8/6K1/4q3/8/8/8/8 w - - 0 1');

    const { check, doubleCheck, mate } = getState();
    expect(check).toEqual(false);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(false);
  });

  it('should make check if one enemy knight is attacking king', () => {
    loadFEN('k7/8/6K1/8/5n2/8/8/8 w - - 0 1');
    const { check, doubleCheck, mate } = getState();
    expect(check).toEqual(true);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(false);
  });

  it('should make doubleCheck if one enemy rook and queen is attacking king', () => {
    loadFEN('k7/8/4r1K1/8/4q3/8/8/8 w - - 0 1');
    const { check, doubleCheck, mate } = getState();
    expect(check).toEqual(true);
    expect(doubleCheck).toEqual(true);
    expect(mate).toEqual(false);
  });

  it('should make doubleCheck if one enemy knight and queen is attacking king', () => {
    loadFEN('k7/8/6K1/8/4qn2/8/8/8 w - - 0 1');
    const { check, doubleCheck, mate } = getState();
    expect(check).toEqual(true);
    expect(doubleCheck).toEqual(true);
    expect(mate).toEqual(false);
  });
  it('should make doubleCheck if one enemy bishop and queen is attacking king', () => {
    loadFEN('k3b3/8/6K1/8/4q3/8/8/8 w - - 0 1');
    const { check, doubleCheck, mate } = getState();
    expect(check).toEqual(true);
    expect(doubleCheck).toEqual(true);
    expect(mate).toEqual(false);
  });
  it('should not be DobuleCheck if one enemy bishop behind queen witch is attacking king', () => {
    loadFEN('k7/8/6K1/8/4q3/8/2b5/8 w - - 0 1');
    const { check, doubleCheck, mate } = getState();
    expect(check).toEqual(true);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(false);
  });
});

//--------------------------------------------------------/
// XRAY
//--------------------------------------------------------/
describe('xrayrook', () => {
  it('should work for W', () => {
    const occupied = Long.fromString('1c', true, 16);
    const blockers = Long.fromString('6', true, 16);
    const fromBitIndex = 1;
    const expected = Long.fromString('8', true, 16);

    expect(xrayRookAttacks({ occupied, blockers, fromBitIndex })).toEqual(
      expected
    );
  });
  it('should work for E', () => {
    const occupied = Long.fromString('1c', true, 16);
    const blockers = Long.fromString('c', true, 16);
    const fromBitIndex = 2;
    const expected = Long.fromString('10', true, 16);

    expect(xrayRookAttacks({ occupied, blockers, fromBitIndex })).toEqual(
      expected
    );
  });
  it('should work for N', () => {
    const occupied = Long.fromString('200000000020002', true, 16);
    const blockers = Long.fromString('20002', true, 16);
    const fromBitIndex = 1;
    const expected = Long.fromString('200000000000000', true, 16);

    expect(xrayRookAttacks({ occupied, blockers, fromBitIndex })).toEqual(
      expected
    );
  });
  it('should work for S', () => {
    const occupied = Long.fromString('202000000000002', true, 16);
    const blockers = Long.fromString('202000000000000', true, 16);
    const fromBitIndex = 57;
    const expected = Long.fromString('2', true, 16);

    expect(xrayRookAttacks({ occupied, blockers, fromBitIndex })).toEqual(
      expected
    );
  });
});
describe('xrayBishop', () => {
  it('should work for NW', () => {
    const occupied = Long.fromString('40000000040200', true, 16);
    const blockers = Long.fromString('40200', true, 16);
    const fromBitIndex = 9;
    const expected = Long.fromString('40000000000000', true, 16);

    expect(xrayBishopAttacks({ occupied, blockers, fromBitIndex })).toEqual(
      expected
    );
  });
  it('should work for NE', () => {
    const occupied = Long.fromString('204080', true, 16);
    const blockers = Long.fromString('4080', true, 16);
    const fromBitIndex = 7;
    const expected = Long.fromString('200000', true, 16);

    expect(xrayBishopAttacks({ occupied, blockers, fromBitIndex })).toEqual(
      expected
    );
  });
  it('should work for SW', () => {
    const occupied = Long.fromString('200001000400010', true, 16);
    const blockers = Long.fromString('200001000000000', true, 16);
    const fromBitIndex = 57;
    const expected = Long.fromString('400000', true, 16);

    expect(xrayBishopAttacks({ occupied, blockers, fromBitIndex })).toEqual(
      expected
    );
  });
  it('should work for SE', () => {
    const occupied = Long.fromString('201000040000', true, 16);
    const blockers = Long.fromString('201000000000', true, 16);
    const fromBitIndex = 45;
    const expected = Long.fromString('40000', true, 16);

    expect(xrayBishopAttacks({ occupied, blockers, fromBitIndex })).toEqual(
      expected
    );
  });
});
//--------------------------------------------------------/
//Mate
//--------------------------------------------------------/

describe('isMate', () => {
  it('two queens can mate', () => {
    loadFEN('k5qq/8/8/8/8/8/8/7K w - - 0 1');
    const { check, doubleCheck, mate } = getState();

    expect(check).toEqual(true);
    expect(doubleCheck).toEqual(false);
    expect(mate).toEqual(true);
  });
  it('', () => {
    loadFEN('r1b1k1r1/pp2Q1Qp/2np2Q1/q7/2B5/8/PPP2PPP/R1B1K1R1 b Qq - 0 11');
    const { check, doubleCheck, mate } = getState();

    expect(check).toEqual(true);
    expect(doubleCheck).toEqual(true);
    expect(mate).toEqual(true);
  });
});
//--------------------------------------------------------/
//Change Gamestate
//--------------------------------------------------------/

describe('updateGameState', () => {
  it('state changes after move is passed', () => {
    const color: Color = 'w';

    const expectedMoves = Long.fromString('0', true, 16);
    const from = 'd2';
    const to = 'd4';
    const piece = 0;
    const promotion = 'q';

    makeMove({ from, to, piece, color, promotion });
    const { gameState: state } = getState();

    const asd = state[0];
  });
});
