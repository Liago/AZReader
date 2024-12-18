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