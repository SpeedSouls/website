import { Directus } from '@directus/sdk'
import { Pages, Games, Sidebar_Items } from '@speedsouls/api'

export default defineNuxtPlugin((...test) => {
	const { DIRECTUS_URL } = useRuntimeConfig()

	const directus = new Directus<{
		pages: Pages
		games: Games
		sidebar_items: Sidebar_Items
	}>(DIRECTUS_URL as string)

	return {
		provide: {
			directus,
		},
	}
})
