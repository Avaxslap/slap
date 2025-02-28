<script>
    import { userData, signerAddress, connected } from "$lib/store";
    import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
    import { Button } from "$lib/components/ui/button";
    import { AlertCircle, Twitter } from "lucide-svelte";
    import { goto } from "$app/navigation";

    // Check if X is connected
    let xIsConnected = $derived($userData?.twitterUsername ? true : false);
    let isConnecting = $state(false);
    let error = $state("");

    // Function to handle Twitter connection
    async function connectTwitter() {
        if (!$signerAddress || !$connected) {
            error = "Please connect your wallet first";
            return;
        }

        try {
            isConnecting = true;
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
            isConnecting = false;
        }
    }
</script>

{#if $connected && $signerAddress && !xIsConnected}
    <div class="flex justify-center">
        <div class="max-w-md w-full">
            <Alert variant="primary" class="my-4 bg-muted/50">
                <AlertCircle class="h-4 w-4" />
                <AlertTitle>Connect your Twitter account</AlertTitle>
                <AlertDescription>
                    <div class="flex flex-col gap-2">
                        <p>Connect your Twitter account to display your username instead of your wallet address.</p>
                        <div class="flex justify-end">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                class="gap-2"
                                onclick={connectTwitter}
                                disabled={isConnecting}
                            >
                                <Twitter class="h-4 w-4 text-[#1DA1F2]" />
                                {isConnecting ? "Connecting..." : "Connect Twitter"}
                            </Button>
                        </div>
                        {#if error}
                            <p class="text-destructive text-sm">{error}</p>
                        {/if}
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    </div>
{/if}