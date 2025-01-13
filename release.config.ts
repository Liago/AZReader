import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);

const releaseConfig = {
	branches: ["dev", "master"],
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
				prepareCmd: `
		  # Update iOS version
		  /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString \${nextRelease.version}" ios/App/App/Info.plist
		  /usr/libexec/PlistBuddy -c "Set :CFBundleVersion \${nextRelease.version}" ios/App/App/Info.plist
		  
		  # Update Android version
		  sed -i '' 's/versionName "[^"]*"/versionName "\${nextRelease.version}"/' android/app/build.gradle
		  
		  # Calculate Android version code (remove dots and convert to integer)
		  VERSION_CODE=$(echo \${nextRelease.version} | sed 's/\\.//g')
		  sed -i '' 's/versionCode [0-9]*/versionCode '\${VERSION_CODE}'/' android/app/build.gradle
		`,
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

export default releaseConfig;
