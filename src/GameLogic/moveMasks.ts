import Long from 'long';
import { SquareBit, removeBlockedMoves, logger } from './helpers';
import { Color } from '../Types';
import moveMasks, {
  ImayMove,
  inBetween,
  initializePreCalculatedMoves,
} from './preCalculatedMoveMasks';

initializePreCalculatedMoves();
//initialize masks
const HFileSet = new Long(0x1010101, 0x1010101, true);
const AFileSet = new Long(0x80808080, 0x80808080, true);

//return all possible moves that king can do in empty board from current square
export const kingPseudoMoves = ({ fromBitIndex }: { fromBitIndex: number }) => {
  return moveMasks.getKingMoves(fromBitIndex);
};

export const knightPseudoMoves = ({
  fromBitIndex,
}: {
  fromBitIndex: number;
}) => {
  // make movemasks for knight moves
  return moveMasks.getKnightMoves(fromBitIndex);
};

interface IbishopLegalMoves {
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
}: IbishopLegalMoves) => {
  //masks for directions where bishop can move
  const bishopPosition = Long.UONE.shiftLeft(fromBitIndex);
  const NWMask = moveMasks.getNW(fromBitIndex);
  const NEMask = moveMasks.getNE(fromBitIndex);
  const SWMask = moveMasks.getSW(fromBitIndex);
  const SEMask = moveMasks.getSE(fromBitIndex);

  const NWSquare = 63 - NWMask.countLeadingZeros();
  const NESquare = 63 - NEMask.countLeadingZeros();
  const SWSquare = SWMask.countTrailingZeros();
  const SESquare = SEMask.countTrailingZeros();

  const occupied = occupiedBits.xor(bishopPosition);
  //get all blocking pieces
  const blockingPiecesNW = checkForBlockers({
    from: fromBitIndex,
    to: NWSquare,
    occupied,
  });
  const blockingPiecesNE = checkForBlockers({
    from: fromBitIndex,
    to: NESquare,
    occupied,
  });
  const blockingPiecesSW = checkForBlockers({
    from: fromBitIndex,
    to: SWSquare,
    occupied,
  });
  const blockingPiecesSE = checkForBlockers({
    from: fromBitIndex,
    to: SESquare,
    occupied,
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

interface IRookLegalMoves {
  fromBitIndex: number;
  occupiedBits: Long;
  teammateOccupiedBits: Long;
}

//returns all moves that rook can make, like attacks and moves to empty squares
export const rookLegalMoves = ({
  fromBitIndex,
  occupiedBits,
  teammateOccupiedBits,
}: IRookLegalMoves) => {
  const legalAttacks = rookLegalAttacks({
    fromBitIndex,
    occupiedBits,
  });
  const legalMoves = legalAttacks.and(
    Long.MAX_UNSIGNED_VALUE.xor(teammateOccupiedBits)
  );
  return legalMoves;
};

const rookLegalAttacks = ({
  fromBitIndex,
  occupiedBits,
}: Omit<IRookLegalMoves, 'teammateOccupiedBits'>) => {
  const pseudoMoves = moveMasks.getRookMoves(fromBitIndex);
  const NMoveMask = moveMasks.getN(fromBitIndex);
  const SMoveMask = moveMasks.getS(fromBitIndex);
  const WMoveMask = moveMasks.getW(fromBitIndex);
  const EMoveMask = moveMasks.getE(fromBitIndex);

  const pseudoAttacks = pseudoMoves.and(occupiedBits);
  //positive
  const NAttacks = removeBlockedMoves(pseudoAttacks, NMoveMask);
  const WAttacks = removeBlockedMoves(pseudoAttacks, WMoveMask);
  //negative
  const SAttacks = removeBlockedMoves(pseudoAttacks, SMoveMask, true);
  const EAttacks = removeBlockedMoves(pseudoAttacks, EMoveMask, true);
  return NAttacks.or(WAttacks).or(EAttacks).or(SAttacks);
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

  mask = pawnLegalAttacks({
    moves: mask,
    pseudoAttacks,
    enemyOccupied,
    elPassant,
    color,
  });

  return mask;
};
interface IpawnLegalAttacks {
  moves: Long;
  pseudoAttacks: Long;
  enemyOccupied: Long;
  elPassant: SquareBit | null;
  color: Color;
}
export const pawnLegalAttacks = ({
  moves,
  enemyOccupied,
  pseudoAttacks,
  elPassant,
  color,
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
  return moves.or(pseudoAttacks.and(includingElPassant.or(enemyOccupied)));
};
function checkForBlockers({ from, to, occupied }: ImayMove) {
  if (from < 0 || to < 0 || to === 64) return Long.UZERO;
  const between = inBetween(from, to );
  if (between === null) return Long.UZERO;
  return between.and(occupied);
}
// can be used for checking if king is attacked
export const squareIsAttacked = ({
  occupiedBits,
  fromBitIndex,
  gameState,
  color,
  teammateOccupiedBits,
}: {
  occupiedBits: Long;
  fromBitIndex: number;
  gameState: Long[];
  teammateOccupiedBits: Long;
  color: Color;
}) => {
  const colorHelper = color === 'w' ? 1 : 0;
  const pawns = gameState[1 - colorHelper] as Long;
  if (!pawnPseudoAttacks({ fromBitIndex, color }).and(pawns).isZero()) {
    return true;
  }
  const rooks = gameState[3 - colorHelper] as Long;
  const queens = gameState[9 - colorHelper] as Long;
  const rooksQueens = queens.or(rooks);
  if (
    !rookLegalMoves({ occupiedBits, teammateOccupiedBits, fromBitIndex })
      .and(rooksQueens)
      .isZero()
  ) {
    return true;
  }
  const bishops = gameState[4 - colorHelper] as Long;
  const bishopsQueens = queens.or(bishops);
  const params = {
    teammateOccupiedBits,
    fromBitIndex,
    occupiedBits,
  };
  if (!bishopLegalMoves(params).and(bishopsQueens).isZero()) {
    return true;
  }
  const knights = gameState[7 - colorHelper] as Long;
  if (!moveMasks.getKnightMoves(fromBitIndex).and(knights).isZero()) {
    return true;
  }
  const kings = gameState[11 - colorHelper] as Long;
  if (!moveMasks.getKingMoves(fromBitIndex).and(kings).isZero()) {
    return true;
  }
  return false;
};
