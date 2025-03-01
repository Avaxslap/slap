<script>
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { onMount, onDestroy } from "svelte";
    import { connected, signerAddress, userData } from "$lib/store";
    import * as format from "$lib/format";
    import { getUserByAddress } from "$lib/helpers/users";
    import X_ICON from "$lib/assets/x-icon.png";

    let messages = $state([]);
    let newMessage = $state("");
    let loading = $state(true);
    let error = $state("");
    let chatInterval;
    let userCache = $state({});
    let autoScroll = $state(true);
    let chatContainer;

    // Load chat messages
    async function loadMessages() {
        try {
            const response = await fetch('/api/chat');
            if (!response.ok) {
                throw new Error('Failed to load chat messages');
            }
            const data = await response.json();
            messages = data.messages;
            
            // Load user data for all addresses in messages
            await loadUserData(messages);
            
            // Scroll to bottom if autoScroll is enabled
            if (autoScroll && chatContainer) {
                setTimeout(() => {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }, 100);
            }
            
            loading = false;
        } catch (err) {
            console.error('Error loading messages:', err);
            error = err.message;
            loading = false;
        }
    }

    // Load user data for all addresses in messages
    async function loadUserData(messages) {
        const addresses = new Set();
        
        // Collect all unique addresses
        messages.forEach(message => {
            if (message && message.sender) {
                addresses.add(message.sender.toLowerCase());
            }
        });
        
        // Create a batch of promises for all addresses
        const fetchPromises = Array.from(addresses).map(async (address) => {
            try {
                // Check if we already have this user in cache
                if (!userCache[address]) {
                    const user = await getUserByAddress(address);
                    if (user) {
                        // Update the cache with the user data
                        userCache[address] = user;
                    }
                }
            } catch (error) {
                console.error(`Error fetching user for ${address}:`, error);
            }
        });
        
        // Wait for all user data to be fetched
        await Promise.all(fetchPromises);
        
        // Force reactivity update by creating a new object
        userCache = {...userCache};
    }

    // Send a new message
    async function sendMessage() {
        if (!$connected || !$signerAddress) {
            error = "Please connect your wallet to chat";
            return;
        }
        
        if (!newMessage.trim()) {
            return;
        }
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender: $signerAddress,
                    content: newMessage.trim()
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
            // Clear the input field
            newMessage = "";
            
            // Reload messages to get the new one
            await loadMessages();
        } catch (err) {
            console.error('Error sending message:', err);
            error = err.message;
        }
    }

    // Handle Enter key press
    function handleKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    // Format timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Display username or address
    function displayUser(address) {
        if (!address) return { name: "Unknown", hasTwitter: false };
        
        const lowerAddress = address.toLowerCase();
        const user = userCache[lowerAddress];
        
        if (user && user.twitterUsername) {
            return {
                name: `@${user.twitterUsername}`,
                hasTwitter: true
            };
        }
        return {
            name: format.address(address),
            hasTwitter: false
        };
    }

    // Check if a message is from the current user
    function isCurrentUser(address) {
        return $signerAddress && address && address.toLowerCase() === $signerAddress.toLowerCase();
    }

    // Handle scroll events to determine if we should auto-scroll
    function handleScroll() {
        if (!chatContainer) return;
        
        const { scrollTop, scrollHeight, clientHeight } = chatContainer;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
        
        autoScroll = atBottom;
    }

    onMount(() => {
        loadMessages();
        
        // Set up polling for new messages every 5 seconds
        chatInterval = setInterval(loadMessages, 5000);
    });

    onDestroy(() => {
        if (chatInterval) {
            clearInterval(chatInterval);
        }
    });
</script>

<Card.Root class="h-full flex flex-col">
    <Card.Header>
        <Card.Title>Chat</Card.Title>
        <Card.Description>
            Chat with other players
        </Card.Description>
    </Card.Header>
    <Card.Content class="flex-grow overflow-hidden flex flex-col">
        <div 
            class="flex-grow overflow-y-auto pr-2 space-y-4" 
            bind:this={chatContainer}
            on:scroll={handleScroll}
        >
            {#if loading && messages.length === 0}
                <div class="flex justify-center items-center h-full">
                    <p class="text-muted-foreground">Loading messages...</p>
                </div>
            {:else if messages.length === 0}
                <div class="flex justify-center items-center h-full">
                    <p class="text-muted-foreground">No messages yet. Be the first to chat!</p>
                </div>
            {:else}
                {#each messages as message}
                    {@const user = displayUser(message.sender)}
                    {@const isSelf = isCurrentUser(message.sender)}
                    
                    <div class={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div class={`max-w-[80%] ${isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-3 py-2`}>
                            <div class="flex items-center gap-1 mb-1">
                                {#if user.hasTwitter}
                                    <img src={X_ICON} alt="X" class="w-3 h-3" />
                                {/if}
                                }
                                <span class={`text-xs font-medium ${isSelf ? 'text-primary-foreground/80' : 'text-foreground/80'}`}>
                                    {user.name}
                                </span>
                                <span class={`text-xs ${isSelf ? 'text-primary-foreground/60' : 'text-foreground/60'} ml-auto`}>
                                    {formatTimestamp(message.timestamp)}
                                </span>
                            </div>
                            <p class="break-words whitespace-pre-wrap text-sm">{message.content}</p>
                        </div>
                    </div>
                {/each}
                }
            {/if}
            }
        </div>
    </Card.Content>
    <Card.Footer class="border-t pt-3">
        {#if error}
            <p class="text-destructive text-sm mb-2">{error}</p>
        {/if}
        }
        <div class="flex gap-2 w-full">
            <Input 
                placeholder="Type a message..." 
                bind:value={newMessage} 
                on:keydown={handleKeydown}
                disabled={!$connected}
            />
            <Button 
                onclick={sendMessage} 
                disabled={!$connected || !newMessage.trim()}
            >
                Send
            </Button>
        </div>
        {#if !$connected}
            <p class="text-muted-foreground text-xs mt-2">Connect your wallet to join the chat</p>
        {/if}
        }
    </Card.Footer>
</Card.Root>