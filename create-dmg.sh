#!/bin/bash
# Create a proper DMG installer after building

echo "Building app..."
npm run tauri build

echo "Creating DMG..."
rm -rf /tmp/markup-dmg
mkdir -p /tmp/markup-dmg
cp -R "src-tauri/target/release/bundle/macos/Markup.app" /tmp/markup-dmg/
ln -s /Applications /tmp/markup-dmg/Applications
hdiutil create -volname "Markup" -srcfolder /tmp/markup-dmg -ov -format UDZO "Markup_latest_aarch64.dmg"
rm -rf /tmp/markup-dmg

echo "✓ DMG created: Markup_latest_aarch64.dmg"
