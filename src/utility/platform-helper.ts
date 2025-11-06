import { Capacitor } from "@capacitor/core";

export class PlatformHelper {
	static isNative(): boolean {
		return Capacitor.isNativePlatform();
	}

	static isIOS(): boolean {
		return Capacitor.getPlatform() === "ios";
	}

	static isAndroid(): boolean {
		return Capacitor.getPlatform() === "android";
	}

	static isWeb(): boolean {
		return Capacitor.getPlatform() === "web";
	}
}

export default PlatformHelper;
