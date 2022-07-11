import { Directus } from '@directus/sdk'
import { pages, games, sidebar_items } from '@prisma/client'

type Colletions = {
	pages: pages
	games: games
	sidebar_items: sidebar_items
}

export default defineNuxtPlugin(() => {
	const directus = new Directus<Colletions>('http://localhost:8055')

	return {
		provide: {
			directus,
		},
	}
})
