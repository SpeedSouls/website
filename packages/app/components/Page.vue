<script setup lang="ts">
import { Pages } from '@speedsouls/api'
import { templateRef } from '@vueuse/core'
import slugify from '@sindresorhus/slugify'
import { PartialItem } from '@directus/sdk'

const props = defineProps<{
	page: PartialItem<Pages>
}>()

let currentSelection = $ref<HTMLElement>()
let titles = $ref<HTMLElement[]>([])
let body = $(templateRef('body'))
const router = useRouter()

function scrollTo(el: HTMLElement) {
	const offset = 48 + 12 // todo dynamic

	window.location.hash = slugify(el.innerText)
	window.scrollTo({
		top: el.offsetTop - offset,
		behavior: 'auto',
	})
}

function handleClick(e: MouseEvent) {
	const el = e.target as HTMLAnchorElement

	if (e.ctrlKey || e.metaKey) return
	if (el.getAttribute('target') !== '_self') return
	if (!el.getAttribute('href')) return

	e.preventDefault()
	router.push(el.getAttribute('href'))
}

onMounted(() => {
	if (!body) return

	const observer = new IntersectionObserver(
		(entries) =>
			entries.forEach((entry) => {
				if (entry.intersectionRatio > 0) {
					currentSelection = entry.target as HTMLElement
				}
			}),
		{
			root: body,
			rootMargin: '64px',
		}
	)

	body.querySelectorAll('h1').forEach((title) => {
		titles.push(title)
		observer.observe(title)
	})
})

onMounted(() => {
	if (!body) return

	const links = body.querySelectorAll('a')
	const titles = body.querySelectorAll('h1')

	Array.from(links).forEach((link) => {
		link.addEventListener('click', handleClick)
	})

	Array.from(titles).forEach((title) => {
		title.addEventListener('click', () => {
			scrollTo(title)
		})
	})
})

onBeforeUnmount(() => {
	const links = body.querySelectorAll('a')

	Array.from(links).forEach((link) => {
		link.removeEventListener('click', handleClick)
	})
})
</script>

<template>
	<div class="grid grid-cols-10 gap-3 py-3">
		<div
			class="prose col-span-8 max-w-none border bg-base-100 px-10 py-3 prose-h1:my-6 prose-h1:cursor-pointer prose-li:m-0"
		>
			<div class="w-full border-b">
				<h1>{{ props.page.title }}</h1>
			</div>
			<div
				ref="body"
				v-html="props.page.body"
			></div>
		</div>
		<div class="col-span-2">
			<div class="sticky top-[4.75rem]">
				<ul class="menu menu-compact border bg-base-100">
					<li class="menu-title">
						<span>On this page</span>
					</li>
					<li v-for="el in titles">
						<button
							@click="scrollTo(el)"
							class="text-left"
							:class="{
								'text-red-500': el === currentSelection,
							}"
							:href="`#${el.innerHTML}`"
							v-html="el.innerHTML"
						></button>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.prose:deep(h1) {
	@apply relative;
	@apply border-b-2 border-dotted border-transparent hover:border-base-content;
	@apply inline-block;
}

.prose:deep(a) {
	@apply link link-primary text-primary;
}

.prose:deep(h1:hover::before) {
	content: '';
	@apply absolute left-0 -translate-x-full;
	@apply h-full w-6;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14' /%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: center;
	background-size: contain;
}
</style>
