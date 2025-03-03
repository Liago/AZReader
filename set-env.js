const fs = require('fs');

const environmentFile = `

	export const endpoint = {
		parser: '${process.env.CORS_PROXY}/${process.env.PARSER_ENDPOINT}',
		RAPID_API_KEY: '${process.env.RAPID_API_KEY}',
		api: '${process.env.API_ENDPOINT}',
		firebase_auth: '${process.env.FIREBASE_AUTH}',
		test_mode: ${process.env.DEBUG},
	};
	
	export const api_keys = {
		FIREBASE_API_KEY: '${process.env.FIREBASE_API_KEY}',
	}

	export const firebase = {
		AUTH_DOMAIN: '${process.env.FIREBASE_AUTH_DOMAIN}',
		DB_URL: '${process.env.FIREBASE_DB_URL}',
		PROJECT_ID: '${process.env.FIREBASE_PROJECT_ID}',
		STORAGE_BUCKET: '${process.env.FIREBASE_STORAGE_BUCKET}',
		SENDER_ID: '${process.env.FIREBASE_SENDER_ID}',
		APP_ID: '${process.env.FIREBASE_APP_ID}',
	}

	export const supabaseDb = {
		SUPA_URL: '${process.env.SUPABASE_URL}',
		SUPA_KEY: '${process.env.SUPABASE_KEY}',
	}

`;

fs.writeFile('./src/config/environment.ts', environmentFile, function (err) {
	if (err) {
		throw console.error(err);
	} else {
		console.log(`React environment.ts file generated`);
	}
});