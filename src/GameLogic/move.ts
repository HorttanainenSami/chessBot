import Long from 'long';
import { Color, Square } from '../Types';
import { SquareBit, bitPieces, logger } from './helpers';
import {
  pawnLegalMoves,
  kingLegalMoves,
  rookLegalMoves,
  bishopLegalMoves,
  knightPseudoMoves,
  moveMask,
  pawnPseudoMoves,
  pawnLegalAttacks,
  pawnPseudoAttacks,
  bishopAttacks,
  rookLegalAttacks,
} from './moveMask';
import {
  removeBlockedMovesForward,
  removeBlockedMovesBackwards,
} from './bitManipulation';
import { gameState, state } from './gameStateChanger';

interface Imove extends IMoves {
  blackOccupiedBits: Long;
  whiteOccupiedBits: Long;
  occupiedBits: Long;
  fromBitIndex: number;
}
export interface IMoves {
  piece: bitPieces;
  color: Color;
}

export const getMoves = ({ color, state }: { color: Color; state: state }) => {
  const { gameState } = state;
  const blackOccupiedBits = gameState.reduce((acc, curr, i) => {
    if (i % 2 === 0) return acc;
    return acc.or(curr);
  }, Long.UZERO);
  const occupiedBits = gameState.reduce(
    (acc, curr) => acc.or(curr),
    Long.UZERO
  );
  const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
  const colorHelper = color === 'w' ? 0 : 1;
  const array: Long[] = Array(64).fill(Long.UZERO);
  for (let piece = colorHelper; piece <= 11; piece += 2) {
    let pieces = gameState[piece];
    while (!pieces.isZero()) {
      const fromBitIndex = pieces.countTrailingZeros();
      const move = {
        fromBitIndex,
        piece,
        color,
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
      };
      const legalMove = getMove({
        move,
        state,
      });

      array[fromBitIndex] = legalMove;
      pieces = pieces.and(Long.UONE.shl(fromBitIndex).not());
    }
  }
  return array;
};
export const getMove = ({
  move,
  state,
}: {
  move: Imove;
  state: state;
}): Long => {
  const friendlyKing =
    move.color === 'w' ? state.gameState[10] : state.gameState[11];
  const {
    pinned,
    elPassant,
    doubleCheck,
    check,
    checkingRays,
    castling,
    gameState,
  } = state;
  const params = {
    ...move,
    friendlyKing,
    pinned,
    check,
    doubleCheck,
    checkingRays,
  };
  switch (move.piece) {
    case 0: {
      return getPawn({ ...params, elPassant });
    }
    case 1: {
      return getPawn({ ...params, elPassant });
    }
    case 2: {
      return getRook(params);
    }
    case 3: {
      return getRook(params);
    }
    case 4: {
      return getBishop(params);
    }
    case 5: {
      return getBishop(params);
    }
    case 6: {
      return getKnight(params);
    }
    case 7: {
      return getKnight(params);
    }
    case 8: {
      if (doubleCheck) return Long.UZERO;
      const diagonalLegalMoves = getBishop(params);
      const RookLegalMoves = getRook(params);

      return diagonalLegalMoves.or(RookLegalMoves);
    }
    case 9: {
      if (doubleCheck) return Long.UZERO;
      const diagonalLegalMoves = getBishop(params);
      const RookLegalMoves = getRook(params);
      return diagonalLegalMoves.or(RookLegalMoves);
    }
    case 10: {
      return getKing({ ...params, castling, state: gameState });
    }
    case 11: {
      return getKing({ ...params, castling, state: gameState });
    }
    default:
      return Long.UZERO;
  }
};

