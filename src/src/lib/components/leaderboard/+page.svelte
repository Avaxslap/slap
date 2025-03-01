<script>
    import * as Card from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";
    import * as format from "$lib/format";
    import { Button } from "$lib/components/ui/button";
    import * as slapflip from "$lib/contracts/slapflip";
    import { onMount } from "svelte";
    import { getUserByAddress } from "$lib/helpers/users";
    import X_ICON from "$lib/assets/x-icon.png";

    let leaderboard = $state([]);
    let loading = $state(true);
    let displayCount = $state(20);
    let userCache = $state({});
    let error = $state("");

    const loadLeaderboard = async () => {
        try {
            loading = true;
            error = "";
            const data = await slapflip.getLeaderboard(displayCount);
            
            // Map the leaderboard data
            const mappedData = await Promise.all(
                data.map(async (entry) => {
                    try {
                        const stats = await slapflip.getPlayerStats(entry.player);
                        return {
                            address: entry.player,
                            slapped: entry.slapped,
                            stats
                        };
                    } catch (err) {
                        console.error(`Error getting stats for ${entry.player}:`, err);
                        return {
                            address: entry.player,
                            slapped: entry.slapped,
                            stats: {
                                slapped: BigInt(0),
                                slaps: BigInt(0),
                                won: BigInt(0),
                                lost: BigInt(0),
                                wagered: BigInt(0)
                            }
                        };
                    }
                })
            );
            
            leaderboard = mappedData;
            
            // Load user data for all addresses
            await loadUserData(leaderboard);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            error = "Failed to load leaderboard. Please try again.";
        } finally {
            loading = false;
        }
    };
    
    // Load user data for all addresses
    const loadUserData = async (entries) => {
        const addresses = new Set();
        
        // Collect all unique addresses
        entries.forEach(entry => {
            if (entry && entry.address) {
                addresses.add(entry.address.toLowerCase());
            }
        });
        
        // Create a batch of promises for all addresses
        const fetchPromises = Array.from(addresses).map(async (address) => {
            try {
                const user = await getUserByAddress(address);
                if (user) {
                    // Update the cache with the user data
                    userCache[address] = user;
                }
            } catch (error) {
                console.error(`Error fetching user for ${address}:`, error);
            }
        });
        
        // Wait for all user data to be fetched
        await Promise.all(fetchPromises);
        
        // Force reactivity update by creating a new object
        userCache = {...userCache};
    };
    
    // Display username or address
    function displayUser(address) {
        if (!address) return {
            html: "Unknown",
            name: "Unknown"
        };
        
        const lowerAddress = address.toLowerCase();
        const user = userCache[lowerAddress];
        
        if (user && user.twitterUsername) {
            return {
                html: `<a href="https://x.com/${user.twitterUsername}" class="font-semibold flex items-center gap-1" target="_blank">
                    <img src="${X_ICON}" alt="X" class="w-4 h-4" />
                    ${user.twitterUsername}
                </a>`,
                name: user.twitterUsername
            };
        }
        return {
            html: format.address(address),
            name: format.address(address)
        };
    }

    onMount(() => {
        loadLeaderboard();
        // Refresh every 30 seconds
        const interval = setInterval(loadLeaderboard, 30000);
        return () => clearInterval(interval);
    });
</script>

<div class="container mx-auto py-4">
    <Card.Root>
        <Card.Header>
            <Card.Title>Slapboard</Card.Title>
            <Card.Description>Top slapped players</Card.Description>
        </Card.Header>
        <Card.Content class="overflow-x-auto">
            {#if loading && leaderboard.length === 0}
                <div class="flex justify-center p-4">
                    <span>Loading...</span>
                </div>
            {:else if error}
                <div class="p-4 text-center text-destructive">
                    <p>{error}</p>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onclick={loadLeaderboard} 
                        class="mt-2"
                    >
                        Try Again
                    </Button>
                </div>
            {:else}
                <div class="rounded-lg overflow-hidden border min-w-[700px] md:min-w-0">
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
                            {#each leaderboard as entry, i}
                                {@const user = displayUser(entry.address)}
                                <Table.Row class="border-l border-r {i === leaderboard.length - 1 ? 'border-b' : ''} {i % 2 === 0 ? 'bg-muted/50' : ''}">
                                    <Table.Cell class="font-bold">{i + 1}</Table.Cell>
                                    <Table.Cell>{@html user.html}</Table.Cell>
                                    <Table.Cell>{format.wei(entry.slapped)}</Table.Cell>
                                    <Table.Cell>{entry.stats.won.toString()}</Table.Cell>
                                    <Table.Cell>{entry.stats.lost.toString()}</Table.Cell>
                                    <Table.Cell>{format.wei(entry.stats.wagered)}</Table.Cell>
                                </Table.Row>
                            {/each}
                            }
                            {#if leaderboard.length === 0}
                                <Table.Row class="border-l border-r border-b">
                                    <Table.Cell colspan="6" class="text-center text-muted-foreground">
                                        No players yet
                                    </Table.Cell>
                                </Table.Row>
                            {/if}
                            }
                        </Table.Body>
                    </Table.Root>
                </div>
            {/if}
            }
        </Card.Content>
        <Card.Footer>
            <Button 
                variant="outline" 
                size="sm" 
                onclick={loadLeaderboard} 
                disabled={loading}
                class="ml-auto"
            >
                {loading ? 'Loading...' : 'Refresh'}
            </Button>
        </Card.Footer>
    </Card.Root>
</div>