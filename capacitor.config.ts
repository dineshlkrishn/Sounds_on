import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soundson.musicplayer',
  appName: 'SoundsOn',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
