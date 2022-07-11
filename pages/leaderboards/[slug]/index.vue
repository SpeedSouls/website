<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const props = defineProps<{ game: any }>()

onMounted(() => {
	if (props.game.data.categories.data.length) {
		router.replace(
			`/leaderboards/${route.params.slug}/${props.game.data.categories.data[0].id}`
		)
	}
})
</script>

<template>
	<div>This game has no categories</div>
</template>