export function getRook({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
  friendlyKing,
  doubleCheck,
  check,
  checkingRays,
  pinned,
}: getPieces) {
  if (doubleCheck) return Long.UZERO;
  const rookPosition = Long.UONE.shiftLeft(fromBitIndex);
  const kingPosition = friendlyKing;
  const teammateOccupiedBits =
    color === 'w' ? whiteOccupiedBits : blackOccupiedBits;
  if (!rookPosition.and(pinned).isZero()) {
    //determine if absolutely pinned
    //check where king is and pinner is opposite
    //check with rook mask,

    const rookMask = moveMask.getBishopMoves(kingPosition.countTrailingZeros());
    //if bishop is attacking, rook cannot move
    if (!rookPosition.and(rookMask).isZero()) {
      return Long.UZERO;
    }
    //check in what direction pinner is
    return getRookPinnerDirection({
      fromBitIndex,
      kingSq: kingPosition.countTrailingZeros(),
      rookPosition,
      occupiedBits,
    }).and(rookPosition.not());
  }
  const legalMoves = rookLegalMoves({
    fromBitIndex,
    occupiedBits,
    teammateOccupiedBits,
  });
  return check ? legalMoves.and(checkingRays) : legalMoves;
}
export function getBishop({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
  friendlyKing,
  doubleCheck,
  check,
  checkingRays,
  pinned,
}: getPieces) {
  if (doubleCheck) return Long.UZERO;
  const teammateOccupiedBits =
    color === 'w' ? whiteOccupiedBits : blackOccupiedBits;
  const piecePosition = Long.UONE.shiftLeft(fromBitIndex);
  if (!piecePosition.and(pinned).isZero()) {
    //determine if absolutely pinned
    //check where king is and pinner is opposite
    //check with rook mask,

    const rookMask = moveMask.getRookMoves(friendlyKing.countTrailingZeros());
    //if rook is attacking, bishop cannot move
    if (!piecePosition.and(rookMask).isZero()) {
      return Long.UZERO;
    }
    //check in what direction pinner is
    return getBishopPinnerDirection(
      fromBitIndex,
      friendlyKing.countTrailingZeros(),
      piecePosition,
      occupiedBits
    );
  }
  const legalMoves = bishopLegalMoves({
    occupiedBits,
    fromBitIndex,
    teammateOccupiedBits,
  }).and(piecePosition.not());

  return check ? legalMoves.and(checkingRays) : legalMoves;
}
////////////////////////////////////set gameState to all getPieces
interface getPieces extends Omit<Imove, 'piece'> {
  friendlyKing: Long;
  check: boolean;
  doubleCheck: boolean;
  checkingRays: Long;
  pinned: Long;
}
interface getPawn extends getPieces {
  elPassant: SquareBit | null;
}
export function getPawn({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
  friendlyKing,
  doubleCheck,
  check,
  checkingRays,
  elPassant,
  pinned,
}: getPawn) {
  const pawnPosition = Long.UONE.shl(fromBitIndex);
  const enemyOccupied = color === 'b' ? whiteOccupiedBits : blackOccupiedBits;
  if (doubleCheck) return Long.UZERO;
  if (!pawnPosition.and(pinned).isZero()) {
    return getPawnPinnerDirection({
      fromBitIndex,
      kingSq: friendlyKing.countTrailingZeros(),
      pawnPosition,
      occupiedBits,
      color,
      enemyOccupied,
      elPassant,
    });
  }
  const legalMoves = pawnLegalMoves({
    fromBitIndex,
    color,
    enemyOccupied,
    occupiedSquares: occupiedBits,
    elPassant,
  });
  return check ? legalMoves.and(checkingRays) : legalMoves;
}
export function getKnight({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  doubleCheck,
  check,
  checkingRays,
  pinned,
}: getPieces) {
  const teammateOccupied =
    color === 'w' ? whiteOccupiedBits : blackOccupiedBits;
  if (doubleCheck) return Long.UZERO;
  if (!Long.UONE.shiftLeft(fromBitIndex).and(pinned).isZero()) {
    return Long.UZERO;
  }
  const pseudoMoves = knightPseudoMoves({
    fromBitIndex,
  });
  const legalMoves = pseudoMoves.and(teammateOccupied.not());
  return check ? legalMoves.and(checkingRays) : legalMoves;
}
interface getKing extends Omit<Imove, 'piece'> {
  state: Long[];
  castling: string;
}
export function getKing({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
  state,
  castling,
}: getKing) {
  const teammateOccupied =
    color === 'w' ? whiteOccupiedBits : blackOccupiedBits;
  const legalMoves = kingLegalMoves({
    fromBitIndex,
    teammateOccupied,
    color,
    castling,
    occupied: occupiedBits,
  });
  const castlings = kingLegalCastlings({
    color,
    fromBitIndex,
    castling,
    occupiedBits,
    state,
  });
  const notAttackedSquares = subsetOfMaskThatIsNotAttacked({
    moveMask: legalMoves.or(castlings),
    occupiedBits: occupiedBits.xor(Long.UONE.shl(fromBitIndex)),
    color,
    state,
  });
  return notAttackedSquares;
}
const kingLegalCastlings = ({
  color,
  fromBitIndex,
  castling,
  occupiedBits,
  state,
}: {
  color: Color;
  fromBitIndex: number;
  castling: string;
  occupiedBits: Long;
  state: Long[];
}) => {
  //check if castling is possible via castling variable
  // and check if whole line is not occupied
  let castlingMask = Long.UZERO;
  function getCastlingMoveMask(to: number) {
    const kingMoveMask = moveMask.inBetween(fromBitIndex, to);
    if (!kingMoveMask)
      throw new Error('FEN notation is in conflict with gamestate! (castling)');
    const safeMoveMask = subsetOfMaskThatIsNotAttacked({
      moveMask: kingMoveMask,
      occupiedBits,
      color,
      state,
    });
    return safeMoveMask.equals(kingMoveMask) ? Long.UONE.shl(to) : Long.UZERO;
  }
  if (color === 'w') {
    if (
      castling.includes('K') &&
      moveMask.mayMove({ from: fromBitIndex, to: 1, occupied: occupiedBits })
    ) {
      castlingMask = castlingMask.or(getCastlingMoveMask(1));
    }
    if (
      castling.includes('Q') &&
      moveMask.mayMove({ from: fromBitIndex, to: 6, occupied: occupiedBits })
    ) {
      castlingMask = castlingMask.or(getCastlingMoveMask(5));
    }
  } else {
    if (
      castling.includes('k') &&
      moveMask.mayMove({ from: fromBitIndex, to: 57, occupied: occupiedBits })
    ) {
      castlingMask = castlingMask.or(getCastlingMoveMask(57));
    }
    if (
      castling.includes('q') &&
      moveMask.mayMove({ from: fromBitIndex, to: 62, occupied: occupiedBits })
    ) {
      castlingMask = castlingMask.or(getCastlingMoveMask(61));
    }
  }

  return castlingMask;
};
export function getPawnPinnerDirection({
  fromBitIndex,
  kingSq,
  pawnPosition,
  occupiedBits,
  color,
  enemyOccupied,
  elPassant,
}: {
  fromBitIndex: number;
  kingSq: number;
  pawnPosition: Long;
  occupiedBits: Long;
  color: Color;
  enemyOccupied: Long;
  elPassant: SquareBit | null;
}) {
  //N can move up if not blocked
  if (
    !moveMask.getN(kingSq).and(pawnPosition).isZero() ||
    !moveMask.getS(kingSq).and(pawnPosition).isZero()
  ) {
    const mask = pawnPseudoMoves({ fromBitIndex: fromBitIndex, color });
    if (color === 'w')
      return removeBlockedMovesForward(fromBitIndex, mask, occupiedBits, true);

    return removeBlockedMovesBackwards(fromBitIndex, mask, occupiedBits, true);
  }
  //NW
  if (color === 'w' && !moveMask.getNW(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: fromBitIndex,
      enemyOccupied,
      color,
      elPassant,
    }).and(moveMask.getNW(kingSq));
  }
  //NE
  if (color === 'w' && !moveMask.getNE(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: fromBitIndex,
      enemyOccupied,
      color,
      elPassant,
    }).and(moveMask.getNE(kingSq));
  }
  //SW
  if (color === 'b' && !moveMask.getSW(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: fromBitIndex,
      enemyOccupied,
      color,
      elPassant,
    }).and(moveMask.getSW(kingSq));
  }
  //SE
  if (color === 'b' && !moveMask.getSE(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: fromBitIndex,
      enemyOccupied,
      color,
      elPassant,
    }).and(moveMask.getSE(kingSq));
  }
  return Long.UZERO;
}
export function getBishopPinnerDirection(
  square: number,
  kingSq: number,
  bishopPosition: Long,
  occupied: Long
) {
  if (square > kingSq) {
    //NW
    if (!moveMask.getNW(kingSq).and(bishopPosition).isZero()) {
      return removeBlockedMovesForward(
        square,
        moveMask.getNW(square),
        occupied
      ).and(bishopPosition.not());
    }
    //NE
    if (!moveMask.getNE(kingSq).and(bishopPosition).isZero()) {
      return removeBlockedMovesForward(
        square,
        moveMask.getNE(square),
        occupied
      ).and(bishopPosition.not());
    }
  }
  //SW
  if (!moveMask.getSW(kingSq).and(bishopPosition).isZero()) {
    return removeBlockedMovesForward(
      square,
      moveMask.getSW(square),
      occupied
    ).and(bishopPosition.not());
  }
  //SE
  if (!moveMask.getSE(kingSq).and(bishopPosition).isZero()) {
    return removeBlockedMovesForward(
      square,
      moveMask.getSE(square),
      occupied
    ).and(bishopPosition.not());
  }
  return Long.UZERO;
}
export function getRookPinnerDirection({
  fromBitIndex,
  kingSq,
  rookPosition,
  occupiedBits,
}: {
  fromBitIndex: number;
  kingSq: number;
  rookPosition: Long;
  occupiedBits: Long;
}) {
  if (fromBitIndex > kingSq) {
    //N
    if (!moveMask.getN(kingSq).and(rookPosition).isZero()) {
      return removeBlockedMovesForward(
        fromBitIndex,
        moveMask.getN(fromBitIndex),
        occupiedBits
      );
    }
    //W
    if (!moveMask.getW(kingSq).and(rookPosition).isZero()) {
      return removeBlockedMovesForward(
        fromBitIndex,
        moveMask.getW(fromBitIndex),
        occupiedBits
      );
    }
  }
  //E
  if (!moveMask.getE(kingSq).and(rookPosition).isZero()) {
    return removeBlockedMovesForward(
      fromBitIndex,
      moveMask.getE(fromBitIndex),
      occupiedBits
    );
  }
  //S
  if (!moveMask.getS(kingSq).and(rookPosition).isZero()) {
    return removeBlockedMovesForward(
      fromBitIndex,
      moveMask.getS(fromBitIndex),
      occupiedBits
    );
  }
  return Long.UZERO;
}
export const kingIsAttackedFrom = ({
  occupiedBits,
  fromBitIndex,
  color,
  state,
}: {
  occupiedBits: Long;
  fromBitIndex: number;
  color: Color;
  state: Long[];
}) => {
  const colorHelper = color === 'w' ? 0 : 1;
  const pawns = state[1 - colorHelper] as Long;
  let checkRays = Long.UZERO;
  let numOfChecks = 0;
  const pawnAttack = pawnPseudoAttacks({ fromBitIndex, color }).and(pawns);
  if (!pawnAttack.isZero()) {
    checkRays = checkRays.or(pawnAttack);
    numOfChecks = numOfChecks + 1;
  }
  const rooks = state[3 - colorHelper] as Long;
  const queens = state[9 - colorHelper] as Long;
  const bishops = state[5 - colorHelper] as Long;
  const rookAttacks = rookLegalAttacks({
    occupiedBits,
    fromBitIndex,
  });
  const BAttacks = bishopAttacks({
    fromBitIndex,
    occupiedBits,
  });
  //rooks
  if (!rookAttacks.and(rooks).isZero()) {
    checkRays = checkRays.or(rookAttacks.and(rooks));
    numOfChecks = numOfChecks + 1;
  }

  //bishop
  if (!BAttacks.and(bishops).isZero()) {
    checkRays = checkRays.or(BAttacks.and(bishops));
    numOfChecks = numOfChecks + 1;
  }
  //queen
  if (!rookAttacks.and(queens).isZero()) {
    checkRays = checkRays.or(rookAttacks.and(queens));
    numOfChecks = numOfChecks + 1;
  }
  //queen
  if (!BAttacks.and(queens).isZero()) {
    checkRays = checkRays.or(BAttacks.and(queens));
    numOfChecks = numOfChecks + 1;
  }

  const knights = state[7 - colorHelper] as Long;
  const knightAttacks = moveMask.getKnightMoves(fromBitIndex).and(knights);
  if (!knightAttacks.isZero()) {
    checkRays = checkRays.or(knightAttacks);
    numOfChecks = numOfChecks + 1;
  }
  const rays = getCheckingPiecesRays(checkRays, fromBitIndex);
  return { rays, check: numOfChecks !== 0, doubleCheck: numOfChecks >= 2 };
};
/**
 * can be checked if any square in movemask is being attacked, useful for castling and king moves
 * @param moveMask {Long} mask that is wanted to be checked in case of attacks
 * @param occupiedBits {Long} all occupied squares in board
 * @param color {Color} friendly color, opposite color can attack
 * @returns {Long} bitboard of all squares in mask that is safe to move
 */
