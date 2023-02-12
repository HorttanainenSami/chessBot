import React, { useEffect, useState } from 'react';
import Long from 'long';
import moveMasks, {
  inBetween,
  obstructed,
  initializePreCalculatedMoves,
} from './preCalculatedMoveMasks';
import { Color } from '../Types';

import { SquareBit, logger } from './helpers';
const HFileSet = new Long(0x1010101, 0x1010101, true);
const AFileSet = new Long(0x80808080, 0x80808080, true);
const startState: Long[] = [
  //pawns
  new Long(0x0000f000, 0x00000000, true), //w
  new Long(0x0, 0x00ff0000, true), //b
  //rooks
  new Long(0x81, 0x0, true), //w
  new Long(0x0, 0x81000000, true), //b and so on...
  //bishops
  new Long(0x24, 0x0, true),
  new Long(0x0, 0x24000000, true),
  //knights
  new Long(0x42, 0x0, true),
  new Long(0x0, 0x42000000, true),
  //queens
  new Long(0x10, 0x0, true),
  new Long(0x0, 0x10000000, true),
  //kings
  new Long(0x8, 0x0, true),
  new Long(0x0, 0x8000000, true),
];
const useMove = () => {
  // save gamestate as bitboard
  initializePreCalculatedMoves();
  const [gameState, setGameState] = useState<Long[]>(startState);
  const [elPassant, setElPassant] = useState<SquareBit | null>(null);
  const [pinned, setPinned] = useState<Long>(Long.UZERO);
  const [checked, setChecked] = useState(false);
  const [doubleChecked, setDoubleChecked] = useState(false);
  const [checkingRays, setCheckingRays] = useState(Long.UZERO);
  const [mate, setMate] = useState(false);

  //return all possible moves that king can do in empty board from current square
  const kingPseudoMoves = ({ fromBitIndex }: { fromBitIndex: number }) => {
    // add castling
    return moveMasks.getKingMoves(fromBitIndex);
  };
  const kingLegalMoves = ({
    fromBitIndex,
    occupiedBits,
    enemyOccupied,
  }: {
    fromBitIndex: number;
    occupiedBits: Long;
    enemyOccupied: Long;
  }) => {
    //filter attacked squares
    const pseudoMoves = checkingRays
      .not()
      .and(kingPseudoMoves({ fromBitIndex }));
    const legalMoves = pseudoMoves.and(occupiedBits.xor(enemyOccupied).not());
    return legalMoves;
  };
  useEffect(() => calculatePinned(gameState, 'w'), []);

  const calculatePinned = (state: Long[], color: Color) => {
    const blackOccupiedBits = state.reduce((acc, curr, i) => {
      if (i % 2 === 0) return acc;
      return acc.or(curr);
    }, new Long(0, 0, true));
    const occupiedBits = state.reduce(
      (acc, curr) => acc.or(curr),
      new Long(0x0, 0x0, true)
    );

    const teammateOccupiedBits =
      color === 'w' ? occupiedBits.xor(blackOccupiedBits) : blackOccupiedBits;
    const pinned = pinnedPieces(
      color,
      teammateOccupiedBits,
      occupiedBits,
      state
    );
    setPinned(pinned);
  };

  const knightPseudoMoves = ({ fromBitIndex }: { fromBitIndex: number }) => {
    // make movemasks for knight moves
    if (doubleChecked) return Long.UZERO;
    if (!Long.UONE.shiftLeft(fromBitIndex).and(pinned).isZero()) {
      return Long.UZERO;
    }
    const legalMoves = moveMasks.getKnightMoves(fromBitIndex);
    return checked ? legalMoves.and(checkingRays) : legalMoves;
  };
  function isCheck(state: Long[], color: Color) {
    const blackOccupiedBits = state.reduce(
      (acc, curr, i) => (i % 2 === 0 ? acc : acc.or(curr)),
      Long.UONE
    );
    const occupiedBits = state.reduce((acc, curr) => acc.or(curr), Long.UONE);
    const teammateOccupiedBits =
      color === 'b' ? blackOccupiedBits : occupiedBits.xor(blackOccupiedBits);
    const enemyOccupied =
      color === 'b' ? occupiedBits.xor(blackOccupiedBits) : blackOccupiedBits;
    const kingPosition =
      color === 'b' ? (state[11] as Long) : (state[10] as Long);
    const fromBitIndex = kingPosition.countTrailingZeros();
    if (
      squareIsAttacked({
        occupiedBits,
        fromBitIndex,
        teammateOccupiedBits,
        friendlyColor: color,
      })
    ) {
      setChecked(true);
      const { rays, numOfChecks } = kingIsAttackedFrom({
        occupiedBits,
        fromBitIndex,
        teammateOccupiedBits,
        color,
      });
      setCheckingRays(rays);
      if (numOfChecks > 1) {
        setDoubleChecked(true);
        const filteredkMoves = kingLegalMoves({
          fromBitIndex,
          occupiedBits,
          enemyOccupied: occupiedBits.xor(teammateOccupiedBits),
        }).and(rays.not());

        if (filteredkMoves.isZero()) {
          setMate(true);
        }
      } else {
        setDoubleChecked(false);
      }
    } else {
      setChecked(false);
      setCheckingRays(Long.UZERO);
      setDoubleChecked(false);
    }
  }
  const changeGameState = (state: Long[], turn: Color) => {
    setGameState(state);
    calculatePinned(state, turn);
    isCheck(state, turn);
  };
  interface IbishopLegalMoves {
    occupiedBits: Long;
    fromBitIndex: number;
    teammateOccupiedBits: Long;
    color: Color;
  }
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
      const rookMask = moveMasks.getRookMoves(
        kingPosition.countTrailingZeros()
      );
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
    return checked
      ? pseudoAttacks.and(teammateOccupiedBits.not()).and(checkingRays)
      : pseudoAttacks.and(teammateOccupiedBits.not());
  };
  const bishopAttacks = ({
    fromBitIndex,
    occupiedBits,
  }: Omit<IbishopLegalMoves, 'color' | 'teammateOccupiedBits'>) => {
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

    const pseudoAttacks = pNW.or(pNE).or(pSW).or(pSE).xor(Long.UONE.shl(fromBitIndex));
    return pseudoAttacks;
  };

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
      const legalMoves = getRookPinnerDirection(
        fromBitIndex,
        kingPosition.countTrailingZeros(),
        piecePosition,
        occupiedBits
      );
      return checked ? legalMoves.and(checkingRays) : legalMoves;
    }

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
  }: Omit<IRookLegalMoves, 'color' | 'teammateOccupiedBits'>) => {
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

    return NAttacks.or(WAttacks).or(EAttacks).or(SAttacks);
  };

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
    //if blocked prevent moving over piece if in start square
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
      numOfChecks += 1;
    }
    const rooks = gameState[3 - colorHelper] as Long;
    const queens = gameState[9 - colorHelper] as Long;
    const rooksQueens = queens.or(rooks);
    const rookAttacks = rookLegalMoves({
      color,
      occupiedBits,
      teammateOccupiedBits,
      fromBitIndex,
    }).and(rooksQueens);
    if (!rookAttacks.isZero()) {
      checkRays = checkRays.or(rookAttacks);
      numOfChecks += 1;
    }
    const bishops = gameState[5 - colorHelper] as Long;
    const bishopsQueens = queens.or(bishops);
    const params = {
      teammateOccupiedBits,
      fromBitIndex,
      occupiedBits,
      color,
    };
    const bishopAttacks = bishopLegalMoves(params).and(bishopsQueens);
    if (!bishopAttacks.isZero()) {
      checkRays = checkRays.or(bishopAttacks);
      numOfChecks += 1;
    }
    const knights = gameState[7 - colorHelper] as Long;
    const knightAttacks = moveMasks.getKnightMoves(fromBitIndex).and(knights);
    if (!knightAttacks.isZero()) {
      checkRays = checkRays.or(knightAttacks);
      numOfChecks += 1;
    }
    const rays = getCheckingPiecesRays(checkRays, fromBitIndex);
    return { rays, numOfChecks };
  };
  const getCheckingPiecesRays = (checksBB: Long, kingSquare: number) => {
    let rays = Long.UZERO;
    let allCheckers = checksBB;
    while (!allCheckers.isZero()) {
      const attackerSq = allCheckers.countTrailingZeros();
      const ray = inBetween(kingSquare, attackerSq) as Long;
      rays = rays.or(ray);
      allCheckers = allCheckers.xor(Long.UONE.shl(attackerSq));
    }
    return rays.xor(Long.UONE.shl(kingSquare));
  };

  // can be used for checking if king is attacked
  const squareIsAttacked = ({
    occupiedBits,
    fromBitIndex,
    friendlyColor,
    teammateOccupiedBits,
  }: {
    occupiedBits: Long;
    fromBitIndex: number;
    teammateOccupiedBits: Long;
    friendlyColor: Color;
  }) => {
    const enemyColorHelper = friendlyColor === 'w' ? 0 : 1;
    const ePawns = gameState[1 - enemyColorHelper] as Long;
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
    if (
      !rookLegalMoves({
        color: friendlyColor,
        occupiedBits,
        teammateOccupiedBits,
        fromBitIndex,
      })
        .and(eRooksQueens)
        .isZero()
    ) {
      return true;
    }
    const eBishops = gameState[5 - enemyColorHelper] as Long;
    const eBbishopsQueens = eQueens.or(eBishops);
    const params = {
      teammateOccupiedBits,
      fromBitIndex,
      occupiedBits,
      color: friendlyColor,
    };
    if (!bishopLegalMoves(params).and(eBbishopsQueens).isZero()) {
      return true;
    }
    const eKnights = gameState[7 - enemyColorHelper] as Long;
    if (!moveMasks.getKnightMoves(fromBitIndex).and(eKnights).isZero()) {
      return true;
    }
    const eKings = gameState[11 - enemyColorHelper] as Long;
    if (!moveMasks.getKingMoves(fromBitIndex).and(eKings).isZero()) {
      return true;
    }
    return false;
  };
  // from: from what square was was bitscan performed
  // moveMask: from square movemask for one direction
  // occupied: bitboard with information about occupied squares
  // return: square index containing blocking piece
  function bitScanForward(from: number, moveMask: Long, occupied: Long) {
    const moveMaskWithoutFromSquare = moveMask.and(Long.UONE.shiftLeft(from).not());
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
    const moveMaskWithoutFromSquare = moveMask.and(Long.UONE.shiftLeft(from).not());
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
    occupied: Long,
    state: Long[]
  ) {
    const colorHelper = color === 'w' ? 1 : 0;
    const enemyColor = color === 'w' ? 0 : 1;
    const kingPosition = state[11 - colorHelper] as Long;
    const kingSquare = kingPosition.countTrailingZeros();
    const eRook = state[3 - enemyColor] as Long;
    const eBishop = state[5 - enemyColor] as Long;
    const eQueen = state[9 - enemyColor] as Long;
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
      return removeBlockedMovesForward(
        square,
        moveMasks.getSW(square),
        occupied
      );
    }
    //SE
    if (!moveMasks.getSE(kingSq).and(bishopPosition).isZero()) {
      return removeBlockedMovesForward(
        square,
        moveMasks.getSE(square),
        occupied
      );
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
      return removeBlockedMovesForward(
        square,
        moveMasks.getE(square),
        occupied
      );
    }
    //S
    if (!moveMasks.getS(kingSq).and(rookPosition).isZero()) {
      return removeBlockedMovesForward(
        square,
        moveMasks.getS(square),
        occupied
      );
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
  return {
    gameState,
    setGameState,
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
    setElPassant,
    elPassant,
    pinned,
    checked,
    kingLegalMoves,
    mate,
    setMate,
    checkingRays,
    xrayBishopAttacks,
    xrayRookAttacks,
    bitScanForward,
    bitScanBackwards,
    removeBlockedMovesBackwards,
    removeBlockedMovesForward,
  };
};
export default useMove;
