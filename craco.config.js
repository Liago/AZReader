const path = require('path');

module.exports = {
	webpack: {
		alias: {
			'@common': path.resolve(__dirname, 'src/common'),
			'@components': path.resolve(__dirname, 'src/components'),
			'@config': path.resolve(__dirname, 'src/config'),
			'@context': path.resolve(__dirname, 'src/context'),
			'@css': path.resolve(__dirname, 'src/css'),
			'@hooks': path.resolve(__dirname, 'src/hooks'),
			'@pages': path.resolve(__dirname, 'src/pages'),
			"@store': path.resolve(__dirname, 'src/store'),
			'@theme': path.resolve(__dirname, 'src/theme'),
			'@utility': path.resolve(__dirname, 'src/utility'),
			'@ui': path.resolve(__dirname, 'src/ui')
		}
	}
};