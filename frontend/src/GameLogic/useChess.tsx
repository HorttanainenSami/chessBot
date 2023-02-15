import React, { useState, useEffect } from 'react';
import Long from 'long';
import { bitPieces, SquareBit, logger, isNumeric, checkBitAt } from './helpers';
import { Square, Move, Color } from '../Types';
import useChessApi from './useChessApi';

export interface IMoves {
  square: Square;
  piece: bitPieces;
  color: Color;
}
const useChess = () => {
  // save gamestate as bitboard
  const [checked, setChecked] = useState(false);
  const [mate, setMate] = useState(false);
  const [turn, setTurn] = useState<Color>('w');
  const [fen, setFen] = useState<string>(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  );

  const [nextBMoves, setBNextMoves] = useState<Long[]>(
    Array(64).fill(Long.UZERO)
  );
  const [nextWMoves, setWNextMoves] = useState<Long[]>(
    Array(64).fill(Long.UZERO)
  );
  const { getMovesW, getMovesB, getState, loadFEN, getFEN, makeMove } =
    useChessApi();

  const loadFen = async (fen: string) => {
    const { gameState, checked, mate, turn } = await loadFEN(fen);
    updateState();
  };

  useEffect(() => {
    updateState();
  }, []);

  // returns all valid moves in Move[]
  // optional parameter /square/: Only return moves of given piece
  const moves = (p: IMoves | null) => {
    if (p === null) {
      return;
    }

    const fromBitIndex: number = SquareBit[p.square];
    const legalMoves =
      p.color === 'w' ? nextWMoves[fromBitIndex] : nextBMoves[fromBitIndex];
    //turn table for squareNotation array
    if (legalMoves) {
      const algebricNotation = getBitIndexes(legalMoves);
      return algebricNotation;
    }
    return null;
  };
  async function updateState() {
    const p1 = await getState();
    const p2 = await getMovesB();
    const p3 = await getMovesW();
    const p4 = await getFEN();
    const [s, b, w, fen] = await Promise.all([p1, p2, p3, p4]);
    const { gameState, mate, checked, turn } = s;
    setBNextMoves(b);
    setWNextMoves(w);
    setChecked(checked);
    setMate(mate);
    setTurn(turn);
    setFen(fen.data);
  }
  const saveMoveInServer = async (props: Move) => {
    makeMove(props).finally(() => updateState());
  };
  // Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
  const MakeMove = (props: Move) => {
    const fromBitIndex = SquareBit[props.from];
    const toBitIndex = SquareBit[props.to];
    const color = props.color;
    if (color === 'w') {
      const legalMoves = nextWMoves[fromBitIndex];
      if (!legalMoves) return false;
      if (!legalMoves.and(Long.UONE.shl(toBitIndex)).isZero()) {
        saveMoveInServer(props);
        return true;
      }
    } else {
      const legalMoves = nextBMoves[fromBitIndex];
      if (!legalMoves) return false;
      if (!legalMoves.and(Long.UONE.shl(toBitIndex)).isZero()) {
        saveMoveInServer(props);
        return true;
      }
    }
    return false;
  };
  // returns true if move is legal to perform
  // checked only when makeMove is performed

  const clearBoard = () =>
    loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  //returns FEN notation of gamestate. Useful for testing

  return {
    makeMove: MakeMove,
    loadFEN: loadFen,
    clearBoard,
    getFen: fen,
    moves,
    isMate: mate,
    isCheck: checked,
    turn,
  };
};
const getBitIndexes = (bitString: Long) => {
  let algebricNotation: string[] = [];
  const bit = bitString.toString(2);
  console.log(bitString.countTrailingZeros(), 'bitstring');
  for (let i = bit.length - bitString.countTrailingZeros(); i >= 0; i--) {
    const hexAtI = bit.charAt(i);
    switch (hexAtI) {
      case '1': {
        algebricNotation = [
          ...algebricNotation,
          SquareBit[bit.length - i - 1] as string,
        ];
        break;
      }
    }
  }

  return algebricNotation;
};
export default useChess;
