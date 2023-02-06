import Long from 'long';
import { SquareBit, removeBlockedMoves, checkBitAt, logger } from './helpers';
import { Color } from '../Types';

//initialize masks
const HFileSet = new Long(0x1010101, 0x1010101, true);
const GFileSet = new Long(0x2020202, 0x2020202, true);
const GHFileMask = HFileSet.or(GFileSet);
const AFileSet = new Long(0x80808080, 0x80808080, true);
const BFileSet = new Long(0x40404040, 0x40404040, true);
const ABFileMask = AFileSet.or(BFileSet);
const Rank1Set = new Long(0xff, 0, true);
const Rank8Set = new Long(0, 0xff000000, true);
const diagonalMask = new Long(0x10204080, 0x1020408, true);
const antiDiagonalMask = new Long(0x8040201, 0x80402010, true);

interface IKingPseudoMoves {
  kingPosition: Long;
}
//return all possible moves that king can do in empty board from current square
export const kingPseudoMoves = ({ kingPosition }: IKingPseudoMoves) => {
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
  const PseudoMask = knightPosition
    .or(noNorthWest)
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

interface IbishopPseudoMoves {
  fromBitIndex: number;
}

//returns bishops all moves that it can make in empty board from current square
export const bishopPseudoMoves = ({ fromBitIndex }: IbishopPseudoMoves) => {
  const NWMask = getNWMask(fromBitIndex);
  const NEMask = getNEMask(fromBitIndex);
  const SWMask = getSWMask(fromBitIndex);
  const SEMask = getSEMask(fromBitIndex);
  return NWMask.or(NEMask).or(SEMask).or(SWMask);
};

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
interface IbishopLegalMoves {
  possibleMoves: Long;
  bishopPosition: Long;
  occupiedBits: Long;
  fromBitIndex: number;
  teammateOccupiedBits: Long;
}
//returns bishops all current legal moves
//legal moves includes moves that contain enemy piece to attack and move to empty square
export const bishopLegalMoves = ({
  teammateOccupiedBits,
  fromBitIndex,
  occupiedBits,
  possibleMoves,
  bishopPosition,
}: IbishopLegalMoves) => {
  //masks for directions where bishop can move
  const NWMask = getNWMask(fromBitIndex);
  const NEMask = getNEMask(fromBitIndex);
  const SWMask = getSWMask(fromBitIndex);
  const SEMask = getSEMask(fromBitIndex);

  //get all blocking pieces
  const blockingPiecesNW = checkForADiagonalBlockingPieces({
    possibleMoves: possibleMoves.and(NWMask).xor(bishopPosition),
    occupiedSquares: occupiedBits,
  });
  const blockingPiecesNE = checkForDiagonalBlockingPieces({
    possibleMoves: possibleMoves.and(NEMask).xor(bishopPosition),
    occupiedSquares: occupiedBits,
  });
  const blockingPiecesSW = checkForDiagonalBlockingPieces({
    possibleMoves: possibleMoves.and(SWMask).xor(bishopPosition),
    occupiedSquares: occupiedBits,
  });
  const blockingPiecesSE = checkForADiagonalBlockingPieces({
    possibleMoves: possibleMoves.and(SEMask).xor(bishopPosition),
    occupiedSquares: occupiedBits,
  });
  const pseudoAttackNW = removeBlockedMoves(blockingPiecesNW, NWMask);
  const pseudoAttackNE = removeBlockedMoves(blockingPiecesNE, NEMask);
  const pseudoAttackSW = removeBlockedMoves(blockingPiecesSW, SWMask, true);
  const pseudoAttackSE = removeBlockedMoves(blockingPiecesSE, SEMask, true);

  const pseudoAttacks = pseudoAttackNW
    .or(pseudoAttackNE)
    .or(pseudoAttackSW)
    .or(pseudoAttackSE);
  //filter teammates from possible attack
  return pseudoAttacks.and(teammateOccupiedBits.not());
};

interface ICheckForBlockingPieces {
  possibleMoves: Long;
  occupiedSquares: Long;
}
// checks diagonal that starts from up-left and ends to down-right
// returns all blocking pieces in that diagonal
export function checkForDiagonalBlockingPieces({
  possibleMoves,
  occupiedSquares,
}: ICheckForBlockingPieces) {
  if (occupiedSquares.isZero()) return occupiedSquares;
  let blockedMoves = possibleMoves;
  const oneBit = new Long(1, 0, true);
  const moves = possibleMoves.toString(2);
  for (
    let i = moves.length - 1;
    i >= possibleMoves.countTrailingZeros();
    i -= 7
  ) {
    let moveBit = oneBit.shiftLeft(i);
    if (!checkBitAt(occupiedSquares.and(moveBit), i)) {
      blockedMoves = blockedMoves.and(moveBit.not());
    }
  }
  return blockedMoves;
}
// checks diagonal that starts from down-left and ends to up-right
// returns all blocking pieces in that diagonal
export function checkForADiagonalBlockingPieces({
  possibleMoves,
  occupiedSquares,
}: ICheckForBlockingPieces) {
  if (occupiedSquares.isZero()) return occupiedSquares;
  let blockedMoves = possibleMoves;
  const oneBit = new Long(1, 0, true);
  const moves = possibleMoves.toString(2);
  for (let i = moves.length - 1; i >= 0; i -= 9) {
    let moveBit = oneBit.shiftLeft(i);
    if (!checkBitAt(occupiedSquares.and(moveBit), i)) {
      blockedMoves = blockedMoves.and(moveBit.not());
    }
  }
  return blockedMoves;
}

interface IRookPseudoMoves {
  fromBitIndex: number;
}
const getFileNumber = (fromBitIndex: number) => fromBitIndex % 8;
const getRankNumber = (fromBitIndex: number) => ~~(fromBitIndex / 8); // double tilde floors double numbers
export const getNMask = (fromBitIndex: number) =>
  HFileSet.shiftLeft(fromBitIndex).shiftLeft(8);
export const getSMask = (fromBitIndex: number) => {
  const fileNumber = getFileNumber(fromBitIndex);
  const rankNumber = getRankNumber(fromBitIndex);
  return AFileSet.shiftRightUnsigned(
    7 - fileNumber + (7 - rankNumber) * 8
  ).shiftRightUnsigned(8);
};
export const getEMask = (fromBitIndex: number) => {
  const fileNumber = getFileNumber(fromBitIndex);
  const rankNumber = getRankNumber(fromBitIndex);
  return Rank1Set.shiftRightUnsigned(8 - fileNumber).shiftLeft(rankNumber * 8);
};
export const getWMask = (fromBitIndex: number) => {
  const fileNumber = getFileNumber(fromBitIndex);
  const rankNumber = getRankNumber(fromBitIndex);
  return Rank1Set.shiftRightUnsigned(1 + fileNumber).shiftLeft(
    rankNumber * 8 + fileNumber + 1
  );
};
export const rookPseudoMoves = ({ fromBitIndex }: IRookPseudoMoves) => {
  const fileNumber = getFileNumber(fromBitIndex);
  const rankNumber = getRankNumber(fromBitIndex);

  const fileMask = HFileSet.shiftLeft(fileNumber);
  const rankMask = Rank1Set.shiftLeft(rankNumber * 8);
  const rookMoveMask = fileMask.or(rankMask);
  return rookMoveMask;
};
interface IRookLegalMoves {
  rookMoveMask: Long;
  fromBitIndex: number;
  occupiedSquares: Long;
  teammateOccupiedBits: Long;
}
export const allBitsSet = new Long(0xffffffff, 0xffffffff, true); // it think this is redudant

//returns all moves that rook can make, like attacks and moves to empty squares
export const rookLegalMoves = ({
  rookMoveMask,
  fromBitIndex,
  occupiedSquares,
  teammateOccupiedBits,
}: IRookLegalMoves) => {
  const NMoveMask = getNMask(fromBitIndex);
  const SMoveMask = getSMask(fromBitIndex);
  const westMoveMask = getWMask(fromBitIndex);
  const eastMoveMask = getEMask(fromBitIndex);

  const pseudoAttacks = rookMoveMask.and(occupiedSquares);
  //positive
  const northAttacks = removeBlockedMoves(pseudoAttacks, NMoveMask);
  const westAttacks = removeBlockedMoves(pseudoAttacks, westMoveMask);
  //negative
  const southAttacks = removeBlockedMoves(pseudoAttacks, SMoveMask, true);
  const eastAttacks = removeBlockedMoves(pseudoAttacks, eastMoveMask, true);
  const pseudoMoves = northAttacks
    .or(westAttacks)
    .or(eastAttacks)
    .or(southAttacks);
  const legalMoves = pseudoMoves.and(allBitsSet.xor(teammateOccupiedBits));
  return legalMoves;
};

interface IpawnPseudoMoves {
  fromBitIndex: number;
  color: Color;
}
export const pawnPseudoMoves = ({ fromBitIndex, color }: IpawnPseudoMoves) => {
  const rankNumber = ~~(fromBitIndex / 8);
  let moveMask = Long.UZERO;
  let moveOne =
    color === 'b'
      ? Long.UONE.shiftLeft(fromBitIndex).shiftRightUnsigned(8)
      : Long.UONE.shiftLeft(fromBitIndex + 8);
  let moveTwo =
    color === 'b' ? moveOne.shiftRightUnsigned(8) : moveOne.shiftLeft(8);
  const blackInStartPosition = color === 'b' && rankNumber === 6;
  const whiteInStartPosition = color === 'w' && rankNumber === 1;
  if (blackInStartPosition || whiteInStartPosition) {
    moveMask = moveMask.or(moveOne).or(moveTwo);
  } else {
    moveMask = moveOne;
  }

  return moveMask;
};

export const pawnPseudoAttacks = ({
  fromBitIndex,
  color,
}: IpawnPseudoMoves) => {
  let moveMask = Long.UZERO;
  if (color === 'b') {
    //eat left
    moveMask = moveMask.or(
      Long.UONE.shiftLeft(fromBitIndex - 7).and(HFileSet.not())
    );
    //eat right
    moveMask = moveMask.or(
      Long.UONE.shiftLeft(fromBitIndex - 9).and(AFileSet.not())
    );
  } else {
    //eat right
    moveMask = moveMask.or(
      Long.UONE.shiftLeft(fromBitIndex + 7).and(AFileSet.not())
    );
    //eat left
    moveMask = moveMask.or(
      Long.UONE.shiftLeft(fromBitIndex + 9).and(HFileSet.not())
    );
  }
  return moveMask;
};
interface IPawnLegalMoves extends IpawnPseudoMoves {
  enemyOccupied: Long;
  occupiedSquares: Long;
  elPassant: SquareBit | null;
}
export const pawnLegalMoves = ({
  fromBitIndex,
  color,
  enemyOccupied,
  occupiedSquares,
  elPassant,
}: IPawnLegalMoves) => {
  // helpers to determine if piece is blocked from quiet moving
  const blockingPieceIndex = color === 'w' ? 8 : -8;
  const blockingPiece = Long.UONE.shiftLeft(fromBitIndex + blockingPieceIndex);
  let mask = Long.UZERO;
  const pseudoMoves = pawnPseudoMoves({ fromBitIndex, color });
  const pseudoAttacks = pawnPseudoAttacks({
    fromBitIndex,
    color,
  });
  //if blocked prevent moving over piece if in start square
  if (blockingPiece.and(occupiedSquares).isZero()) {
    mask = pseudoMoves.and(occupiedSquares.not());
  }
  //Include attacks if square contains enemy
  let includingElPassant = enemyOccupied;
  if (elPassant) {
    const elpassantRank = ~~(elPassant / 8);
    const enemyElpassantRank = color === 'w' ? 5 : 2;
    if (elpassantRank === enemyElpassantRank) {
      includingElPassant = Long.UONE.shiftLeft(elPassant).or(enemyOccupied);
    }
  }
  mask = mask.or(pseudoAttacks.and(includingElPassant));

  // include elpassand
  if (elPassant === null) return mask;
  return mask;
};
