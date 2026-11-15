const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
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
    },
  });
  win.webContents.on("console-message", (_event, level, message) => {
    if (level === 3) errors.push(message);
  });
  win.webContents.on("render-process-gone", (_event, details) =>
    errors.push(JSON.stringify(details)),
  );
  try {
    await win.loadFile(path.join(__dirname, "..", "index.html"));
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
    fs.writeFileSync(screenshot, (await win.webContents.capturePage()).toPNG());
    await win.webContents.executeJavaScript(
      `import('./game.js').then(({game:g})=>{g.game.mode='pvp';g.game.state='controls';g.render();})`,
    );
    fs.writeFileSync(
      path.join(outputDirectory, "controls.png"),
      (await win.webContents.capturePage()).toPNG(),
    );
    await win.webContents.executeJavaScript(
      `import('./game.js').then(({game:g})=>{g.startMatch();g.game.state='fighting';g.render();})`,
    );
    fs.writeFileSync(
      path.join(outputDirectory, "fight.png"),
      (await win.webContents.capturePage()).toPNG(),
    );
    if (errors.length) throw Error(errors.join("\n"));
    console.log(JSON.stringify({ ...result, screenshot }));
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
