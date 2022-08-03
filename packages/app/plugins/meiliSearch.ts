import { MeiliSearch } from 'meilisearch'

export default defineNuxtPlugin(() => {
	const meiliSearch = new MeiliSearch({
		host: 'http://127.0.0.1:7700',
		apiKey: 'MASTER_KEY',
	})

	return {
		provide: {
			meiliSearch,
		},
	}
})
