const fs = require('fs');
const path = require('path');

// SVG data for the icon
const svgData = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#grad1)" stroke="#E5E7EB" stroke-width="2"/>
  
  <!-- Person silhouette -->
  <circle cx="64" cy="45" r="12" fill="white" opacity="0.9"/>
  <path d="M 40 85 Q 40 65 64 65 Q 88 65 88 85" fill="white" opacity="0.9"/>
  
  <!-- Form/document icon -->
  <rect x="75" y="35" width="25" height="30" rx="2" fill="white" opacity="0.8"/>
  <line x1="80" y1="45" x2="95" y2="45" stroke="#4F46E5" stroke-width="1.5"/>
  <line x1="80" y1="50" x2="95" y2="50" stroke="#4F46E5" stroke-width="1.5"/>
  <line x1="80" y1="55" x2="90" y2="55" stroke="#4F46E5" stroke-width="1.5"/>
  
  <!-- Security shield -->
  <path d="M 64 25 L 75 30 L 75 40 Q 75 50 64 55 Q 53 50 53 40 L 53 30 Z" fill="white" opacity="0.7"/>
  <path d="M 64 30 L 70 33 L 70 40 Q 70 45 64 48 Q 58 45 58 40 L 58 33 Z" fill="#4F46E5"/>
</svg>`;

// Function to create a simple PNG-like file (base64 encoded SVG)
function createIconFile(size, filename) {
    // Create a simple colored square as a placeholder
    const simpleSvg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#4F46E5"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="${size/4}">SP</text>
    </svg>`;
    
    // For now, we'll create a simple text file that represents the icon
    // In a real scenario, you'd use a library like sharp or canvas to generate actual PNGs
    fs.writeFileSync(filename, simpleSvg);
    console.log(`Created ${filename}`);
}

// Generate icons for different sizes
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
    createIconFile(size, `icon${size}.png`);
});

console.log('Icon files created successfully!');
console.log('Note: These are placeholder SVG files. For production, you should convert them to actual PNG files.'); 