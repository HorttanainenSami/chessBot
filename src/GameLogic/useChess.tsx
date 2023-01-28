import { useState } from 'react';
import Long from 'long';

export type Color = 'black' | 'white';
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Square =
    'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8' |
    'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
    'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
    'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
    'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
    'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
    'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
    'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';
// convert square to its pointing bitindex
export enum SquareBit {
  'h1', 'g1', 'f1', 'e1', 'd1', 'c1', 'b1', 'a1',
  'h2', 'g2', 'f2', 'e2', 'd2', 'c2', 'b2', 'a2',
  'h3', 'g3', 'f3', 'e3', 'd3', 'c3', 'b3', 'a3',
  'h4', 'g4', 'f4', 'e4', 'd4', 'c4', 'b4', 'a4',
  'h5', 'g5', 'f5', 'e5', 'd5', 'c5', 'b5', 'a5',
  'h6', 'g6', 'f6', 'e6', 'd6', 'c6', 'b6', 'a6',
  'h7', 'g7', 'f7', 'e7', 'd7', 'c7', 'b7', 'a7',
  'h8', 'g8', 'f8', 'e8', 'd8', 'c8', 'b8', 'a8',
}
export const allBitsSet = new Long(0xFFFFFFFF, 0xFFFFFFFF, true);
export enum bitPieces {
  'P',
  'p',
  'R',
  'r',
  'B',
  'b',
  'N',
  'n',
  'Q',
  'q',
  'K',
  'k',
}
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
interface Move {
  from: Square,
  to: Square,
  promotion: PieceSymbol,
  captured?: PieceSymbol,
  color: Color,
  piece: bitPieces
}
const useChess = () => {
  // save gamestate as bitboard
  const [ gameState, setGameState ] = useState<Long[]>(startState);
  const [ turn, setTurn ] = useState<'w'|'b'>('w');
  //checks if castling is possible '' means not possible
  const  [castling, setCastling] = useState('KQkq');
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
      console.log(frombitIndex);
      ////////////////////////////////////////////////////////////
      //move all these masks to globals if can be used more than once
      //////////////////////////////////////////////////////////
      const rookPosition = oneBit.shiftLeft(frombitIndex);
      const fileNumber = frombitIndex%8;
      const rankNumber = ~~(frombitIndex/8);
      //file
      const northMoveMask = new Long(0x1010101, 0x1010101, true).shiftLeft(frombitIndex+8);
      const southMoveMask = new Long(0x1010101, 0x1010101, true).shiftRightUnsigned(64-frombitIndex);
      //rank
      const eastMoveMask = new Long(0, 0xFF000000, true).shiftLeft(fileNumber+1).shiftRightUnsigned(8*(7-rankNumber));
      const westMoveMask = new Long(0xFF,0, true).shiftRightUnsigned(8-fileNumber).shiftLeft(rankNumber*8);
      const fileMask = new Long(0x1010101, 0x1010101, true).shiftLeft(fileNumber);
      const rankMask = new Long(0xFF, 0, true).shiftLeft(rankNumber*8);
      const rookMoveMask = fileMask.or(rankMask);

      //include only blocking pieces
      const attacks = rookMoveMask.and(blackOccupiedBits);
      logger(attacks);


      return false;
    }
    case 3:{
      console.log('case3');
      console.log(frombitIndex);
      const northMoveMask = new Long(1, 0, true).shiftLeft(frombitIndex+8);
      const northBitCount = ((frombitIndex)/8);
      console.log(logger(northMoveMask), northBitCount, ~~northBitCount);
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

  const getFEN = () => {
    let Fen = '';
    const pieceBitboard = gameState.reduce((acc, curr) => acc.or(curr), new Long(0x0,0x0, true)); 

    for(let idx = 8; idx > 0; idx--){
      let empty=0;
      //let str = `${idx}: `;
      for(let i = 7; i >= 0; i--) {
        //str = str.concat(' ');
        const bitIndex = idx*8-(8-i);
        //str = str.concat(bitIndex.toString());
        //str = str.concat(`(${idx*8-(8-i)})`);
        if(!checkBitAt(pieceBitboard, bitIndex)){
          empty++;
          continue;
        }

        //should check what bitboard contains 1 bit at bitIndex and add it to FEN string
        if(empty !== 0){
          Fen = Fen.concat(empty.toString());
          //str = str.concat(empty.toString());
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
          //str = str.concat(piece);
          break;
        }
      }
     
      if(empty !== 0){
        Fen = Fen.concat(empty.toString());
        //str = str.concat(empty.toString());
      }

      if(idx === 1 ){
        //console.log(str);
        break; 
      }
      Fen = Fen.concat('/');
      //console.log(str + '/');
      
    }
    return Fen.concat(` ${turn} ${castling} ${elPassant} ${halfMove} ${fullMove}`);
  };

  return { loadFEN, clearBoard, getFEN, moves, gameState, makeMove};
};
const logger = ( l : Long) => console.log(l.toString(2).padStart(64,'0').match(/.{1,8}/g)?.join('\n'));
function isNumeric(expectedValue:string) {
  if (typeof expectedValue === 'string' && !Number.isNaN(Number(expectedValue))) {
    return true;
  }
  return false;
}
function checkBitAt(long : Long, index: number){
  return long.shiftRight(index).and(1).toInt()===1;
}
export default useChess;
