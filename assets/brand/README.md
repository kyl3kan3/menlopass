# peri brand mark

The mark is the wordmark: `peri.` set in Fraunces italic (optical size 144, SOFT 30, WONK on), ink
on paper with a vermilion full stop. The same wordmark sits in the app's masthead, so the icon and
the product are one piece of type.

Files:

- `peri-icon-master.png` opaque 1024 × 1024, ink on paper (`#fbfbf9`): the iOS light icon and the web icons.
- `peri-icon-dark.png` opaque, paper on black: reference only.
- `peri-icon-tinted.png` opaque grayscale, white on black: the iOS tinted icon (the system colours it by luminance).
- `peri-mark-transparent.png` ink wordmark on transparent: splash (light), Android adaptive foreground.
- `peri-mark-paper.png` paper wordmark on transparent: the iOS dark icon (the system supplies the dark backdrop) and the dark splash.
- `peri-mark-mono.png` white wordmark on transparent: Android monochrome (themed) icon.

The masters are rendered from the real font through Chrome by `tools/render-brand-masters.cjs`;
`node mobile/scripts/generate-brand-assets.cjs` then packages the root PWA icons (`icon-192.png`,
`icon-512.png`, `maskable-512.png`, `favicon-64.png`, `apple-touch-icon.png`) and every native icon
under `mobile/assets/`. After a brand change run `python3 build.py`, `npm run mobile:sync` and
`npm run screenshots:store`.

The clinical and navigation symbols inside the app are functional icons, not brand marks.
