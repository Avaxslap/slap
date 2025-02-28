<script>
    import * as Card from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";
    import * as format from "$lib/format";
    import { Button } from "$lib/components/ui/button";
    import * as slapflip from "$lib/contracts/slapflip";
    import { onMount } from "svelte";
    import { getUserByAddress } from "$lib/helpers/users";

    import X_ICON from "$lib/assets/x-icon.png";
    
    let pendingSlaps = $state([]);
    let fulfilledSlaps = $state([]);
    let loading = $state(true);
    let displayCount = $state(10);
    let userCache = $state({});  // Changed to a plain object for easier reactivity

    const loadSlaps = async () => {
        try {
            loading = true;
            const [pending, fulfilled] = await Promise.all([
                slapflip.getRecentPendingSlaps(displayCount),
                slapflip.getRecentFulfilledSlaps(displayCount)
            ]);
            
            // Format slaps
            pendingSlaps = pending.map(slapflip.formatSlapStatus);
            fulfilledSlaps = fulfilled.map(slapflip.formatSlapStatus);
            
            // Load user data for all addresses
            await loadUserData([...pendingSlaps, ...fulfilledSlaps]);
        } catch (error) {
            console.error('Failed to load slaps:', error);
        } finally {
            loading = false;
        }
    };
    
    // Load user data for all addresses in slaps
    const loadUserData = async (slaps) => {
        const addresses = new Set();
        
        // Collect all unique addresses
        slaps.forEach(slap => {
            addresses.add(slap.player.toLowerCase());
            addresses.add(slap.slappee.toLowerCase());
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
        console.log('Updated user cache:', userCache);
    };
    
    // Display username or address
    const displayUser = (address) => {
        const lowerAddress = address.toLowerCase();
        const user = userCache[lowerAddress];
        
        if (user && user.twitterUsername) {
            return `<a href="https://x.com/${user.twitterUsername}" class="font-semibold flex items-center gap-1" target="_blank">
                <img src="${X_ICON}" alt="X" class="w-4 h-4" />
                ${user.twitterUsername}
            </a>`;
        }
        return format.address(address);
    };

    onMount(async () => {
        await loadSlaps();
        // Refresh every 15 seconds
        const interval = setInterval(loadSlaps, 15000);
        return () => clearInterval(interval);
    });
</script>

<!-- Rest of the component remains the same -->

<div class="flex flex-col gap-4">
    {#if !loading && pendingSlaps.length > 0}
        <Card.Root>
            <Card.Header>
                <Card.Title>Pending Slaps</Card.Title>
            </Card.Header>
            <Card.Content>
                <div class="rounded-lg overflow-hidden border">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row class="bg-primary hover:bg-primary border-l border-r">
                                <Table.Head class="text-white font-semibold">Player</Table.Head>
                                <Table.Head class="text-white font-semibold">Slapped</Table.Head>
                                <Table.Head class="text-white font-semibold">Amount</Table.Head>
                                <Table.Head class="text-white font-semibold">Type</Table.Head>
                                <Table.Head class="text-white font-semibold">Status</Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each pendingSlaps as slap, i}
                                <Table.Row class="border-l border-r {i === pendingSlaps.length - 1 ? 'border-b' : ''} {i % 2 === 0 ? 'bg-warning/5' : 'bg-warning/10'}">
                                    <Table.Cell>{@html displayUser(slap.player)}</Table.Cell>
                                    <Table.Cell>{@html displayUser(slap.slappee)}</Table.Cell>
                                    <Table.Cell>{format.wei(slap.amount)}</Table.Cell>
                                    <Table.Cell>{slap.tokenType === 0 ? 'AVAX' : 'SLAP'}</Table.Cell>
                                    <Table.Cell>PENDING</Table.Cell>
                                </Table.Row>
                            {/each}
                        </Table.Body>
                    </Table.Root>
                </div>
            </Card.Content>
        </Card.Root>
    {/if}

    <Card.Root>
        <Card.Header>
            <Card.Title>Recent Slaps</Card.Title>
        </Card.Header>
        <Card.Content>
            {#if loading && fulfilledSlaps.length === 0}
                <div class="flex justify-center p-4">
                    <span>Loading...</span>
                </div>
            {:else}
                <div class="rounded-lg overflow-hidden border">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row class="bg-primary hover:bg-primary border-l border-r">
                                <Table.Head class="text-white font-semibold">Player</Table.Head>
                                <Table.Head class="text-white font-semibold">Slapped</Table.Head>
                                <Table.Head class="text-white font-semibold">Amount</Table.Head>
                                <Table.Head class="text-white font-semibold">Swing</Table.Head>
                                <Table.Head class="text-white font-semibold">Result</Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each fulfilledSlaps as slap, i}
                                <Table.Row 
                                    class={`border-l border-r ${i === fulfilledSlaps.length - 1 ? 'border-b' : ''} 
                                    ${slap.won 
                                        ? (i % 2 === 0 ? 'bg-green-500/5' : 'bg-green-500/10')
                                        : (i % 2 === 0 ? 'bg-destructive/5' : 'bg-destructive/10')
                                    }`}
                                >
                                    <Table.Cell>{@html displayUser(slap.player)}</Table.Cell>
                                    <Table.Cell>{@html displayUser(slap.slappee)}</Table.Cell>
                                    <Table.Cell>{format.wei(slap.amount)}</Table.Cell>
                                    <Table.Cell>{slap.tokenType === 0 ? 'SLAP' : 'AVAX'}</Table.Cell>
                                    <Table.Cell>{slap.won ? 'SLAPPED' : 'MISSED'}</Table.Cell>
                                </Table.Row>
                            {/each}
                            {#if fulfilledSlaps.length === 0}
                                <Table.Row class="border-l border-r border-b">
                                    <Table.Cell colspan="5" class="text-center text-muted-foreground">
                                        No fulfilled slaps
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