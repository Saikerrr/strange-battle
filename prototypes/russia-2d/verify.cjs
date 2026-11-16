const { app, BrowserWindow } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
app.whenReady().then(async () => {
  const errors = [];
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
  win.webContents.on("console-message", (details, level, message) => {
    const severity = details.level ?? level;
    if (severity === "error" || severity === 3)
      errors.push(details.message ?? message);
  });
  const evaluate = (code) =>
    win.webContents.executeJavaScript(
      `(()=>{const g=window.russiaPrototype;${code}})()`,
    );
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const out = path.join(__dirname, "..", "..", "artifacts", "verification");
  const snapshot = async (name) => {
    const pixels = await evaluate(
      "g.render();return document.getElementById('preview').toDataURL('image/png').split(',')[1];",
    );
    fs.writeFileSync(
      path.join(out, name + ".png"),
      Buffer.from(pixels, "base64"),
    );
  };
  async function key(type, keyCode) {
    win.webContents.sendInputEvent({ type, keyCode });
    await wait(30);
  }
  try {
    await win.loadFile(path.join(__dirname, "index.html"));
    const deadline = Date.now() + 10000;
    while (
      !(await win.webContents.executeJavaScript(
        "Boolean(window.russiaPrototype?.ready)",
      ))
    ) {
      if (Date.now() > deadline)
        throw Error("Prototype load timeout " + errors.join("\n"));
      await wait(50);
    }
    await evaluate("g.pause();");
    assert.equal(await evaluate("return g.rig.parts.length;"), 14);
    await snapshot("russia-prototype-idle");
    await key("keyDown", "D");
    assert.equal(await evaluate("return g.state.keys.has('KeyD');"), true);
    await evaluate("g.step(.5);");
    assert.ok(await evaluate("return g.state.player.x>570;"));
    await snapshot("russia-prototype-run");
    await key("keyUp", "D");
    await evaluate("g.step(.2);");
    assert.equal(await evaluate("return g.state.player.vx;"), 0);
    await key("keyDown", "A");
    await evaluate("g.step(.2);");
    assert.equal(await evaluate("return g.state.player.facing;"), -1);
    await evaluate("window.dispatchEvent(new Event('blur'));g.step(.2);");
    assert.equal(await evaluate("return g.state.keys.size;"), 0);
    assert.equal(await evaluate("return g.state.player.vx;"), 0);
    await key("keyUp", "A");
    await key("keyDown", "W");
    await evaluate("g.step(.2);");
    assert.equal(await evaluate("return g.state.player.grounded;"), false);
    assert.ok(await evaluate("return g.state.player.y<660;"));
    await snapshot("russia-prototype-jump");
    await key("keyDown", "W");
    await evaluate("g.step(1.2);");
    assert.equal(await evaluate("return g.state.player.y;"), 760);
    assert.equal(await evaluate("return g.state.player.grounded;"), true);
    await evaluate("g.step(.2);");
    assert.equal(await evaluate("return g.state.player.grounded;"), true);
    await key("keyUp", "W");
    await key("keyDown", "W");
    await evaluate("g.step(.1);");
    assert.equal(await evaluate("return g.state.player.grounded;"), false);
    await key("keyUp", "W");
    await evaluate("g.step(1.2);");
    for (const [keyCode, name, time] of [
      ["F", "jab", 0.15],
      ["G", "kick", 0.33],
      ["H", "heavy", 0.49],
    ]) {
      await evaluate("g.state.player.x=1030;g.state.player.facing=1;");
      const hits = await evaluate("return g.state.dummy.hits;");
      await key("keyDown", keyCode);
      await evaluate(`g.step(${time});`);
      await snapshot("russia-prototype-" + name);
      await evaluate("g.step(2);");
      assert.equal(await evaluate("return g.state.dummy.hits;"), hits + 1);
      await key("keyDown", keyCode);
      await evaluate("g.step(1);");
      assert.equal(
        await evaluate("return g.state.dummy.hits;"),
        hits + 1,
        "held key repeats",
      );
      await key("keyUp", keyCode);
    }
    for (const [x, facing] of [
      [190, -1],
      [1410, 1],
    ]) {
      await evaluate(`g.state.player.x=${x};g.state.player.facing=${facing};`);
      await key("keyDown", "H");
      await evaluate("g.step(.49);");
      await snapshot("russia-prototype-edge-" + facing);
      await evaluate("g.step(1);");
      await key("keyUp", "H");
    }
    const contact = await win.webContents.executeJavaScript(`(async()=>{
      const g=window.russiaPrototype,{sample}=await import('./combat.mjs'),{drawRig}=await import('./rig-renderer.mjs');
      const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=870;const c=canvas.getContext('2d');c.fillStyle='#242b32';c.fillRect(0,0,1600,870);
      for(let i=0;i<24;i++) {
        const clip=i<8?'run':i<12?'jab':i<16?'heavy':'jump',phase=i<8?i/8:i>=16?(i-16)/7:(clip==='heavy'?[0,.30,.52,.85]:[0,.18,.34,.85])[i%4];const x=i%8*200+100,y=Math.floor(i/8)*290+260;
        c.strokeStyle='#53606a';c.beginPath();c.moveTo(x-95,y);c.lineTo(x+95,y);c.stroke();
        c.save();c.translate(x,y);c.scale(.57,.57);drawRig(c,g.texture,g.rig,sample(g.rig,clip,phase*g.rig.clips[clip].duration),0,0,1);c.restore();
        c.fillStyle='#cbd0d6';c.font='14px Arial';c.textAlign='center';c.fillText(clip+' '+phase.toFixed(2),x,y+22);
      }return canvas.toDataURL('image/png').split(',')[1];})()`);
    fs.writeFileSync(
      path.join(out, "russia-animation-contact-sheet.png"),
      Buffer.from(contact, "base64"),
    );
    // Capture actual sequential renderer frames as a short animation preview.
    const video = await win.webContents.executeJavaScript(`(async()=>{
      const g=window.russiaPrototype,c=document.getElementById('preview'),stream=c.captureStream(0),track=stream.getVideoTracks()[0],chunks=[];
      const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      const done=new Promise(r=>recorder.onstop=r);g.state.player.x=360;g.state.player.facing=1;g.state.player.attack=null;g.state.keys.clear();g.press('KeyD');recorder.start();
      for(let i=0;i<150;i++){if(i===25)g.press('KeyW');if(i===26)g.release('KeyW');if(i===75)g.release('KeyD');if(i===90){g.state.player.x=1030;g.press('KeyH');}g.step(1/30);track.requestFrame();await new Promise(r=>setTimeout(r,34));}
      recorder.stop();await done;track.stop();const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let str='';for(const b of bytes)str+=String.fromCharCode(b);return btoa(str);
    })()`);
    fs.writeFileSync(
      path.join(out, "russia-animation-preview.webm"),
      Buffer.from(video, "base64"),
    );
    for (const [width, height] of [
      [1600, 900],
      [960, 600],
    ]) {
      win.setContentSize(width, height);
      await wait(80);
      const ratio = await evaluate(
        "const r=document.getElementById('preview').getBoundingClientRect();return r.width/r.height;",
      );
      assert.ok(Math.abs(ratio - 16 / 9) < 0.01);
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        parts: 14,
        clips: 6,
        nativeInput: "A/D/W/F/G/H, jump/landing/repress, blur, hold, edges",
        hits: await evaluate("return g.state.dummy.hits;"),
        video: "russia-animation-preview.webm",
        errors,
      }),
    );
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
