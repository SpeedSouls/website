<template>
	<div class="relative flex min-h-screen flex-col bg-base-200/50">
		<Navbar class="min-h-16 fixed border-b" />
		<div class="container mx-auto flex-grow pt-16">
			<slot />
		</div>
	</div>
</template>
