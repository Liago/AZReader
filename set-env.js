const fs = require('fs');

const environmentFile = `export const endpoint = {
	parser: '${process.env.PARSER_ENDPOINT}',
	api: '${process.env.API_ENDPOINT}',
	firebase_auth: '${process.env.FIREBASE_AUTH}',
  	test_mode: ${process.env.DEBUG},
	};
	
	export const api_keys = {
		FIREBASE_API_KEY: '${process.env.FIREBASE_API_KEY}',
	}
`;

fs.writeFile('./src/config/environment.ts', environmentFile, function (err) {
	if (err) {
		throw console.error(err);
	} else {
		console.log(`React environment.ts file generated`);
	}
});