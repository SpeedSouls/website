<script lang="ts">
export default defineComponent({
	inheritAttrs: false,
})
</script>

<script setup lang="ts">
import {
	templateRef,
	useMagicKeys,
	useScrollLock,
	whenever,
} from '@vueuse/core'

const dialog = templateRef('dialog')

const props = withDefaults(
	defineProps<{
		open?: boolean
		closeOnEscape?: boolean
	}>(),
	{
		open: false,
		closeOnEscape: false,
	}
)

const emit = defineEmits(['update:open'])

let { escape } = $(useMagicKeys())
let isLocked = $(useScrollLock(document.body, props.open))

whenever(() => escape && props.open, close)

watch(
	() => props.open,
	(v) => {
		isLocked = v
	},
	{ immediate: true }
)

function close() {
	emit('update:open', false)
}
</script>

<template>
	<Teleport to="body">
		<div
			v-bind="$attrs"
			ref="modal"
			class="modal"
			:class="{
				'modal-open': open,
			}"
		>
			<slot />
		</div>
	</Teleport>
</template>
