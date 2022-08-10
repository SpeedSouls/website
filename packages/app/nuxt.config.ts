import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
	css: ['@/assets/tailwind.css'],
	build: {
		transpile: ['@heroicons/vue'],
	},
	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},
	runtimeConfig: {
		DIRECTUS_URL: process.env.DIRECTUS_URL,
		MEILI_URL: process.env.MEILI_URL,
		MEILI_API_KEY: process.env.MEILI_API_KEY,
	},
	experimental: {
		reactivityTransform: true,
	},
})
