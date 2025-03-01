<script>
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
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
            
        } catch (err) {
            error = err.message || "Failed to check whitelist status";
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    async function joinWhitelist() {
        try {
            isLoading = true;
            error = "";
            
            // Call API to join whitelist
            const response = await fetch('/api/whitelist/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: $signerAddress })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to join whitelist");
            }
            
            // Update application status to pending
            applicationStatus = "pending";
            applicationSubmitted = true;
            
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
                                <p class="text-sm text-muted-foreground">
                                    Applications are typically reviewed within 24-48 hours. You'll receive an update once your application has been processed.
                                </p>
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
                        disabled={isLoading}
                        onclick={joinWhitelist}
                    >
                        {isLoading ? 'Processing...' : 'Join Whitelist'}
                    </Button>
                {/if}
            </Card.Footer>
        </Card.Root>
        
        {#if $connected && (isWhitelisted || applicationStatus === "approved")}
            <div class="mt-6 text-center">
                <a href="/" class="text-primary hover:underline">
                    Return to Play
                </a>
            </div>
        {/if}
    </div>
</div>