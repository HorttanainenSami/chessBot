import Long from 'long';
import moveMasks, {
  inBetween,
  obstructed,
  initializePreCalculatedMoves,
} from '../preCalculatedMoveMasks';
import { Color } from '../Types';
import { SquareBit, logger } from './helpers';

const HFileSet = new Long(0x1010101, 0x1010101, true);
const AFileSet = new Long(0x80808080, 0x80808080, true);
let gameState: Long[] = [
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
function reset() {
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
// save gamestate as bitboard
initializePreCalculatedMoves();

//return all possible moves that king can do in empty board from current square
const kingPseudoMoves = ({ fromBitIndex }: { fromBitIndex: number }) => {
  // add castling
  return moveMasks.getKingMoves(fromBitIndex);
};
const kingLegalMoves = ({
  fromBitIndex,
  occupiedBits,
  color,
  teammateOccupied,
}: {
  fromBitIndex: number;
  occupiedBits: Long;
  enemyOccupied: Long;
  color: Color;
  teammateOccupied: Long;
}) => {
  //filter attacked squares
  const pseudoMoves = kingPseudoMoves({ fromBitIndex });
  const legalMoves = pseudoMoves.and(teammateOccupied.not());
  const notAttackedSquares = kingMoveMaskThatIsNotAttacked(
    legalMoves,
    occupiedBits.xor(Long.UONE.shl(fromBitIndex)),
    color
  );
  return notAttackedSquares;
};
//returns Long of all attacked
function kingMoveMaskThatIsNotAttacked(
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
const calculatePinned = (color: Color) => {
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
const knightPseudoMoves = ({ fromBitIndex }: { fromBitIndex: number }) => {
  // make movemasks for knight moves
  if (doubleChecked) return Long.UZERO;
  if (!Long.UONE.shiftLeft(fromBitIndex).and(pinned).isZero()) {
    return Long.UZERO;
  }
  const legalMoves = moveMasks.getKnightMoves(fromBitIndex);
  return checked ? legalMoves.and(checkingRays) : legalMoves;
};
//returns bishops all current legal moves
//legal moves includes moves that contain enemy piece to attack and move to empty square
const bishopLegalMoves = ({
  teammateOccupiedBits,
  fromBitIndex,
  occupiedBits,
  color,
}: IbishopLegalMoves) => {
  if (doubleChecked) return Long.UZERO;
  const piecePosition = Long.UONE.shiftLeft(fromBitIndex);
  if (!piecePosition.and(pinned).isZero()) {
    //determine if absolutely pinned
    //check where king is and pinner is opposite
    //check with rook mask,
    const colorHelper = color === 'w' ? 1 : 0;
    const kingPosition = gameState[11 - colorHelper] as Long;
    const rookMask = moveMasks.getRookMoves(kingPosition.countTrailingZeros());
    //if rook is attacking, bishop cannot move
    if (!piecePosition.and(rookMask).isZero()) {
      return Long.UZERO;
    }
    //check in what direction pinner is
    return getBishopPinnerDirection(
      fromBitIndex,
      kingPosition.countTrailingZeros(),
      piecePosition,
      occupiedBits
    );
  }
  const pseudoAttacks = bishopAttacks({ fromBitIndex, occupiedBits });
  //filter teammates from possible attack
  //prettier-ignore
  return checked
    ? pseudoAttacks
        .and(teammateOccupiedBits.xor(Long.UONE.shl(fromBitIndex)).not())
        .and(checkingRays)
    : pseudoAttacks.and(
        teammateOccupiedBits.xor(Long.UONE.shl(fromBitIndex)).not()
      );
};
function bishopAttacks({
  fromBitIndex,
  occupiedBits,
}: Omit<IbishopLegalMoves, 'color' | 'teammateOccupiedBits'>) {
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
  color: Color;
}

//returns all moves that rook can make, like attacks and moves to empty squares
const rookLegalMoves = ({
  fromBitIndex,
  occupiedBits,
  teammateOccupiedBits,
  color,
}: IRookLegalMoves) => {
  if (doubleChecked) return Long.UZERO;
  const piecePosition = Long.UONE.shiftLeft(fromBitIndex);
  if (!piecePosition.and(pinned).isZero()) {
    //determine if absolutely pinned
    //check where king is and pinner is opposite
    //check with rook mask,
    const colorHelper = color === 'w' ? 1 : 0;
    const kingPosition = gameState[11 - colorHelper] as Long;
    const rookMask = moveMasks.getBishopMoves(
      kingPosition.countTrailingZeros()
    );
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
    );
  }

  const legalAttacks = rookLegalAttacks({
    fromBitIndex,
    occupiedBits,
  });
  const legalMoves = legalAttacks
    .and(Long.MAX_UNSIGNED_VALUE.xor(teammateOccupiedBits))
    .and(Long.UONE.shl(fromBitIndex).not());
  return checked ? legalMoves.and(checkingRays) : legalMoves;
};

function rookLegalAttacks({
  fromBitIndex,
  occupiedBits,
}: Omit<IRookLegalMoves, 'color' | 'teammateOccupiedBits'>) {
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
}
const pawnLegalMoves = ({
  fromBitIndex,
  color,
  enemyOccupied,
  occupiedSquares,
}: IPawnLegalMoves) => {
  if (doubleChecked) return Long.UZERO;
  if (!Long.UONE.shiftLeft(fromBitIndex).and(pinned).isZero()) {
    const colorHelper = color === 'w' ? 1 : 0;
    const kingPosition = gameState[11 - colorHelper] as Long;
    return getPawnPinnerDirection(
      fromBitIndex,
      kingPosition.countTrailingZeros(),
      Long.UONE.shiftLeft(fromBitIndex),
      occupiedSquares,
      color,
      enemyOccupied
    );
  }
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
  });

  const legalMoves = pseudoMovesBlockerRemoved.or(legalAttacks);
  return checked ? legalMoves.and(checkingRays) : legalMoves;
};
interface IpawnLegalAttacks {
  fromBitIndex: number;
  enemyOccupied: Long;
  color: Color;
}
const pawnLegalAttacks = ({
  fromBitIndex,
  enemyOccupied,
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
  const pseudoAttacks = pawnPseudoAttacks({ fromBitIndex, color });
  return pseudoAttacks.and(includingElPassant.or(enemyOccupied));
};
function isMate() {}
function isCheck() {
  const blackOccupiedBits = gameState.reduce(
    (acc, curr, i) => (i % 2 === 0 ? acc : acc.or(curr)),
    Long.UZERO
  );
  const occupiedBits = gameState.reduce(
    (acc, curr) => acc.or(curr),
    Long.UZERO
  );
  const teammateOccupiedBits =
    turn === 'b' ? blackOccupiedBits : occupiedBits.xor(blackOccupiedBits);

  const kingPosition =
    turn === 'b' ? (gameState[11] as Long) : (gameState[10] as Long);

  const fromBitIndex = kingPosition.countTrailingZeros();
  if (fromBitIndex === 64) return;
  const kingSquareIsAttacked = squareIsAttacked({
    occupiedBits,
    fromBitIndex,
    friendlyColor: turn,
  });
  if (kingSquareIsAttacked) {
    checked = true;
    const { rays, numOfChecks } = kingIsAttackedFrom({
      occupiedBits,
      fromBitIndex,
      teammateOccupiedBits,
      color: turn,
    });
    checkingRays = rays;
    console.log('numOfChecks', numOfChecks);

    if (numOfChecks > 1) {
      console.log('doubleChecked ', numOfChecks);

      doubleChecked = true;
      const filteredkMoves = kingLegalMoves({
        fromBitIndex,
        occupiedBits,
        enemyOccupied: occupiedBits.xor(teammateOccupiedBits),
        teammateOccupied: teammateOccupiedBits,
        color: turn,
      }).and(rays.not());

      if (filteredkMoves.isZero()) {
        mate = true;
      }
    } else {
      doubleChecked = false;
    }
  } else {
    checked = false;
    checkingRays = Long.UZERO;
    doubleChecked = false;
  }
}
const setFEN = (
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
  changeGameState(state, color);
};
const changeGameState = (state: Long[], toColor?: Color) => {
  //if color is given as parameter or get next players color
  gameState = state;
  const color = toColor ? toColor : turn === 'w' ? 'b' : 'w';
  turn = color;
  calculatePinned(color);
  isCheck();
};
interface IbishopLegalMoves {
  occupiedBits: Long;
  fromBitIndex: number;
  teammateOccupiedBits: Long;
  color: Color;
}

// can be used for checking if king is attacked
const kingIsAttackedFrom = ({
  occupiedBits,
  fromBitIndex,
  color,
  teammateOccupiedBits,
}: {
  occupiedBits: Long;
  fromBitIndex: number;
  teammateOccupiedBits: Long;
  color: Color;
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
  const knightAttacks = moveMasks.getKnightMoves(fromBitIndex).and(knights);
  if (!knightAttacks.isZero()) {
    const attackingKnightPosition = knights.and(knightAttacks);
    checkRays = checkRays.or(attackingKnightPosition);
    numOfChecks = numOfChecks + 1;
  }
  const rays = getCheckingPiecesRays(checkRays, fromBitIndex);
  return { rays, numOfChecks };
};
const getCheckingPiecesRays = (checksBB: Long, kingSquare: number) => {
  let rays = Long.UZERO;
  let allCheckers = checksBB;
  while (!allCheckers.isZero()) {
    const attackerSq = allCheckers.countTrailingZeros();
    if (attackerSq === 64) continue;
    const ray = inBetween(kingSquare, attackerSq) as Long;
    if (!ray) {
      allCheckers = allCheckers.xor(Long.UONE.shl(attackerSq));
      continue;
    }
    rays = rays.or(ray);
    allCheckers = allCheckers.xor(Long.UONE.shl(attackerSq));
  }
  return rays.xor(Long.UONE.shl(kingSquare));
};
//occupiedBits: BB of all pieces in board
//fromBitIndex: index of square that is checked if its attacked by enemy pieces
//firendlyColor: color from what perspective square is examined
//teammateOccupiedBits: BB of all teammate bits in board
//return:
//    true if enemypawns attack intercepts with square,
//    false if not/or enemypawn is in square but is not defended by enemy pawn
const squareIsAttacked = ({
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
  if (!moveMasks.getKnightMoves(fromBitIndex).and(eKnights).isZero()) {
    return true;
  }
  const eKings = gameState[11 - enemyColorHelper] as Long;
  //check if kingAttack from examined square contains enemy King
  if (!moveMasks.getKingMoves(fromBitIndex).and(eKings).isZero()) {
    return true;
  }
  //return false if square is not attacked by enemy pieces
  return false;
};

// from: from what square was was bitscan performed
// moveMask: from square movemask for one direction
// occupied: bitboard with information about occupied squares
// return: square index containing blocking piece
function bitScanForward(from: number, moveMask: Long, occupied: Long) {
  const moveMaskWithoutFromSquare = moveMask.and(
    Long.UONE.shiftLeft(from).not()
  );
  const blockedSquares = moveMaskWithoutFromSquare.and(occupied);
  const blockerIndex = blockedSquares.countTrailingZeros();
  if (blockerIndex === 64) return -1;
  return blockerIndex;
}
// from: from what square was was bitscan performed
// moveMask: from square movemask for one direction
// occupied: bitboard with information about occupied squares
// return: square index containing blocking piece
function bitScanBackwards(from: number, moveMask: Long, occupied: Long) {
  const moveMaskWithoutFromSquare = moveMask.and(
    Long.UONE.shiftLeft(from).not()
  );
  const blockedSquares = moveMaskWithoutFromSquare.and(occupied);
  const blockerIndex = 63 - blockedSquares.countLeadingZeros();
  if (blockerIndex === -1) return -1;
  return blockerIndex;
}
function removeBlockedMovesForward(
  from: number,
  moveMask: Long,
  occupied: Long,
  removeBlockers: boolean = false
) {
  const blockingPieceIndex = bitScanForward(from, moveMask, occupied);
  if (blockingPieceIndex === -1) return moveMask;
  const maskBetween = inBetween(from, blockingPieceIndex);
  if (maskBetween === null) return moveMask;

  return removeBlockers
    ? maskBetween.xor(Long.UONE.shl(blockingPieceIndex))
    : maskBetween;
}

function removeBlockedMovesBackwards(
  from: number,
  moveMask: Long,
  occupied: Long,
  removeBlockers: boolean = false
) {
  const blockingPieceIndex = bitScanBackwards(from, moveMask, occupied);
  if (blockingPieceIndex === -1) return moveMask;
  const maskBetween = inBetween(from, blockingPieceIndex);
  if (maskBetween === null) return moveMask;
  return removeBlockers
    ? maskBetween.xor(Long.UONE.shl(blockingPieceIndex))
    : maskBetween;
}
function xrayRookAttacks(occupied: Long, blockers: Long, square: number) {
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
function xrayBishopAttacks(occupied: Long, blockers: Long, square: number) {
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
function pinnedPieces(
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
    const obstructedBB = obstructed(kingSquare, pinnerSq, occupied);
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

    const obstructedBB = obstructed(kingSquare, pinnerSq, occupied);
    if (obstructed === null) break;
    const pieceBeingPinned = obstructedBB.and(teammateOccupiedBits);
    //check if piece is bishop or queen its partiallyPinned
    pinned = pinned.or(pieceBeingPinned);
    pinner = pinner.xor(Long.UONE.shiftLeft(pinnerSq));
  }
  return pinned;
}
function getBishopPinnerDirection(
  square: number,
  kingSq: number,
  bishopPosition: Long,
  occupied: Long
) {
  if (square > kingSq) {
    //NW
    if (!moveMasks.getNW(kingSq).and(bishopPosition).isZero()) {
      return removeBlockedMovesForward(
        square,
        moveMasks.getNW(square),
        occupied
      );
    }
    //NE
    if (!moveMasks.getNE(kingSq).and(bishopPosition).isZero()) {
      return removeBlockedMovesForward(
        square,
        moveMasks.getNE(square),
        occupied
      );
    }
  }
  //SW
  if (!moveMasks.getSW(kingSq).and(bishopPosition).isZero()) {
    return removeBlockedMovesForward(square, moveMasks.getSW(square), occupied);
  }
  //SE
  if (!moveMasks.getSE(kingSq).and(bishopPosition).isZero()) {
    return removeBlockedMovesForward(square, moveMasks.getSE(square), occupied);
  }
  return Long.UZERO;
}
function getRookPinnerDirection(
  square: number,
  kingSq: number,
  rookPosition: Long,
  occupied: Long
) {
  if (square > kingSq) {
    //N
    if (!moveMasks.getN(kingSq).and(rookPosition).isZero()) {
      return removeBlockedMovesForward(
        square,
        moveMasks.getN(square),
        occupied
      );
    }
    //W
    if (!moveMasks.getW(kingSq).and(rookPosition).isZero()) {
      return removeBlockedMovesForward(
        square,
        moveMasks.getW(square),
        occupied
      );
    }
  }
  //E
  if (!moveMasks.getE(kingSq).and(rookPosition).isZero()) {
    return removeBlockedMovesForward(square, moveMasks.getE(square), occupied);
  }
  //S
  if (!moveMasks.getS(kingSq).and(rookPosition).isZero()) {
    return removeBlockedMovesForward(square, moveMasks.getS(square), occupied);
  }
  return Long.UZERO;
}
function getPawnPinnerDirection(
  square: number,
  kingSq: number,
  pawnPosition: Long,
  occupied: Long,
  color: Color,
  enemyOccupied: Long
) {
  //N can move up if not blocked
  if (
    !moveMasks.getN(kingSq).and(pawnPosition).isZero() ||
    !moveMasks.getS(kingSq).and(pawnPosition).isZero()
  ) {
    const mask = pawnPseudoMoves({ fromBitIndex: square, color });
    if (color === 'w')
      return removeBlockedMovesForward(square, mask, occupied, true);

    return removeBlockedMovesBackwards(square, mask, occupied, true);
  }
  //NW
  if (color === 'w' && !moveMasks.getNW(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: square,
      enemyOccupied,
      color,
    }).and(moveMasks.getNW(kingSq));
  }
  //NE
  if (color === 'w' && !moveMasks.getNE(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: square,
      enemyOccupied,
      color,
    }).and(moveMasks.getNE(kingSq));
  }
  //SW
  if (color === 'b' && !moveMasks.getSW(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: square,
      enemyOccupied,
      color,
    }).and(moveMasks.getSW(kingSq));
  }
  //SE
  if (color === 'b' && !moveMasks.getSE(kingSq).and(pawnPosition).isZero()) {
    return pawnLegalAttacks({
      fromBitIndex: square,
      enemyOccupied,
      color,
    }).and(moveMasks.getSE(kingSq));
  }
  return Long.UZERO;
}
const setElpassant = (square: SquareBit | null) => (elPassant = square);
export {
  gameState,
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
  changeGameState,
  kingLegalMoves,
  xrayBishopAttacks,
  xrayRookAttacks,
  bitScanForward,
  bitScanBackwards,
  removeBlockedMovesBackwards,
  removeBlockedMovesForward,
  squareIsAttacked,
  kingMoveMaskThatIsNotAttacked,
  setElpassant,
  reset,
  setFEN,
};
