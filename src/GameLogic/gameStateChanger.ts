import Long from 'long';
import { Color, Move } from '../Types';
import {
  pawnLegalMoves,
  kingLegalMoves,
  rookLegalMoves,
  bishopLegalMoves,
  knightPseudoMoves,
  getObstructed,
  getinBetween,
  moveMask,
  pawnPseudoMoves,
  pawnLegalAttacks,
  pawnPseudoAttacks,
  bishopAttacks,
  rookLegalAttacks,
} from './move';
import {
  removeBlockedMovesForward,
  removeBlockedMovesBackwards,
} from './bitManipulation';
import { SquareBit, bitPieces, logger } from './helpers';
export let gameState: Long[] = [
  //pawns
  Long.fromString('0xff00', true, 16), //w
  Long.fromString('0xff000000000000', true, 16), //b
  //rooks
  Long.fromString('0x81', true, 16), //w
  Long.fromString('0x8100000000000000', true, 16), //b
  //bishops
  Long.fromString('0x24', true, 16), //w
  Long.fromString('0x2400000000000000', true, 16), //b
  //knights
  Long.fromString('0x42', true, 16), //w
  Long.fromString('0x4200000000000000', true, 16), //b
  //queens
  Long.fromString('0x10', true, 16), //w
  Long.fromString('0x1000000000000000', true, 16), //b
  //kings
  Long.fromString('0x8', true, 16), //w
  Long.fromString('0x800000000000000', true, 16), //b
];
export let elPassant: SquareBit | null = null;
export let pinned: Long = Long.UZERO;
export let checked = false;
export let doubleChecked = false;
export let checkingRays = Long.UZERO;
export let mate = false;
export let turn: Color = 'w';
export let castling = 'KQkq';
// can be used to set tie if reaches to 50
export let halfMove = 0;
export let fullMove = 1;
export const setElPassant = (s: SquareBit | null) => (elPassant = s);
export const setHalfMove = (s: number) => (halfMove = s);
export const setFullMove = (s: number) => (fullMove = s);
export const setTurn = (s: Color) => (turn = s);
//helper for tests
export function reset() {
  gameState = [
    //pawns
    Long.fromString('0xff00', true, 16), //w
    Long.fromString('0xff000000000000', true, 16), //b
    //rooks
    Long.fromString('0x81', true, 16), //w
    Long.fromString('0x8100000000000000', true, 16), //b
    //bishops
    Long.fromString('0x24', true, 16), //w
    Long.fromString('0x2400000000000000', true, 16), //b
    //knights
    Long.fromString('0x42', true, 16), //w
    Long.fromString('0x4200000000000000', true, 16), //b
    //queens
    Long.fromString('0x10', true, 16), //w
    Long.fromString('0x1000000000000000', true, 16), //b
    //kings
    Long.fromString('0x8', true, 16), //w
    Long.fromString('0x800000000000000', true, 16), //b
  ];
  elPassant = null;
  pinned = Long.UZERO;
  checked = false;
  doubleChecked = false;
  checkingRays = Long.UZERO;
  mate = false;
  turn = 'w';
}
export const getState = () => ({
  gameState,
  pinned,
  checked,
  doubleChecked,
  checkingRays,
  mate,
  turn,
  elPassant,
  halfMove,
  fullMove,
  castling,
});

