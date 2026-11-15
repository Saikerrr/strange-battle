# Графика Ability Draft

Два runtime-ассета созданы встроенным `image_gen` по прямому запросу пользователя,
15 ноября 2026. CLI/API fallback не использовался. PNG сохранены без обработки.
`background.png` — фон 1672×941, вписывается в Canvas 1600×900.
`card.png` — рамка 1086×1448 с настоящим alpha снаружи, тёмной серединой;
используется на карточках, кнопках и выборе моделей. Текст/иконки рисует игра.

## Prompt: background.png

Use case: stylized-concept. Asset type: runtime background for the Ability Draft screen in Strange Battle, a gritty illustrated country fighting game. Create a wide 16:9 landscape game background, 1600x900 composition. An underground boxing club converted into a tactical selection room: dark charcoal and muted plum metal, worn concrete, cables, soft industrial overhead lamps, subtle warm brass details. Painterly comic / detailed pixel-inspired illustration consistent with an arcade fighting game. Keep the central 75 percent very dark, quiet and spacious for three large interactive skill cards and readable UI. Interesting environmental details stay along left/right edges and upper corners. This is an EMPTY BACKGROUND only: no UI frames, no buttons, no lettering, no numbers, no people, no flags, no logos, no watermark. Deliver one finished game-ready raster image.

## Prompt: card.png

Use case: stylized-concept. Asset type: reusable vertical UI skill card frame texture for the Ability Draft screen of Strange Battle, gritty illustrated arcade fighter. One single front-facing rectangular card, aspect ratio 3:4, isolated on a genuinely transparent background. Worn dark charcoal steel, clipped angular corners, layered bevels, restrained muted violet edge accents, subtle brass bolts, hand-painted illustrated texture. Large recessed nearly black inner area, mostly smooth and quiet, for game-rendered skill icon, title and short description. Border width about 5 percent of card. Orthographic flat UI artwork, no perspective, no environment, no lettering, no icons, no characters, no logos, no watermark, no other cards. Show complete frame with a little transparent margin on every side. Actual alpha transparency outside the card.
