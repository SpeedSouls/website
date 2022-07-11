<script setup lang="ts">
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
			class="card image-full rounded-none bg-base-100 shadow-xl before:!rounded-none"
		>
			<figure>
				<img
					class="object-cover"
					:src="`http://localhost:8055/assets/${game.background}?height=250`"
					alt="Shoes"
				/>
			</figure>
			<div class="card-body flex items-center justify-center">
				<h2 class="card-title">{{ game.name }}</h2>
			</div>
		</NuxtLink>
	</div>
</template>
