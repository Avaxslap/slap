<script>
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
    import { connected, signerAddress } from "$lib/store";
    import { onMount } from "svelte";
    import TwitterIcon from "lucide-svelte/icons/twitter";
    import CheckCircleIcon from "lucide-svelte/icons/check-circle";
    import AlertCircleIcon from "lucide-svelte/icons/alert-circle";
    import XCircleIcon from "lucide-svelte/icons/x-circle";
    import ClockIcon from "lucide-svelte/icons/clock";
    import * as config from "$lib/config";

    let isWhitelisted = $state(false);
    let isLoading = $state(false);
    let twitterConnected = $state(false);
    let error = $state("");
    let applicationStatus = $state(""); // "pending", "approved", "denied", or empty string
    let applicationSubmitted = $state(false); // Track if they just submitted an application
    let selectedTier = $state(""); // Track selected tier
    let userTier = $state(""); // Track the tier the user has been approved for or requested

    // Define whitelist tiers
    const tiers = config.tiers;

    // Function to get tier name from tier id
    function getTierName(tierId) {
        const tier = tiers.find(t => t.id === tierId);
        return tier ? tier.name : "Unknown";
    }

    // Function to get tier price from tier id
    function getTierPrice(tierId) {
        const tier = tiers.find(t => t.id === tierId);
        return tier ? tier.price : "";
    }

    $effect(() => {
        if ($connected) {
            checkWhitelistStatus();
        }
    });

    async function checkWhitelistStatus() {
        try {
            if (!$signerAddress) return;
            
            isLoading = true;
            
            // Check whitelist status from our API
            const response = await fetch(`/api/whitelist/status?address=${$signerAddress}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to check whitelist status");
            }
            
            const data = await response.json();
            isWhitelisted = data.isWhitelisted;
            twitterConnected = data.twitterConnected;
            applicationStatus = data.status || "";
            userTier = data.tier || "";
            
        } catch (err) {
            error = err.message || "Failed to check whitelist status";
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    async function joinWhitelist() {
        try {
            if (!selectedTier) {
                error = "Please select a tier";
                return;
            }
            
            isLoading = true;
            error = "";
            
            // Call API to join whitelist
            const response = await fetch('/api/whitelist/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address: $signerAddress,
                    tier: selectedTier
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to join whitelist");
            }
            
            // Update application status to pending
            applicationStatus = "pending";
            applicationSubmitted = true;
            userTier = selectedTier;
            
        } catch (err) {
            error = err.message || "Failed to join whitelist";
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('twitter') === 'connected') {
            twitterConnected = true;
            // If we just connected Twitter, check whitelist status again
            if ($signerAddress) {
                checkWhitelistStatus();
            }
        }
        if (params.get('error')) {
            const errorCode = params.get('error');
            if (errorCode === 'twitter_already_linked') {
                error = "This Twitter account is already linked to another wallet address.";
            } else {
                error = decodeURIComponent(errorCode);
            }
        }
    });

    async function connectTwitter() {
        try {
            isLoading = true;
            error = "";
            
            // Get the Twitter auth URL from our API
            const response = await fetch(`/api/auth/twitter?address=${$signerAddress}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to start Twitter authentication");
            }
            
            const data = await response.json();
            
            if (data.url) {
                // Redirect to Twitter for authentication
                window.location.href = data.url;
            } else {
                throw new Error('Failed to get Twitter authorization URL');
            }
            
        } catch (err) {
            error = err.message || "Failed to connect Twitter";
            console.error(err);
            isLoading = false;
        }
    }

    function getStatusDisplay() {
        if (isWhitelisted || applicationStatus === "approved") {
            return {
                icon: CheckCircleIcon,
                color: "text-green-500",
                title: "You're on the whitelist!",
                message: "Congratulations! Your wallet is now whitelisted for AvaxSlap."
            };
        } else if (applicationStatus === "denied") {
            return {
                icon: XCircleIcon,
                color: "text-red-500",
                title: "Application Denied",
                message: "Unfortunately, your whitelist application has been denied."
            };
        } else if (applicationStatus === "pending") {
            return {
                icon: ClockIcon,
                color: "text-amber-500",
                title: applicationSubmitted ? "Application Received!" : "Application Pending",
                message: applicationSubmitted 
                    ? "Thank you for your application! We've received your request and it's currently under review. Please check back later for updates."
                    : "Your whitelist application is currently under review. Please check back later for updates."
            };
        }
        
        return null;
    }
</script>

