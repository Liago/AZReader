module.exports = {
	content: ["./src/**/*.{html,js,jsx,ts,tsx}"],  // Aggiunto supporto per più estensioni di file
	theme: {
		extend: {
			inset: {
				'center-custom': '0px',
			},
		},
		fontFamily: {
			gentium_book: ['"Gentium Book Basic"', 'serif'],
			lato: ['"Lato"', 'serif'],
			montserrat: ['"Montserrat"', 'sans-serif'],
			open_sans: ['"Open Sans"', 'sans-serif'],
			roboto: ['"Roboto Slab"', 'serif'],
		},
		fontSize: {
			'xs': ['0.75rem', { lineHeight: '1rem' }],
			'sm': ['0.875rem', { lineHeight: '1.25rem' }],
			'base': ['1rem', { lineHeight: '1.5rem' }],
			'lg': ['1.125rem', { lineHeight: '1.75rem' }],
			'xl': ['1.25rem', { lineHeight: '1.75rem' }],
			'2xl': ['1.5rem', { lineHeight: '2rem' }],
		},
	},
	plugins: [
		function ({ addUtilities }) {
			const newUtilities = {
				'.center-custom': {
					'inset': '0px',
				},
			}
			addUtilities(newUtilities, ['responsive', 'hover'])
		}
	],
}