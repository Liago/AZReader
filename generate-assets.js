const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');

// Ensure output directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Convert SVG to PNG
const convertSvg = (svgPath, outputPath, width, height) => {
  return new Promise((resolve, reject) => {
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    svg2img(svgContent, { width, height }, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        fs.writeFileSync(outputPath, buffer);
        console.log(`✓ Generated: ${outputPath} (${width}x${height})`);
        resolve();
      }
    });
  });
};

async function generateAssets() {
  console.log('🎨 Generating app assets...\n');

  // Icon sizes needed
  const iconSizes = [
    { size: 1024, name: 'icon-1024.png' },
    { size: 512, name: 'icon.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 180, name: 'icon-180.png' },
    { size: 167, name: 'icon-167.png' },
    { size: 152, name: 'icon-152.png' },
    { size: 144, name: 'icon-144.png' },
    { size: 128, name: 'icon-128.png' },
    { size: 120, name: 'icon-120.png' },
    { size: 96, name: 'icon-96.png' },
    { size: 87, name: 'icon-87.png' },
    { size: 80, name: 'icon-80.png' },
    { size: 76, name: 'icon-76.png' },
    { size: 72, name: 'icon-72.png' },
    { size: 64, name: 'favicon.png' },
    { size: 60, name: 'icon-60.png' },
    { size: 58, name: 'icon-58.png' },
    { size: 48, name: 'icon-48.png' },
    { size: 40, name: 'icon-40.png' },
  ];

  // Splash screen sizes needed
  const splashSizes = [
    { width: 2732, height: 2732, name: 'splash-2732x2732.png' },
    { width: 2048, height: 2732, name: 'splash-2048x2732.png' },
    { width: 1668, height: 2388, name: 'splash-1668x2388.png' },
    { width: 1536, height: 2048, name: 'splash-1536x2048.png' },
    { width: 1242, height: 2688, name: 'splash-1242x2688.png' },
    { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
    { width: 828, height: 1792, name: 'splash-828x1792.png' },
    { width: 750, height: 1334, name: 'splash-750x1334.png' },
    { width: 640, height: 1136, name: 'splash-640x1136.png' },
  ];

  try {
    // Generate icons
    console.log('📱 Generating app icons...');
    ensureDir('resources/generated/icons');

    const iconSvg = 'resources/icon.svg';
    for (const { size, name } of iconSizes) {
      await convertSvg(iconSvg, `resources/generated/icons/${name}`, size, size);
    }

    // Copy main icon to public
    fs.copyFileSync('resources/generated/icons/icon.png', 'public/assets/icon/icon.png');
    fs.copyFileSync('resources/generated/icons/favicon.png', 'public/assets/icon/favicon.png');
    console.log('\n✓ Icons copied to public/assets/icon/\n');

    // Generate splash screens
    console.log('🎨 Generating splash screens...');
    ensureDir('resources/generated/splash');

    const splashSvg = 'resources/splash.svg';
    for (const { width, height, name } of splashSizes) {
      await convertSvg(splashSvg, `resources/generated/splash/${name}`, width, height);
    }

    // Generate dark mode splash screens
    console.log('\n🌙 Generating dark mode splash screens...');
    ensureDir('resources/generated/splash-dark');

    const splashDarkSvg = 'resources/splash-dark.svg';
    for (const { width, height, name } of splashSizes) {
      await convertSvg(splashDarkSvg, `resources/generated/splash-dark/${name}`, width, height);
    }

    console.log('\n✅ All assets generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npx cap sync');
    console.log('   2. The assets will be copied to Android and iOS projects');
    console.log('   3. Build and test on your devices\n');

  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

generateAssets();
