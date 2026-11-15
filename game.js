import { createGame } from "./src/engine/create-game.js";
import { loadTitleImages } from "./src/ui/title-menu.js";
import { installMenuPresentation } from "./src/ui/menu-presentation.js";

export const game = createGame({ titleImages: await loadTitleImages() });
installMenuPresentation(game);
requestAnimationFrame(game.loop);
