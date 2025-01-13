import { CapacitorConfig } from "@capacitor/cli";

interface IntentFilter {
	action: string;
	autoVerify?: boolean;
	data: Array<{
		scheme: string;
		host: string;
		pathPrefix: string;
	}>;
	category: string[];
}

type ExtendedAndroidConfig = NonNullable<CapacitorConfig["android"]> & {
	intentFilters?: IntentFilter[];
};

interface ExtendedCapacitorConfig extends Omit<CapacitorConfig, "android"> {
	android?: ExtendedAndroidConfig;
}

const config: ExtendedCapacitorConfig = {
	appId: "liago.azreader",
	appName: "AZReader",
	webDir: "build",
	bundledWebRuntime: false,
	plugins: {
		CapacitorHttp: {
			enabled: true,
		},
	},
	ios: {
		scheme: "azreader",
		limitsNavigationsToAppBoundDomains: true,
		contentInset: "always",
		allowsLinkPreview: false,
		backgroundColor: "#ffffff", // Aggiunto questo
		preferredContentMode: "mobile", // Aggiunto questo
	},
};

export default config;
