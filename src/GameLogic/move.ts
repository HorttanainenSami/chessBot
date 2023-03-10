import Long from 'long';
import { Color } from '../Types';
import {
  SquareBit,
  bitPieces,
  getBlackOccupiedBits,
  getOccupiedBits,
} from './helpers';
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
import { state } from './gameStateChanger';

interface Imove {
  blackOccupiedBits: Long;
  whiteOccupiedBits: Long;
  occupiedBits: Long;
  fromBitIndex: number;
  piece: bitPieces;
  color: Color;
}

export type getMovesReturn = Map<SquareBit, IAllMoves>;
export interface IAllMoves {
  piece: bitPieces;
  color: Color;
  algebricMoves: SquareBit[];
  algebricAttacks: SquareBit[];
  moves: Long;
  attacks: Long;
}
/**
 * get all moves from one side
 * @param color {Color} color whose turn it is
 * @param state {state} current state of game
 * @returns {Map<SquareBit, IAllMoves>}
 */
export const getMoves = ({
  color,
  state,
}: {
  color: Color;
  state: state;
}): getMovesReturn => {
  const array: getMovesReturn = new Map();

  const { gameState, mate, draw } = state;
  if (mate || draw) return array;

  const blackOccupiedBits = getBlackOccupiedBits(gameState);
  const occupiedBits = getOccupiedBits(gameState);
  const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
  const colorHelper = color === 'w' ? 0 : 1;
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
      if (!legalMove.isZero()) {
        const attacks =
          color === 'w'
            ? blackOccupiedBits.and(legalMove)
            : whiteOccupiedBits.and(legalMove);
        array.set(fromBitIndex, {
          piece,
          color,
          algebricMoves: toIndexArray(legalMove.and(attacks.not())),
          algebricAttacks: toIndexArray(attacks),
          moves: legalMove,
          attacks,
        });
      }

      pieces = pieces.and(Long.UONE.shl(fromBitIndex).not());
    }
  }
  return array;
};
/**
 * transforms bitboard occuppied bits to array of indexes
 * @param BB {Long} Bitboard representation of piece
 * @returns {SquareBit[]} bitboard occuppied bits to array of indexes
 */
export const toIndexArray = (BB: Long) => {
  let i = BB;
  const IndexArray: SquareBit[] = [];
  while (!i.isZero()) {
    const square = i.countTrailingZeros();
    if (square === 64) {
      break;
    }
    IndexArray.push(square);
    i = i.and(Long.UONE.shl(square).not());
  }
  return IndexArray;
};
/**
 *  gets moves of specific piece
 * @param move {Imove} nessesary information to get possible moves
 * @param state {state} current state of game
 * @returns {Long} BB of all possible moves that piece can make
 */
export const getMove = ({
  move,
  state,
}: {
  move: Imove;
  state: state;
}): Long => {
  const friendlyKing =
    move.color === 'w' ? state.gameState[10] : state.gameState[11];

  const params = {
    ...move,
    friendlyKing,
    state,
  };
  switch (move.piece) {
    case 0: {
      return getPawn(params);
    }
    case 1: {
      return getPawn(params);
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
      if (state.doubleCheck) return Long.UZERO;
      const diagonalLegalMoves = getBishop(params);
      const RookLegalMoves = getRook(params);

      return diagonalLegalMoves.or(RookLegalMoves);
    }
    case 9: {
      if (state.doubleCheck) return Long.UZERO;
      const diagonalLegalMoves = getBishop(params);
      const RookLegalMoves = getRook(params);
      return diagonalLegalMoves.or(RookLegalMoves);
    }
    case 10: {
      return getKing(params);
    }
    case 11: {
      return getKing(params);
    }
    default:
      return Long.UZERO;
  }
};
/**
 * returns legal moves of rook
 * @param color {Color} color whose turn it is
 * @param fromBitIndex {number} square index of rook
 * @param blackOccupiedBits {Long} bb of black pieces
 * @param whiteOccupiedBits {Long} bb of white pieces
 * @param occupiedBits {Long} bb of occupied bits
 * @param friendlyKing {Long} friendly king
 * @param state {state} current state of game
 * @returns {Long} BB of possible moves
 */
