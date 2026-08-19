# MenoCompass product media

## Video

- `menocompass-app-preview-iphone.mp4` — 29-second App Store preview, 886×1920, H.264, 30 fps, AAC stereo.
- `menocompass-product-demo-vertical.mp4` — 29-second 1080×1920 version for landing pages and social posts.
- `menocompass-preview-poster.png` — poster-frame candidate captured at five seconds.
- `menocompass-demo-contact-sheet.jpg` — visual storyboard showing the complete demo flow.

The demo uses real MenoCompass interface captures and synthetic demonstration data. It does not depict features that are absent from the app.

## Screenshots

- iPhone storefront set: `../iphone-6.5/`
- iPad storefront set: `../ipad-12.9/`
- Raw interface captures: `../raw/` (generated locally and ignored by Git)

## Storyboard

1. Daily symptom and treatment context
2. 30- and 90-day trends
3. Medication and lab tracking
4. Clinician-ready reports
5. Evidence-graded guidance
6. Privacy-first close

Regenerate everything with:

```sh
npm run build
npm run screenshots:store
npm run demo:product
```
