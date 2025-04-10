import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', 'class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	fontFamily: {
  		sans: [
  			'Inter'
  		],
  		mono: [
  			'geist-mono'
  		],
  		nunito: [
  			'Nunito',
  			'sans-serif'
  		]
  	},
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			'dark-background': 'hsl(var(--dark-background))',
  			'accent-magenta': 'hsl(var(--accent-magenta))',
  			'accent-cyan': 'hsl(var(--accent-cyan))',
  			'dark-gray': 'hsl(var(--dark-gray))',
  			'light-gray': 'hsl(var(--light-gray))',
  			'lighter-gray': 'hsl(var(--lighter-gray))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			backgroundImage: {
  				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  			},
  			keyframes: {
  				'collapsible-down': {
  					from: {
  						height: '0'
  					},
  					to: {
  						height: 'var(--radix-collapsible-content-height)'
  					}
  				},
  				'collapsible-up': {
  					from: {
  						height: 'var(--radix-collapsible-content-height)'
  					},
  					to: {
  						height: '0'
  					}
  				}
  			},
  			animation: {
  				'collapsible-down': 'collapsible-down 0.2s ease-out',
  				'collapsible-up': 'collapsible-up 0.2s ease-out'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
			typography: () => ({
				DEFAULT: {
					css: {
						'--tw-prose-body': 'hsl(var(--foreground))',
						'--tw-prose-headings': 'hsl(var(--foreground))',
						'--tw-prose-links': 'hsl(var(--foreground))',
						'--tw-prose-bold': 'hsl(var(--foreground))',
						'--tw-prose-italic': 'hsl(var(--foreground))',
						'--tw-prose-underline': 'hsl(var(--foreground))',
						'--tw-prose-strikethrough': 'hsl(var(--foreground))',
						'--tw-prose-bullets': 'hsl(var(--foreground))',
						'--tw-prose-hr': 'hsl(var(--foreground))',
						'--tw-prose-quote-borders': 'hsl(var(--foreground))',
					}
				}
			})
  	}
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
export default config;
