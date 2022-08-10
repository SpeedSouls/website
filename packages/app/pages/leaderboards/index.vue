<script setup lang="ts">
const { DIRECTUS_URL } = useRuntimeConfig()
const { $directus } = useNuxtApp()

const { data } = $(
	useAsyncData(`games`, () => $directus.items('games').readByQuery())
)
</script>

<template>
	<div
		v-if="data"
		class="mt-3 grid grid-cols-3 gap-3"
	>
		<NuxtLink
			v-for="game in data.data"
			:key="game.id"
			:to="`/leaderboards/${game.speedruncom}`"
			class="aspect-video overflow-hidden relative"
		>
			<img
				class="object-cover w-full object-center"
				:src="`${DIRECTUS_URL}/assets/${game.background}?height=250`"
				alt="Shoes"
			/>
			<div
				class="absolute inset-0 bg-black/30 flex items-center justify-center"
			>
				<h2 class="text-white font-bold text-lg">{{ game.name }}</h2>
			</div>
		</NuxtLink>
	</div>
</template>
