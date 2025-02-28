<script>
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { connected, signerAddress } from "$lib/store";
    import { onMount } from "svelte";
    import CheckCircleIcon from "lucide-svelte/icons/check-circle";
    import XCircleIcon from "lucide-svelte/icons/x-circle";
    import AlertCircleIcon from "lucide-svelte/icons/alert-circle";
    import TwitterIcon from "lucide-svelte/icons/twitter";
    import * as config from "$lib/config";

    // List of admin addresses (should be moved to a secure location or database)
    const ADMIN_ADDRESSES = [
        "0x06C8E296cc63B15b17878b673a9d58E71EA7508b", // Replace with actual admin addresses
    ];

    let isAdmin = $state(false);
    let isLoading = $state(false);
    let error = $state("");
    let whitelistApplications = $state([]);
    let searchTerm = $state("");
    let filterStatus = $state("all"); // "pending", "approved", "denied", "all"

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
            
            const response = await fetch('/api/admin/whitelist/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address,
                    adminAddress: $signerAddress 
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to approve application");
            }
            
            // Update the local state
            whitelistApplications = whitelistApplications.map(app => 
                app.address === address ? { ...app, status: 'approved', approvedAt: new Date() } : app
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
    $effect(() => {
        loadWhitelistApplications();
    });

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
    <div class="max-w-6xl mx-auto">
        {#if !$connected}
            <div class="flex flex-col items-center justify-center py-16">
                <AlertCircleIcon class="h-16 w-16 text-muted-foreground mb-6" />
                <h2 class="text-2xl font-semibold mb-2">Wallet Not Connected</h2>
                <p class="text-center text-muted-foreground mb-8">
                    Please connect your wallet to access the admin panel.
                </p>
            </div>
        {:else if !isAdmin}
            <div class="flex flex-col items-center justify-center py-16">
                <XCircleIcon class="h-16 w-16 text-destructive mb-6" />
                <h2 class="text-2xl font-semibold mb-2">Access Denied</h2>
                <p class="text-center text-muted-foreground mb-8">
                    You do not have permission to access the admin panel.
                </p>
            </div>
        {:else}
            <Card.Root>
                <Card.Header>
                    <Card.Title class="text-2xl">Whitelist Administration</Card.Title>
                    <Card.Description>
                        Manage whitelist applications for AvaxSlap.
                    </Card.Description>
                </Card.Header>
                
                <Card.Content>
                    <div class="space-y-6">
                        {#if error}
                            <div class="bg-destructive/10 text-destructive p-4 rounded-md">
                                {error}
                            </div>
                        {/if}
                        
                        <div class="flex flex-col sm:flex-row gap-4 mb-6">
                            <div class="flex-1">
                                <Input 
                                    type="text" 
                                    placeholder="Search by address or Twitter username" 
                                    bind:value={searchTerm}
                                />
                            </div>
                            <div class="flex gap-2">
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
                        
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr class="border-b">
                                        <th class="text-left py-3 px-4">Address</th>
                                        <th class="text-left py-3 px-4">Twitter</th>
                                        <th class="text-left py-3 px-4">Status</th>
                                        <th class="text-left py-3 px-4">Applied At</th>
                                        <th class="text-left py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#if isLoading && whitelistApplications.length === 0}
                                        <tr>
                                            <td colspan="5" class="py-8 text-center text-muted-foreground">
                                                Loading applications...
                                            </td>
                                        </tr>
                                    {:else if getFilteredApplications().length === 0}
                                        <tr>
                                            <td colspan="5" class="py-8 text-center text-muted-foreground">
                                                No applications found.
                                            </td>
                                        </tr>
                                    {:else}
                                        {#each getFilteredApplications() as app}
                                            <tr class="border-b hover:bg-muted/50">
                                                <td class="py-3 px-4 font-mono text-sm">
                                                    {app.address.substring(0, 8)}...{app.address.substring(app.address.length - 6)}
                                                </td>
                                                <td class="py-3 px-4">
                                                    {#if app.twitterUsername}
                                                        <div class="flex items-center gap-2">
                                                            <TwitterIcon class="h-4 w-4 text-[#1DA1F2]" />
                                                            <a 
                                                                href={`https://twitter.com/${app.twitterUsername}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                class="hover:underline"
                                                            >
                                                                @{app.twitterUsername}
                                                            </a>
                                                        </div>
                                                    {:else}
                                                        <span class="text-muted-foreground">Not connected</span>
                                                    {/if}
                                                </td>
                                                <td class="py-3 px-4">
                                                    {#if app.status === 'approved'}
                                                        <span class="inline-flex items-center gap-1 text-success">
                                                            <CheckCircleIcon class="h-4 w-4" />
                                                            Approved
                                                        </span>
                                                    {:else if app.status === 'denied'}
                                                        <span class="inline-flex items-center gap-1 text-destructive">
                                                            <XCircleIcon class="h-4 w-4" />
                                                            Denied
                                                        </span>
                                                    {:else}
                                                        <span class="text-muted-foreground">Pending</span>
                                                    {/if}
                                                </td>
                                                <td class="py-3 px-4 text-sm text-muted-foreground">
                                                    {formatDate(app.createdAt)}
                                                </td>
                                                <td class="py-3 px-4">
                                                    <div class="flex gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onclick={() => approveApplication(app.address)}
                                                            disabled={app.status === 'approved' || isLoading}
                                                            class="text-success border-success hover:bg-success/10"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onclick={() => denyApplication(app.address)}
                                                            disabled={app.status === 'denied' || isLoading}
                                                            class="text-destructive border-destructive hover:bg-destructive/10"
                                                        >
                                                            Deny
                                                        </Button>
                                                    </div>
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
</div>