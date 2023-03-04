import Long from 'long';
import Masks, {
  inBetween,
  initializePreCalculatedMoves,
  mayMove,
  obstructed,
} from './preCalculatedMoveMasks';

beforeAll(() => {
  initializePreCalculatedMoves();
});
describe('ArrRectangular is initialized right', () => {
  it('get same mask from->to and to->from', () => {
    const from = 0;
    const to = 63;
    const mask = inBetween(from, to);
    const mask2 = inBetween(to, from);

    expect(mask).toEqual(mask2);
  });
  it('get same mask from->to and to->from', () => {
    const from = 0;
    const to = 63;
    const mask = inBetween(from, to);
    const mask2 = inBetween(to, from);
    const expected = Long.fromString('8040201008040201', true, 16);

    expect(mask).toEqual(mask2);
    expect(mask).toEqual(expected);
  });
  it('get same mask from->to and to->from', () => {
    const from = 0;
    const to = 56;
    const mask = inBetween(from, to);
    const mask2 = inBetween(to, from);
    const expected = Long.fromString('101010101010101', true, 16);

    expect(mask).toEqual(mask2);
    expect(mask).toEqual(expected);
  });
  it('get same mask from->to and to->from', () => {
    const from = 0;
    const to = 7;
    const mask = inBetween(from, to);
    const mask2 = inBetween(to, from);
    const expected = Long.fromString('ff', true, 16);

    expect(mask).toEqual(mask2);
    expect(mask).toEqual(expected);
  });
  it('get same mask from->to and to->from when from and to is not in same line or diagonal', () => {
    const from = 0;
    const to = 15;
    const mask = inBetween(from, to);
    const mask2 = inBetween(to, from);

    expect(mask).toEqual(mask2);
    expect(mask).toEqual(null);
  });
});
describe('obstructed', () => {
  it('if no one is in way, return Long.UZERO', () => {
    const from = 0;
    const to = 63;
    const mask = obstructed(from, to, Long.UZERO);

    expect(mask).toEqual(Long.UZERO);
  });
  it('if from->to is illegal return UZERO', () => {
    const from = 0;
    const to = 62;
    const mask = obstructed(from, to, Long.UZERO);

    expect(mask).toEqual(Long.UZERO);
  });
  it('if from->to is illegal return UZERO, when occupied is full', () => {
    const from = 0;
    const to = 62;
    const mask = obstructed(from, to, Long.MAX_UNSIGNED_VALUE);

    expect(mask).toEqual(Long.UZERO);
  });
  it('return all squares between from and to excluding from, when occupied is full', () => {
    const from = 0;
    const to = 63;
    const mask = obstructed(from, to, Long.MAX_UNSIGNED_VALUE);

    expect(mask).toEqual(Long.fromString('8040201008040200', true, 16));
  });
});
describe('mayMove', () => {
  it('return false if legal move', () => {
    const from = 0;
    const to = 62;
    const mask = mayMove({ from, to, occupied: Long.MAX_UNSIGNED_VALUE });
    const mask1 = mayMove({ from, to, occupied: Long.UZERO });

    expect(mask).toEqual(false);
    expect(mask1).toEqual(false);
  });
  it('return true when no obstructed moves between from-to', () => {
    const from = 0;
    const to = 56;
    const occupied = Long.fromString('8040201008040201', true, 16);
    const mask = mayMove({ from, to, occupied });
    const piecesInWay = obstructed(from, to, occupied);

    expect(mask).toEqual(piecesInWay.isZero());
  });
  it('return true when no obstructed moves between from-to', () => {
    const from = 0;
    const to = 63;
    const occupied = Long.fromString('8040201008040201', true, 16);
    const mask = mayMove({ from, to, occupied });
    const piecesInWay = obstructed(from, to, occupied);

    expect(mask).toEqual(piecesInWay.isZero());
  });
  it('return true when no obstructed moves between from-to', () => {
    const from = 0;
    const to = 9;
    const occupied = Long.fromString('8040201008040201', true, 16);
    const mask = mayMove({ from, to, occupied });
    const piecesInWay = obstructed(from, to, occupied);

    expect(mask).toEqual(piecesInWay.isZero());
  });
});

