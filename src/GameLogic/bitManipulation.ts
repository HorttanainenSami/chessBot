import Long from 'long';
import { getinBetween } from './move';

/**
 *remove all set bits behind blocked square in movemask used only to W,N,NW directions
 * @param from {number} index of square where to start scanning
 * @param moveMask {Long} movemask to one direction (W , N, NW)
 * @param occupied {Long} bitboard of occupied squares
 * @param removeBlockers {boolean} default=false, remove also blocker
 * @returns returns subset of moveMask that contains only empty squares and blocker square
 */
export function removeBlockedMovesForward(
  from: number,
  moveMask: Long,
  occupied: Long,
  removeBlockers: boolean = false
) {
  const blockingPieceIndex = bitScanForward(from, moveMask, occupied);
  if (blockingPieceIndex === -1) return moveMask;
  const maskBetween = getinBetween(from, blockingPieceIndex);
  if (maskBetween === null) return moveMask;

  return removeBlockers
    ? maskBetween.and(Long.UONE.shl(blockingPieceIndex).not())
    : maskBetween;
}
/**
 *remove all set bits behind blocked square in movemask used only to E,S,SE directions
 * @param from {number} index of square where to start scanning
 * @param moveMask {Long} movemask to one direction (E , S, SE)
 * @param occupied {Long} bitboard of occupied squares
 * @param removeBlockers {boolean} default=false, remove also blocker
 * @returns returns subset of moveMask that contains only empty squares and blocker square
 */
export function removeBlockedMovesBackwards(
  from: number,
  moveMask: Long,
  occupied: Long,
  removeBlockers: boolean = false
) {
  const blockingPieceIndex = bitScanBackwards(from, moveMask, occupied);
  if (blockingPieceIndex === -1) return moveMask;
  const maskBetween = getinBetween(from, blockingPieceIndex);
  if (maskBetween === null) return moveMask;
  return removeBlockers
    ? maskBetween.and(Long.UONE.shl(blockingPieceIndex).not())
    : maskBetween;
}
/**
 * Scans given mask to (E and S) direction and return next square that contains occupied bit
 * @param from {number} square where bitscan is performed
 * @param moveMask {Long} mask that is wanted to scan
 * @param occupied {Long} bitboard with information about occupied squares
 * @returns {number} square index containing piece, excluding from square
 */
export function bitScanForward(from: number, moveMask: Long, occupied: Long) {
  const moveMaskWithoutFromSquare = moveMask.and(
    Long.UONE.shiftLeft(from).not()
  );
  const blockedSquares = moveMaskWithoutFromSquare.and(occupied);
  const blockerIndex = blockedSquares.countTrailingZeros();
  if (blockerIndex === 64) return -1;
  return blockerIndex;
}
/**
 * Scans given mask to (E and S) direction and return next square that contains occupied bit
 * @param from {number} square where bitscan is performed
 * @param moveMask {Long} mask that is wanted to scan
 * @param occupied {Long} bitboard with information about occupied squares
 * @returns {number} square index containing piece, excluding from square
 */
export function bitScanBackwards(from: number, moveMask: Long, occupied: Long) {
  const moveMaskWithoutFromSquare = moveMask.and(
    Long.UONE.shiftLeft(from).not()
  );
  const blockedSquares = moveMaskWithoutFromSquare.and(occupied);
  const blockerIndex = 63 - blockedSquares.countLeadingZeros();
  if (blockerIndex === -1) return -1;
  return blockerIndex;
}
