import Long from 'long';
/**
 * initialize all precalculated moves
 */
export function initializePreCalculatedMoves() {
  declareBisopMoves();
  generateArrRectangular();
  declareRookMoves();
  declareKingMoves();
  declareKnightMoves();
}
//declare
const arrRectangular: (null | Long)[][] = Array.apply(null, Array(64)).map(() =>
  Array.apply(null, Array(64)).map(() => null)
);
const bishopMoves: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const bishopNWMasks: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const bishopNEMasks: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const bishopSEMasks: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const bishopSWMasks: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const rookMoves: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const rookNMasks: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const rookEMasks: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const rookWMasks: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const rookSMasks: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const knightMoves: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const kingMoves: (null | Long)[] = Array.apply(null, Array(64)).map(
  () => Long.UZERO
);
const diagonalMask = new Long(0x10204080, 0x1020408, true);
const antiDiagonalMask = new Long(0x8040201, 0x80402010, true);

/**
 * generates ArrRectangular that contains mask from-to
 */
export function generateArrRectangular() {
  for (let from = 0; from <= 63; from++) {
    const rank = ~~(from / 8);
    const file = from % 8;
    const arrInISquare = Array.apply(null, Array());
    arrInISquare[from] = Long.UZERO;
    rankSquares({ from, rank, file });
    fileSquares({ from, rank, file });
    diagonal({ from, rank, file });
    antiDiagonal({ from, rank, file });
  }

  interface IHelpers {
    rank: number;
    file: number;
    from: number;
  }
  //progress upwards
  function rankSquares({ rank, file, from }: IHelpers) {
    for (let x = 0; x <= file; x++) {
      const to = from - x;
      if (from === to) continue;
      const between = from - to;
      //for some reason aritmeric shift right didnt work correctly
      const mask = Long.fromString('0xff', true, 16)
        .shiftLeft(63 - between)
        .shiftRightUnsigned(63 - between)
        .shiftLeft(to);
      saveInArray({ mask, to, from });
    }
  }

  function fileSquares({ rank, file, from }: IHelpers) {
    for (let x = rank; x <= 7; x++) {
      const to = 8 * x + file;
      const between = (to - from) / 8 + 1;
      const mask = Long.fromString('0x101010101010101', true, 16)
        .shiftLeft((8 - between) * 8)
        .shiftRightUnsigned((8 - between) * 8)
        .shiftLeft(from);
      saveInArray({ mask, to, from });
    }
  }
  //starts from up-left
  function diagonal({ rank, file, from }: IHelpers) {
    let toFile = file + 1;
    let toRank = rank + 1;
    while (toFile <= 7 && toRank <= 7) {
      const to = toRank * 8 + toFile;
      const between = (to - from) / 9 + 1;
      const mask = Long.fromString('0x8040201008040201', true, 16)
        .shiftLeft((8 - between) * 8)
        .shiftRightUnsigned((8 - between) * 8)
        .shiftLeft(from);
      toFile++;
      toRank++;
      saveInArray({ mask, to, from });
    }
  }
  //starts from down-left
  function antiDiagonal({ rank, file, from }: IHelpers) {
    let toFile = file - 1;
    let toRank = rank + 1;
    while (toFile >= 0 && toRank <= 7) {
      const to = toRank * 8 + toFile;
      const between = (to - from) / 7 + 1;
      const mask = Long.fromString('0x102040810204080', true, 16)
        .shiftLeft((8 - between) * 8)
        .shiftRightUnsigned((8 - between) * 8 + 7)
        .shiftLeft(from);
      toFile--;
      toRank++;
      saveInArray({ mask, to, from });
    }
  }
  interface IsaveInArray {
    mask: Long;
    to: number;
    from: number;
  }
  function saveInArray({ mask, to, from }: IsaveInArray) {
    const arrayFrom = arrRectangular[from] as Array<null | Long>;
    const arrayTo = arrRectangular[to] as Array<null | Long>;
    arrayFrom[to] = mask;
    arrayTo[from] = mask;
  }
}
interface IinBetween {
  from: number;
  to: number;
}
/**
 *
 * @param from {number} squareIndex
 * @param to {nubmer} squareIndex
 * @returns {Long} mask between from and to all bits set
 */
export function inBetween(from: number, to: number) {
  const fromArr = arrRectangular[from] as Array<Long | null>;
  return fromArr[to] as Long | null;
}
export interface ImayMove extends IinBetween {
  occupied: Long;
}
/**
 *
 * @param from {number} squareIndex
 * @param to {nubmer} squareIndex
 * @param occupied {Long} Bitboard of all pieces in board
 * @returns {Long} Bitboard mask of all bits set witch are in between from-to and contains piece
 */
