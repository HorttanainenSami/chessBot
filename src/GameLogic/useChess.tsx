import { useState } from 'react';
import Long from 'long';
import { bitPieces, SquareBit, logger, isNumeric, checkBitAt, blockingPiece } from './helpers';
import { Move } from '../Types';

const HFileSet = new Long(0x1010101, 0x1010101, true);
const Rank1Set = new Long(0xFF,0, true);
const Rank8Set = new Long(0, 0xFF000000, true);
export const allBitsSet = new Long(0xFFFFFFFF, 0xFFFFFFFF, true);
/*
pieces represented in 64 bit, 1 = piece, 0 = not piece 
*/
const startState: Long[] = [
  //pawns
  new Long(0x0000F000, 0x00000000, true),//w
  new Long(0x0, 0x00FF0000, true),//b
  //rooks
  new Long(0x81, 0x0, true),//w
  new Long(0x0, 0x81000000, true),//b and so on...
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
const useChess = () => {
  // save gamestate as bitboard
  const [ gameState, setGameState ] = useState<Long[]>(startState);
  const [ turn, setTurn ] = useState<'w'|'b'>('w');
  //checks if castling is possible '' means not possible
  const [ castling, setCastling ] = useState('KQkq');
  const [ elPassant, setElPassant ] = useState<string>('-');
  const [ halfMove, setHalfMove ] = useState(0);
  const [ fullMove, setFullMove ] = useState(1);

  // returns all valid moves in Move[] 
  // optional parameter /square/: Only return moves of given piece
  const moves = () => {
    return {};
  };
  // Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
  const makeMove = (move: Move) => {
    console.log(move); 
    //returns true if legal false if illegal 
    console.log(validateMove(move));


    return {};
  };
  // returns true if move is legal to perform
  const validateMove = ({ from, to, piece, promotion, color }: Move) => {
    const frombitIndex = SquareBit[from];
    const toBitIndex = SquareBit[to];
    const oneBit = new Long(1,0,true);
    const occupiedBits = gameState.reduce((acc, curr) => acc.or(curr), new Long(0x0,0x0, true));
    const blackOccupiedBits = gameState.reduce((acc, curr,i) => {
      if(i%2===0) return acc;
      return acc.or(curr);
    }, new Long(0,0,true));
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const emptySquares = occupiedBits.xor(allBitsSet);
    console.log(bitPieces[piece]);
    switch(piece){
    case 0:{
      const moveWPawnMask = new Long(0x101, 0, true).shiftLeft(frombitIndex+8);
      //add also attacks
      const possibleMoves = emptySquares.and(moveWPawnMask);
      //check if /to/ is within possibleMoves
      const moveMask = possibleMoves.and(oneBit.shiftLeft(toBitIndex));
      return checkBitAt(moveMask,toBitIndex);
    }
    case 1:{
      const moveBPawnMask = new Long(0x101, 0x0,true).shiftLeft(frombitIndex-16);
      //add also attacks
      const possibleMoves = emptySquares.and(moveBPawnMask);
      //check if /to/ is within possibleMoves
      const moveMask = possibleMoves.and(oneBit.shiftLeft(toBitIndex));
      return checkBitAt(moveMask,toBitIndex);
    }
    //rooks
    case 2:{
      console.log('case2');
      const fileNumber = frombitIndex%8;
      const rankNumber = ~~(frombitIndex/8);
      const northMoveMask = HFileSet.shiftLeft(frombitIndex+8);
      const southMoveMask = HFileSet.shiftRightUnsigned(64-frombitIndex);
      const eastMoveMask = Rank8Set.shiftLeft(fileNumber+1).shiftRightUnsigned(8*(7-rankNumber));
      const westMoveMask = Rank1Set.shiftRightUnsigned(8-fileNumber).shiftLeft(rankNumber*8);
      const fileMask = HFileSet.shiftLeft(fileNumber);
      const rankMask = Rank1Set.shiftLeft(rankNumber*8);
      const rookMoveMask = fileMask.or(rankMask);

      const pseudoAttacks = rookMoveMask.and(blackOccupiedBits);
      const pseudoMoves = blockingPiece(pseudoAttacks, northMoveMask).or(blockingPiece(pseudoAttacks,westMoveMask)).or(blockingPiece(pseudoAttacks,southMoveMask,true)).or(blockingPiece(pseudoAttacks,eastMoveMask));
      const legalMoves = pseudoMoves.and(allBitsSet.xor(whiteOccupiedBits));
      //remove white pieces

      return false;
    }
    case 3:{
      console.log('case3');
      ////////////////////////////////////////////////////////////
      //move all these masks to globals if can be used more than once
      //////////////////////////////////////////////////////////
      const fileNumber = frombitIndex%8;
      const rankNumber = ~~(frombitIndex/8);
      const northMoveMask = HFileSet.shiftLeft(frombitIndex+8);
      const southMoveMask = HFileSet.shiftRightUnsigned(64-frombitIndex);
      const eastMoveMask = Rank8Set.shiftLeft(fileNumber+1).shiftRightUnsigned(8*(7-rankNumber));
      const westMoveMask = Rank1Set.shiftRightUnsigned(8-fileNumber).shiftLeft(rankNumber*8);
      const fileMask = HFileSet.shiftLeft(fileNumber);
      const rankMask = Rank1Set.shiftLeft(rankNumber*8);
      const rookMoveMask = fileMask.or(rankMask);

      const pseudoAttacks = rookMoveMask.and(blackOccupiedBits);
      const pseudoMoves = blockingPiece(pseudoAttacks, northMoveMask).or(blockingPiece(pseudoAttacks,westMoveMask)).or(blockingPiece(pseudoAttacks,southMoveMask,true)).or(blockingPiece(pseudoAttacks,eastMoveMask));
      const legalMoves = pseudoMoves.and(allBitsSet.xor(whiteOccupiedBits));

      return false;
    }
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    }
  
    return {};
  };
  const loadFEN = (Fen: string) => {
    const splittedFen = Fen.split(' ');
    if(splittedFen.length !=6) throw new Error('Fen not in correct form');

    const fstate = splittedFen[0] as string;
    const fturn = splittedFen[1] as 'w'|'b';
    const fcastling = splittedFen[2] as string;
    const fElPassant = splittedFen[3] as string;
    const fhalfMoves = splittedFen[4] as string;
    const ffullMoves = splittedFen[5] as string;

    if(!isNumeric(ffullMoves)) throw new Error('Fen fullMoves notated incorrectly');
    if(!isNumeric(fhalfMoves)) throw new Error('Fen halfMoves notated incorrectly');

    //iterate fen
    type PieceIteration = {
      piece: string,
      bitIndex: number,
    }
    type emptyIteration = {
      zeros: number,
      bitIndex: number
    }
    const newGame = Array(12).fill(new Long(0,0,true));
    const iterator = (prop: PieceIteration|emptyIteration) => {
      //add either 1 or multiple 0's
      if('zeros' in prop){return; }

      const { piece, bitIndex } = prop;
      const bitOperator =  new Long(1, 0x0, true).shiftLeft(bitIndex);
      switch(piece){
      case 'P':
        //0
        newGame[0] = newGame[0].or(bitOperator);
        break;
      case 'p':
        //1
        newGame[1] = newGame[1].or(bitOperator);
        break;
      case 'R':
        //2
        newGame[2] = newGame[2].or(bitOperator);
        break;
      case 'r':
        //3
        newGame[3] = newGame[3].or(bitOperator);
        break;
      case 'B':
        //4
        newGame[4] = newGame[4].or(bitOperator);
        break;
      case 'b':
        //5
        newGame[5] = newGame[5].or(bitOperator);
        break;
      case 'N':
        //6
        newGame[6] = newGame[6].or(bitOperator);
        break;
      case 'n':
        //7
        newGame[7] = newGame[7].or(bitOperator);
        break;
      case 'Q':
        //8
        newGame[8] = newGame[8].or(bitOperator);
        break;
      case 'q':
        //9
        newGame[9] = newGame[9].or(bitOperator);
        break;
      case 'K':
        //10
        newGame[10] = newGame[10].or(bitOperator);
        break;
      case 'k':
        //11
        newGame[11] = newGame[11].or(bitOperator);
        break;
      }
    };
    let i = 63;
    for( let c of fstate) {
      if(c === '/'){
        console.log(i, '/');
        continue;
      }
      if(isNumeric(c)){
        iterator({ zeros: Number(c), bitIndex: i }); 
        i-=Number(c);
        continue;
      }else {
        iterator({ piece: c, bitIndex: i }); 
      }
      i--;
    }
    setTurn(turn);
    setGameState(newGame);
    setHalfMove(Number(fhalfMoves));
    setFullMove(Number(ffullMoves));
    setElPassant(fElPassant);
    setCastling(fcastling);
    

    return newGame;
  };

  const clearBoard = () => setGameState( new Array(12).fill(new Long(0x0,0x0, true)));

  //returns FEN notation of gamestate. Useful for testing
  const getFEN = () => {
    let Fen = '';
    const pieceBitboard = gameState.reduce((acc, curr) => acc.or(curr), new Long(0x0,0x0, true)); 

    for(let idx = 8; idx > 0; idx--){
      let empty=0;
      for(let i = 7; i >= 0; i--) {
        const bitIndex = idx*8-(8-i);
        if(!checkBitAt(pieceBitboard, bitIndex)){
          empty++;
          continue;
        }

        //should check what bitboard contains 1 bit at bitIndex and add it to FEN string
        if(empty !== 0){
          Fen = Fen.concat(empty.toString());
          empty=0;
        }
        for(let x = 0; x < gameState.length; x++){
          const bitBoard = gameState[x] as Long;
          if(!checkBitAt(bitBoard, bitIndex)){
            continue;
          }
          const piece = bitPieces[x];
          if(!piece) throw new Error(`piece ${x} not found`);
          Fen = Fen.concat(piece);
          break;
        }
      }
     
      if(empty !== 0){
        Fen = Fen.concat(empty.toString());
      }

      if(idx === 1 ){
        break; 
      }
      Fen = Fen.concat('/');
    }
    return Fen.concat(` ${turn} ${castling} ${elPassant} ${halfMove} ${fullMove}`);
  };

  return { loadFEN, clearBoard, getFEN, moves, gameState, makeMove};
};
export default useChess;
