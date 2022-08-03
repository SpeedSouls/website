import { Directus,  } from '@directus/sdk'
import { Pages, Games, Sidebar_Items } from '@speedsouls/api'

export default defineNuxtPlugin(() => {
	const directus = new Directus<{
		pages: Pages
		games: Games
		sidebar_items: Sidebar_Items
	}>('http://localhost:8055')

	return {
		provide: {
			directus,
		},
	}
})