export function subsetOfMaskThatIsNotAttacked({
  moveMask,
  occupiedBits,
  color,
  state,
}: {
  moveMask: Long;
  occupiedBits: Long;
  color: Color;
  state: Long[];
}) {
  //scan all bits
  let allMoves = moveMask;
  let squaresAttacked = Long.UZERO;
  while (!allMoves.isZero()) {
    const square = allMoves.countTrailingZeros();
    if (square === 64) return moveMask.and(squaresAttacked.not());
    const attacked = squareIsAttacked({
      occupiedBits,
      fromBitIndex: square,
      friendlyColor: color,
      state,
    });
    if (attacked) squaresAttacked = squaresAttacked.or(Long.UONE.shl(square));
    //remove checked square
    const squarePosition = Long.UONE.shl(square).not();
    allMoves = allMoves.and(squarePosition);
  }
  return moveMask.and(squaresAttacked.not());
}
export const getCheckingPiecesRays = (checksBB: Long, kingSquare: number) => {
  let rays = Long.UZERO;
  let allCheckers = checksBB;
  while (!allCheckers.isZero()) {
    const attackerSq = allCheckers.countTrailingZeros();
    if (attackerSq === 64) continue;
    const ray = moveMask.inBetween(kingSquare, attackerSq) as Long;
    //it might be knight
    if (!ray) {
      rays = rays.or(Long.UONE.shl(attackerSq));
      allCheckers = allCheckers.xor(Long.UONE.shl(attackerSq));
      continue;
    }
    rays = rays.or(ray);
    allCheckers = allCheckers.xor(Long.UONE.shl(attackerSq));
  }
  return rays.and(Long.UONE.shl(kingSquare).not());
};
/**
 *
 * @param occupiedBits {Long} BB of all pieces in board
 * @param fromBitIndex {number} index of square examined
 * @param friendlyColor {Color} color of examined piece
 * @returns true: enemy attacks square, false is safe to move
 */
