import { Directus } from '@directus/sdk'
import type { Pages, Games, Sidebar_Items } from '@speedsouls/api'

type Colletions = {
	pages: Pages
	games: Games
	sidebar_items: Sidebar_Items
}

export default defineNuxtPlugin(() => {
	const directus = new Directus<Colletions>('http://localhost:8055')

	return {
		provide: {
			directus,
		},
	}
})