export const updateGameState = ({ piece, color, from, to }: Move) => {
  const toBitIndex = SquareBit[to];
  const fromBitIndex = SquareBit[from];
  let moveBoard = gameState[piece] as Long;
  let modifiedGameState = gameState;
  //update moved piece

  const toMask = Long.UONE.shiftLeft(toBitIndex);
  const fromMask = Long.UONE.shiftLeft(fromBitIndex);
  moveBoard = moveBoard.and(fromMask.not());
  moveBoard = moveBoard.or(toMask);
  //remove captured pieces
  const elPassantCapture = checkIfElpassant(toBitIndex, piece);
  const deletedPieces = elPassantCapture
    ? removeCapturedPiece(elPassantCapture.square, color)
    : removeCapturedPiece(toBitIndex, color);
  //if pawn moves to last rank it will be promoted to Queen
  if (piece === 1 && ~~(toBitIndex / 8) === 0) {
    modifiedGameState[9] = modifiedGameState[9].or(toMask);
    moveBoard = moveBoard.and(toMask.not());
  }
  if (piece === 0 && ~~(toBitIndex / 8) === 7) {
    modifiedGameState[8] = modifiedGameState[8].or(toMask);
    moveBoard = moveBoard.and(toMask.not());
  }
  //make castle

  //set/remove elpassant
  if ((piece === 1 || piece === 0) && (fromBitIndex - toBitIndex) % 16 === 0) {
    const elPassantSquare = color === 'w' ? fromBitIndex + 8 : fromBitIndex - 8;
    setElPassant(elPassantSquare);
  } else {
    setElPassant(null);
  }

  //final state changes

  const newTurn = turn === 'b' ? 'w' : 'b';
  if (deletedPieces) {
    modifiedGameState[deletedPieces.i] = deletedPieces.pieces;
  }
  modifiedGameState[piece] = moveBoard;

  changeGameState(modifiedGameState);
  //set if pawn moved or piece captured to 0 otherwise increment
  if (piece === 1 || piece === 0 || deletedPieces) {
    setHalfMove(0);
  } else {
    setHalfMove(halfMove + 1);
  }

  if (turn === 'b') {
    setFullMove(fullMove + 1);
  }
  setTurn(newTurn);
};

export const checkIfElpassant = (toBitIndex: number, piece: bitPieces) => {
  // check if moved piece is pawn and its moved to elpassant square
  if (toBitIndex === elPassant && (piece === 0 || piece === 1)) {
    const rank = ~~(toBitIndex / 8);
    if (rank === 2) {
      return {
        square: toBitIndex + 8,
      };
    } else if (rank === 5) {
      return {
        square: toBitIndex - 8,
      };
    }
  }
};

export const removeCapturedPiece = (fromBitIndex: number, color: Color) => {
  // white pieces is even and black odd in gamestate Array so we need to set this even for black odd
  const forHelper = color === 'w' ? 1 : 0;
  const capturedPiece = Long.UONE.shiftLeft(fromBitIndex);
  for (let i = forHelper; i < gameState.length; i += 2) {
    let pieces = gameState[i] as Long;
    if (!capturedPiece.and(pieces).isZero()) {
      pieces = pieces.and(capturedPiece.not());
      return { i, pieces };
    }
  }
};

// Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
export const makeMove = (props: Move) => {
  if (props.color !== turn) return false;

  return updateGameState(props);
};

export const getMoves = (color: Color) => {
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
      const legalMove = getMove({
        fromBitIndex,
        piece,
        color,
        blackOccupiedBits,
        whiteOccupiedBits,
        occupiedBits,
      });

      array[fromBitIndex] = legalMove;
      pieces = pieces.and(Long.UONE.shl(fromBitIndex).not());
    }
  }
  return array;
};

