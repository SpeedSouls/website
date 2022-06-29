import { Directus } from '@directus/sdk'

type Page = {
	id: number
	body: string
}

type Colletions = {
	page: Page
}

export default defineNuxtPlugin(() => {
	const directus = new Directus<Colletions>('http://localhost:8055')

	return {
		provide: {
			directus,
		},
	}
})
