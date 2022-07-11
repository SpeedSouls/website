<script setup lang="ts">
const route = useRoute()
const props = defineProps<{ game: any }>()

const category =
	typeof route.params.category === 'string'
		? route.params.category
		: route.params.category[0]

const { data: leaderboard } = useAsyncData<any>(
	`leaderboard/${props.game.data.id}/${category}`,
	() =>
		$fetch(
			`https://www.speedrun.com/api/v1/leaderboards/${props.game.data.id}/category/${category}`
		)
)
</script>

<template>
	<table
		v-if="leaderboard"
		class="table-compact table w-full border"
	>
		<tbody>
			<tr>
				<td colspan="999">
					{{ leaderboard.data.weblink }}
				</td>
			</tr>
			<tr
				v-for="row in leaderboard.data.runs"
				:key="row.id"
			>
				<td>
					{{ row.place }}
				</td>
				<td>
					{{ row.run.weblink }}
				</td>
			</tr>
		</tbody>
	</table>
</template>
