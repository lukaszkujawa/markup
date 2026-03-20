#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../docs');
const targetDir = path.join(__dirname, '../public/docs');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Get all markdown files from source
const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.md'));

// Copy each file
files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✓ Copied ${file} to public/docs/`);
});

console.log(`\n📄 Copied ${files.length} documentation file(s)\n`);
