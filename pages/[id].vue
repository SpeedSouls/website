<script setup lang="ts">
const { $directus } = useNuxtApp()
const route = useRoute()

const { data } = useAsyncData(`page-${route.params.id}`, () =>
	$directus.items('page').readOne(route.params.id as string)
)
</script>

<template>
	<Page
		v-if="data"
		:page="data"
	/>
</template>
