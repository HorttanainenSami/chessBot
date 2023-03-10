const moveRouter = require('express').Router();
import { Response, Request } from 'express';
import { Color } from './Types';
import { getState, makeMove } from './GameLogic/gameStateChanger';
import { getFEN, loadFEN } from './GameLogic/fen';
import { move as botMove } from './Engine/engineMove';
import { getMoves, getMovesReturn } from './GameLogic/move';

moveRouter.get('/getState', (request: Request, response: Response) => {
  response.send(getState());
});
moveRouter.post('/makeMove', (request: Request, response: Response) => {
  const m = makeMove(request.body);
  response.send(m);
});

moveRouter.get('/getMoves/w', (request: Request, response: Response) => {
  const color: Color = 'w';
  const state = getState();
  const moves: getMovesReturn = getMoves({ color, state });
  response.send([...moves]);
});
moveRouter.get('/getMoves/b', (request: Request, response: Response) => {
  const color: Color = 'b';
  const state = getState();

  const moves: getMovesReturn = getMoves({ color, state });
  response.send([...moves]);
});

moveRouter.post('/loadFEN', (request: Request, response: Response) => {
  const { fen } = request.body;
  const state = loadFEN(fen);
  response.send(state);
});
moveRouter.get('/getFEN', (request: Request, response: Response) => {
  const fen = getFEN();
  response.send(fen);
});
moveRouter.get('/getMoves/bot', (request: Request, response: Response) => {
  const { turn } = getState();

  botMove({ color: turn })
    .then(() => response.json(getFEN()))
    .catch(() => response.json({ error: 'No bot in this game' }));
});
module.exports = moveRouter;