export const squareIsAttacked = ({
  occupiedBits,
  fromBitIndex,
  friendlyColor,
  state,
}: {
  occupiedBits: Long;
  fromBitIndex: number;
  friendlyColor: Color;
  state: Long[];
}) => {
  const enemyColorHelper = friendlyColor === 'w' ? 0 : 1;
  const ePawns = state[1 - enemyColorHelper] as Long;
  //check if pawnAttack from examined square contains enemy pawn
  if (
    !pawnPseudoAttacks({ fromBitIndex, color: friendlyColor })
      .and(ePawns)
      .isZero()
  ) {
    return true;
  }
  const eRooks = state[3 - enemyColorHelper] as Long;
  const eQueens = state[9 - enemyColorHelper] as Long;
  const eRooksQueens = eQueens.or(eRooks);
  //check if rookAttack from examined square contains enemy Rook/Queen
  if (
    !rookLegalAttacks({
      occupiedBits,
      fromBitIndex,
    })
      .and(eRooksQueens)
      .isZero()
  ) {
    return true;
  }
  const eBishops = state[5 - enemyColorHelper] as Long;
  const eBbishopsQueens = eQueens.or(eBishops);

  //check if bishopAttack from examined square contains enemy Bishop/Queen
  if (
    !bishopAttacks({
      fromBitIndex,
      occupiedBits,
    })
      .and(eBbishopsQueens)
      .isZero()
  ) {
    return true;
  }
  const eKnights = state[7 - enemyColorHelper] as Long;
  //check if knightAttack from examined square contains enemy Knight
  if (!moveMask.getKnightMoves(fromBitIndex).and(eKnights).isZero()) {
    return true;
  }
  const eKings = state[11 - enemyColorHelper] as Long;
  //check if kingAttack from examined square contains enemy King
  if (!moveMask.getKingMoves(fromBitIndex).and(eKings).isZero()) {
    return true;
  }
  //return false if square is not attacked by enemy pieces
  return false;
};
