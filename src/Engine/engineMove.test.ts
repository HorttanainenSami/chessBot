import { loadFEN } from '../GameLogic/fen';
import { getState, makeMove, reset } from '../GameLogic/gameStateChanger';
import {
  getOrderedMoves,
  initializePolynomials,
  bchHash,
  polynomials,
  enginesNextMove,
} from './engineMove';
import { Color, Move, Piece, PieceSymbol, Square } from '../Types';
import { SquareBit } from '../GameLogic/helpers';
import { getMoves } from '../GameLogic/move';
import { bitCount } from './evaluation';

describe('OrderMoves', () => {
  it('works with empty moves', () => {
    loadFEN('8/8/8/8/8/8/8/8 w - - 0 1');
    const newState = getState();
    const expectedResult: Move[] = [];
    const result = getOrderedMoves(newState);
    expect(result).toEqual(expectedResult);
  });
  it('works with pieces in board', () => {
    loadFEN('3r4/8/8/8/8/3R4/8/8 w - - 0 1');
    const newState = getState();
    const initialMove = {
      from: SquareBit[20] as Square,
      promotion: 'q' as PieceSymbol,
      color: 'w' as Color,
      piece: 2,
    };
    const expectedResult: Move[] = [
      { ...initialMove, to: SquareBit[60] as Square },
      { ...initialMove, to: SquareBit[4] as Square },
      { ...initialMove, to: SquareBit[12] as Square },
      { ...initialMove, to: SquareBit[16] as Square },
      { ...initialMove, to: SquareBit[17] as Square },
      { ...initialMove, to: SquareBit[18] as Square },
      { ...initialMove, to: SquareBit[19] as Square },
      { ...initialMove, to: SquareBit[21] as Square },
      { ...initialMove, to: SquareBit[22] as Square },
      { ...initialMove, to: SquareBit[23] as Square },
      { ...initialMove, to: SquareBit[28] as Square },
      { ...initialMove, to: SquareBit[36] as Square },
      { ...initialMove, to: SquareBit[44] as Square },
      { ...initialMove, to: SquareBit[52] as Square },
    ];
    const result = getOrderedMoves(newState);
    expect(result).toEqual(expectedResult);
  });
  it('works with pieces in board', () => {
    loadFEN('3r4/2P1P3/8/8/8/3R4/6P1/8 w - - 0 1');
    const newState = getState();
    const initialRookMove = {
      from: SquareBit[20] as Square,
      promotion: 'q' as PieceSymbol,
      color: 'w' as Color,
      piece: 2,
    };
    const initialPawnMove = {
      from: SquareBit[9] as Square,
      promotion: 'q' as PieceSymbol,
      color: 'w' as Color,
      piece: 0,
    };
    const initialPawn2Move = {
      from: SquareBit[51] as Square,
      promotion: 'q' as PieceSymbol,
      color: 'w' as Color,
      piece: 0,
    };
    const initialPawn3Move = {
      from: SquareBit[53] as Square,
      promotion: 'q' as PieceSymbol,
      color: 'w' as Color,
      piece: 0,
    };
    const expectedResult: Move[] = [
      { ...initialPawn2Move, to: SquareBit[60] as Square },
      { ...initialPawn3Move, to: SquareBit[60] as Square },
      { ...initialRookMove, to: SquareBit[60] as Square },
      { ...initialPawnMove, to: SquareBit[17] as Square },
      { ...initialPawnMove, to: SquareBit[25] as Square },
      { ...initialPawn2Move, to: SquareBit[59] as Square },
      { ...initialPawn3Move, to: SquareBit[61] as Square },
      { ...initialRookMove, to: SquareBit[4] as Square },
      { ...initialRookMove, to: SquareBit[12] as Square },
      { ...initialRookMove, to: SquareBit[16] as Square },
      { ...initialRookMove, to: SquareBit[17] as Square },
      { ...initialRookMove, to: SquareBit[18] as Square },
      { ...initialRookMove, to: SquareBit[19] as Square },
      { ...initialRookMove, to: SquareBit[21] as Square },
      { ...initialRookMove, to: SquareBit[22] as Square },
      { ...initialRookMove, to: SquareBit[23] as Square },
      { ...initialRookMove, to: SquareBit[28] as Square },
      { ...initialRookMove, to: SquareBit[36] as Square },
      { ...initialRookMove, to: SquareBit[44] as Square },
      { ...initialRookMove, to: SquareBit[52] as Square },
    ];
    const result = getOrderedMoves(newState);
    expect(result).toEqual(expectedResult);
  });
  it('works with all pieces in board', () => {
    loadFEN('1q1r2n1/2P1P3/8/1B3p2/6N1/3Rp3/1Q4P1/8 w - - 0 1');
    const newState = getState();

    const moves = getMoves({
      color: 'w',
      state: newState,
    });
    let filteredAttacks: any[] = [];
    let filteredMoves: any[] = [];
    moves.forEach((a, b) => {
      a.algebricAttacks.map((r) =>
        filteredAttacks.push({
          from: SquareBit[b] as Square,
          to: SquareBit[r] as Square,
        })
      );
      a.algebricMoves.forEach((r) =>
        filteredMoves.push({
          from: SquareBit[b] as Square,
          to: SquareBit[r] as Square,
        })
      );
    });
    const expectedAttacks = filteredAttacks
      .filter((r) => r.length !== 0)
      .map((r) => r as { for: Square; to: Square });
    const expectedMoves = filteredMoves
      .filter((r) => r.length !== 0)
      .map((r) => r as { for: Square; to: Square });
    const result = getOrderedMoves(newState);
    expect(result).toMatchObject([...expectedAttacks, ...expectedMoves]);
  });
  it('should return right amounth of moves', () => {
    loadFEN('1q1r2n1/2P1P3/8/1B3p2/6N1/3Rp3/1Q4P1/8 w - - 0 1');
    const newState = getState();

    const moves = getMoves({
      color: 'w',
      state: newState,
    });
    let amounth = 0;
    for (let [, s] of moves) {
      amounth += bitCount(s.attacks);
      amounth += bitCount(s.moves.and(s.attacks.not()));
    }

    const result = getOrderedMoves(newState);
    expect(result.length).toEqual(amounth);
  });
});

