#!/usr/bin/env node

console.log('🧹 Cleaning Markup state...\n');

const stateMessage = `
This script will help you reset Markup to a fresh state.

To clear the app state, you need to manually clear localStorage in your browser:

1. Open Markup in development mode: npm run tauri dev
2. Open DevTools (Right-click > Inspect or F12)
3. Go to the "Application" tab (Chrome/Edge) or "Storage" tab (Firefox)
4. Find "Local Storage" in the sidebar
5. Click on your app's origin (usually http://localhost:1420)
6. Look for these keys:
   - markup_app_state
   - markup_filesystem
   - markup_first_run_complete
7. Right-click each key and select "Delete" or click the "Clear All" button

Alternatively, run this in the browser console:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
localStorage.removeItem('markup_app_state');
localStorage.removeItem('markup_filesystem');
localStorage.removeItem('markup_first_run_complete');
location.reload();
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Then refresh the page to see the fresh first-run experience! ✨
`;

console.log(stateMessage);
