const { app, BrowserWindow } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

app.whenReady().then(async () => {
  const errors = [];
  const window = new BrowserWindow({
    show: false,
    width: 1600,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
  window.webContents.on("console-message", (details, level, message) => {
    const severity = details.level ?? level;
    if (severity === "error" || severity === 3)
      errors.push(details.message ?? message);
  });
  try {
    await window.loadFile(path.join(__dirname, "index.html"));
    const end = Date.now() + 10000;
    while (
      !(await window.webContents.executeJavaScript(
        "Boolean(window.russiaPreview?.ready)",
      ))
    ) {
      if (Date.now() > end)
        throw Error("Preview did not load: " + errors.join("\n"));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const actors = await window.webContents.executeJavaScript(
      "window.russiaPreview.actors",
    );
    assert.equal(actors.length, 2);
    for (const a of actors) {
      assert.ok(
        a.transparentPixels > a.width * a.height * 0.2,
        a.file + " alpha",
      );
      assert.ok(
        a.bounds.y > 0 && a.bounds.y + a.bounds.h < a.height,
        a.file + " hat/boots clipped",
      );
      const displayWidth = (a.bounds.w / a.bounds.h) * 490;
      assert.ok(
        a.x - displayWidth / 2 > 0 && a.x + displayWidth / 2 < 1200,
        a.file + " screen bounds",
      );
    }
    for (const [width, height] of [
      [1600, 900],
      [960, 600],
    ]) {
      window.setContentSize(width, height);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const dimensions = await window.webContents.executeJavaScript(
        `(()=>{const b=document.getElementById('preview').getBoundingClientRect();return {width:b.width,height:b.height,left:b.left,top:b.top};})()`,
      );
      assert.ok(Math.abs(dimensions.width / dimensions.height - 16 / 9) < 0.01);
      assert.ok(dimensions.left >= 0 && dimensions.top >= 0);
    }
    const png = await window.webContents.executeJavaScript(
      "document.getElementById('preview').toDataURL('image/png').split(',')[1]",
    );
    const out = path.join(
      __dirname,
      "..",
      "..",
      "artifacts",
      "verification",
      "russia-models.png",
    );
    fs.writeFileSync(out, Buffer.from(png, "base64"));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ actors, screenshot: out }));
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
