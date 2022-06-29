<script setup lang="ts">
import { PartialItem } from '@directus/sdk'

type Page = {
	id: number
	body: string
}

const props = defineProps<{
	page: PartialItem<Page>
}>()

const currentSelection = ref<Element>()
const titles = ref<Element[]>([])

function scrollTo(el: Element) {
	el.scrollIntoView({
		behavior: 'smooth',
	})
}

onMounted(() => {
	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.intersectionRatio > 0) {
				currentSelection.value = entry.target
			}
		})
	})

	document.querySelectorAll('.prose h1').forEach((title) => {
		titles.value.push(title)
		observer.observe(title)
	})
})
</script>

<template>
	<ul class="fixed top-0 right-0 p-5">
		<li v-for="el in titles">
			<button
				@click="scrollTo(el)"
				:class="{
					'text-red-500': el === currentSelection,
				}"
				:href="`#${el.innerHTML}`"
				v-html="el.innerHTML"
			></button>
		</li>
	</ul>
	<div
		class="prose prose-a:text-blue-300 prose-li:m-0"
		v-html="props.page.body"
	/>
</template>
