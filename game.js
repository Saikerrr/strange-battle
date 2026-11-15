import { createGame } from "./src/engine/create-game.js";
import { loadTitleImages } from "./src/ui/title-menu.js";

export const game = createGame({ titleImages: await loadTitleImages() });
requestAnimationFrame(game.loop);
