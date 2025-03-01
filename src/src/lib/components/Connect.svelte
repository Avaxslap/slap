<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { modal, wagmiAdapter } from "$lib/appkit";
    import {
        accountState,
        networkState,
        appKitState,
        themeState,
        events,
        walletInfo,
        signerAddress,
        connected
    } from "$lib/store";

    import { Button } from "$lib/components/ui/button";

    let props = $props();

    async function createOrUpdateUser(address) {
        try {
            // First check if the user exists
            const checkResponse = await fetch(`/api/users?address=${address}`);
            const checkData = await checkResponse.json();
            
            if (!checkData.user) {
                // User doesn't exist, create a new one
                const createResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        address: address
                    })
                });
                
                if (!createResponse.ok) {
                    console.error('Failed to create user:', await createResponse.json());
                } else {
                    console.log('User created successfully');
                }
            } else {
                // User exists, update last seen
                const updateResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        address: address
                    })
                });
                
                if (!updateResponse.ok) {
                    console.error('Failed to update user:', await updateResponse.json());
                }
            }
        } catch (error) {
            console.error('Error managing user in database:', error);
        }
    }

    const disconnect = async () => {};

    onMount(async () => {
        if (!modal) return;

        modal.subscribeAccount(async (state) => {
            $accountState = state;
            $connected = $accountState.isConnected;
            $signerAddress = $accountState.address;

            if ($connected && $signerAddress) {
                try {
                    // Create or update user when connected
                    await createOrUpdateUser($signerAddress);
                } catch (error) {
                    console.error('Error handling user connection:', error);
                }
            }
        });

        modal.subscribeNetwork((state) => {
            $networkState = state;
            
        });

        modal.subscribeState((state) => {
            $appKitState = state;
        });

        modal.subscribeEvents((state) => {
            $events = state;
        });

        modal.subscribeWalletInfo((state) => {
            $walletInfo = state;
        });

    });
</script>
<appkit-button />