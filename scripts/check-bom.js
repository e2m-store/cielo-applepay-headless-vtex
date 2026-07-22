const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'packages/applepay-core/package.json',
  'packages/applepay-adapter-vtex/package.json',
  'packages/applepay-react/package.json',
];

const withBom = [];

for (const relativePath of filesToCheck) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const content = fs.readFileSync(fullPath);
  const hasBom = content.length >= 3 && content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf;

  if (hasBom) {
    withBom.push(relativePath);
  }
}

if (withBom.length > 0) {
  console.error('BOM detected in package manifest(s):');
  for (const file of withBom) {
    console.error(`- ${file}`);
  }
  console.error('Please save these files as UTF-8 without BOM before publishing.');
  process.exit(1);
}

console.log('No BOM detected in package manifests.');
