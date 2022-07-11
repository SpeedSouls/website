<script setup lang="ts">
const { $directus } = useNuxtApp()

const { data } = useAsyncData(`sidebar_items`, () =>
	$directus.items('sidebar_items').readByQuery({
		fields: ['title', 'page.slug', 'page.title'],
	})
)
</script>

<template>
	<div class="relative flex min-h-screen flex-col bg-base-200/50">
		<Navbar class="min-h-16 fixed border-b" />
		<div class="container mx-auto grid flex-grow grid-cols-12 gap-3 pt-16">
			<div class="col-span-2">
				<div
					v-if="data"
					class="sticky top-16 pt-3"
				>
					<ul class="menu menu-compact border bg-base-100">
						<li v-for="item in data.data">
							<NuxtLink :to="`/${(item.page as any).slug}`">{{
								item.title || (item.page as any).title
							}}</NuxtLink>
						</li>
					</ul>
				</div>
			</div>
			<div class="col-span-10 col-start-3">
				<slot />
			</div>
		</div>
		<div class="border-t">
			<Footer />
		</div>
	</div>
</template>
