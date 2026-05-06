const fs = require('fs');
const path = require('path');

// A simple script to copy the image. Resizing without native deps is hard in Node, so we'll just copy it.
// The browser will scale it down.
const src = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\b8563550-f569-419b-90b1-eb98ab2746ce\\pos_app_icon_1777556578662.png';
const dest1 = 'd:\\project\\POSAI\\public\\pwa-192x192.png';
const dest2 = 'd:\\project\\POSAI\\public\\pwa-512x512.png';

fs.copyFileSync(src, dest1);
fs.copyFileSync(src, dest2);
console.log('Images copied successfully.');