describe('getMasks NW', () => {
  it('getNW', () => {
    const from = 0;
    const mask = Masks.getNW(from);
    const expected = Long.fromString('8040201008040201', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getNW', () => {
    const from = 17;
    const mask = Masks.getNW(from);
    const expected = Long.fromString('4020100804020000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getNW', () => {
    const from = 49;
    const mask = Masks.getNW(from);
    const expected = Long.fromString('402000000000000', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getMasks NE', () => {
  it('getNE from 7', () => {
    const from = 7;
    const mask = Masks.getNE(from);
    const expected = Long.fromString('102040810204080', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getNE from 18', () => {
    const from = 18;
    const mask = Masks.getNE(from);
    const expected = Long.fromString('102040000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getNE from 55', () => {
    const from = 55;
    const mask = Masks.getNE(from);
    const expected = Long.fromString('4080000000000000', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getMasks SW', () => {
  it('getSW from 7', () => {
    const from = 7;
    const mask = Masks.getSW(from);
    const expected = Long.fromString('80', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getSW from 18', () => {
    const from = 18;
    const mask = Masks.getSW(from);
    const expected = Long.fromString('40810', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getSW from 50', () => {
    const from = 50;
    const mask = Masks.getSW(from);
    const expected = Long.fromString('4081020408000', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getMasks SE', () => {
  it('getSE from 23', () => {
    const from = 23;
    const mask = Masks.getSE(from);
    const expected = Long.fromString('804020', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getSE from 18', () => {
    const from = 18;
    const mask = Masks.getSE(from);
    const expected = Long.fromString('40201', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getSE from 50', () => {
    const from = 50;
    const mask = Masks.getSE(from);
    const expected = Long.fromString('4020100000000', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getMasks N', () => {
  it('getN from 23', () => {
    const from = 23;
    const mask = Masks.getN(from);
    const expected = Long.fromString('8080808080800000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getN from 43', () => {
    const from = 43;
    const mask = Masks.getN(from);
    const expected = Long.fromString('808080000000000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getN from 0', () => {
    const from = 0;
    const mask = Masks.getN(from);
    const expected = Long.fromString('101010101010101', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getMasks E', () => {
  it('getE from 23', () => {
    const from = 23;
    const mask = Masks.getE(from);
    const expected = Long.fromString('ff0000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getE from 43', () => {
    const from = 43;
    const mask = Masks.getE(from);
    const expected = Long.fromString('f0000000000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getE from 0', () => {
    const from = 0;
    const mask = Masks.getE(from);
    const expected = Long.fromString('1', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getMasks W', () => {
  it('getW from 20', () => {
    const from = 20;
    const mask = Masks.getW(from);
    const expected = Long.fromString('f00000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getW from 43', () => {
    const from = 43;
    const mask = Masks.getW(from);
    const expected = Long.fromString('f80000000000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getW from 0', () => {
    const from = 0;
    const mask = Masks.getW(from);
    const expected = Long.fromString('ff', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getMasks S', () => {
  it('getS from 20', () => {
    const from = 20;
    const mask = Masks.getS(from);
    const expected = Long.fromString('101010', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getS from 43', () => {
    const from = 43;
    const mask = Masks.getS(from);
    const expected = Long.fromString('80808080808', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getS from 0', () => {
    const from = 0;
    const mask = Masks.getS(from);
    const expected = Long.fromString('1', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getS from 57', () => {
    const from = 57;
    const mask = Masks.getS(from);
    const expected = Long.fromString('202020202020202', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getRookMoves', () => {
  it('getRookMoves from 20', () => {
    const from = 20;
    const mask = Masks.getRookMoves(from);
    const expected = Long.fromString('1010101010ef1010', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getRookMoves from 43', () => {
    const from = 43;
    const mask = Masks.getRookMoves(from);
    const expected = Long.fromString('808f70808080808', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getRookMoves from 0', () => {
    const from = 0;
    const mask = Masks.getRookMoves(from);
    const expected = Long.fromString('1010101010101fe', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getRookMoves from 57', () => {
    const from = 57;
    const mask = Masks.getRookMoves(from);
    const expected = Long.fromString('fd02020202020202', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getKnightMoves', () => {
  it('getKnightMoves from 20', () => {
    const from = 20;
    const mask = Masks.getKnightMoves(from);
    const expected = Long.fromString('2844004428', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getKnightMoves from 43', () => {
    const from = 43;
    const mask = Masks.getKnightMoves(from);
    const expected = Long.fromString('1422002214000000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getKnightMoves from 0', () => {
    const from = 0;
    const mask = Masks.getKnightMoves(from);
    const expected = Long.fromString('20400', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getKnightMoves from 57', () => {
    const from = 57;
    const mask = Masks.getKnightMoves(from);
    const expected = Long.fromString('8050000000000', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getKingMoves', () => {
  it('getKingMoves from 20', () => {
    const from = 20;
    const mask = Masks.getKingMoves(from);
    const expected = Long.fromString('38283800', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getKingMoves from 43', () => {
    const from = 43;
    const mask = Masks.getKingMoves(from);
    const expected = Long.fromString('1c141c00000000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getKingMoves from 0', () => {
    const from = 0;
    const mask = Masks.getKingMoves(from);
    const expected = Long.fromString('302', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getKingMoves from 57', () => {
    const from = 57;
    const mask = Masks.getKingMoves(from);
    const expected = Long.fromString('507000000000000', true, 16);
    expect(mask).toEqual(expected);
  });
});
describe('getBishopMoves', () => {
  it('getBishopMoves from 20', () => {
    const from = 20;
    const mask = Masks.getBishopMoves(from);
    const expected = Long.fromString('1824428002844', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getBishopMoves from 43', () => {
    const from = 43;
    const mask = Masks.getBishopMoves(from);
    const expected = Long.fromString('2214001422418000', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getBishopMoves from 0', () => {
    const from = 0;
    const mask = Masks.getBishopMoves(from);
    const expected = Long.fromString('8040201008040200', true, 16);
    expect(mask).toEqual(expected);
  });
  it('getBishopMoves from 57', () => {
    const from = 57;
    const mask = Masks.getBishopMoves(from);
    const expected = Long.fromString('5081020408000', true, 16);
    expect(mask).toEqual(expected);
  });
});
