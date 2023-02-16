import Long from 'long';
import moveMasks, {
  inBetween,
  obstructed,
  initializePreCalculatedMoves,
} from '../preCalculatedMoveMasks';
import { Color } from '../Types';
import { SquareBit, logger } from './helpers';
import {
  removeBlockedMovesBackwards,
  removeBlockedMovesForward,
} from './bitManipulation';

const HFileSet = new Long(0x1010101, 0x1010101, true);
const AFileSet = new Long(0x80808080, 0x80808080, true);

initializePreCalculatedMoves();
export const getObstructed = (from: number, to: number, occupied: Long) =>
  obstructed(from, to, occupied);
export const getinBetween = (from: number, to: number) => inBetween(from, to);
//return all possible moves that king can do in empty board from current square
const kingPseudoMoves = ({ fromBitIndex }: { fromBitIndex: number }) => {
  // add castling
  return moveMasks.getKingMoves(fromBitIndex);
};
export const moveMask = moveMasks;

const kingLegalMoves = ({
  fromBitIndex,
  teammateOccupied,
}: {
  fromBitIndex: number;
  occupiedBits: Long;
  enemyOccupied: Long;
  color: Color;
  teammateOccupied: Long;
  gameState: Long[];
}) => {
  //filter attacked squares
  const pseudoMoves = kingPseudoMoves({ fromBitIndex });
  const legalMoves = pseudoMoves.and(teammateOccupied.not());

  return legalMoves;
};

interface KingPseudoMoves {
  fromBitIndex: number;
}
const knightPseudoMoves = ({ fromBitIndex }: KingPseudoMoves) => {
  // make movemasks for knight moves

  const legalMoves = moveMasks.getKnightMoves(fromBitIndex);
  return legalMoves;
};
//returns bishops all current legal moves
//legal moves includes moves that contain enemy piece to attack and move to empty square
interface IbishopLegalMoves {
  occupiedBits: Long;
  fromBitIndex: number;
  teammateOccupiedBits: Long;
}

const bishopLegalMoves = ({
  teammateOccupiedBits,
  fromBitIndex,
  occupiedBits,
}: IbishopLegalMoves) => {
  if (fromBitIndex === 64) throw new Error('square out of bounds');
  const pseudoAttacks = bishopAttacks({ fromBitIndex, occupiedBits });
  //filter teammates from possible attack

  return pseudoAttacks.and(
    teammateOccupiedBits.xor(Long.UONE.shl(fromBitIndex)).not()
  );
};
function bishopAttacks({
  fromBitIndex,
  occupiedBits,
}: Pick<IbishopLegalMoves, 'fromBitIndex' | 'occupiedBits'>) {
  //masks for directions where bishop can move
  //check if absolute pinned
  const NWMask = moveMasks.getNW(fromBitIndex);
  const NEMask = moveMasks.getNE(fromBitIndex);
  const SWMask = moveMasks.getSW(fromBitIndex);
  const SEMask = moveMasks.getSE(fromBitIndex);
  const pNW = removeBlockedMovesForward(fromBitIndex, NWMask, occupiedBits);
  const pNE = removeBlockedMovesForward(fromBitIndex, NEMask, occupiedBits);
  const pSW = removeBlockedMovesBackwards(fromBitIndex, SWMask, occupiedBits);
  const pSE = removeBlockedMovesBackwards(fromBitIndex, SEMask, occupiedBits);

  const pseudoAttacks = pNW
    .or(pNE)
    .or(pSW)
    .or(pSE)
    .and(Long.UONE.shl(fromBitIndex).not());
  return pseudoAttacks;
}

interface IRookLegalMoves {
  fromBitIndex: number;
  occupiedBits: Long;
  teammateOccupiedBits: Long;
}

