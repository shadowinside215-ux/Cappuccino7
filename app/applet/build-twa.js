import {TwaManifest, TwaGenerator} from '@bubblewrap/core';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    const manifest = new TwaManifest({
      host: 'ais-pre-drrfdy3z666ibkpuuaut6t-614804442213.europe-west2.run.app',
      name: 'Cappuccino7',
      shortName: 'Cap7',
      startUrl: '/',
      iconUrl: 'https://ais-pre-drrfdy3z666ibkpuuaut6t-614804442213.europe-west2.run.app/pwa-512x512.png',
      themeColor: '#9c661c',
      backgroundColor: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      packageId: 'com.cappuccino7.app'
    });
    const generator = new TwaGenerator();
    await generator.generateTwaProject('./twa', manifest);
    console.log('Done generating TWA project');
  } catch (err) {
    console.error(err);
  }
}
main();
