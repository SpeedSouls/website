<script setup lang="ts">
const { $directus } = useNuxtApp()

const { data } = useAsyncData(`pages`, () =>
	$directus.items('page').readByQuery()
)
</script>

<template>
	<ul v-if="data">
		<li v-for="d in data.data">
			<NuxtLink :to="`/${d.id}`">{{ d.id }}</NuxtLink>
		</li>
	</ul>
</template>