//returns all moves that rook can make, like attacks and moves to empty squares
const rookLegalMoves = ({
  fromBitIndex,
  occupiedBits,
  teammateOccupiedBits,
}: IRookLegalMoves) => {
  const legalAttacks = rookLegalAttacks({
    fromBitIndex,
    occupiedBits,
  });
  const legalMoves = legalAttacks
    .and(Long.MAX_UNSIGNED_VALUE.xor(teammateOccupiedBits))
    .and(Long.UONE.shl(fromBitIndex).not());
  return legalMoves;
};

function rookLegalAttacks({
  fromBitIndex,
  occupiedBits,
}: Pick<IRookLegalMoves, 'fromBitIndex' | 'occupiedBits'>) {
  const NMoveMask = moveMasks.getN(fromBitIndex);
  const SMoveMask = moveMasks.getS(fromBitIndex);
  const WMoveMask = moveMasks.getW(fromBitIndex);
  const EMoveMask = moveMasks.getE(fromBitIndex);
  //positive
  const NAttacks = removeBlockedMovesForward(
    fromBitIndex,
    NMoveMask,
    occupiedBits
  );
  const WAttacks = removeBlockedMovesForward(
    fromBitIndex,
    WMoveMask,
    occupiedBits
  );

  const EAttacks = removeBlockedMovesBackwards(
    fromBitIndex,
    EMoveMask,
    occupiedBits
  );
  const SAttacks = removeBlockedMovesBackwards(
    fromBitIndex,
    SMoveMask,
    occupiedBits
  );

  return NAttacks.or(WAttacks)
    .or(EAttacks)
    .or(SAttacks)
    .and(Long.UONE.shl(fromBitIndex).not());
}

interface IpawnPseudoMoves {
  fromBitIndex: number;
  color: Color;
}
const pawnPseudoMoves = ({ fromBitIndex, color }: IpawnPseudoMoves) => {
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

const pawnPseudoAttacks = ({
  fromBitIndex,
  color,
}: Omit<IpawnPseudoMoves, 'occupiedBits'>) => {
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
const pawnLegalMoves = ({
  fromBitIndex,
  color,
  enemyOccupied,
  occupiedSquares,
  elPassant,
}: IPawnLegalMoves) => {
  const pseudoMoves = pawnPseudoMoves({ fromBitIndex, color });
  //prettier-ignore
  const pseudoMovesBlockerRemoved =
      color === 'w'
        ? removeBlockedMovesForward(
          fromBitIndex,
          pseudoMoves,
          occupiedSquares,
          true
        ).and(pseudoMoves)
        : removeBlockedMovesBackwards(
          fromBitIndex,
          pseudoMoves,
          occupiedSquares,
          true
        ).and(pseudoMoves);

  const legalAttacks = pawnLegalAttacks({
    fromBitIndex,
    enemyOccupied,
    color,
    elPassant,
  });

  const legalMoves = pseudoMovesBlockerRemoved.or(legalAttacks);
  return legalMoves;
};
interface IpawnLegalAttacks {
  fromBitIndex: number;
  enemyOccupied: Long;
  color: Color;
  elPassant: SquareBit | null;
}
const pawnLegalAttacks = ({
  fromBitIndex,
  enemyOccupied,
  color,
  elPassant,
}: IpawnLegalAttacks) => {
  // do this elpassant check in here
  let includingElPassant = enemyOccupied;
  if (elPassant) {
    const elpassantRank = ~~(elPassant / 8);
    const enemyElpassantRank = color === 'w' ? 5 : 2;
    if (elpassantRank === enemyElpassantRank) {
      includingElPassant = Long.UONE.shiftLeft(elPassant).or(enemyOccupied);
    }
  }
  const pseudoAttacks = pawnPseudoAttacks({ fromBitIndex, color });
  return pseudoAttacks.and(includingElPassant.or(enemyOccupied));
};

export {
  pawnLegalMoves,
  rookLegalMoves,
  rookLegalAttacks,
  bishopLegalMoves,
  bishopAttacks,
  kingPseudoMoves,
  knightPseudoMoves,
  pawnPseudoAttacks,
  pawnLegalAttacks,
  pawnPseudoMoves,
  kingLegalMoves,
};
