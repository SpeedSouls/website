<script setup lang="ts">
import { OnClickOutside } from '@vueuse/components'

const emit = defineEmits(['clickOutside'])
</script>

<template>
	<OnClickOutside
		class="modal-box"
		@trigger="emit('clickOutside')"
	>
		<slot />
	</OnClickOutside>
</template>