<div class="container mx-auto py-8 px-4">
    <div class="max-w-2xl mx-auto">
        <Card.Root>
            <Card.Header>
                <Card.Title class="text-2xl">Join the Whitelist</Card.Title>
                <Card.Description>
                    Connect your wallet and Twitter to join the AvaxSlap whitelist for early access.
                </Card.Description>
            </Card.Header>
            
            <Card.Content>
                {#if !$connected}
                    <div class="flex flex-col items-center justify-center py-8">
                        <AlertCircleIcon class="h-12 w-12 text-muted-foreground mb-4" />
                        <p class="text-center text-muted-foreground mb-6">
                            Please connect your wallet to join the whitelist
                        </p>
                        <Button disabled>Connect Wallet</Button>
                        <p class="text-xs text-muted-foreground mt-2">
                            Use the connect button in the top right corner
                        </p>
                    </div>
                {:else if applicationStatus || isWhitelisted}
                    {@const status = getStatusDisplay()}
                    <div class="flex flex-col items-center justify-center py-8">
                        <svelte:component this={status.icon} class={`h-12 w-12 ${status.color} mb-4`} />
                        <h3 class="text-xl font-medium mb-2">{status.title}</h3>
                        <p class="text-center text-muted-foreground">
                            {status.message}
                        </p>
                        
                        {#if applicationStatus === "pending"}
                            <div class="mt-6 bg-muted/50 p-4 rounded-lg w-full max-w-md">
                                <h4 class="font-medium mb-2">Application Status</h4>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="font-medium">Status:</span>
                                    <span class="inline-flex items-center gap-1 text-amber-500">
                                        <ClockIcon class="h-4 w-4" />
                                        Pending Review
                                    </span>
                                </div>
                                {#if userTier}
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="font-medium">Requested Tier:</span>
                                        <span class="text-primary font-medium">
                                            {getTierName(userTier)} ({getTierPrice(userTier)})
                                        </span>
                                    </div>
                                {/if}
                                <p class="text-sm text-muted-foreground">
                                    Applications are typically reviewed within 24-48 hours. You'll receive an update once your application has been processed.
                                </p>
                            </div>
                        {/if}
                        
                        {#if isWhitelisted || applicationStatus === "approved"}
                            <div class="mt-6 bg-muted/50 p-4 rounded-lg w-full max-w-md">
                                <h4 class="font-medium mb-2">Whitelist Details</h4>
                                {#if userTier}
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="font-medium">Your Tier:</span>
                                        <span class="text-primary font-medium">
                                            {getTierName(userTier)} ({getTierPrice(userTier)})
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="space-y-6">
                        <div class="bg-muted/50 p-4 rounded-lg">
                            <h3 class="font-medium mb-2">Whitelist Requirements</h3>
                            <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Connect your wallet</li>
                                <li>Connect your Twitter account</li>
                                <li>Follow @AvaxSlap on Twitter</li>
                                <li>Retweet our pinned tweet</li>
                            </ul>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 border rounded-lg">
                            <div class="flex items-center gap-3">
                                <TwitterIcon class="h-5 w-5 text-[#1DA1F2]" />
                                <span>Twitter Account</span>
                            </div>
                            {#if twitterConnected}
                                <div class="flex items-center gap-2 text-success">
                                    <CheckCircleIcon class="h-5 w-5" />
                                    <span>Connected</span>
                                </div>
                            {:else}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onclick={connectTwitter} 
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Connecting...' : 'Connect'}
                                </Button>
                            {/if}
                        </div>
                        
                        {#if twitterConnected}
                            <div class="p-4 border rounded-lg">
                                <h3 class="font-medium mb-3">Select Whitelist Tier</h3>
                                <div class="space-y-4">
                                    <div class="grid grid-cols-1 gap-3">
                                        {#each tiers as tier}
                                            <div 
                                                class="border rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/50 flex justify-between items-center {selectedTier === tier.id ? 'border-primary bg-primary/10' : ''}"
                                                onclick={() => selectedTier = tier.id}
                                            >
                                                <div>
                                                    <h4 class="font-medium">{tier.name}</h4>
                                                    <p class="text-sm text-muted-foreground">{tier.price}</p>
                                                </div>
                                                {#if selectedTier === tier.id}
                                                    <CheckCircleIcon class="h-5 w-5 text-primary" />
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/if}
                        
                        {#if error}
                            <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                                {error}
                            </div>
                        {/if}
                    </div>
                {/if}
            </Card.Content>
            
            <Card.Footer>
                {#if $connected && !isWhitelisted && !applicationStatus && twitterConnected}
                    <Button 
                        class="w-full" 
                        disabled={isLoading || !selectedTier}
                        onclick={joinWhitelist}
                    >
                        {isLoading ? 'Processing...' : 'Join Whitelist'}
                    </Button>
                {/if}
            </Card.Footer>
        </Card.Root>
        
        {#if $connected && (isWhitelisted || applicationStatus === "approved")}
            
        {/if}
    </div>
</div>