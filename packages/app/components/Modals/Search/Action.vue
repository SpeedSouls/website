<script setup lang="ts">
import { ArrowUpIcon } from '@heroicons/vue/solid'
</script>

<template>
	<ModalAction
		class="action mt-3 flex h-11 items-center justify-start gap-3 px-3 text-base-content/50"
	>
		<span class="text-xs">
			<span class="mr-1 font-mono font-bold">enter</span> to select
		</span>
		<span class="flex items-center gap-1 text-xs">
			<ArrowUpIcon class="h-3" /> <ArrowUpIcon class="h-3 rotate-180" /> to
			navigate
		</span>
		<span class="text-xs">
			<span class="mr-1 font-mono font-bold">esc</span> to close
		</span>
	</ModalAction>
</template>
