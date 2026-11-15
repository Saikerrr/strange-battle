const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const outputDirectory = path.join(__dirname, "..", "artifacts", "verification");

const errors = [];
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1600,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      autoplayPolicy: "no-user-gesture-required",
    },
  });
  win.webContents.setAudioMuted(true);
  win.webContents.on("console-message", (_event, level, message) => {
    if (level === 3) errors.push(message);
  });
  win.webContents.on("render-process-gone", (_event, details) =>
    errors.push(JSON.stringify(details)),
  );
  try {
    await win.loadFile(path.join(__dirname, "..", "index.html"));
    fs.mkdirSync(outputDirectory, { recursive: true });
    const evaluate = (code) =>
      win.webContents.executeJavaScript(
        `import('./game.js').then(async ({game:g})=>{const deadline=Date.now()+3000;while(g.sceneTransition?.progress<1){g.render();if(Date.now()>deadline)throw Error('Transition did not finish: '+g.sceneTransition.progress);await new Promise(r=>setTimeout(r,20));}${code}})`,
      );
    await evaluate(
      `g.loop=()=>{};await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));g.goToTitle();g.render();`,
    );
    const snapshot = async (name) => {
      await win.webContents.executeJavaScript(
        "new Promise(resolve=>requestAnimationFrame(resolve))",
      );
      fs.writeFileSync(
        path.join(outputDirectory, name + ".png"),
        (await win.webContents.capturePage()).toPNG(),
      );
    };
    await snapshot("main-menu");
    await evaluate(
      `if(g.menuMusic.state()!=='loaded')await new Promise((resolve,reject)=>{g.menuMusic.once('load',resolve);g.menuMusic.once('loaderror',reject);});`,
    );
    assert.equal(await evaluate("return g.menuMusic.loop();"), true);
    assert.equal(await evaluate("return g.menuMusic.playing();"), true);
    win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Return" });
    win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Return" });
    assert.equal(
      await evaluate("return g.game.state;"),
      "title",
      "Enter must not open PVP",
    );
    const pointFor = (id) =>
      evaluate(
        `const b=g.buttons['${id}'],r=g.canvas.getBoundingClientRect();return {x:Math.round(r.left+(b.x+b.w/2)/g.W*r.width),y:Math.round(r.top+(b.y+b.h/2)/g.H*r.height)};`,
      );
    const buttonPoint = (mode) => pointFor("play_" + mode);
    const pvp = await buttonPoint("pvp");
    win.webContents.sendInputEvent({ type: "mouseMove", ...pvp });
    await snapshot("main-menu-hover");
    assert.equal(
      fs
        .readFileSync(path.join(outputDirectory, "main-menu.png"))
        .equals(
          fs.readFileSync(path.join(outputDirectory, "main-menu-hover.png")),
        ),
      false,
      "Hover must visibly change the button",
    );
    assert.equal(await evaluate("return g.canvas.style.cursor;"), "pointer");
    win.webContents.sendInputEvent({
      type: "mouseDown",
      button: "left",
      clickCount: 1,
      ...pvp,
    });
    await snapshot("main-menu-pressed");
    assert.equal(
      fs
        .readFileSync(path.join(outputDirectory, "main-menu-hover.png"))
        .equals(
          fs.readFileSync(path.join(outputDirectory, "main-menu-pressed.png")),
        ),
      false,
      "Press must visibly compress the button",
    );
    assert.equal(await evaluate("return g.titlePointer.down;"), true);
    win.webContents.sendInputEvent({
      type: "mouseUp",
      button: "left",
      clickCount: 1,
      ...pvp,
    });
    assert.equal(await evaluate("return g.game.mode;"), "pvp");
    assert.equal(await evaluate("return g.game.state;"), "select");
    for (const size of [
      [1600, 900],
      [1200, 800],
      [1000, 600],
    ]) {
      win.setContentSize(...size);
      await evaluate("g.resize();g.goToTitle();g.render();");
      for (const mode of ["pvp", "pve", "practice"]) {
        await evaluate("g.goToTitle();g.render();");
        const p = await buttonPoint(mode);
        win.webContents.sendInputEvent({ type: "mouseMove", ...p });
        win.webContents.sendInputEvent({
          type: "mouseDown",
          button: "left",
          clickCount: 1,
          ...p,
        });
        win.webContents.sendInputEvent({
          type: "mouseUp",
          button: "left",
          clickCount: 1,
          ...p,
        });
        assert.deepEqual(await evaluate("return [g.game.state,g.game.mode];"), [
          "select",
          mode,
        ]);
        await evaluate("g.render();");
        const back = await pointFor("back");
        win.webContents.sendInputEvent({ type: "mouseMove", ...back });
        win.webContents.sendInputEvent({
          type: "mouseDown",
          button: "left",
          clickCount: 1,
          ...back,
        });
        win.webContents.sendInputEvent({
          type: "mouseUp",
          button: "left",
          clickCount: 1,
          ...back,
        });
        assert.equal(
          await evaluate("return g.game.state;"),
          "title",
          "Back must return to the new menu",
        );
      }
    }
    await evaluate(
      "g.goToTitle();g.titlePointer.x=-1;g.titlePointer.y=-1;g.render();",
    );
    await snapshot("main-menu-small");
    win.setContentSize(1600, 900);
    await evaluate("g.resize();");
    await evaluate("g.game.state='roundStart';g.render();");
    await evaluate("await new Promise(r=>setTimeout(r,400));");
    assert.equal(
      await evaluate("return g.menuMusic.playing();"),
      false,
      "Music must stop on the arena",
    );
    await evaluate("g.goToTitle();g.render();");
    assert.equal(
      await evaluate("return g.menuMusic.playing();"),
      true,
      "Music must restart in menus",
    );
    assert.ok(
      await evaluate("return g.menuMusic.seek()<1.5;"),
      "Music must restart from the beginning",
    );
    const result = await win.webContents.executeJavaScript(`(async () => {
      const {game:g}=await import('./game.js');
      g.loop=()=>{};
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const countries=['ukraine','russia','america','china','japan','afghanistan'];
      let matches=0;
      for(const a of countries)for(const b of countries) {
        g.game.mode='pve';g.selections.p1=a;g.selections.p2=b;g.startMatch();g.game.state='fighting';
        for(let i=0;i<90;i++){g.updateGame(1/60);if(i%15===0)g.render();}
        g.triggerUlt(g.p1,g.p2);g.triggerUlt(g.p2,g.p1);
      for(let i=0;i<120;i++){
        for(const f of [g.p1,g.p2])for(const [j,key]of ['skill1','skill2','skill3'].entries()){
          const code=Array.isArray(f.controls[key])?f.controls[key][0]:f.controls[key];
          if(i%40===j*10)g.keys[code]=true;if(i%40===j*10+5)g.keys[code]=false;
        }
        g.updateGame(1/60);if(i%15===0)g.render();
      }
        for(const f of [g.p1,g.p2])for(const key of ['hp','x','y','vx','vy'])if(!Number.isFinite(f[key]))throw Error(f.charType+'.'+key+'='+f[key]);
        matches++;
      }
      g.game.mode='pve';g.game.state='select';g.selections.p1='japan';g.selections.p2='afghanistan';g.render();
      return {matches,title:document.title,buttons:Object.keys(g.buttons).length};
    })()`);
    fs.mkdirSync(outputDirectory, { recursive: true });
    const screenshot = path.join(outputDirectory, "selection.png");
    await snapshot("selection");
    await win.webContents.executeJavaScript(
      `import('./game.js').then(({game:g})=>{g.game.mode='pvp';g.game.state='controls';g.render();})`,
    );
    await snapshot("controls");
    await win.webContents.executeJavaScript(
      `import('./game.js').then(({game:g})=>{g.startMatch();g.game.state='fighting';g.render();})`,
    );
    await snapshot("fight");
    if (errors.length) throw Error(errors.join("\n"));
    console.log(
      JSON.stringify({
        ...result,
        menuChecks: "Enter, hover, press, all modes at three window sizes",
        screenshot,
      }),
    );
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
