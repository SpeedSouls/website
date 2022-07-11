<script setup lang="ts">
import { Games } from '@speedsouls/api'

const props = defineProps<{
	speedruncom: Games['speedruncom']
}>()

const { data } = $(
	useFetch(
		`https://www.speedrun.com/api/v1/games/${props.speedruncom}?embed=categories`
	)
)

watchEffect(() => console.log(data))
</script>
