<script setup lang="ts">
import { useMagicKeys, useToggle, whenever } from '@vueuse/core'
import { SearchIcon, SunIcon, MoonIcon } from '@heroicons/vue/solid'

const props = withDefaults(
	defineProps<{
		transparent?: boolean
	}>(),
	{
		transparent: false,
	}
)

let isDark = $(useDark())
const toggle = useToggle($$(isDark))
const { Command, K } = $(useMagicKeys())

let open = $ref(false)

whenever(
	() => Command && K,
	() => {
		open = !open
	}
)
</script>

<template>
	<div
		class="navbar z-50 bg-base-100"
		:class="{
			'border-b bg-opacity-100': !props.transparent,
			'bg-opacity-0': props.transparent,
		}"
	>
		<div class="container mx-auto flex gap-3">
			<NuxtLink
				to="/"
				class="btn btn-ghost no-animation rounded-none text-xl normal-case"
				:class="{
					'text-base-100': props.transparent,
				}"
				>SpeedSouls</NuxtLink
			>
			<div class="form-control">
				<button
					class="flex items-center gap-3 text-base-content/50 hover:text-base-content"
					@click.prevent="open = true"
				>
					<SearchIcon
						class="h-5 w-5"
						:class="{
							'text-base-100': props.transparent,
						}"
					/>
					<span
						class="text-sm"
						:class="{
							'text-base-100': props.transparent,
						}"
						>Search</span
					>
					<span
						class="flex gap-1 rounded border py-1 px-2 text-sm"
						:class="{
							'text-base-100': props.transparent,
						}"
					>
						<span>⌘</span>
						<span>K</span>
					</span>
				</button>
			</div>
			<div class="ml-auto flex items-center">
				<NuxtLink
					to="/leaderboards"
					class="btn btn-ghost no-animation rounded-none text-xl normal-case"
					:class="{
						'text-base-100': props.transparent,
					}"
					>Leaderboards</NuxtLink
				>
				<button
					@click="toggle()"
					:class="{ hidden: true }"
				>
					<SunIcon
						v-if="isDark"
						class="h-6 w-6"
						:class="{
							'text-base-100': props.transparent,
						}"
					/>
					<MoonIcon
						v-else
						class="h-6 w-6"
						:class="{
							'text-base-100': props.transparent,
						}"
					/>
				</button>
			</div>
		</div>
		<ModalsSearch
			:open="open"
			@update:open="open = $event"
		/>
	</div>
</template>
