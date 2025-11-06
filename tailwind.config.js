module.exports = {
	content: ["./src/**/*.{html,js,jsx,ts,tsx}"],  // Aggiunto supporto per più estensioni di file
	darkMode: 'class', // Attivo il supporto per il tema dark di Tailwind
	theme: {
		extend: {
			inset: {
				'center-custom': '0px',
			},
			colors: {
				primary: {
					light: '#6DB2FF',
					DEFAULT: '#4F7AFF',
					dark: '#456be0'
				},
				secondary: {
					light: '#7DE7D8',
					DEFAULT: '#4AC7B7',
					dark: '#41afa1'
				},
				tertiary: {
					light: '#A594FF',
					DEFAULT: '#7B68EE',
					dark: '#6c5bd1'
				}
			},
			borderRadius: {
				'xl': '1rem',
				'2xl': '1.5rem',
			},
			boxShadow: {
				'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.05)',
				'card': '0 2px 10px 0 rgba(0, 0, 0, 0.03), 0 1px 4px 0 rgba(0, 0, 0, 0.04)'
			},
			animation: {
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in': 'slide-in 0.3s ease-out'
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'slide-in': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				}
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #4F7AFF 0%, #6DB2FF 100%)',
				'gradient-secondary': 'linear-gradient(135deg, #4AC7B7 0%, #7DE7D8 100%)',
				'gradient-tertiary': 'linear-gradient(135deg, #7B68EE 0%, #A594FF 100%)'
			},
			typography: {
				DEFAULT: {
					css: {
						color: '#000000',
						a: {
							color: '#456be0',
							'&:hover': {
								color: '#4F7AFF',
							},
							textDecoration: 'none',
							fontWeight: '600',
						},
						h1: {
							color: '#000000',
						},
						h2: {
							color: '#000000',
						},
						h3: {
							color: '#000000',
						},
						h4: {
							color: '#000000',
						},
						blockquote: {
							borderLeftColor: '#6DB2FF',
						},
						'code::before': {
							content: '""',
						},
						'code::after': {
							content: '""',
						},
					},
				},
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
			'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
			'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
		function ({ addUtilities, addComponents }) {
			const newUtilities = {
				'.center-custom': {
					'inset': '0px',
				},
				'.font-size-control': {
					'font-size': 'var(--current-font-size)',
					'line-height': 'var(--current-line-height)',
				},
				'.text-gradient-primary': {
					'background-image': 'linear-gradient(135deg, #4F7AFF 0%, #6DB2FF 100%)',
					'color': 'transparent',
					'-webkit-background-clip': 'text',
					'background-clip': 'text'
				},
				'.card-modern': {
					'background-color': 'white',
					'border-radius': '0.75rem',
					'box-shadow': '0 2px 10px 0 rgba(0, 0, 0, 0.03), 0 1px 4px 0 rgba(0, 0, 0, 0.04)',
					'overflow': 'hidden',
					'transition': 'transform 0.2s, box-shadow 0.2s'
				},
				'.card-modern:hover': {
					'transform': 'translateY(-2px)',
					'box-shadow': '0 4px 14px 0 rgba(0, 0, 0, 0.05)'
				}
			}

			addUtilities(newUtilities, ['responsive', 'hover'])
		}
	],
}