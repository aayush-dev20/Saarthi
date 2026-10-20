import fs from 'fs';
import path from 'path';

const files = [
  'data-manager.js',
  'auth.js',
  'dashboard.js',
  'qr-scanner.js',
  'voice-commands.js',
  'main.js',
  'html5-qrcode.min.js',
  'style.css'
];

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

for (const file of files) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`Copied ${file} to dist/`);
  }
}
