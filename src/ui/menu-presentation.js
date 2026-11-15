const menus = new Set(["title", "select", "controls", "matchEnd"]);
const url = (name) =>
  new URL(`../../assets/audio/${name}`, import.meta.url).href;

export function installMenuPresentation(g) {
  const { Howl, gsap } = globalThis;
  if (!Howl || !gsap) return;
  const music = new Howl({
    src: [url("dark-city.wav")],
    html5: true,
    loop: true,
    volume: 0.28,
  });
  const sounds = Object.fromEntries(
    ["hover", "click", "transition"].map((name) => [
      name,
      new Howl({
        src: [url(name + ".ogg")],
        volume: name === "hover" ? 0.14 : 0.23,
        rate: 0.85,
      }),
    ]),
  );
  let musicInMenu = false,
    hovered = null,
    previousState = null;
  let fadeSerial = 0;
  g.menuMusic = music;
  const updateMusic = () => {
    const wanted = menus.has(g.game.state);
    if (wanted === musicInMenu) return;
    musicInMenu = wanted;
    const serial = ++fadeSerial;
    if (wanted) {
      music.stop();
      music.volume(0.28);
      music.play();
    } else {
      music.fade(music.volume(), 0, 350);
      setTimeout(() => {
        if (serial === fadeSerial && !musicInMenu) music.stop();
      }, 360);
    }
  };
  music.on("playerror", () => {
    music.once("unlock", () => {
      if (musicInMenu && !music.playing()) music.play();
    });
  });
  const snapshot = document.createElement("canvas");
  snapshot.width = g.W;
  snapshot.height = g.H;
  const transition = { progress: 1 };
  let transitionTween = null,
    transitionStarted = 0;
  g.sceneTransition = transition;
  const render = g.render;
  g.render = () => {
    if (transitionTween && transition.progress < 1)
      transitionTween.progress(
        Math.min(1, (performance.now() - transitionStarted) / 400),
      );
    const state = g.game.state;
    if (
      previousState !== null &&
      state !== previousState &&
      (menus.has(state) || menus.has(previousState))
    ) {
      // Preserve the outgoing scene; combat timers keep their existing rules.
      snapshot.getContext("2d").drawImage(g.canvas, 0, 0);
      gsap.killTweensOf(transition);
      transition.progress = 0;
      transitionStarted = performance.now();
      transitionTween = gsap.to(transition, {
        progress: 1,
        duration: 0.4,
        paused: true,
        ease: "sine.inOut",
      });
      sounds.transition.play();
      hovered = null;
    }
    previousState = state;
    updateMusic();
    render();
    if (transition.progress < 1) {
      const { ctx, W, H } = g,
        p = transition.progress;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p * 2);
      ctx.drawImage(snapshot, 0, 0);
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.85;
      ctx.fillStyle = "#07060d";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  };
  const handleClick = g.handleClick,
    handleEnter = g.handleEnter;
  g.handleClick = (x, y) => {
    if (transition.progress < 1) return;
    const valid = Object.keys(g.buttons).some((id) => g.hitBtn(id, x, y));
    if (valid) sounds.click.play();
    handleClick(x, y);
    g.render();
  };
  g.handleEnter = () => {
    if (transition.progress >= 1) {
      handleEnter();
      g.render();
    }
  };
  g.canvas.addEventListener("pointermove", (event) => {
    if (!menus.has(g.game.state) || transition.progress < 1) return;
    const r = g.canvas.getBoundingClientRect(),
      x = ((event.clientX - r.left) / r.width) * g.W,
      y = ((event.clientY - r.top) / r.height) * g.H;
    const id = Object.keys(g.buttons).find((id) => g.hitBtn(id, x, y)) || null;
    if (id && id !== hovered) sounds.hover.play();
    hovered = id;
  });
  g.canvas.addEventListener("pointerleave", () => {
    hovered = null;
  });
  window.addEventListener("pagehide", () => {
    music.unload();
    Object.values(sounds).forEach((s) => s.unload());
    gsap.killTweensOf(transition);
  });
  updateMusic();
}
