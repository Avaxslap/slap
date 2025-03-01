<script>
	import "../app.css";
	import HeaderNavigation from "$lib/components/HeaderNavigation.svelte";
	import ConnectX from "$lib/components/ConnectX.svelte";
    import * as config from "$lib/config";

	let { children } = $props();
</script>

<div class="flex min-h-screen w-full flex-col bg-muted/40">
	<HeaderNavigation />
	<main class="flex-grow px-4 sm:px-6 md:px-8 py-4">
		{@render children()}
	</main>
</div>

<svelte:head>
	<title>{config.APP_TITLE}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>