export function obstructed(from: number, to: number, occupied: Long) {
  const between = inBetween(from, to);
  if (between === null) return Long.UZERO;
  return between.xor(Long.UONE.shiftLeft(from)).and(occupied);
}
export function mayMove({ from, to, occupied }: ImayMove) {
  const between = inBetween(from, to);
  if (between === null || !between) return false;
  return between.and(occupied).and(Long.UONE.shl(from).not()).isZero();
}

/////////////////////////////////////////////////BISHOP///////////////////////////////////////
export function declareBisopMoves() {
  for (let square = 0; square <= 63; square++) {
    //declare
    const NW = getNWMask(square);
    const NE = getNEMask(square);
    const SW = getSWMask(square);
    const SE = getSEMask(square);
    const mask = NW.or(NE).or(SW).or(SE).and(Long.UONE.shl(square).not());
    //save
    bishopNWMasks[square] = NW;
    bishopNEMasks[square] = NE;
    bishopSWMasks[square] = SW;
    bishopSEMasks[square] = SE;
    bishopMoves[square] = mask;
  }
}

//gets current squares up-left diagonal mask
const getNWMask = (fromBitIndex: number) => {
  const fileNumber = fromBitIndex % 8;
  const rankNumber = ~~(fromBitIndex / 8);
  //number of bits that needs to be shifted so remaining active bits is amounth of moves bishop can make in said direction
  const NWhelper =
    fileNumber - rankNumber >= 0 ? fileNumber * 8 : rankNumber * 8;
  return antiDiagonalMask
    .shiftLeft(NWhelper)
    .shiftRightUnsigned(NWhelper)
    .shiftLeft(fromBitIndex);
};
//gets current squares up-right diagonal mask
const getNEMask = (fromBitIndex: number) => {
  const fileNumber = fromBitIndex % 8;
  const rankNumber = ~~(fromBitIndex / 8);
  const NEhelper =
    7 - fileNumber - rankNumber >= 0
      ? (7 - fileNumber) * 8 // positive
      : rankNumber * 8; //negative
  return diagonalMask
    .shiftLeft(NEhelper)
    .shiftRightUnsigned(NEhelper + 7)
    .shiftLeft(fromBitIndex);
};
//gets current squares down-left diagonal mask
const getSWMask = (fromBitIndex: number) => {
  const fileNumber = fromBitIndex % 8;
  const rankNumber = ~~(fromBitIndex / 8);
  const SWhelper =
    7 - fileNumber - rankNumber >= 0
      ? (7 - rankNumber) * 8 //positive
      : fileNumber * 8; // negative
  return diagonalMask
    .shiftRightUnsigned(SWhelper)
    .shiftLeft(SWhelper + 7)
    .shiftRightUnsigned(63 - fromBitIndex);
};
//gets current squares down-right diagonal mask
const getSEMask = (fromBitIndex: number) => {
  const fileNumber = fromBitIndex % 8;
  const rankNumber = ~~(fromBitIndex / 8);
  const SEhelper =
    fileNumber - rankNumber >= 0
      ? (7 - rankNumber) * 8 //positive
      : (7 - fileNumber) * 8; // negative
  return antiDiagonalMask
    .shiftRightUnsigned(SEhelper)
    .shiftLeft(SEhelper)
    .shiftRightUnsigned(63 - fromBitIndex);
};
function getNW(square: number) {
  return bishopNWMasks[square] as Long;
}
function getNE(square: number) {
  return bishopNEMasks[square] as Long;
}
function getSW(square: number) {
  return bishopSWMasks[square] as Long;
}
function getSE(square: number) {
  return bishopSEMasks[square] as Long;
}
function getBishopMoves(square: number) {
  return bishopMoves[square] as Long;
}

//////////////////////ROOK//////////////////////////
const HFileSet = new Long(0x1010101, 0x1010101, true);
const GFileSet = new Long(0x2020202, 0x2020202, true);
const AFileSet = new Long(0x80808080, 0x80808080, true);
const BFileSet = new Long(0x40404040, 0x40404040, true);
const Rank1Set = new Long(0xff, 0, true);

const getFileNumber = (fromBitIndex: number) => fromBitIndex % 8;
const getRankNumber = (fromBitIndex: number) => ~~(fromBitIndex / 8); // double tilde floors double numbers

interface IrookMoveMasks {
  square: number;
  file: number;
  rank: number;
}

export function declareRookMoves() {
  for (let square = 0; square <= 63; square++) {
    //declare
    const params = {
      square,
      file: getFileNumber(square),
      rank: getRankNumber(square),
    };
    const N = getNMask(params);
    const E = getEMask(params);
    const W = getWMask(params);
    const S = getSMask(params);
    const mask = N.or(E).or(W).or(S).and(Long.UONE.shl(square).not());
    //save
    rookNMasks[square] = N;
    rookEMasks[square] = E;
    rookWMasks[square] = W;
    rookSMasks[square] = S;
    rookMoves[square] = mask;
  }
}
export const getNMask = ({ square }: IrookMoveMasks) =>
  HFileSet.shiftLeft(square);
