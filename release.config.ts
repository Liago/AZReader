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
		],
		[
			"@semantic-release/git",
			{
				assets: ["package.json", "package-lock.json", "CHANGELOG.md"],
				message: "v${nextRelease.version}",
			},
		],
	],
};
