<script>
    import ResultsTable from "$lib/components/ResultsTable.svelte";
    import Play from "$lib/components/Play.svelte";
    import Chat from "$lib/components/Chat.svelte";
    import ConnectX from "$lib/components/ConnectX.svelte";
</script>

<div class="container mx-auto">
    <ConnectX />
    
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        <div class="lg:col-span-7 space-y-4">
            <div class="w-full">
                <Play />
            </div>

            <div class="w-full">
                <ResultsTable />
            </div>
        </div>

        <div class="lg:col-span-5 h-[600px] md:h-[700px]">
            <Chat />
        </div>
    </div>
</div>