export function getRook({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
  friendlyKing,
  state,
}: getPieces) {
  const { doubleCheck, check, checkingRays, pinned } = state;
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
/**
 * returns legal moves of bishop
 * @param color {Color} color whose turn it is
 * @param fromBitIndex {number} square index of rook
 * @param blackOccupiedBits {Long} bb of black pieces
 * @param whiteOccupiedBits {Long} bb of white pieces
 * @param occupiedBits {Long} bb of occupied bits
 * @param friendlyKing {Long} friendly king
 * @param state {state} current state of game
 * @returns {Long} BB of possible moves
 */
export function getBishop({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
  friendlyKing,
  state,
}: getPieces) {
  const { doubleCheck, check, checkingRays, pinned } = state;
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

interface getPieces extends Omit<Imove, 'piece'> {
  friendlyKing: Long;
  state: state;
}
/**
 * returns legal moves of pawn
 * @param color {Color} color whose turn it is
 * @param fromBitIndex {number} square index of rook
 * @param blackOccupiedBits {Long} bb of black pieces
 * @param whiteOccupiedBits {Long} bb of white pieces
 * @param occupiedBits {Long} bb of occupied bits
 * @param friendlyKing {Long} friendly king
 * @param state {state} current state of game
 * @returns {Long} BB of possible moves
 */
export function getPawn({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
  friendlyKing,
  state,
}: getPieces) {
  const { doubleCheck, pinned, elPassant, checkingRays, check } = state;
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
/**
 * returns legal moves of Knight
 * @param color {Color} color whose turn it is
 * @param fromBitIndex {number} square index of rook
 * @param blackOccupiedBits {Long} bb of black pieces
 * @param whiteOccupiedBits {Long} bb of white pieces
 * @param occupiedBits {Long} bb of occupied bits
 * @param friendlyKing {Long} friendly king
 * @param state {state} current state of game
 * @returns {Long} BB of possible moves
 */
export function getKnight({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  state,
}: getPieces) {
  const { doubleCheck, check, checkingRays, pinned } = state;
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
/**
 * returns legal moves of king
 * @param color {Color} color whose turn it is
 * @param fromBitIndex {number} square index of rook
 * @param blackOccupiedBits {Long} bb of black pieces
 * @param whiteOccupiedBits {Long} bb of white pieces
 * @param occupiedBits {Long} bb of occupied bits
 * @param friendlyKing {Long} friendly king
 * @param state {state} current state of game
 * @returns {Long} BB of possible moves
 */
export function getKing({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
  state,
}: Omit<getPieces, 'friendlyKing'>) {
  const { castling, gameState } = state;
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
    gameState,
  });
  const notAttackedSquares = subsetOfMaskThatIsNotAttacked({
    moveMask: legalMoves.or(castlings),
    occupiedBits: occupiedBits.xor(Long.UONE.shl(fromBitIndex)),
    color,
    gameState,
  });
  return notAttackedSquares;
}
/**
 * returns legal castling moves for king
 * @param color {Color} color whose turn it is
 * @param fromBitIndex {number} square index of rook
 * @param occupiedBits {Long} bb of occupied bits
 * @param gameState {Long[]} current state of game
 * @param castling {string} current castling rights
 * @returns {Long} BB of possible castling moves
 */
const kingLegalCastlings = ({
  color,
  fromBitIndex,
  castling,
  occupiedBits,
  gameState,
}: {
  color: Color;
  fromBitIndex: number;
  castling: string;
  occupiedBits: Long;
  gameState: Long[];
}) => {
  //check if castling is possible via castling variable
  // and check if whole line is not occupied
  let castlingMask = Long.UZERO;
  function getCastlingMoveMask(to: number) {
    const kingMoveMask = moveMask.inBetween(fromBitIndex, to);
    if (!kingMoveMask) {
      throw new Error('FEN notation is in conflict with gamestate! (castling)');
    }
    const safeMoveMask = subsetOfMaskThatIsNotAttacked({
      moveMask: kingMoveMask,
      occupiedBits,
      color,
      gameState,
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
/**
 * returns bitboard representation of pawn pinner
 * @param color {Color} color whose turn it is
 * @param fromBitIndex {number} square index of rook
 * @param enemyOccupied {Long} bb of enemy pieces
 * @param occupiedBits {Long} bb of occupied bits
 * @param kingSq {number} king square
 * @param elpassant {SquareBit|null} elpassant square
 * @returns {Long} BB of pawn pinner
 */
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
  gameState,
}: {
  occupiedBits: Long;
  fromBitIndex: number;
  color: Color;
  gameState: Long[];
}) => {
  const colorHelper = color === 'w' ? 0 : 1;
  const pawns = gameState[1 - colorHelper] as Long;
  let checkRays = Long.UZERO;
  let numOfChecks = 0;
  const pawnAttack = pawnPseudoAttacks({ fromBitIndex, color }).and(pawns);
  if (!pawnAttack.isZero()) {
    checkRays = checkRays.or(pawnAttack);
    numOfChecks = numOfChecks + 1;
  }
  const rooks = gameState[3 - colorHelper] as Long;
  const queens = gameState[9 - colorHelper] as Long;
  const bishops = gameState[5 - colorHelper] as Long;
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

  const knights = gameState[7 - colorHelper] as Long;
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
  gameState,
}: {
  moveMask: Long;
  occupiedBits: Long;
  color: Color;
  gameState: Long[];
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
      gameState,
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
  gameState,
}: {
  occupiedBits: Long;
  fromBitIndex: number;
  friendlyColor: Color;
  gameState: Long[];
}) => {
  const enemyColorHelper = friendlyColor === 'w' ? 0 : 1;
  const ePawns = gameState[1 - enemyColorHelper] as Long;
  //check if pawnAttack from examined square contains enemy pawn
  if (
    !pawnPseudoAttacks({ fromBitIndex, color: friendlyColor })
      .and(ePawns)
      .isZero()
  ) {
    return true;
  }
  const eRooks = gameState[3 - enemyColorHelper] as Long;
  const eQueens = gameState[9 - enemyColorHelper] as Long;
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
  const eBishops = gameState[5 - enemyColorHelper] as Long;
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
  const eKnights = gameState[7 - enemyColorHelper] as Long;
  //check if knightAttack from examined square contains enemy Knight
  if (!moveMask.getKnightMoves(fromBitIndex).and(eKnights).isZero()) {
    return true;
  }
  const eKings = gameState[11 - enemyColorHelper] as Long;
  //check if kingAttack from examined square contains enemy King
  if (!moveMask.getKingMoves(fromBitIndex).and(eKings).isZero()) {
    return true;
  }
  //return false if square is not attacked by enemy pieces
  return false;
};
