<script setup lang="ts">
import { MeiliSearch, SearchResponse } from 'meilisearch'
import { onStartTyping, watchPausable, whenever } from '@vueuse/core'
import { SearchIcon, XIcon } from '@heroicons/vue/solid'
import { pages } from '.prisma/client'
import Action from './Action.vue'

const client = new MeiliSearch({
	host: 'http://127.0.0.1:7700',
	apiKey: 'MASTER_KEY',
})

let response = $ref<SearchResponse<pages>>()
let query = $ref('')
let selectedIndex = $ref(0)
let input = $ref<HTMLInputElement>(null)

const props = withDefaults(
	defineProps<{
		open?: boolean
	}>(),
	{
		open: false,
	}
)

const { pause, resume } = watchPausable(
	() => query,
	async (value) => {
		selectedIndex = 0

		const tmp = (await client
			.index<pages>('pages')
			.search(value)) as SearchResponse<pages>

		if (tmp.query !== value) return
		response = tmp
	},
	{ immediate: true }
)

const emit = defineEmits(['update:open'])

function close() {
	emit('update:open', false)
}

function up() {
	if (!response) return
	selectedIndex = Math.max(0, selectedIndex - 1)
}

function down() {
	if (!response) return
	selectedIndex = Math.min(response.nbHits - 1, selectedIndex + 1)
}

const router = useRouter()

function enter() {
	const hit = response?.hits?.[selectedIndex]
	if (!hit) return

	router.push(`/${hit.slug}`)
	close()
}

function reset() {
	query = ''
	input?.focus()
}

function onClickOutside() {
	if (!props.open) return
	close()
}

onStartTyping(() => {
	if (!props.open) return
	input?.focus()
})

whenever(
	() => props.open,
	() => {
		resume()
		selectedIndex = 0
	},
	{ immediate: true }
)

whenever(
	() => !props.open,
	() => {
		pause()
		query = ''
		response = null
	},
	{ immediate: true }
)

whenever(
	() => input,
	(value) => {
		if (props.open) value?.focus()
	}
)
</script>

<template>
	<Modal
		v-if="props.open"
		class="items-start pt-24 shadow-lg"
		@update:open="emit('update:open', $event)"
		close-on-escape
		open
	>
		<ModalBox
			@click-outside="onClickOutside"
			class="rounded p-0"
		>
			<div class="flex flex-col gap-3 p-3">
				<div
					class="flex h-12 w-full items-center rounded border border-primary px-3 gap-1"
				>
					<SearchIcon class="h-5 w-5 text-primary" />
					<input
						v-model="query"
						:ref="(el: HTMLInputElement) => (input = el)"
						class="flex-grow bg-transparent outline-none"
						placeholder="Search"
						@keydown.up="up"
						@keydown.down="down"
						@keydown.enter="enter"
					/>
					<XIcon
						v-show="query"
						@click="reset"
						class="m-1 h-5 w-5 cursor-pointer hover:text-accent"
					/>
				</div>
				<ul class="menu gap-1">
					<li
						v-for="(hit, i) in response?.hits"
						class="rounded border shadow transition-none"
						:class="{ 'bg-primary text-primary-content': selectedIndex === i }"
						@mouseenter="selectedIndex = i"
					>
						<NuxtLink
							:to="`/${hit.slug}`"
							@click="close"
						>
							{{ hit.title }}
						</NuxtLink>
					</li>
				</ul>
				<div
					v-if="response?.hits.length === 0 && query"
					class="mb-6 text-center text-base-content/50"
				>
					No results for "<span class="text-base-content">{{ query }}</span
					>"
				</div>
			</div>
			<Action />
		</ModalBox>
	</Modal>
</template>

<style lang="postcss" scoped>
.action {
	box-shadow: 0 -1px 0 0 #e0e3e8, 0 -3px 6px 0 rgba(69, 98, 155, 0.12);
}
</style>
