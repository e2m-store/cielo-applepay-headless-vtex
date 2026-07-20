const fs = require('fs');
const path = require('path');

function fixBomInDirectory(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      fixBomInDirectory(itemPath);
    } else if (item.name === 'package.json') {
      try {
        let content = fs.readFileSync(itemPath, 'utf8');
        
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
          fs.writeFileSync(itemPath, content, 'utf8');
          console.log(`✓ BOM removed: ${itemPath}`);
        }
      } catch (err) {
        console.error(`✗ Error in ${itemPath}:`, err.message);
      }
    }
  }
}

const baseDir = path.resolve(__dirname, 'node_modules/@conectores_cielo');

if (fs.existsSync(baseDir)) {
  console.log(`Fixing BOM in ${baseDir}...`);
  fixBomInDirectory(baseDir);
  console.log('Done!');
} else {
  console.log(`Directory not found: ${baseDir}`);
}
