<script setup lang="ts">
const { DIRECTUS_URL } = useRuntimeConfig()
const { $directus } = useNuxtApp()

definePageMeta({
	layout: 'full',
})

const { data: games } = $(
	useAsyncData('game', async () =>
		$directus.items('games').readByQuery({
			limit: -1,
		})
	)
)

const randomGame = $computed(() => {
	if (!games?.data?.length) return
	const index = Math.floor(Math.random() * games?.data.length)
	return games.data[index]
})
</script>

<template>
	<div
		class="relative flex w-full items-center justify-center overflow-hidden bg-black"
	>
		<img
			class="max-h-screen min-h-[100vh] w-full scale-105 object-cover opacity-75 blur-sm"
			:src="`${DIRECTUS_URL}/assets/${randomGame?.background}`"
			alt=""
			lazy
		/>
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="card w-96 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Shoes!</h2>
					<p>If a dog chews shoes whose shoes does he choose?</p>
					<div class="card-actions justify-end">
						<button class="btn btn-primary">Buy Now</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
