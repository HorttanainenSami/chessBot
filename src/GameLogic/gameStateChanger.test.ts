import Long from 'long';
import {
  reset,
  xrayBishopAttacks,
  xrayRookAttacks,
  getState,
  makeMove,
  getUpdatedState,
  checkIfElpassant,
} from './gameStateChanger';
import { Color, Move, PieceSymbol, Square } from '../Types';
import {
  SquareBit,
  getBlackOccupiedBits,
  getOccupiedBits,
  logger,
} from './helpers';
import { loadFEN } from './fen';
import { getKing, getMove, getMoves } from './move';
import { forEach } from 'lodash';
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

    const expectedMoves = Long.fromString('1000ef00', true, 16);
    const from = 'd2';
    const to = 'd4';
    const piece = 0;
    const promotion = 'q';

    makeMove({ from, to, piece, color, promotion });
    const { gameState: state } = getState();

    const result = state[0];
    expect(result).toEqual(expectedMoves);
  });
});
describe('getUpdatedState', () => {
  it('getUpdatedState should not update real state', () => {
    const color: Color = 'w';
    const state = getState();
    const fromBitIndex = state.gameState[0].countTrailingZeros();
    const toBitIndex = Long.UONE.shl(fromBitIndex + 8).countTrailingZeros();
    const move: Move = {
      from: SquareBit[fromBitIndex] as Square,
      to: SquareBit[toBitIndex] as Square,
      promotion: 'q' as PieceSymbol,
      color,
      piece: 0,
    };

    const updated = getUpdatedState({ move, state });

    const { gameState } = getState();

    expect(state.gameState[0]).toEqual(gameState[0]);
    expect(updated.gameState[0]).not.toEqual(gameState[0]);
  });
  it('making moves should increment bchHistory', () => {
    const color: Color = 'w';
    const state = getState();
    const fromBitIndex = state.gameState[0].countTrailingZeros();
    const toBitIndex = Long.UONE.shl(fromBitIndex + 8).countTrailingZeros();
    const move: Move = {
      from: SquareBit[fromBitIndex] as Square,
      to: SquareBit[toBitIndex] as Square,
      promotion: 'q' as PieceSymbol,
      color,
      piece: 0,
    };

    const updated = getUpdatedState({ move, state });

    expect(state.bchHistory.length).toEqual(0);
    expect(updated.bchHistory.length).toEqual(1);
  });
  it('making repetive moves should cause draw', () => {
    loadFEN('6k1/7r/8/8/8/4b3/5r2/3R1K2 w - - 0 1');
    const state = getState();
    const move1: Move = {
      from: 'f1',
      to: 'g1',
      promotion: 'q' as PieceSymbol,
      color: 'w',
      piece: 10,
    };

    const move2: Move = {
      from: 'g8',
      to: 'g7',
      promotion: 'q' as PieceSymbol,
      color: 'b',
      piece: 11,
    };
    const move3: Move = {
      from: 'g1',
      to: 'f1',
      promotion: 'q' as PieceSymbol,
      color: 'w',
      piece: 10,
    };

    const move4: Move = {
      from: 'g7',
      to: 'g8',
      promotion: 'q' as PieceSymbol,
      color: 'b',
      piece: 11,
    };
    makeMove(move1);
    makeMove(move2);
    makeMove(move3);
    makeMove(move4);
    makeMove(move1);
    makeMove(move2);
    makeMove(move3);
    makeMove(move4);
    makeMove(move1);
    const updated = getState();
    expect(state.bchHistory.length).toEqual(0);
    expect(updated.bchHistory.length).toEqual(9);
    expect(state.draw).toEqual(false);
    expect(updated.draw).toEqual(true);
  });
});
describe('movePiece', () => {
  it('removes piece if it is captured', () => {
    loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0 1');
    const color: Color = 'b';

    const from = 'f2';
    const to = 'f1';
    const piece = 3;
    const promotion = 'q';
    const result = Long.fromString('0', true, 16);
    makeMove({ from, to, piece, color, promotion });
    const { gameState: state } = getState();
    expect(state[6]).toEqual(result);
  });
  it('sets elpassant state', () => {
    loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0 1');
    const color: Color = 'b';

    const from = 'g7';
    const to = 'g5';
    const piece = 1;
    const promotion = 'q';
    makeMove({ from, to, piece, color, promotion });
    const { elPassant } = getState();
    expect(elPassant).toEqual(SquareBit['g6']);
  });

  it('removes elpassant state', () => {
    loadFEN('6k1/pp6/2p5/2bp2p1/8/P5Pb/1P3rrP/2BRRN1K w - g5 0 1');
    const color: Color = 'w';

    const from = 'g3';
    const to = 'g4';
    const piece = 0;
    const promotion = 'q';
    makeMove({ from, to, piece, color, promotion });
    const { elPassant } = getState();
    expect(elPassant).toEqual(null);
  });
  it('castling can be made', () => {
    loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1');
    const color: Color = 'w';

    const from = 'e1';
    const to = 'g1';
    const piece = 10;
    const promotion = 'q';
    const kingPosition = Long.fromString('2', true, 16);
    const rookPosition = Long.fromString('84', true, 16);
    makeMove({ from, to, piece, color, promotion });
    const { gameState, castling } = getState();
    expect(gameState[10]).toEqual(kingPosition);
    expect(gameState[2]).toEqual(rookPosition);
    expect(castling).toEqual('kq');
  });
  it('removes castling right if rook is captured', () => {});
});
describe('castling', () => {
  it('castling is possible if castling rights are valid', () => {
    loadFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = blackOccupiedBits.xor(occupiedBits);
    const piece = 10;
    const color: Color = piece % 2 === 0 ? 'w' : 'b';
    const fromBitIndex = state.gameState[piece].countTrailingZeros();
    const move = {
      blackOccupiedBits,
      whiteOccupiedBits,
      occupiedBits,
      fromBitIndex,
      piece,
      color,
    };
    const expectedMoves = Long.fromString('36', true, 16);
    expect(getMove({ state: getState(), move })).toEqual(expectedMoves);
    loadFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w Kkq - 0 1');
    const expectedMoves1 = Long.fromString('16', true, 16);
    expect(getMove({ state: getState(), move })).toEqual(expectedMoves1);

    loadFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w Qkq - 0 1');
    const expectedMoves2 = Long.fromString('34', true, 16);

    expect(getMove({ state: getState(), move })).toEqual(expectedMoves2);
  });
  it('castling is possible if castling rights are valid', () => {
    loadFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1');
    const state = getState();
    const blackOccupiedBits = getBlackOccupiedBits(state.gameState);
    const occupiedBits = getOccupiedBits(state.gameState);
    const whiteOccupiedBits = blackOccupiedBits.xor(occupiedBits);
    const piece = 11;
    const color: Color = piece % 2 === 0 ? 'w' : 'b';
    const fromBitIndex = state.gameState[piece].countTrailingZeros();
    const move = {
      blackOccupiedBits,
      whiteOccupiedBits,
      occupiedBits,
      fromBitIndex,
      piece,
      color,
    };
    const kq = Long.fromString('3600000000000000', true, 16);
    expect(getMove({ state: getState(), move })).toEqual(kq);

    loadFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQk - 0 1');
    const k = Long.fromString('1600000000000000', true, 16);
    expect(getMove({ state: getState(), move })).toEqual(k);

    loadFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQq - 0 1');
    const q = Long.fromString('3400000000000000', true, 16);
    expect(getMove({ state: getState(), move })).toEqual(q);

    loadFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQ - 0 1');
    const none = Long.fromString('1400000000000000', true, 16);
    expect(getMove({ state: getState(), move })).toEqual(none);
  });
  it('castling is updated after rook move', () => {
    loadFEN('r3k2r/1pppppp1/8/8/8/8/1PPPPPP1/R3K2R w KQkq - 0 1');
    expect(getState().castling).toEqual('KQkq');
    makeMove({ from: 'h1', to: 'h7', promotion: 'q', color: 'w', piece: 2 });
    expect(getState().castling).toEqual('Qkq');
    makeMove({ from: 'h8', to: 'h7', promotion: 'q', color: 'b', piece: 3 });
    expect(getState().castling).toEqual('Qq');
  });
  it('castling is updated after rook is captured', () => {
    loadFEN('r3k2r/1pppppp1/8/8/8/8/1PPPPPP1/R3K2R w KQkq - 0 1');
    expect(getState().castling).toEqual('KQkq');
    makeMove({ from: 'h1', to: 'h8', promotion: 'q', color: 'w', piece: 2 });
    expect(getState().castling).toEqual('Qq');
  });
});
describe('reset works', () => {
  it('reset loads start state of game', () => {
    loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 1 2');
    const state1 = getState();
    reset();
    const state2 = getState();
    expect(state1.castling).not.toEqual(state2.castling);
    expect(state1.fullMove).not.toEqual(state2.fullMove);
    expect(state1.halfMove).not.toEqual(state2.halfMove);
    expect(state1.turn).not.toEqual(state2.turn);
  });
});

describe('get king moves', () => {
  it('cannot move', () => {
    loadFEN('8/8/2p5/2pk1K2/2N1R3/8/2P5/4Q3 b - - 3 2');
    const state = getState();
    const moves = getMoves({ color: 'b', state });
    expect(Array.from(moves).length).toBe(0);
    expect(state.check).toBe(false);
    expect(state.mate).toBe(false);
    expect(state.staleMate).toBe(true);
  });
});
