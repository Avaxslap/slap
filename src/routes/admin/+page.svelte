<script>
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
    import { connected, signerAddress } from "$lib/store";
    import { onMount } from "svelte";
    import CheckCircleIcon from "lucide-svelte/icons/check-circle";
    import XCircleIcon from "lucide-svelte/icons/x-circle";
    import AlertCircleIcon from "lucide-svelte/icons/alert-circle";
    import TwitterIcon from "lucide-svelte/icons/twitter";
    import ClockIcon from "lucide-svelte/icons/clock";
    import * as config from "$lib/config";

    const ADMIN_ADDRESSES = config.ADMIN_ADDRESSES;

    let isAdmin = $state(false);
    let isLoading = $state(false);
    let error = $state("");
    let whitelistApplications = $state([]);
    let searchTerm = $state("");
    let filterStatus = $state("all"); // "pending", "approved", "denied", "all"
    let selectedTiers = $state({}); // Track selected tiers for each application
    let password = $state("");

    let tiers = config.tiers;

    // Function to get tier name from tier id
    function getTierName(tierId) {
        const tier = tiers.find(t => t.id === tierId);
        return tier ? tier.name : "Unknown";
    }

    // Function to handle tier selection change
    function handleTierChange(address, tierId) {
        selectedTiers = { ...selectedTiers, [address]: tierId };
    }

    // Check if current user is an admin
    $effect(() => {
        if ($connected && $signerAddress) {
            isAdmin = ADMIN_ADDRESSES.includes($signerAddress);
            if (isAdmin) {
                loadWhitelistApplications();
            }
        }
    });

    async function loadWhitelistApplications() {
        try {
            isLoading = true;
            error = "";
            
            const response = await fetch(`/api/admin/whitelist?address=${$signerAddress}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to load whitelist applications");
            }
            
            const data = await response.json();
            whitelistApplications = data.applications;
            
            // Initialize selectedTiers with the current tier for each application
            const tierMap = {};
            whitelistApplications.forEach(app => {
                tierMap[app.address] = app.tier || "tier1";
            });
            selectedTiers = tierMap;
            
        } catch (err) {
            error = err.message || "Failed to load whitelist applications";
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    async function approveApplication(address) {
        try {
            isLoading = true;
            error = "";
            
            const selectedTier = selectedTiers[address];
            
            const response = await fetch('/api/admin/whitelist/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address,
                    adminPassword: password,
                    adminAddress: $signerAddress,
                    tier: selectedTier
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to approve application");
            }
            
            // Update the local state
            whitelistApplications = whitelistApplications.map(app => 
                app.address === address ? { ...app, status: 'approved', tier: selectedTier, approvedAt: new Date() } : app
            );
            
        } catch (err) {
            error = err.message || "Failed to approve application";
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    async function denyApplication(address) {
        try {
            isLoading = true;
            error = "";
            
            const response = await fetch('/api/admin/whitelist/deny', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address,
                    adminPassword: password,
                    adminAddress: $signerAddress
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to deny application");
            }
            
            // Update the local state
            whitelistApplications = whitelistApplications.map(app => 
                app.address === address ? { ...app, status: 'denied', deniedAt: new Date() } : app
            );
            
        } catch (err) {
            error = err.message || "Failed to deny application";
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    // Filter applications based on search term and status filter
    function getFilteredApplications() {
        return whitelistApplications.filter(app => {
            // Filter by status
            if (filterStatus !== "all" && app.status !== filterStatus) {
                return false;
            }
            
            // Filter by search term
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    app.address.toLowerCase().includes(term) ||
                    (app.twitterUsername && app.twitterUsername.toLowerCase().includes(term))
                );
            }
            
            return true;
        });
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    }
</script>

<div class="container mx-auto py-8 px-4">
    {#if !$connected}
        <div class="max-w-md mx-auto text-center p-8 bg-muted/30 rounded-lg">
            <AlertCircleIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 class="text-xl font-medium mb-2">Wallet Not Connected</h2>
            <p class="text-muted-foreground mb-4">
                Please connect your wallet to access the admin panel.
            </p>
        </div>
    {:else if !isAdmin}
        <div class="max-w-md mx-auto text-center p-8 bg-destructive/10 rounded-lg">
            <XCircleIcon class="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 class="text-xl font-medium mb-2">Access Denied</h2>
            <p class="text-muted-foreground mb-4">
                You do not have permission to access the admin panel.
            </p>
        </div>
    {:else}
        <Card.Root>
            <Card.Header>
                <Card.Title class="text-2xl">Whitelist Applications</Card.Title>
                <Card.Description>
                    Review and manage whitelist applications.
                </Card.Description>
            </Card.Header>
            
            <Card.Content>
                {#if error}
                    <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
                        {error}
                    </div>
                {/if}
                
                <div class="space-y-4">
                    <div class="flex flex-col sm:flex-row gap-4 justify-between">
                        <Input 
                            type="password" 
                            placeholder="Administrator password" 
                            class="max-w-md"
                            bind:value={password}
                        />
                        <Input 
                            type="text" 
                            placeholder="Search by address or Twitter username" 
                            class="max-w-md"
                            bind:value={searchTerm}
                        />
                        
                        <div class="flex gap-2">
                            <div class="flex gap-1">
                                <Button 
                                    variant={filterStatus === "all" ? "default" : "outline"} 
                                    size="sm"
                                    onclick={() => filterStatus = "all"}
                                >
                                    All
                                </Button>
                                <Button 
                                    variant={filterStatus === "pending" ? "default" : "outline"} 
                                    size="sm"
                                    onclick={() => filterStatus = "pending"}
                                >
                                    Pending
                                </Button>
                                <Button 
                                    variant={filterStatus === "approved" ? "default" : "outline"} 
                                    size="sm"
                                    onclick={() => filterStatus = "approved"}
                                >
                                    Approved
                                </Button>
                                <Button 
                                    variant={filterStatus === "denied" ? "default" : "outline"} 
                                    size="sm"
                                    onclick={() => filterStatus = "denied"}
                                >
                                    Denied
                                </Button>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onclick={loadWhitelistApplications}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'Refresh'}
                            </Button>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse">
                            <thead>
                                <tr class="border-b">
                                    <th class="text-left py-3 px-4">Address</th>
                                    <th class="text-left py-3 px-4">Twitter</th>
                                    <th class="text-left py-3 px-4">Status</th>
                                    <th class="text-left py-3 px-4">Tier</th>
                                    <th class="text-left py-3 px-4">Applied At</th>
                                    <th class="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#if isLoading && whitelistApplications.length === 0}
                                    <tr>
                                        <td colspan="6" class="py-8 text-center text-muted-foreground">
                                            Loading applications...
                                        </td>
                                    </tr>
                                {:else if getFilteredApplications().length === 0}
                                    <tr>
                                        <td colspan="6" class="py-8 text-center text-muted-foreground">
                                            No applications found.
                                        </td>
                                    </tr>
                                {:else}
                                    {#each getFilteredApplications() as app}
                                        <tr class="border-b hover:bg-muted/30">
                                            <td class="py-3 px-4 font-mono text-sm">
                                                {app.address.substring(0, 6)}...{app.address.substring(app.address.length - 4)}
                                            </td>
                                            <td class="py-3 px-4">
                                                {#if app.twitterUsername}
                                                    <a 
                                                        href={`https://twitter.com/${app.twitterUsername}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        class="inline-flex items-center gap-1 text-primary hover:underline"
                                                    >
                                                        <TwitterIcon class="h-4 w-4" />
                                                        @{app.twitterUsername}
                                                    </a>
                                                {:else}
                                                    <span class="text-muted-foreground">Not connected</span>
                                                {/if}
                                            </td>
                                            <td class="py-3 px-4">
                                                {#if app.status === "approved"}
                                                    <span class="inline-flex items-center gap-1 text-success">
                                                        <CheckCircleIcon class="h-4 w-4" />
                                                        Approved
                                                    </span>
                                                {:else if app.status === "denied"}
                                                    <span class="inline-flex items-center gap-1 text-destructive">
                                                        <XCircleIcon class="h-4 w-4" />
                                                        Denied
                                                    </span>
                                                {:else}
                                                    <span class="inline-flex items-center gap-1 text-amber-500">
                                                        <ClockIcon class="h-4 w-4" />
                                                        Pending
                                                    </span>
                                                {/if}
                                            </td>
                                            <td class="py-3 px-4">
                                                {#if app.status === "pending"}
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-xs text-muted-foreground">Requested: {getTierName(app.tier || "tier1")}</span>
                                                        <Select 
                                                            value={selectedTiers[app.address]} 
                                                            onselect={(e) => handleTierChange(app.address, e.detail)}
                                                        >
                                                            <SelectTrigger class="h-8 w-40">
                                                                <SelectValue placeholder="Select tier" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {#each tiers as tier}
                                                                    <SelectItem value={tier.id}>{tier.name} - {tier.price}</SelectItem>
                                                                {/each}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                {:else}
                                                    <span>{getTierName(app.tier || "tier1")}</span>
                                                {/if}
                                            </td>
                                            <td class="py-3 px-4 text-sm">
                                                {formatDate(app.appliedAt)}
                                            </td>
                                            <td class="py-3 px-4">
                                                {#if app.status === "pending"}
                                                    <div class="flex gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onclick={() => approveApplication(app.address)}
                                                            disabled={isLoading}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onclick={() => denyApplication(app.address)}
                                                            disabled={isLoading}
                                                            class="text-destructive hover:bg-destructive/10"
                                                        >
                                                            Deny
                                                        </Button>
                                                    </div>
                                                {:else if app.status === "approved"}
                                                    <span class="text-sm text-muted-foreground">
                                                        Approved on {formatDate(app.approvedAt)}
                                                    </span>
                                                {:else if app.status === "denied"}
                                                    <span class="text-sm text-muted-foreground">
                                                        Denied on {formatDate(app.deniedAt)}
                                                    </span>
                                                {/if}
                                            </td>
                                        </tr>
                                    {/each}
                                {/if}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card.Content>
        </Card.Root>
    {/if}
</div>