describe('bchHash', () => {
  beforeAll(() => {
    initializePolynomials();
  });

  it('bchhash generates hexCode', () => {
    loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const { gameState, castling, draw } = getState();
    const hashCode = bchHash(gameState, false, castling, draw);

    expect(hashCode).not.toBe(0);
  });
  it('bchHash generates different bchHash for different states', () => {
    const uniqueHash = new Set<number>();
    loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const state1 = getState();
    const hashCode1 = bchHash(
      state1.gameState,
      false,
      state1.castling,
      state1.draw
    );
    uniqueHash.add(hashCode1);
    loadFEN('rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR w KQkq - 0 1');
    const state2 = getState();
    const hashCode2 = bchHash(
      state2.gameState,
      false,
      state2.castling,
      state2.draw
    );
    uniqueHash.add(hashCode2);

    loadFEN('rnbqkbnr/p1pppppp/8/1p6/2P5/1P6/P2PPPPP/RNBQKBNR w KQkq - 0 1');
    const state3 = getState();
    const hashCode3 = bchHash(
      state3.gameState,
      false,
      state3.castling,
      state3.draw
    );
    uniqueHash.add(hashCode3);

    loadFEN('rnbqkbnr/p1pppppp/8/8/2p5/1P6/P2PPPPP/RNBQKBNR w KQkq - 0 1');

    const state4 = getState();
    const hashCode4 = bchHash(
      state4.gameState,
      false,
      state4.castling,
      state4.draw
    );
    uniqueHash.add(hashCode4);

    loadFEN('rnbqkbnr/p1pppppp/8/8/2P5/8/P2PPPPP/RNBQKBNR w KQkq - 0 1');
    const state5 = getState();
    const hashCode5 = bchHash(
      state5.gameState,
      false,
      state5.castling,
      state5.draw
    );
    uniqueHash.add(hashCode5);

    expect(uniqueHash.size).toBe(5);
  });
  it('bchHash generates different bchHash for different states', () => {
    const uniqueHash = new Set<number>();
    loadFEN('rnbqkbnr/pppppppp/8/8/8/3PP3/PPP2PPP/RNBQKBNR w KQkq - 0 1');
    const state1 = getState();
    const hashCode1 = bchHash(
      state1.gameState,
      false,
      state1.castling,
      state1.draw
    );
    uniqueHash.add(hashCode1);
    loadFEN('rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
    const state2 = getState();
    const hashCode2 = bchHash(
      state2.gameState,
      false,
      state2.castling,
      state2.draw
    );
    uniqueHash.add(hashCode2);
    loadFEN('rnbqkbnr/pppppppp/8/8/8/3P4/PPP1PPPP/RNBQKBNR w KQkq - 0 1');
    const state3 = getState();
    const hashCode3 = bchHash(
      state3.gameState,
      false,
      state3.castling,
      state3.draw
    );
    uniqueHash.add(hashCode3);
    loadFEN('rnbqkbnr/pppppppp/8/8/3P4/4P3/PPP2PPP/RNBQKBNR w KQkq - 0 1');
    const state4 = getState();
    const hashCode4 = bchHash(
      state4.gameState,
      false,
      state4.castling,
      state4.draw
    );
    uniqueHash.add(hashCode4);
    loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const state5 = getState();
    const hashCode5 = bchHash(
      state5.gameState,
      false,
      state5.castling,
      state5.draw
    );
    uniqueHash.add(hashCode5);

    expect(uniqueHash.size).toBe(5);
  });
  it('bchHash generates same bchHash for same state', () => {
    const uniqueHash = new Set<number>();
    loadFEN('rnbqkbnr/pppppppp/8/8/8/3PP3/PPP2PPP/RNBQKBNR w KQkq - 0 1');
    const state1 = getState();
    for (let i = 0; i < 50; i++) {
      uniqueHash.add(
        bchHash(state1.gameState, false, state1.castling, state1.draw)
      );
    }

    expect(uniqueHash.size).toBe(1);
  });
  it('bchHash values are unique', () => {
    let uniqueValues: Set<number> = new Set();
    for (let i = 0; i < 64; i++) {
      for (let j = 0; j < 12; j++) {
        for (let x = 0; x < 64; x++) {
          const value = polynomials[i][j][x];
          if (uniqueValues.has(value)) {
            expect(true).toBe(false);
          } else {
            uniqueValues.add(value);
          }
        }
      }
    }
  });
});

describe('alphabeta finds n mate when depth is n', () => {
  beforeEach(() => {
    reset();
  });
  it('finds mate in 2, when depth is 4', async () => {
    loadFEN('8/4R3/2pk4/2p2K2/8/4N3/2P5/4Q3 w - - 0 1');
    const wmove = await enginesNextMove(4, 'w');
    makeMove(wmove);
    const bmove = await enginesNextMove(4, 'b');
    makeMove(bmove);
    const wmove2 = await enginesNextMove(4, 'w');
    makeMove(wmove2);
    const state = getState();
    expect(state.mate).toBe(true);
  });
});
