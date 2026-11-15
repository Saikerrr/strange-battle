export function initializeInput(sbContext) {
  sbContext.P1_CONTROLS = {
    left: "KeyA",
    right: "KeyD",
    jump: "KeyW",
    block: "KeyS",
    punch: "KeyF",
    kick: "KeyG",
    special: "KeyH",
    ult: "KeyR",
    dash: "ShiftLeft",
    skill1: "KeyZ",
    skill2: "KeyX",
    skill3: "KeyC",
  };
  sbContext.P2_CONTROLS = {
    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
    block: "ArrowDown",
    punch: ["Numpad4", "Comma"],
    kick: ["Numpad5", "Period"],
    special: ["Numpad6", "Slash"],
    ult: ["Numpad0", "Digit0"],
    dash: "ShiftRight",
    skill1: ["Numpad1", "Digit1"],
    skill2: ["Numpad2", "Digit2"],
    skill3: ["Numpad3", "Digit3"],
  };
  sbContext.keys = {};
}
export function attachInput(sbContext) {
  window.addEventListener("resize", sbContext.resize);
  window.addEventListener("keydown", (e) => {
    if (!sbContext.audioCtx) sbContext.initAudio();
    sbContext.keys[e.code] = true;
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space",
        "Tab",
        "Slash",
        "Backslash",
        "Period",
        "Comma",
      ].includes(e.code)
    )
      e.preventDefault();
    if (e.code === "Enter" && !e.repeat) sbContext.handleEnter();
    if (e.code === "KeyR" && sbContext.game.state === "matchEnd")
      sbContext.goToSelect();
  });
  window.addEventListener("keyup", (e) => {
    sbContext.keys[e.code] = false;
  });
  window.addEventListener("blur", () => {
    for (const key of Object.keys(sbContext.keys)) delete sbContext.keys[key];
    if (["fighting", "roundStart", "roundEnd"].includes(sbContext.game.state)) {
      sbContext.game.pausedFrom = sbContext.game.state;
      sbContext.game.state = "paused";
    }
  });
  sbContext.canvas.addEventListener("click", (e) => {
    const rect = sbContext.canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * sbContext.W;
    const sy = ((e.clientY - rect.top) / rect.height) * sbContext.H;
    sbContext.handleClick(sx, sy);
  });
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Escape" || e.repeat) return;
    if (sbContext.game.state === "paused") {
      sbContext.game.state = sbContext.game.pausedFrom || "fighting";
      sbContext.game.pausedFrom = null;
      e.preventDefault();
      return;
    }
    if (["fighting", "roundStart", "roundEnd"].includes(sbContext.game.state)) {
      sbContext.game.pausedFrom = sbContext.game.state;
      sbContext.game.state = "paused";
      sbContext.game.infoPanel = null;
      e.preventDefault();
    }
  });
}
