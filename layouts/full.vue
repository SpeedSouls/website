<script setup lang="ts">
import { useEventListener, useThrottleFn } from '@vueuse/core'

let transparent = $ref(true)

function update() {
	transparent = window.scrollY < 10
}

useEventListener('scroll', useThrottleFn(update, 33))
onMounted(update)
</script>

<template>
	<div class="relative flex min-h-screen flex-col bg-base-200/50">
		<Navbar
			class="min-h-16 fixed"
			:transparent="transparent"
		/>
		<div class="flex-grow grid-cols-12 gap-3">
			<slot />
		</div>
		<div class="border-t">
			<Footer />
		</div>
	</div>
</template>
