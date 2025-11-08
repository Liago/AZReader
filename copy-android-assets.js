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

function copyAndroidAssets() {
  console.log('📱 Copying assets to Android project...\n');

  const androidResPath = 'android/app/src/main/res';
  const iconsPath = 'resources/generated/icons';
  const splashPath = 'resources/generated/splash';

  // Create mipmap directories and copy icons
  const mipmapSizes = [
    { dir: 'mipmap-hdpi', size: '72' },
    { dir: 'mipmap-mdpi', size: '48' },
    { dir: 'mipmap-xhdpi', size: '96' },
    { dir: 'mipmap-xxhdpi', size: '144' },
    { dir: 'mipmap-xxxhdpi', size: '192' },
  ];

  console.log('🎨 Copying app icons...');
  mipmapSizes.forEach(({ dir, size }) => {
    const mipmapPath = path.join(androidResPath, dir);
    ensureDir(mipmapPath);

    const iconSrc = path.join(iconsPath, `icon-${size}.png`);
    const iconDest = path.join(mipmapPath, 'ic_launcher.png');
    const iconDestRound = path.join(mipmapPath, 'ic_launcher_round.png');
    const iconDestForeground = path.join(mipmapPath, 'ic_launcher_foreground.png');

    copyFile(iconSrc, iconDest);
    copyFile(iconSrc, iconDestRound);
    copyFile(iconSrc, iconDestForeground);
  });

  // Create drawable directories and copy splash screens
  const drawableDirs = [
    'drawable',
    'drawable-land-hdpi',
    'drawable-land-mdpi',
    'drawable-land-xhdpi',
    'drawable-land-xxhdpi',
    'drawable-land-xxxhdpi',
    'drawable-port-hdpi',
    'drawable-port-mdpi',
    'drawable-port-xhdpi',
    'drawable-port-xxhdpi',
    'drawable-port-xxxhdpi',
  ];

  console.log('\n🎨 Copying splash screens...');
  drawableDirs.forEach((dir) => {
    const drawablePath = path.join(androidResPath, dir);
    ensureDir(drawablePath);

    // Use the largest splash screen for all densities
    const splashSrc = path.join(splashPath, 'splash-2732x2732.png');
    const splashDest = path.join(drawablePath, 'splash.png');

    if (fs.existsSync(splashSrc)) {
      copyFile(splashSrc, splashDest);
    }
  });

  console.log('\n✅ Android assets copied successfully!\n');
}

try {
  copyAndroidAssets();
} catch (error) {
  console.error('❌ Error copying assets:', error);
  process.exit(1);
}
