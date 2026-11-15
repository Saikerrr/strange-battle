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
    // Verify complete designs after the SVG-to-cloth rendering pipeline.
    await win.webContents.executeJavaScript(`(async()=>{
      const {loadTitleImages}=await import('./src/ui/title-menu.js');
      const {drawClothFlag}=await import('./src/ui/cloth-flags.js');
      const images=await loadTitleImages();
      const canvas=document.createElement('canvas');canvas.width=100;canvas.height=100;
      const c=canvas.getContext('2d');
      const pixel=(x,y)=>Array.from(c.getImageData(x,y,1,1).data);
      c.drawImage(images.draftCard,0,0,100,100);
      if(!(pixel(0,0)[3]===0&&pixel(50,50)[3]>240))throw Error('Draft card must have transparent outside and opaque center');
      c.clearRect(0,0,100,100);
      drawClothFlag(c,images,'russia',10,10,64,48);
      const white=pixel(25,17),blue=pixel(25,34),red=pixel(25,51);
      if(!(white[0]>150&&white[1]>150&&white[2]>150&&blue[2]>blue[0]*2&&red[0]>red[2]*2))throw Error('Cloth flag lost Russia stripes: '+JSON.stringify({white,blue,red}));
      c.clearRect(0,0,100,100);drawClothFlag(c,images,'japan',10,10,64,48);
      const disc=pixel(42,34),field=pixel(20,34);
      if(!(disc[0]>disc[1]*2&&field[0]>150&&field[1]>150))throw Error('Cloth flag lost Japan disc: '+JSON.stringify({disc,field}));
    })()`);
    const evaluate = (code) =>
      win.webContents.executeJavaScript(
        `import('./game.js').then(async ({game:g})=>{const deadline=Date.now()+3000;while(g.sceneTransition?.progress<1){g.render();if(Date.now()>deadline)throw Error('Transition did not finish: '+g.sceneTransition.progress);await new Promise(r=>setTimeout(r,20));}${code}})`,
      );
    await evaluate(
      `g.loop=()=>{};await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));g.goToTitle();g.render();`,
    );
    const snapshot = async (name) => {
      await evaluate("g.render();");
      await evaluate("g.render();");
      await new Promise((r) => setTimeout(r, 60));
      await win.webContents.executeJavaScript(
        "new Promise(resolve=>requestAnimationFrame(resolve))",
      );
      const pixels = await evaluate(
        "g.render();return g.canvas.toDataURL('image/png').split(',')[1];",
      );
      fs.writeFileSync(
        path.join(outputDirectory, name + ".png"),
        Buffer.from(pixels, "base64"),
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
      await new Promise((r) => setTimeout(r, 100));
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
        await new Promise((r) => setTimeout(r, 60));
        win.webContents.sendInputEvent({
          type: "mouseUp",
          button: "left",
          clickCount: 1,
          ...p,
        });
        await new Promise((r) => setTimeout(r, 60));
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
        await new Promise((r) => setTimeout(r, 60));
        win.webContents.sendInputEvent({
          type: "mouseUp",
          button: "left",
          clickCount: 1,
          ...back,
        });
        await new Promise((r) => setTimeout(r, 60));
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
    await evaluate(
      "g.game.mode='pve';g.game.state='select';g.game.infoPanel={side:'P1',charId:'japan'};g.render();",
    );
    await snapshot("selection-skills");
    await evaluate(
      "g.game.infoPanel=null;g.game.mode='practice';g.game.state='select';g.render();",
    );
    await snapshot("practice-selection");
    await evaluate("g.startMatch();g.game.state='fighting';g.render();");
    await snapshot("practice");
    for (const country of [
      "afghanistan",
      "china",
      "russia",
      "america",
      "japan",
    ]) {
      await evaluate(
        `g.game.mode='pvp';g.selections.p1='${country}';g.selections.p2='${country}';g.startMatch();g.game.state='fighting';g.keys={};g.p1.x=650;g.p2.x=950;g.p1.y=g.p2.y=g.GROUND_Y;g.p1.state=g.p2.state='idle';g.triggerUlt(g.p2,g.p1);g.p1.noodleMode=true;g.p1.noodleCharges=5;g.camera.x=800;g.camera.y=400;g.camera.zoom=1;g.screenFlash=0;g.screenShake.timer=0;g.particles.length=0;g.explosionRings.length=0;g.render();`,
      );
      await snapshot("country-" + country);
      if (country === "afghanistan")
        await evaluate(
          "g.p1.afghanRifleActive=1;g.p2.afghanMinigunActive=1;g.afghanPlanes.push({x:800,y:340});g.afghanC4s.push({x:800,y:g.GROUND_Y,landed:true,owner:g.p1});",
        );
      if (country === "america")
        await evaluate(
          "g.p1.castBurger();g.p2.castBurger();g.p1.castEagle();const e=g.eagles[0];e.x=800;e.y=450;e.timer=.2;",
        );
      if (country === "russia")
        await evaluate(
          "g.p1.startAttack('uppercut');g.p1.attack.timer=.25;g.sbSpawnRocket(g.p2,g.p1);g.ultRockets[0].x=800;g.ultRockets[0].y=420;",
        );
      if (country === "china")
        await evaluate(
          "g.p1.cnFirework(g.p2);g.cnFireworks[0].x=800;g.cnFireworks[0].y=430;g.p2.dragonRush=1;",
        );
      await snapshot("skills-" + country);
    }
    await evaluate(
      "g.selections.p1=g.selections.p2='japan';g.startMatch();g.game.state='fighting';g.p1.x=650;g.p2.x=950;g.camera.x=800;g.p1.japanParryStance=1;g.p2.ultCharging=true;g.p2.ultChargeTimer=1;g.p2.ultChargeDuration=2;g.screenFlash=0;g.render();",
    );
    await snapshot("japan-poses");
    const clickButton = async (id) => {
      await evaluate("g.render();");
      const p = await pointFor(id);
      win.webContents.sendInputEvent({ type: "mouseMove", ...p });
      win.webContents.sendInputEvent({
        type: "mouseDown",
        button: "left",
        clickCount: 1,
        ...p,
      });
      await new Promise((r) => setTimeout(r, 60));
      win.webContents.sendInputEvent({
        type: "mouseUp",
        button: "left",
        clickCount: 1,
        ...p,
      });
      await new Promise((r) => setTimeout(r, 60));
      await evaluate("g.render();");
    };
    await evaluate("g.goToTitle();g.render();");
    await clickButton("play_draft");
    assert.equal(await evaluate("return g.game.state;"), "draftSetup");
    await snapshot("draft-setup");
    await clickButton("draft_pvp");
    await snapshot("draft-skills");
    for (let i = 0; i < 6; i++)
      await clickButton(
        await evaluate("return 'draft_skill_'+g.draft.offers[0];"),
      );
    assert.equal(
      await evaluate("return new Set(g.draft.picks.flat()).size;"),
      6,
    );
    await snapshot("draft-models");
    await clickButton("draft_model_america");
    await clickButton("draft_model_afghanistan");
    assert.equal(await evaluate("return g.game.state;"), "roundStart");
    await evaluate("g.game.state='fighting';g.render();");
    const hudPoint = await evaluate(
      "const b=g.hudHitAreas[0],r=g.canvas.getBoundingClientRect();return{x:Math.round((b.x+20)/g.W*r.width+r.left),y:Math.round((b.y+20)/g.H*r.height+r.top)};",
    );
    win.webContents.sendInputEvent({ type: "mouseMove", ...hudPoint });
    await new Promise((r) => setTimeout(r, 60));
    await snapshot("hud-skill-tooltip");
    await evaluate(
      "g.p1.draftLoadout=['afghanistan.rifle','japan.parry','china.noodle'];g.p1.afghanRifleActive=1;g.p2.draftLoadout=['america.burger','russia.uppercut','afghanistan.c4'];g.p2.burgerEatTimer=1;g.hudPointer=null;g.render();",
    );
    await snapshot("draft-equipment");
    await evaluate(
      "g.triggerUlt(g.p1,g.p2);g.screenFlash=0;g.screenShake.timer=0;g.particles.length=0;g.render();",
    );
    const passivePoint = await evaluate(
      "const b=g.hudHitAreas.find(b=>b.info.name==='Защитный щит'),r=g.canvas.getBoundingClientRect();return{x:Math.round((b.x+15)/g.W*r.width+r.left),y:Math.round((b.y+15)/g.H*r.height+r.top)};",
    );
    win.webContents.sendInputEvent({ type: "mouseMove", ...passivePoint });
    await new Promise((r) => setTimeout(r, 60));
    await snapshot("hud-passive-tooltip");
    await evaluate(
      "g.p1.ultTimer=0;g.p1.y=g.p2.y=g.GROUND_Y-180;g.p1.onGround=g.p2.onGround=false;g.p1.vy=g.p2.vy=-600;g.p1.state=g.p2.state='jump';g.hudPointer=null;g.render();",
    );
    await snapshot("jump-rise");
    await evaluate("g.p1.vy=g.p2.vy=600;g.render();");
    await snapshot("jump-fall");
    await evaluate("g.goToTitle();g.game.mode='pve';g.beginDraft();");
    for (let i = 0; i < 3; i++)
      await evaluate(
        "g.chooseDraftSkill(g.draft.offers[0]);g.updateGame(.8);g.render();",
      );
    await evaluate(
      "g.chooseDraftModel('japan');g.updateGame(.8);g.game.state='fighting';g.render();",
    );
    assert.equal(await evaluate("return g.p2.isAI;"), true);
    assert.equal(
      await evaluate(
        "return new Set([...g.p1.draftLoadout,...g.p2.draftLoadout]).size;",
      ),
      6,
    );
    // Mixed kits keep all borrowed timers/projectiles finite in a real renderer.
    await evaluate(`const {ABILITIES}=await import('./src/characters/ability-kit.js');
      for(let model=0;model<6;model++){
        const countries=['ukraine','russia','america','china','japan','afghanistan'];
        g.game.draftEnabled=false;g.game.mode='pvp';g.selections.p1=countries[model];g.selections.p2=countries[(model+1)%6];g.startMatch();g.game.state='fighting';
        g.p1.draftLoadout=[0,4,8].map(j=>ABILITIES[(model*3+j)%18].id);
        g.p2.draftLoadout=[1,5,9].map(j=>ABILITIES[(model*3+j)%18].id);
        for(let frame=0;frame<180;frame++){
          for(const f of [g.p1,g.p2])for(let slot=0;slot<3;slot++){const c=f.controls['skill'+(slot+1)],key=Array.isArray(c)?c[0]:c;g.keys[key]=frame%60===slot*10;}
          g.updateGame(1/60);if(frame%30===0)g.render();
        }
        for(const f of [g.p1,g.p2])for(const key of ['hp','x','y','vx','vy'])if(!Number.isFinite(f[key]))throw Error('Draft '+f.charType+'.'+key);
      }g.goToTitle();g.render();`);
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
