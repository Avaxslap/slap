<script>
    import * as Card from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";
    import * as format from "$lib/format";
    import { Button } from "$lib/components/ui/button";
    import * as slapflip from "$lib/contracts/slapflip";
    import { onMount } from "svelte";

    let leaderboard = $state([]);
    let loading = $state(true);
    let displayCount = $state(10);

    const loadLeaderboard = async () => {
        try {
            loading = true;
            const data = await slapflip.getLeaderboard(displayCount);
            leaderboard = await Promise.all(
                data.map(async (address) => {
                    const stats = await slapflip.getPlayerStats(address.player);
                    return {
                        address,
                        stats
                    };
                })
            );
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            loading = false;
        }
    };

    onMount(() => {
        loadLeaderboard();
        // Refresh every 30 seconds
        const interval = setInterval(loadLeaderboard, 30000);
        return () => clearInterval(interval);
    });
</script>

<div class="container mx-auto py-8">
    <Card.Root>
        <Card.Header>
            <Card.Title>Slapboard</Card.Title>
            <Card.Description>Top slapped players</Card.Description>
        </Card.Header>
        <Card.Content>
            {#if loading && leaderboard.length === 0}
                <div class="flex justify-center p-4">
                    <span>Loading...</span>
                </div>
            {:else}
                <div class="rounded-lg overflow-hidden border">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row class="bg-primary hover:bg-primary border-l border-r">
                                <Table.Head class="text-white font-semibold">Rank</Table.Head>
                                <Table.Head class="text-white font-semibold">Player</Table.Head>
                                <Table.Head class="text-white font-semibold">Slapped</Table.Head>
                                <Table.Head class="text-white font-semibold">Wins</Table.Head>
                                <Table.Head class="text-white font-semibold">Losses</Table.Head>
                                <Table.Head class="text-white font-semibold">Wagered</Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each leaderboard as { address, stats }, i}
                                <Table.Row class="border-l border-r {i === leaderboard.length - 1 ? 'border-b' : ''} {i % 2 === 0 ? 'bg-muted/50' : ''}">
                                    <Table.Cell class="font-bold">{i + 1}</Table.Cell>
                                    <Table.Cell>{format.address(address.player)}</Table.Cell>
                                    <Table.Cell>{format.wei(stats.slapped)}</Table.Cell>
                                    <Table.Cell>{stats.won.toString()}</Table.Cell>
                                    <Table.Cell>{stats.lost.toString()}</Table.Cell>
                                    <Table.Cell>{format.wei(stats.wagered)}</Table.Cell>
                                </Table.Row>
                            {/each}
                            {#if leaderboard.length === 0}
                                <Table.Row class="border-l border-r border-b">
                                    <Table.Cell colspan="6" class="text-center text-muted-foreground">
                                        No players yet
                                    </Table.Cell>
                                </Table.Row>
                            {/if}
                        </Table.Body>
                    </Table.Root>
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
</div>