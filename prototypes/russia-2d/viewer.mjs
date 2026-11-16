import { drawTrainingDummy } from "../../src/rendering/training-dummy.js";

const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");
const floor = 760;
const variants = [
  { name: "СПОРТИВНАЯ ФОРМА", file: "russia-classic.png", x: 340 },
  { name: "МЕХОВАЯ КУРТКА", file: "russia-coat.png", x: 890 },
];

async function loadActor(variant) {
  const image = new Image();
  image.src = new URL("./assets/" + variant.file, import.meta.url).href;
  await image.decode();
  const surface = document.createElement("canvas");
  surface.width = image.naturalWidth;
  surface.height = image.naturalHeight;
  const sample = surface.getContext("2d", { willReadFrequently: true });
  sample.drawImage(image, 0, 0);
  const pixels = sample.getImageData(0, 0, surface.width, surface.height).data;
  let left = surface.width,
    top = surface.height,
    right = -1,
    bottom = -1,
    transparent = 0;
  for (let y = 0; y < surface.height; y++)
    for (let x = 0; x < surface.width; x++) {
      const alpha = pixels[(y * surface.width + x) * 4 + 3];
      if (alpha === 0) transparent++;
      if (alpha < 32) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  if (right < left || transparent === 0)
    throw Error("У изображения нет прозрачного фона: " + variant.file);
  const bounds = { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
  return {
    ...variant,
    image,
    bounds,
    transparentPixels: transparent,
    width: surface.width,
    height: surface.height,
  };
}

function text(value, x, y, size = 20, color = "#c7cdd3") {
  ctx.fillStyle = color;
  ctx.font = `${size}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(value, x, y);
}
function render(actors) {
  ctx.fillStyle = "#242b32";
  ctx.fillRect(0, 0, 1600, 900);
  ctx.fillStyle = "#2d363e";
  ctx.fillRect(0, floor, 1600, 140);
  ctx.strokeStyle = "#49555d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floor);
  ctx.lineTo(1600, floor);
  ctx.stroke();
  ctx.strokeStyle = "#39434b";
  ctx.lineWidth = 1;
  for (let x = -400; x < 2000; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, floor);
    ctx.lineTo(800 + (x - 800) * 1.3, 900);
    ctx.stroke();
  }
  text("РОССИЯ · ДВЕ МОДЕЛИ", 800, 75, 32, "#edf0ef");
  for (const actor of actors) {
    const { bounds: b } = actor,
      height = 490,
      width = (b.w / b.h) * height;
    ctx.fillStyle = "#10161a66";
    ctx.beginPath();
    ctx.ellipse(actor.x, floor + 5, width * 0.32, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(
      actor.image,
      b.x,
      b.y,
      b.w,
      b.h,
      actor.x - width / 2,
      floor - height,
      width,
      height,
    );
    text(actor.name, actor.x, 210, 21);
  }
  drawTrainingDummy(ctx, 1350, floor - 12, 2.1);
  text("МАНЕКЕН", 1350, 210, 21);
  text(
    "В полный рост · одинаковая высота · прозрачные игровые изображения",
    800,
    820,
    18,
  );
  text(
    "Следующий этап после выбора: скелет, бег и атаки в Blender",
    800,
    858,
    17,
    "#929ea7",
  );
}

try {
  const actors = await Promise.all(variants.map(loadActor));
  render(actors);
  window.russiaPreview = {
    ready: true,
    actors: actors.map(({ image, ...data }) => data),
    render: () => render(actors),
  };
} catch (error) {
  document.getElementById("error").hidden = false;
  document.getElementById("error").textContent =
    "Не удалось открыть модели: " + error.message;
  console.error(error);
}
