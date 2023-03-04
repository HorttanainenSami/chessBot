import Long from 'long';
import { getFEN, loadFEN } from './fen';
import { getState } from './gameStateChanger';

describe('loadFen', () => {
  it('fen /6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0 1/ loads correct state', () => {
    loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0 1');
    const state = getState();
    expect(state.turn).toBe('b');
    expect(state.castling).toBe('-');
    expect(state.check).toBe(false);
    expect(state.elPassant).toBe(undefined);
    const wP = state.gameState[0];
    const EwP = Long.fromString('824100', true, 16);
    expect(wP).toEqual(EwP);

    const bP = state.gameState[1];
    const EbP = Long.fromString('c2201000000000', true, 16);
    expect(bP).toEqual(EbP);

    const wR = state.gameState[2];
    const EwR = Long.fromString('18', true, 16);
    expect(wR).toEqual(EwR);

    const bR = state.gameState[3];
    const EbR = Long.fromString('600', true, 16);
    expect(bR).toEqual(EbR);

    const wB = state.gameState[4];
    const EwB = Long.fromString('20', true, 16);
    expect(wB).toEqual(EwB);

    const bB = state.gameState[5];
    const EbB = Long.fromString('2000010000', true, 16);
    expect(bB).toEqual(EbB);

    const wN = state.gameState[6];
    const EwN = Long.fromString('4', true, 16);
    expect(wN).toEqual(EwN);

    const bN = state.gameState[7];
    const EbN = Long.fromString('0', true, 16);
    expect(bN).toEqual(EbN);

    const wQ = state.gameState[8];
    const EwQ = Long.fromString('0', true, 16);
    expect(wQ).toEqual(EwQ);

    const bQ = state.gameState[9];
    const EbQ = Long.fromString('0', true, 16);
    expect(bQ).toEqual(EbQ);

    const wK = state.gameState[10];
    const EwK = Long.fromString('1', true, 16);
    expect(wK).toEqual(EwK);

    const bK = state.gameState[11];
    const EbK = Long.fromString('200000000000000', true, 16);
    expect(bK).toEqual(EbK);
  });
  it('notadted incorrectly', () => {
    expect(() => {
      loadFEN('asdasd');
    }).toThrow(Error);
  });
  it('fullmoves not included or not number', () => {
    expect(() => {
      loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - - 1');
    }).toThrow(Error);
    expect(() => {
      loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - -');
    }).toThrow(Error);
  });
  it('halfmoves not included or not number', () => {
    expect(() => {
      loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0 -');
    }).toThrow(Error);
    expect(() => {
      loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0');
    }).toThrow(Error);
  });
});

describe('getFen', () => {
  it('loadFEN and getFEN doesnt modify FEN', () => {
    loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - e3 0 1');
    expect(getFEN()).toEqual(
      '6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - e3 0 1'
    );
  });
  it('loadFEN and getFEN doesnt modify FEN', () => {
    loadFEN('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K w KQ e3 0 1');
    expect(getFEN()).toEqual(
      '6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K w KQ e3 0 1'
    );
  });
});
