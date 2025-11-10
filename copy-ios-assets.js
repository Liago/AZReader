const fs = require('fs');
const path = require('path');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const copyFile = (src, dest) => {
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied: ${path.basename(dest)}`);
};

function copyIOSAssets() {
  console.log('🍎 Copying assets to iOS project...\n');

  const iosAssetsPath = 'ios/App/App/Assets.xcassets';
  const iconsPath = 'resources/generated/icons';
  const splashPath = 'resources/generated/splash';

  // Create AppIcon.appiconset directory and Contents.json
  const appIconPath = path.join(iosAssetsPath, 'AppIcon.appiconset');
  ensureDir(appIconPath);

  // iOS icon sizes mapping
  const iosIcons = [
    { size: '20x20', scale: '2x', file: 'icon-40.png', filename: 'AppIcon-20x20@2x.png' },
    { size: '20x20', scale: '3x', file: 'icon-60.png', filename: 'AppIcon-20x20@3x.png' },
    { size: '29x29', scale: '2x', file: 'icon-58.png', filename: 'AppIcon-29x29@2x.png' },
    { size: '29x29', scale: '3x', file: 'icon-87.png', filename: 'AppIcon-29x29@3x.png' },
    { size: '40x40', scale: '2x', file: 'icon-80.png', filename: 'AppIcon-40x40@2x.png' },
    { size: '40x40', scale: '3x', file: 'icon-120.png', filename: 'AppIcon-40x40@3x.png' },
    { size: '60x60', scale: '2x', file: 'icon-120.png', filename: 'AppIcon-60x60@2x.png' },
    { size: '60x60', scale: '3x', file: 'icon-180.png', filename: 'AppIcon-60x60@3x.png' },
    { size: '76x76', scale: '1x', file: 'icon-76.png', filename: 'AppIcon-76x76@1x.png' },
    { size: '76x76', scale: '2x', file: 'icon-152.png', filename: 'AppIcon-76x76@2x.png' },
    { size: '83.5x83.5', scale: '2x', file: 'icon-167.png', filename: 'AppIcon-83.5x83.5@2x.png' },
    { size: '1024x1024', scale: '1x', file: 'icon-1024.png', filename: 'AppIcon-1024x1024@1x.png' },
  ];

  console.log('🎨 Copying app icons...');
  iosIcons.forEach(({ file, filename }) => {
    const iconSrc = path.join(iconsPath, file);
    const iconDest = path.join(appIconPath, filename);

    if (fs.existsSync(iconSrc)) {
      copyFile(iconSrc, iconDest);
    } else {
      // Use closest size available
      const fallbackSrc = path.join(iconsPath, 'icon-180.png');
      if (fs.existsSync(fallbackSrc)) {
        copyFile(fallbackSrc, iconDest);
      }
    }
  });

  // Create Contents.json for AppIcon
  const appIconContents = {
    images: iosIcons.map(({ size, scale, filename }) => ({
      size,
      idiom: size === '1024x1024' ? 'ios-marketing' :
             (size === '76x76' || size === '83.5x83.5') ? 'ipad' : 'iphone',
      filename,
      scale,
    })),
    info: {
      version: 1,
      author: 'xcode',
    },
  };

  fs.writeFileSync(
    path.join(appIconPath, 'Contents.json'),
    JSON.stringify(appIconContents, null, 2)
  );
  console.log('✓ Created Contents.json for AppIcon');

  // Create Splash.imageset directory and Contents.json
  const splashImagePath = path.join(iosAssetsPath, 'Splash.imageset');
  ensureDir(splashImagePath);

  console.log('\n🎨 Copying splash screens...');

  // Copy splash screen images
  const splashFiles = [
    { src: 'splash-2732x2732.png', dest: 'splash-2732x2732.png', scale: '3x' },
    { src: 'splash-1668x2388.png', dest: 'splash-1668x2388.png', scale: '2x' },
    { src: 'splash-1242x2688.png', dest: 'splash-1242x2688.png', scale: '1x' },
  ];

  splashFiles.forEach(({ src, dest }) => {
    const splashSrc = path.join(splashPath, src);
    const splashDest = path.join(splashImagePath, dest);

    if (fs.existsSync(splashSrc)) {
      copyFile(splashSrc, splashDest);
    }
  });

  // Create Contents.json for Splash
  const splashContents = {
    images: splashFiles.map(({ dest, scale }) => ({
      idiom: 'universal',
      filename: dest,
      scale,
    })),
    info: {
      version: 1,
      author: 'xcode',
    },
  };

  fs.writeFileSync(
    path.join(splashImagePath, 'Contents.json'),
    JSON.stringify(splashContents, null, 2)
  );
  console.log('✓ Created Contents.json for Splash');

  console.log('\n✅ iOS assets copied successfully!\n');
}

try {
  copyIOSAssets();
} catch (error) {
  console.error('❌ Error copying assets:', error);
  process.exit(1);
}
