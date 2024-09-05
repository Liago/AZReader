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
	appId: "io.ionic.starter",
	appName: "AZReader",
	webDir: "build",
	bundledWebRuntime: false,
	plugins: {
		CapacitorHttp: {
			enabled: true,
		},
	},
	android: {
		intentFilters: [
			{
				action: "VIEW",
				autoVerify: true,
				data: [
					{
						scheme: "azreader",
						host: "auth",
						pathPrefix: "/confirm",
					},
				],
				category: ["BROWSABLE", "DEFAULT"],
			},
		],
	},
	ios: {
		scheme: "azreader",
	},
};

export default config;
