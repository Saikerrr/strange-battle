# Россия: отдельный анимационный прототип

Запуск из корня: `npm run preview:russia`. A/D — бег, F — быстрый удар,
G — удар ногой, H — сильный удар. На поле только боец и неподвижный манекен.
Основная игра запускается по-прежнему через `npm start`.

Новый образ взят из `references/russia-animation-reference.png`, предоставленного
пользователем. Рисованный атлас содержит отдельные части; в Blender 5.3 собрана
настоящая armature с мешами/весами и пятью Actions. Canvas воспроизводит
вычисленные позиции костей из `assets/russia-rig.json`, не двигает целый PNG.

- `assets/russia-parts.png` — прозрачный атлас (встроенный image_gen).
- `assets/russia-rig.json` — 14 слоёв, 5 клипов, 119 экспортированных поз.
- `blender/russia-2d.blend` — редактируемая сцена, текстура упакована внутрь.
- `blender/build_russia.py` — создание сцены и авторских поз с нуля.
- `blender/export_russia.py` — экспорт открытой сцены после ручной правки поз.
- `combat.mjs` — фиксированный шаг, ввод, фазы атак и единственный контакт.
- `rig-renderer.mjs` — отрисовка слоёв по экспорту костей.

Бег: 360 px/s, шаг 216 px, фаза следует реально пройденному расстоянию.
Опорная подошва в полном цикле остаётся на одной мировой координате;
разгон/остановка смешиваются со стойкой. Длительности F/G/H — 13/30,
19/30 и 28/30 секунды, контакт около 34% / 52% / 52% клипа.
Манекен не перемещается, при попадании отклоняется от закреплённого основания.
Повтор от удерживания F/G/H не включён. Новых способностей/прыжка/ИИ нет.

Проверки: `npm run test:russia` и
`./node_modules/.bin/electron.cmd prototypes/russia-2d/verify.cjs`.
Последняя проверяет реальный ввод A/D/F/G/H, отпускание/blur, края поля,
попадания и отсутствие ошибок renderer; сохраняет PNG, контактный лист
и короткое `artifacts/verification/russia-animation-preview.webm`.

Сборка: `blender --background --python prototypes/russia-2d/blender/build_russia.py`.
Она создаёт сцену заново; ручные правки сохраняй в .blend, затем используй
`blender --background prototypes/russia-2d/blender/russia-2d.blend --python prototypes/russia-2d/blender/export_russia.py`.
В Blender выбери armature и нужную Action (idle/run/jab/kick/heavy).
Фон камеры прозрачный; источник PNG упакован, внешние платные расширения не нужны.

Это первый cutout-прототип: слои жёсткие, мимика и сложная деформация ткани
не проработаны покадрово. Сходство с референсом стилизованное. Человеческая
оценка плавности/читаемости и ощущения управления остаётся ручным плейтестом.

## Сохранённые изображения первого этапа

- `assets/russia-classic.png` — текущий костюм: ушанка, майка, шорты, красная обувь.
- `assets/russia-coat.png` — меховая куртка из меню, тёмные брюки и обувь.
- Обе картинки созданы встроенным image_gen, не CLI, 16 ноября 2026.
- Исходные PNG первого этапа сохранены без обработки, новый прототип их не использует.
- Манекен отрисовывается существующим `src/rendering/training-dummy.js`.

## Prompt: russia-classic.png

Use case: stylized-concept. Asset type: actual production 2D fighting-game character sprite, a single isolated full-body playable fighter PNG with genuine alpha transparency. This is the character image that will be displayed inside a game, not a concept sheet or illustration scene. Reference image 1: use ONLY the left normal-form Russia fighter's costume identity (fur ushanka, plain white athletic top, blue shorts, red boots); ignore the HUD, arena and right cyborg. Reference image 2: use ONLY the detailed hand-inked anime/comic art style and strong anatomy, not its costumes or environment. Draw an adult Russian male fighter, sturdy athletic realistic 7-head-tall proportions, strong legs and arms, short dark hair, stern expressive face. Outfit: grey-brown fur ushanka with a small red star, fitted plain white sleeveless athletic vest, blue boxing shorts, red mid-calf boxing boots, bare fists. Side-view fighting game camera, torso turned three-quarter toward camera, face and feet directed to screen right. Quiet neutral boxing guard with both fists at chest/chin height, elbows visibly separated from torso, knees slightly soft, feet shoulder-width apart and both soles on one horizontal baseline. Complete clean visible silhouette including every finger and both boots; no foreshortening, no weapon. Crisp ink outlines, controlled cel shading, carefully painted cloth and fur details, muted natural tones, even neutral lighting without colored rim light. No outlines around the whole cutout beyond natural line art. Center one character with 8 percent transparent margin all around; top of hat and bottoms of boots fully inside the frame. Portrait 2:3 composition. No background, no ground, no ground shadow, no text, no UI, no labels, no extra views, no other characters, no mock checkerboard, no watermark.

## Prompt: russia-coat.png

Use case: stylized-concept. Asset type: one actual production 2D fighting-game character sprite PNG with genuine alpha transparency. Input image 1 is the identity, exact body proportions, stance, camera and ink/cel-shaded rendering style reference: keep the SAME adult male face, dark hair, athletic build, full-body scale, right-facing three-quarter neutral boxing guard, fist positions and boots-on-one-baseline composition. Input image 2 is a COSTUME reference: ONLY the Russia fighter on the RIGHT wearing a fur-collared winter coat and fur ushanka. Make the alternate Russia playable character wearing that outfit: grey-brown fur ushanka with small red star, dark brown worn leather/shearling jacket with a large thick pale grey fur collar and fur cuffs, burgundy inner layer, dark blue full-length trousers, sturdy black leather winter boots. Jacket length around upper thighs; hem must leave both legs and knee joints easy to read. Bare fists, no weapon. Preserve clear clean separated silhouettes of limbs so this drawing can become an animated game actor. Crisp expressive anime/comic line art, careful cloth/leather/fur texture, strong believable anatomy, even neutral lighting, natural muted colors. One single complete full-body character, face and feet directed screen right, at rest with fists at chest/chin level, both soles grounded on one horizontal baseline. Keep an 8 percent TRANSPARENT margin all around; complete hat, fingers and both boots visible. Portrait 2:3 composition. Absolutely no background, no floor, no cast shadow, no aura, no haze, no glow, no colored backlight, no UI, no lettering, no other views, no other characters, no watermark, no fake checkerboard. This file is the isolated game character itself, not a poster or character design sheet.

