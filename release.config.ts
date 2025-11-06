import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);

export default {
	branches: ["dev", "main"],
	plugins: [
		"@semantic-release/commit-analyzer",
		"@semantic-release/release-notes-generator",
		[
			"@semantic-release/changelog",
			{
				changelogFile: "CHANGELOG.md",
			},
		],
		"@semantic-release/npm",
		[
			"@semantic-release/exec",
			{
				prepareCmd:
					'/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${nextRelease.version}" ios/App/App/Info.plist && ' +
					'/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${nextRelease.version}" ios/App/App/Info.plist && ' +
					'sed -i "" -E "s/(versionName ).*/\\1\\"${nextRelease.version}\\"/" android/app/build.gradle && ' +
					'sed -i "" -E "s/(versionCode ).*/\\1$(echo ${nextRelease.version} | tr -d ".")/" android/app/build.gradle',
			},
		],
		[
			"@semantic-release/git",
			{
				assets: ["package.json", "package-lock.json", "CHANGELOG.md", "ios/App/App/Info.plist", "android/app/build.gradle"],
				message: "v${nextRelease.version}",
			},
		],
	],
};