export const calculatePinned = (color: Color) => {
  const blackOccupiedBits = gameState.reduce((acc, curr, i) => {
    if (i % 2 === 0) return acc;
    return acc.or(curr);
  }, Long.UZERO);
  const occupiedBits = gameState.reduce(
    (acc, curr) => acc.or(curr),
    Long.UZERO
  );
  const teammateOccupiedBits =
    color === 'w' ? occupiedBits.xor(blackOccupiedBits) : blackOccupiedBits;
  const initialPinned = pinnedPieces(color, teammateOccupiedBits, occupiedBits);
  pinned = initialPinned;
};
calculatePinned('w');
export function pinnedPieces(
  color: Color,
  teammateOccupiedBits: Long,
  occupied: Long
) {
  const colorHelper = color === 'w' ? 1 : 0;
  const enemyColor = color === 'w' ? 0 : 1;
  const kingPosition = gameState[11 - colorHelper] as Long;
  const kingSquare = kingPosition.countTrailingZeros();
  if (kingSquare === 64) return Long.UZERO;
  const eRook = gameState[3 - enemyColor] as Long;
  const eBishop = gameState[5 - enemyColor] as Long;
  const eQueen = gameState[9 - enemyColor] as Long;
  let pinned = Long.UZERO;

  let pinner = xrayRookAttacks(occupied, teammateOccupiedBits, kingSquare);
  while (!pinner.isZero()) {
    let pinnerSq = pinner.countTrailingZeros();
    let pinnerPosition = Long.UONE.shiftLeft(pinnerSq);
    if (pinnerSq === 64) break;
    //check if pinnerSq contains enemy queen or rook
    if (pinnerPosition.and(eQueen.or(eRook)).isZero()) {
      pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
      continue;
    }
    const obstructedBB = getObstructed(kingSquare, pinnerSq, occupied);
    if (obstructedBB === null) break;
    const pieceBeingPinned = obstructedBB.and(teammateOccupiedBits);
    pinned = pinned.or(pieceBeingPinned);
    pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
  }
  pinner = xrayBishopAttacks(occupied, teammateOccupiedBits, kingSquare);
  while (!pinner.isZero()) {
    let pinnerSq = pinner.countTrailingZeros();
    if (pinnerSq === 64) break;
    const pinnerPosition = Long.UONE.shiftLeft(pinnerSq);
    //check if pinnerSq contains enemy queen or bishop
    if (pinnerPosition.and(eQueen.or(eBishop)).isZero()) {
      pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
      continue;
    }

    const obstructedBB = getObstructed(kingSquare, pinnerSq, occupied);
    if (obstructedBB === null) break;
    const pieceBeingPinned = obstructedBB.and(teammateOccupiedBits);
    //check if piece is bishop or queen its partiallyPinned
    pinned = pinned.or(pieceBeingPinned);
    pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
  }
  return pinned;
}
export const setFEN = (
  state: Long[],
  elpassantP: SquareBit | null,
  castlingP: string,
  halfMoveP: number,
  fullMoveP: number,
  color?: Color
) => {
  elPassant = elpassantP;
  castling = castlingP;
  halfMove = halfMoveP;
  fullMove = fullMoveP;
  checked = false;
  doubleChecked = false;
  mate = false;
  changeGameState(state, color);
};
export const changeGameState = (state: Long[], toColor?: Color) => {
  //if color is given as parameter or get next players color
  gameState = state;
  const color = toColor ? toColor : turn === 'w' ? 'b' : 'w';
  turn = color;
  calculatePinned(color);
  isCheck();
};
export const getMove = (p: Imove): Long => {
  if (mate) return Long.UZERO;
  switch (p.piece) {
    case 0: {
      return getPawn(p);
    }
    case 1: {
      return getPawn(p);
    }
    case 2: {
      return getRook(p);
    }
    case 3: {
      return getRook(p);
    }
    case 4: {
      return getBishop(p);
    }
    case 5: {
      return getBishop(p);
    }
    case 6: {
      return getKnight(p);
    }
    case 7: {
      return getKnight(p);
    }
    case 8: {
      if (doubleChecked) return Long.UZERO;
      const diagonalLegalMoves = getBishop(p);
      const RookLegalMoves = getRook(p);

      return diagonalLegalMoves.or(RookLegalMoves);
    }
    case 9: {
      if (doubleChecked) return Long.UZERO;
      const diagonalLegalMoves = getBishop(p);
      const RookLegalMoves = getRook(p);
      return diagonalLegalMoves.or(RookLegalMoves);
    }
    case 10: {
      return getKing(p);
    }
    case 11: {
      return getKing(p);
    }
    default:
      return Long.UZERO;
  }
};
export function isMate(color: Color) {
  const allMoves = getMoves(color);
  for (let asd of allMoves) {
    if (!asd.isZero()) {
      return;
    }
  }
  mate = true;
}
export function isCheck() {
  const occupiedBits = gameState.reduce(
    (acc, curr) => acc.or(curr),
    Long.UZERO
  );
  const kingPosition =
    turn === 'b' ? (gameState[11] as Long) : (gameState[10] as Long);

  const fromBitIndex = kingPosition.countTrailingZeros();
  if (fromBitIndex === 64) return;

  const { rays, check, doubleCheck } = kingIsAttackedFrom({
    occupiedBits,
    fromBitIndex,
    gameState,
    color: turn,
  });
  doubleChecked = doubleCheck;
  checkingRays = rays;
  checked = check;
  //trigger mate checking function
  if (check) isMate(turn);
}
export function getRook({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
}: Omit<Imove, 'piece'>) {
  if (doubleChecked) return Long.UZERO;
  const piecePosition = Long.UONE.shiftLeft(fromBitIndex);
  const kingPosition = color === 'w' ? gameState[10] : gameState[11];
  const teammateOccupiedBits =
    color === 'w' ? whiteOccupiedBits : blackOccupiedBits;
  if (!piecePosition.and(pinned).isZero()) {
    //determine if absolutely pinned
    //check where king is and pinner is opposite
    //check with rook mask,

    const rookMask = moveMask.getBishopMoves(kingPosition.countTrailingZeros());
    //if bishop is attacking, rook cannot move
    if (!piecePosition.and(rookMask).isZero()) {
      return Long.UZERO;
    }
    //check in what direction pinner is
    return getRookPinnerDirection(
      fromBitIndex,
      kingPosition.countTrailingZeros(),
      piecePosition,
      occupiedBits
    ).and(piecePosition.not());
  }
  const legalMoves = rookLegalMoves({
    fromBitIndex,
    occupiedBits,
    teammateOccupiedBits,
  });
  return checked ? legalMoves.and(checkingRays) : legalMoves;
}
export function getBishop({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
}: Omit<Imove, 'piece'>) {
  if (doubleChecked) return Long.UZERO;
  const friendlyKing = color === 'w' ? gameState[10] : gameState[11];
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

  return checked ? legalMoves.and(checkingRays) : legalMoves;
}
export function getPawn({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
}: Omit<Imove, 'piece'>) {
  const friendlyKing = color === 'w' ? gameState[10] : gameState[11];
  const pawnPosition = Long.UONE.shl(fromBitIndex);
  const enemyOccupied = color === 'b' ? whiteOccupiedBits : blackOccupiedBits;
  if (doubleChecked) return Long.UZERO;
  if (!pawnPosition.and(pinned).isZero()) {
    return getPawnPinnerDirection(
      fromBitIndex,
      friendlyKing.countTrailingZeros(),
      pawnPosition,
      occupiedBits,
      color,
      enemyOccupied
    );
  }
  const legalMoves = pawnLegalMoves({
    fromBitIndex,
    color,
    enemyOccupied,
    occupiedSquares: occupiedBits,
    elPassant,
  });
  return checked ? legalMoves.and(checkingRays) : legalMoves;
}
export function getKnight({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
}: Omit<Imove, 'piece'>) {
  const teammateOccupied =
    color === 'w' ? whiteOccupiedBits : blackOccupiedBits;
  if (doubleChecked) return Long.UZERO;
  if (!Long.UONE.shiftLeft(fromBitIndex).and(pinned).isZero()) {
    return Long.UZERO;
  }
  const pseudoMoves = knightPseudoMoves({
    fromBitIndex,
  });
  const legalMoves = pseudoMoves.and(teammateOccupied.not());
  return checked ? legalMoves.and(checkingRays) : legalMoves;
}
export function getKing({
  color,
  fromBitIndex,
  blackOccupiedBits,
  whiteOccupiedBits,
  occupiedBits,
}: Omit<Imove, 'piece'>) {
  const teammateOccupied =
    color === 'w' ? whiteOccupiedBits : blackOccupiedBits;
  const enemyOccupied = color === 'b' ? whiteOccupiedBits : blackOccupiedBits;
  const legalMoves = kingLegalMoves({
    fromBitIndex,
    occupiedBits,
    enemyOccupied,
    teammateOccupied,
    color,
    gameState,
  });
  const notAttackedSquares = subsetOfMaskThatIsNotAttacked(
    legalMoves,
    occupiedBits.xor(Long.UONE.shl(fromBitIndex)),
    color
  );
  return notAttackedSquares;
}
export function getPawnPinnerDirection(
  square: number,
  kingSq: number,
  pawnPosition: Long,
  occupied: Long,
  color: Color,
  enemyOccupied: Long
) {
  //N can move up if not blocked
  if (
    !moveMask.getN(kingSq).and(pawnPosition).isZero() ||
    !moveMask.getS(kingSq).and(pawnPosition).isZero()
  ) {
    const mask = pawnPseudoMoves({ fromBitIndex: square, color });
    if (color === 'w')
      return removeBlockedMovesForward(square, mask, occupied, true);

    return removeBlockedMovesBackwards(square, mask, occupied, true);
  }
  //NW
  if (color === 'w' && !moveMask.getNW(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: square,
      enemyOccupied,
      color,
      elPassant,
    }).and(moveMask.getNW(kingSq));
  }
  //NE
  if (color === 'w' && !moveMask.getNE(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: square,
      enemyOccupied,
      color,
      elPassant,
    }).and(moveMask.getNE(kingSq));
  }
  //SW
  if (color === 'b' && !moveMask.getSW(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: square,
      enemyOccupied,
      color,
      elPassant,
    }).and(moveMask.getSW(kingSq));
  }
  //SE
  if (color === 'b' && !moveMask.getSE(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: square,
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
export function getRookPinnerDirection(
  square: number,
  kingSq: number,
  rookPosition: Long,
  occupied: Long
) {
  if (square > kingSq) {
    //N
    if (!moveMask.getN(kingSq).and(rookPosition).isZero()) {
      return removeBlockedMovesForward(square, moveMask.getN(square), occupied);
    }
    //W
    if (!moveMask.getW(kingSq).and(rookPosition).isZero()) {
      return removeBlockedMovesForward(square, moveMask.getW(square), occupied);
    }
  }
  //E
  if (!moveMask.getE(kingSq).and(rookPosition).isZero()) {
    return removeBlockedMovesForward(square, moveMask.getE(square), occupied);
  }
  //S
  if (!moveMask.getS(kingSq).and(rookPosition).isZero()) {
    return removeBlockedMovesForward(square, moveMask.getS(square), occupied);
  }
  return Long.UZERO;
}
export const getCheckingPiecesRays = (checksBB: Long, kingSquare: number) => {
  let rays = Long.UZERO;
  let allCheckers = checksBB;
  while (!allCheckers.isZero()) {
    const attackerSq = allCheckers.countTrailingZeros();
    if (attackerSq === 64) continue;
    const ray = getinBetween(kingSquare, attackerSq) as Long;
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
 * @param gameState {Long[]}
 * @returns {Long} bitboard of all squares in mask that is safe to move
 */
export function subsetOfMaskThatIsNotAttacked(
  moveMask: Long,
  occupiedBits: Long,
  color: Color
) {
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
    });
    if (attacked) squaresAttacked = squaresAttacked.or(Long.UONE.shl(square));
    //remove checked square
    const squarePosition = Long.UONE.shl(square).not();
    allMoves = allMoves.and(squarePosition);
  }
  return moveMask.and(squaresAttacked.not());
}

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
}: {
  occupiedBits: Long;
  fromBitIndex: number;
  friendlyColor: Color;
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
export function xrayRookAttacks(
  occupied: Long,
  blockers: Long,
  square: number
) {
  const occupiedWOSelf = occupied.xor(Long.UONE.shiftLeft(square));
  const attack = rookLegalAttacks({
    fromBitIndex: square,
    occupiedBits: occupied,
  }).and(occupiedWOSelf);
  const onlyBlockers = blockers.and(attack);
  const attacksBehindBlockers = rookLegalAttacks({
    fromBitIndex: square,
    occupiedBits: occupied.xor(onlyBlockers),
  }).and(occupiedWOSelf);
  return attack.xor(attacksBehindBlockers);
}
export function xrayBishopAttacks(
  occupied: Long,
  blockers: Long,
  square: number
) {
  const occupiedWOSelf = occupied.xor(Long.UONE.shiftLeft(square));
  const attack = bishopAttacks({
    fromBitIndex: square,
    occupiedBits: occupied,
  }).and(occupiedWOSelf);
  const onlyBlockers = blockers.and(attack);
  const attacksBehindBlockers = bishopAttacks({
    fromBitIndex: square,
    occupiedBits: occupied.xor(onlyBlockers),
  }).and(occupiedWOSelf);
  return attack.xor(attacksBehindBlockers);
}
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
