const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'assets');
const purple = '#6B4E71';
const cream = '#FAF8F4';
const white = '#FFFFFF';
const symbol = '✦';

function svgOverlay({ width, height, color }) {
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .symbol { fill: ${color}; font-family: sans-serif; font-weight: 900; }
      </style>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="symbol" font-size="${Math.round(Math.min(width, height) * 0.35)}">${symbol}</text>
    </svg>
  `;
}

async function createSvgImage({ width, height, background, symbolColor, output }) {
  const svg = svgOverlay({ width, height, color: symbolColor });
  const outputPath = path.join(assetsDir, output);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`Created ${output}`);
}

async function createSolidImage({ width, height, background, output }) {
  const outputPath = path.join(assetsDir, output);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background,
    },
  })
    .png()
    .toFile(outputPath);
  console.log(`Created ${output}`);
}

async function run() {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  await createSvgImage({
    width: 1024,
    height: 1024,
    background: purple,
    symbolColor: white,
    output: 'icon.png',
  });

  await createSvgImage({
    width: 1024,
    height: 1024,
    background: purple,
    symbolColor: white,
    output: 'adaptive-icon.png',
  });

  await createSvgImage({
    width: 1284,
    height: 2778,
    background: cream,
    symbolColor: purple,
    output: 'splash.png',
  });

  await createSolidImage({
    width: 32,
    height: 32,
    background: purple,
    output: 'favicon.png',
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
