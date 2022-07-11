<script setup lang="ts">
const { $directus } = useNuxtApp()
const route = useRoute()

definePageMeta({
	layout: 'wiki',
})

const slug =
	typeof route.params.slug === 'string'
		? route.params.slug
		: route.params.slug.join('/')

const { data, pending } = $(
	useAsyncData(`page-${slug}`, () =>
		$directus.items('pages').readByQuery({
			filter: {
				slug: {
					_eq: slug,
				},
			},
		})
	)
)
</script>

<template>
	<div>
		<div v-if="!data">Loading...</div>
		<Page
			v-else-if="data?.data.length"
			:page="data.data[0]"
		/>
		<div v-else>
			<div class="alert alert-error shadow-lg">
				<div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 flex-shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>Error! Task failed successfully.</span>
				</div>
			</div>
		</div>
	</div>
</template>
