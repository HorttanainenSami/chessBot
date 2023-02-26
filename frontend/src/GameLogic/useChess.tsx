import React, { useState, useEffect } from 'react';
import Long from 'long';
import { bitPieces, SquareBit, logger, isNumeric, checkBitAt } from './helpers';
import { Square, Move, Color } from '../Types';
import useChessApi, { getMovesReturn } from './useChessApi';

export interface IMoves {
  square: Square;
  piece: bitPieces;
  color: Color;
}
export type botSide = Color | 'both' | null;
const useChess = () => {
  // save gamestate as bitboard
  const [checked, setChecked] = useState(false);
  const [mate, setMate] = useState(false);
  const [draw, setDraw] = useState(false);
  const [stalemate, setStalemate] = useState(false);
  const [turn, setTurn] = useState<Color>('w');
  const [fen, setFen] = useState<string>(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  );
  let botSide: botSide = 'both';

  const [nextBMoves, setBNextMoves] = useState<getMovesReturn>(new Map());
  const [nextWMoves, setWNextMoves] = useState<getMovesReturn>(new Map());
  const {
    getMovesW,
    getMovesB,
    getState,
    loadFEN,
    getFEN,
    makeMove,
    getBotMove,
  } = useChessApi();
  useEffect(() => {
    if (botSide === 'both' || botSide === turn) {
      getBotMoves();
    }
  }, [fen]);
  const loadFen = (fen: string) => {
    loadFEN(fen).then(() => updateState());
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
    console.log(nextWMoves.get(fromBitIndex), 'nextmoves');

    const legalMoves =
      p.color === 'w'
        ? nextWMoves.get(fromBitIndex)
        : nextBMoves.get(fromBitIndex);
    //turn table for squareNotation array
    if (legalMoves) {
      const algebricNotation = getBitIndexes(legalMoves.moves);
      return algebricNotation;
    }
    return null;
  };
  const getNextMove = async () => {
    getBotMove({ color: turn });
  };
  const getBotMoves = async () => {
    console.log('getBotMoves');
    getBotMove({ color: turn })
      .then(() => {
        if (botSide === 'both') {
          updateBotMatch();
        } else {
          updateState();
        }
      })
      .catch((e) => console.log(e));
  };
  async function updateBotMatch() {
    const p1 = await getState();
    const p4 = await getFEN();
    const [s, fen] = await Promise.all([p1, p4]);
    const { gameState, mate, check, turn } = s;
    setChecked(check);
    setMate(mate);
    setTurn(turn);
    setFen(fen);
  }
  async function updateState() {
    const p1 = await getState();
    const p2 = await getMovesB();
    const p3 = await getMovesW();
    const p4 = await getFEN();
    const [s, b, w, fen] = await Promise.all([p1, p2, p3, p4]);
    const { draw, gameState, mate, check, turn, stalemate } = s;
    setBNextMoves(b);
    setWNextMoves(w);
    setChecked(check);
    setMate(mate);
    setTurn(turn);
    setFen(fen);
    setStalemate(stalemate);
    setDraw(draw);
  }
  const saveMoveInServer = async (props: Move) => {
    makeMove(props)
      .catch((e) => console.log('error', e))
      .finally(() => updateState());
  };
  // Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
  const MakeMove = (props: Move) => {
    const fromBitIndex = SquareBit[props.from];
    const toBitIndex = SquareBit[props.to];
    const color = props.color;
    if (color === 'w') {
      const legalMoves = nextWMoves.get(fromBitIndex);
      if (!legalMoves) return false;
      if (!legalMoves.moves.and(Long.UONE.shl(toBitIndex)).isZero()) {
        saveMoveInServer(props);
        return true;
      }
    } else {
      const legalMoves = nextBMoves.get(fromBitIndex);
      if (!legalMoves) return false;
      if (!legalMoves.moves.and(Long.UONE.shl(toBitIndex)).isZero()) {
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
    getBotMoves,
    makeMove: MakeMove,
    loadFEN: loadFen,
    clearBoard,
    getFen: fen,
    moves,
    isMate: mate,
    isCheck: checked,
    isDraw: draw,
    turn,
    isStaleMate: stalemate,
    getNextMove,
  };
};
export const getBitIndexes = (bitString: Long) => {
  let algebricNotation: string[] = [];
  const bit = bitString.toString(2);
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
