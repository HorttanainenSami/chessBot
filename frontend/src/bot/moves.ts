interface ImakeMove {
  possibleMoves: string[],
  positionsInFen: string,
}
function makeMove({ possibleMoves } : ImakeMove): string|undefined {
  //const evaluate = evaluate(positionsInFen);
  const randomIndex = Math.floor(Math.random() * possibleMoves.length);
  return(possibleMoves[randomIndex]);
}

/*
function evaluate(positionsInFen : string) {

}
*/
export { makeMove};

