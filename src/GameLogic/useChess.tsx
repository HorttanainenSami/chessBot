import { useState } from 'react';
import Long from 'long';
import { bitPieces, SquareBit, logger, isNumeric, checkBitAt, blockingPiece } from './helpers';
import { Square, Piece, Move, Color } from '../Types';

const HFileSet = new Long(0x1010101, 0x1010101, true);
const GFileSet = new Long(0x2020202, 0x2020202, true);
const GHFileMask = HFileSet.or(GFileSet);
const AFileSet = new Long(0x80808080, 0x80808080, true);
const BFileSet = new Long(0x40404040, 0x40404040, true);
const ABFileMask = AFileSet.or(BFileSet);
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
export interface IMoves {
  square: Square,
  piece: bitPieces,
  color: Color
}
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
  const moves = (p : IMoves|null) => {
    // determine if wanted all moves for color that is next in turn
    if(p===null){
      return;
    }
    //wanted specific piece
    const legalMoves = move(p); 
    //turn table for squareNotation array
    const algebricNotation = getBitIndexes(legalMoves);
    return algebricNotation;
    
  };
  const move = ({ square, piece, color } : IMoves):Long => {
    //return only one
    const fromBitIndex = SquareBit[square];
    const oneBit = new Long(1,0,true);
    const currentPiecePosition = oneBit.shiftLeft(fromBitIndex);
    const occupiedBits = gameState.reduce((acc, curr) => acc.or(curr), new Long(0x0,0x0, true));
    const blackOccupiedBits = gameState.reduce((acc, curr,i) => {
      if(i%2===0) return acc;
      return acc.or(curr);
    }, new Long(0,0,true));
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    const emptySquares = occupiedBits.xor(allBitsSet);
    switch(piece){

    case 0:{
      //elpassant
      return pawnLegalMoves({ fromBitIndex, enemyOccupied: blackOccupiedBits, emptySquares, color: 'w', occupiedBits });
    }
    case 1:{
      //elpassant
      return pawnLegalMoves({ fromBitIndex, enemyOccupied: whiteOccupiedBits, emptySquares, color: 'b', occupiedBits });
    }
    case 2:{
      return rookLegalMoves({ fromBitIndex, occupiedBits, teammateOccupiedBits: whiteOccupiedBits });
    }
    case 3:{
      return rookLegalMoves({ fromBitIndex, occupiedBits, teammateOccupiedBits: blackOccupiedBits });
    }
    case 4:{
      return bishopLegalMoves({fromBitIndex, occupiedBits, teammateOccupiedBits: whiteOccupiedBits});
    }
    case 5:{
      return bishopLegalMoves({fromBitIndex, occupiedBits, teammateOccupiedBits: blackOccupiedBits});
    }
    case 6:{
      const pseudoMoves = knightPseudoMoves({knightPosition: currentPiecePosition });
      const legalMoves = pseudoMoves.and(whiteOccupiedBits.not());
      return legalMoves;
    }
    case 7:{
      const pseudoMoves = knightPseudoMoves({knightPosition: currentPiecePosition });
      const legalMoves = pseudoMoves.and(blackOccupiedBits.not());
      return legalMoves;
    }
    case 8:{
      const diagonalMoves = bishopLegalMoves({fromBitIndex, occupiedBits, teammateOccupiedBits:whiteOccupiedBits});
      const fileAndRankMoves = rookLegalMoves({fromBitIndex, occupiedBits, teammateOccupiedBits:whiteOccupiedBits});
      return diagonalMoves.or(fileAndRankMoves);
    }
    case 9:{
      const diagonalMoves = bishopLegalMoves({fromBitIndex, occupiedBits, teammateOccupiedBits:blackOccupiedBits});
      const fileAndRankMoves = rookLegalMoves({fromBitIndex, occupiedBits, teammateOccupiedBits:blackOccupiedBits});
      return diagonalMoves.or(fileAndRankMoves);
    }
    case 10:{
      const pseudoMoves =  kingPseudoMoves({kingPosition: currentPiecePosition});
      // add here also defended squares filter
      return pseudoMoves.and(whiteOccupiedBits.not());
    }
    case 11:{
      const pseudoMoves =  kingPseudoMoves({kingPosition: currentPiecePosition});
      // add here also defended squares filter
      return pseudoMoves.and(blackOccupiedBits.not());
    }
    default: return new Long(0,0,true);
    }

  };
  // Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
  const makeMove = (move: Move) => {
    console.log(move); 
    //returns true if legal false if illegal 
    console.log(validateMove(move));


    return {};
  };
  // returns true if move is legal to perform
  // checked only when makeMove is performed
  const validateMove = ({ from, to, piece, promotion, color }: Move) => {
    const fromBitIndex = SquareBit[from];
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
      const legalMoves = pawnLegalMoves({ fromBitIndex, enemyOccupied: blackOccupiedBits, emptySquares, color: 'w', occupiedBits });
      const moveMask = legalMoves.and(oneBit.shiftLeft(toBitIndex));
      return checkBitAt(moveMask,toBitIndex);
    }
    case 1:{
      const legalMoves = pawnLegalMoves({ fromBitIndex, enemyOccupied: whiteOccupiedBits, emptySquares, color: 'b', occupiedBits });
      const moveMask = legalMoves.and(oneBit.shiftLeft(toBitIndex));
      return checkBitAt(moveMask, toBitIndex);
    }
    //rooks
    case 2:{
      rookLegalMoves({ fromBitIndex, occupiedBits, teammateOccupiedBits: whiteOccupiedBits });
      return false;
    }
    case 3:{
      rookLegalMoves({ fromBitIndex, occupiedBits, teammateOccupiedBits: blackOccupiedBits });
      return false;
    }
    case 4:{
      rookLegalMoves({ fromBitIndex, occupiedBits, teammateOccupiedBits: whiteOccupiedBits });
      return false;
    }
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
interface IPawnLegalMoves {
  fromBitIndex: number,
  emptySquares: Long,
  enemyOccupied: Long,
  occupiedBits: Long,
  color: Color,
}
const pawnLegalMoves = ({fromBitIndex, enemyOccupied, emptySquares, color, occupiedBits}: IPawnLegalMoves) => {
  //if white in 2 rank and black in 7 rank move 2 forward possible
  const rankNumber = ~~(fromBitIndex/8);
  let movePawnMask = new Long(1,0,true);
  let possibleMoves = new Long(0,0,true);
  let eat= new Long(1,0,true);
  let pseudoMoves = new Long(1,0,true);
  if(color === 'b'){
    const blockingPiece = checkBitAt(movePawnMask.shiftLeft(fromBitIndex-8).and(occupiedBits), fromBitIndex-8);
    movePawnMask = (rankNumber === 6 && !blockingPiece)?
      movePawnMask.add(0x100).shiftLeft(fromBitIndex-16)
      : movePawnMask.shiftLeft(fromBitIndex-8);
    possibleMoves = emptySquares.and(movePawnMask);
    //eat left
    pseudoMoves=eat.shiftLeft(fromBitIndex-7).and(HFileSet.not());
    //eat right
    pseudoMoves=pseudoMoves.or(eat.shiftLeft(fromBitIndex-9).and(AFileSet.not()));
  }else{
    const blockingPiece = checkBitAt(movePawnMask.shiftLeft(fromBitIndex+8).and(occupiedBits),fromBitIndex+8);

    movePawnMask = (rankNumber === 1 && !blockingPiece)?
      movePawnMask.add(0x100).shiftLeft(fromBitIndex+8)
      : movePawnMask.shiftLeft(fromBitIndex+8);

    possibleMoves = emptySquares.and(movePawnMask);
    //eat left
    pseudoMoves=eat.shiftLeft(9+fromBitIndex).and(HFileSet.not());
    //eat right
    pseudoMoves=pseudoMoves.or(eat.shiftLeft(7+fromBitIndex).and(AFileSet.not()));
  }
  //filter if not anything to eat
  pseudoMoves = pseudoMoves.and(enemyOccupied);
  return possibleMoves.or(pseudoMoves);
};
interface IRookLegalMoves {
  fromBitIndex: number,
  occupiedBits: Long,
  teammateOccupiedBits: Long
}
const rookLegalMoves = ({ fromBitIndex, occupiedBits, teammateOccupiedBits }: IRookLegalMoves) => {
  const fileNumber = fromBitIndex%8;
  const rankNumber = ~~(fromBitIndex/8);
  const northMoveMask = HFileSet.shiftLeft(fromBitIndex).shiftLeft(8);
  const southMoveMask = AFileSet.shiftRightUnsigned((7-fileNumber)+(7-rankNumber)*8).shiftRightUnsigned(8);
  const westMoveMask = Rank1Set.shiftRightUnsigned(1+fileNumber).shiftLeft(rankNumber*8+fileNumber+1);
  const eastMoveMask = Rank1Set.shiftRightUnsigned(8-fileNumber).shiftLeft(rankNumber*8);
  const fileMask = HFileSet.shiftLeft(fileNumber);
  const rankMask = Rank1Set.shiftLeft(rankNumber*8);
  const rookMoveMask = fileMask.or(rankMask);

  const pseudoAttacks = rookMoveMask.and(occupiedBits);
  //positive
  const northAttacks = blockingPiece(pseudoAttacks, northMoveMask);
  const westAttacks = blockingPiece(pseudoAttacks, westMoveMask);
  //negative
  const southAttacks = blockingPiece(pseudoAttacks, southMoveMask, true);
  const eastAttacks = blockingPiece(pseudoAttacks, eastMoveMask, true);
  const pseudoMoves = northAttacks.or(westAttacks).or(eastAttacks).or(southAttacks);
  const legalMoves = pseudoMoves.and(allBitsSet.xor(teammateOccupiedBits));
  logger(legalMoves);
  return legalMoves;
};
const getBitIndexes = (bitString: Long) => {
  let algebricNotation:string[] = [];
  const bit = bitString.toString(2);
  
  for( let i = bit.length-bitString.countTrailingZeros(); i>=0;i--){
    const hexAtI = bit.charAt(i);
    switch(hexAtI){
    case '1':{
      algebricNotation = [...algebricNotation, SquareBit[bit.length-i-1] as string];
      break;
    }
    }
  }

  return algebricNotation;
};
interface IBishopLegalMoves {
  fromBitIndex: number,
  occupiedBits: Long,
  teammateOccupiedBits: Long
}
const bishopLegalMoves = ({fromBitIndex, occupiedBits, teammateOccupiedBits }: IBishopLegalMoves) => {
    
  const fileNumber = fromBitIndex%8;
  const rankNumber = ~~(fromBitIndex/8);
  const bishopSquare = new Long(1,0,true).shiftLeft(fromBitIndex);
  const antiDiagonalMask= new Long(0x8040201,0x80402010,true);
  const diagonalMask = new Long(0x10204080,0x1020408,true);
  //helpers determine howmany moves bishop can move to direction
  const NWhelper = fileNumber-rankNumber >=0 ?
    fileNumber*8 // positive
    :rankNumber*8; //negative
  const NEhelper = (7-fileNumber)-rankNumber >=0 ?
    (7-fileNumber)*8 // positive
    :rankNumber*8; //negative
  const SEhelper = fileNumber-rankNumber >= 0 ?
    (7-rankNumber)*8 //positive
    : (7-fileNumber)*8;// negative
  const SWhelper = (7-fileNumber)-rankNumber >= 0 ?
    (7-rankNumber)*8 //positive
    : (fileNumber)*8;// negative
  const NWMask = antiDiagonalMask.shiftLeft(NWhelper).shiftRightUnsigned(NWhelper).shiftLeft(fromBitIndex);
  const NEMask = diagonalMask.shiftLeft(NEhelper).shiftRightUnsigned(NEhelper+7).shiftLeft(fromBitIndex);
  const SEMask = antiDiagonalMask.shiftRightUnsigned(SEhelper).shiftLeft(SEhelper).shiftRightUnsigned(63-fromBitIndex);
  const SWMask = diagonalMask.shiftRightUnsigned(SWhelper).shiftLeft(SWhelper+7).shiftRightUnsigned(63-fromBitIndex);
  const pseudoMovesNW = checkForADiagonalBlockingPieces({possibleMoves:NWMask.xor(bishopSquare), occupiedSquares: occupiedBits});
  const pseudoMovesNE = checkForDiagonalBlockingPieces({possibleMoves:NEMask.xor(bishopSquare), occupiedSquares: occupiedBits});
  const pseudoMovesSW = checkForDiagonalBlockingPieces({possibleMoves:SWMask.xor(bishopSquare), occupiedSquares: occupiedBits});
  const pseudoMovesSE = checkForADiagonalBlockingPieces({possibleMoves:SEMask.xor(bishopSquare), occupiedSquares: occupiedBits});
  const pseudoMoves = blockingPiece(pseudoMovesNW, NWMask).or(blockingPiece(pseudoMovesNE, NEMask)).or(blockingPiece(pseudoMovesSE, SEMask,true)).or(blockingPiece(pseudoMovesSW, SWMask, true));

  return pseudoMoves.and(teammateOccupiedBits.not());
};
interface ICheckForBlockingPieces {
  possibleMoves:Long
  occupiedSquares:Long
}
function checkForDiagonalBlockingPieces({ possibleMoves, occupiedSquares }: ICheckForBlockingPieces) {
  var blockedMoves = possibleMoves;
  const oneBit= new Long(1, 0, true);
  const moves = possibleMoves.toString(2);
  for (let i = moves.length-1; i>=possibleMoves.countTrailingZeros(); i-=7) {
    var moveBit = oneBit.shiftLeft(i);
    if (!checkBitAt(occupiedSquares.and(moveBit), i)) {
      blockedMoves= blockedMoves.and(moveBit.not());
    }
  }
  return blockedMoves;
}
function checkForADiagonalBlockingPieces({ possibleMoves, occupiedSquares }: ICheckForBlockingPieces) {
  var blockedMoves = possibleMoves;
  const oneBit= new Long(1, 0, true);
  const moves = possibleMoves.toString(2);
  for (let i = moves.length-1; i>=0; i-=9) {
    var moveBit = oneBit.shiftLeft(i);
    if (!checkBitAt(occupiedSquares.and(moveBit), i)) {
      blockedMoves= blockedMoves.and(moveBit.not());
    }
  }
  return blockedMoves;
}
interface IKingPseudoMoves {
  kingPosition: Long
}
const kingPseudoMoves = ({kingPosition}: IKingPseudoMoves) => {

  const NorthWest = kingPosition.shiftLeft(9);
  const NorthEast = kingPosition.shiftLeft(7);
  const North = kingPosition.shiftLeft(8);
  const West = kingPosition.shiftLeft(1);
  const East = kingPosition.shiftRightUnsigned(1);
  const South = kingPosition.shiftRightUnsigned(8);
  const SouthWest = kingPosition.shiftRightUnsigned(7);
  const SouthEast = kingPosition.shiftRightUnsigned(9);

  const moveMask = West.or(North).or(East).or(South).or(NorthEast).or(NorthWest).or(SouthEast).or(SouthWest);
  //do masking 
  logger(AFileSet.not());
  logger(HFileSet.not());
  if(kingPosition.and(AFileSet).isZero()) return moveMask.and(AFileSet.not());
  if(kingPosition.and(HFileSet).isZero()) return moveMask.and(HFileSet.not());
  return moveMask;
};
interface IknightPseudoMoves {
  knightPosition: Long,
}
const knightPseudoMoves = ({knightPosition}: IknightPseudoMoves) => {

  const noNorthWest = knightPosition.shiftLeft(17);
  const noNorthEast = knightPosition.shiftLeft(15);
  const noWestWest = knightPosition.shiftLeft(6);
  const noEastEast = knightPosition.shiftLeft(10);
  const soSouthWest = knightPosition.shiftRightUnsigned(17);
  const soSouthEast = knightPosition.shiftRightUnsigned(15);
  const soWestWest = knightPosition.shiftRightUnsigned(10);
  const soEastEast = knightPosition.shiftRightUnsigned(6);
  const PseudoMask = knightPosition.or(noNorthWest).or(noNorthEast).or(soSouthWest).or(soSouthEast).or(noEastEast).or(noWestWest).or(soWestWest).or(soEastEast);

  //remove moves that portal to other side
  if(!ABFileMask.and(knightPosition).isZero()) return PseudoMask.and(GHFileMask.not());  //remove GHFILE
  if(!GHFileMask.and(knightPosition).isZero()) return PseudoMask.and(ABFileMask.not());  //remove ABFILE
  return PseudoMask; 
};
export default useChess;

