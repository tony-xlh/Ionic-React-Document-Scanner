import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.company.appname',
  appName: 'My Capacitor App',
  webDir: 'build',
  android:{
    allowMixedContent:true
  },
  server:{
    androidScheme:"http"
  }
};

export default config;