import { createGame } from "./src/engine/create-game.js";

export const game = createGame();
requestAnimationFrame(game.loop);
