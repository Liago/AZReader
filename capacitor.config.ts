import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "io.ionic.starter",
	appName: "AZReader",
	webDir: "build",
	bundledWebRuntime: false,
	server: { iosScheme: "ionic" },
};

export default config;