export const getSMask = ({ file, rank }: IrookMoveMasks) => {
  return AFileSet.shiftRightUnsigned(7 - file + (7 - rank) * 8);
};
export const getEMask = ({ file, rank }: IrookMoveMasks) => {
  return Rank1Set.shiftRightUnsigned(7 - file).shiftLeft(rank * 8);
};
export const getWMask = ({ file, rank }: IrookMoveMasks) => {
  return Rank1Set.shiftRightUnsigned(file).shiftLeft(rank * 8 + file);
};

function getN(square: number) {
  return rookNMasks[square] as Long;
}
function getE(square: number) {
  return rookEMasks[square] as Long;
}
function getW(square: number) {
  return rookWMasks[square] as Long;
}
function getS(square: number) {
  return rookSMasks[square] as Long;
}
function getRookMoves(square: number) {
  return rookMoves[square] as Long;
}

///////////////////////////////////KNIGHT//////////////////////////////////
const ABFileMask = AFileSet.or(BFileSet);
const GHFileMask = HFileSet.or(GFileSet);

interface IknightPseudoMoves {
  knightPosition: Long;
}
export const knightPseudoMoves = ({ knightPosition }: IknightPseudoMoves) => {
  // make movemasks for knight moves
  const noNorthWest = knightPosition.shiftLeft(17);
  const noNorthEast = knightPosition.shiftLeft(15);
  const noWestWest = knightPosition.shiftLeft(6);
  const noEastEast = knightPosition.shiftLeft(10);
  const soSouthWest = knightPosition.shiftRightUnsigned(17);
  const soSouthEast = knightPosition.shiftRightUnsigned(15);
  const soWestWest = knightPosition.shiftRightUnsigned(10);
  const soEastEast = knightPosition.shiftRightUnsigned(6);
  const PseudoMask = Long.UZERO.or(noNorthWest)
    .or(noNorthEast)
    .or(soSouthWest)
    .or(soSouthEast)
    .or(noEastEast)
    .or(noWestWest)
    .or(soWestWest)
    .or(soEastEast);

  //remove all moves that portal to the other side of board
  if (!ABFileMask.and(knightPosition).isZero())
    return PseudoMask.and(GHFileMask.not()); //remove GHFILE
  if (!GHFileMask.and(knightPosition).isZero())
    return PseudoMask.and(ABFileMask.not()); //remove ABFILE
  return PseudoMask;
};
export function declareKnightMoves() {
  for (let square = 0; square <= 63; square++) {
    //declare
    const knightPosition = Long.UONE.shiftLeft(square);
    //calculate
    const mask = knightPseudoMoves({ knightPosition });
    //save
    knightMoves[square] = mask;
  }
}

export function getKnightMoves(square: number) {
  return knightMoves[square] as Long;
}

/////////////////////////////////////KING/////////////////////////////////

export const kingPseudoMoves = ({ kingPosition }: { kingPosition: Long }) => {
  const NorthWest = kingPosition.shiftLeft(9);
  const NorthEast = kingPosition.shiftLeft(7);
  const North = kingPosition.shiftLeft(8);
  const West = kingPosition.shiftLeft(1);
  const East = kingPosition.shiftRightUnsigned(1);
  const South = kingPosition.shiftRightUnsigned(8);
  const SouthWest = kingPosition.shiftRightUnsigned(7);
  const SouthEast = kingPosition.shiftRightUnsigned(9);

  const moveMask = West.or(North)
    .or(East)
    .or(South)
    .or(NorthEast)
    .or(NorthWest)
    .or(SouthEast)
    .or(SouthWest);
  //remove all moves that portal to the other side of board
  if (!kingPosition.and(HFileSet).isZero()) return moveMask.and(AFileSet.not());
  if (!kingPosition.and(AFileSet).isZero()) return moveMask.and(HFileSet.not());
  return moveMask;
};

export function declareKingMoves() {
  for (let square = 0; square <= 63; square++) {
    //declare
    const kingPosition = Long.UONE.shiftLeft(square);
    //calculate
    const mask = kingPseudoMoves({ kingPosition });
    //save
    kingMoves[square] = mask;
  }
}

export function getKingMoves(square: number) {
  return kingMoves[square] as Long;
}

export default {
  getNE,
  getNW,
  getSW,
  getSE,
  getBishopMoves,
  getE,
  getN,
  getS,
  getW,
  getRookMoves,
  getKnightMoves,
  getKingMoves,
  inBetween,
  mayMove,
  obstructed,
};
