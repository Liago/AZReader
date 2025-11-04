const fs = require('fs');

const environmentFile = `

	export const endpoint = {
		parser: '${process.env.CORS_PROXY}/${process.env.PARSER_ENDPOINT}',
		api: '${process.env.API_ENDPOINT}',
		test_mode: ${process.env.DEBUG},
	};

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