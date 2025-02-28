<script>

    import ResultsTable from "$lib/components/ResultsTable.svelte";
    import Play from "$lib/components/Play.svelte";
    import Chat from "$lib/components/Chat.svelte";

</script>

<div class="container mx-auto px-4">
    <div class="flex gap-4 flex-col md:flex-row">
        <div class="md:w-3/5 space-y-4">
            <div class="w-full">
                <Play />
            </div>

            <div class="w-full">
                <ResultsTable />
            </div>
        </div>

        <div class="md:w-2/5">
            <Chat />
        </div>
    </div>
</div>