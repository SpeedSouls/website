<script setup lang="ts">
const route = useRoute()
const { $directus } = useNuxtApp()

watchEffect(() => console.log(route.params))

const slug =
	typeof route.params.slug === 'string'
		? route.params.slug
		: route.params.slug.join('/')

const { data: game, error } = useAsyncData<any>(`game-${slug}`, async () => {
	const games = await $directus.items('games').readByQuery({
		filter: {
			speedruncom: slug,
		},
		limit: 1,
	})

	if (!games.data.length) {
		throw new Error('game not found')
	}

	const game = games.data[0]

	const data = await $fetch(
		`https://www.speedrun.com/api/v1/games/${game.speedruncom}?embed=categories`
	)

	return data
})
</script>

<template>
	<div
		v-if="game"
		class="grid grid-cols-12 gap-3"
	>
		<aside class="col-span-2">
			<div class="sticky top-16 pt-3">
				<ul class="menu menu-compact border bg-base-100">
					<li
						v-for="category in game.data.categories.data"
						:key="category.id"
					>
						<NuxtLink :to="`/leaderboards/${slug}/${category.id}`">
							{{ category.name }}
						</NuxtLink>
					</li>
				</ul>
			</div>
		</aside>
		<div class="col-span-10 py-3">
			<NuxtPage :game="game" />
		</div>
	</div>
</template>
