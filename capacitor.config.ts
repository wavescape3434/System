import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.theguild.personal",
  appName: "The Guild",
  webDir: "dist",
  android: { backgroundColor: "#f5f3ed" },
  plugins: {
    SystemBars: { style: "LIGHT", insetsHandling: "css", initialViewportFitValueHint: "cover" },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
      logLevel: 1,
    },
  },
};
export default config;
