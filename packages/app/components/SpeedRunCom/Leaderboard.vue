<script setup lang="ts">
import { games } from '@prisma/client'

const props = defineProps<{
	speedruncom: games['speedruncom']
}>()

const { data } = $(
	useFetch(
		`https://www.speedrun.com/api/v1/games/${props.speedruncom}?embed=categories`
	)
)

watchEffect(() => console.log(data))
</script>


