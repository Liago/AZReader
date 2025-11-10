# App Icons and Splash Screens

This document explains how to generate and update app icons and splash screens for AZReader.

## Overview

AZReader uses custom-designed app icons and splash screens featuring an open book design with gradient brand colors:
- **Primary**: #4F7AFF (blue)
- **Secondary**: #4AC7B7 (teal)
- **Tertiary**: #7B68EE (purple)

## Files Structure

```
resources/
├── icon.svg                    # Source icon design (1024x1024)
├── splash.svg                  # Source splash screen (light mode)
├── splash-dark.svg             # Source splash screen (dark mode)
├── icon.png                    # Generated main icon (1024x1024)
├── splash.png                  # Generated main splash (2732x2732)
└── generated/
    ├── icons/                  # All generated icon sizes
    ├── splash/                 # Light mode splash screens
    └── splash-dark/            # Dark mode splash screens
```

## How to Regenerate Assets

If you modify the source SVG files, regenerate all assets:

### 1. Generate PNG images from SVG

```bash
node generate-assets.js
```

This creates all required icon and splash screen sizes in `resources/generated/`.

### 2. Copy assets to Android project

```bash
node copy-android-assets.js
```

This copies icons and splash screens to:
- `android/app/src/main/res/mipmap-*/` (icons)
- `android/app/src/main/res/drawable*/` (splash screens)

### 3. Copy assets to iOS project

```bash
node copy-ios-assets.js
```

This copies assets and generates Contents.json files for:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- `ios/App/App/Assets.xcassets/Splash.imageset/`

### 4. Sync with Capacitor

```bash
npx cap sync
```

### 5. Build and test

#### Android
```bash
npx cap run android
# or
npx cap build android
```

#### iOS
```bash
npx cap run ios
# or open in Xcode
npx cap open ios
```

## Icon Sizes Generated

The script generates icons in the following sizes:

**Android:**
- 48x48 (mdpi)
- 72x72 (hdpi)
- 96x96 (xhdpi)
- 144x144 (xxhdpi)
- 192x192 (xxxhdpi)

**iOS:**
- 40x40, 60x60, 58x58, 87x87, 80x80 (various @2x, @3x scales)
- 120x120, 180x180 (app icons)
- 76x76, 152x152, 167x167 (iPad)
- 1024x1024 (App Store)

**Web:**
- 512x512 (PWA)
- 192x192 (PWA)
- 64x64 (favicon)

## Splash Screen Sizes

Multiple sizes are generated to support different device screens:
- 2732x2732 (iPad Pro 12.9")
- 2048x2732 (iPad Pro 12.9" portrait)
- 1668x2388 (iPad Pro 11")
- 1536x2048 (iPad Pro 10.5")
- 1242x2688 (iPhone 11 Pro Max, XS Max)
- 1125x2436 (iPhone 11 Pro, X, XS)
- 828x1792 (iPhone 11, XR)
- 750x1334 (iPhone 8, 7, 6)
- 640x1136 (iPhone SE, 5)

## Splash Screen Configuration

### Web
The web splash screen is embedded in `public/index.html` with:
- Gradient background matching brand colors
- Floating book icon animation
- Loading dots animation
- Smooth fade-out transition
- Dark mode support via CSS media queries

### Native (Android/iOS)
Configured in `capacitor.config.ts`:
```typescript
SplashScreen: {
  launchShowDuration: 2000,
  launchAutoHide: true,
  launchFadeOutDuration: 500,
  backgroundColor: "#4F7AFF",
  // ... other settings
}
```

The native splash screen is controlled by the Capacitor SplashScreen plugin and automatically hides when the app is ready (see `src/App.tsx`).

## Modifying the Design

To change the icon or splash screen design:

1. Edit the SVG files in `resources/`:
   - `icon.svg` - App icon design
   - `splash.svg` - Light mode splash screen
   - `splash-dark.svg` - Dark mode splash screen

2. Run the regeneration scripts as described above

3. Test on both Android and iOS devices/simulators

## Troubleshooting

**Icons not updating on device:**
- Clear app data and reinstall
- For iOS: Clean build folder in Xcode (Cmd+Shift+K)
- For Android: `cd android && ./gradlew clean`

**Splash screen shows white screen:**
- Verify assets were copied correctly
- Check that `@capacitor/splash-screen` plugin is installed
- Ensure `capacitor.config.ts` has SplashScreen configuration
- Verify splash screen images exist in native projects

**Build errors:**
- Run `npx cap sync` again
- Check that all image files were generated correctly
- Verify Contents.json files exist for iOS assets
