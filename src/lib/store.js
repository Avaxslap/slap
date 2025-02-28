import { writable } from 'svelte/store'
import { getUserByAddress } from '$lib/helpers/users'
import { browser } from '$app/environment'

export const accountState = writable({})
export const networkState = writable({})
export const appKitState = writable({})
export const themeState = writable({ themeMode: 'light', themeVariables: {} })
export const events = writable([])
export const walletInfo = writable({})
export const wagmiConfig = writable(null);
export const signerAddress = writable(null);
export const connected = writable(false);
export const publicClient = writable(false);
export const userData = writable({});

if (browser) {
    // Create a derived store effect to handle user data updates
    let unsubscribe;
    
    // Setup the subscription
    function setupSubscription() {
        if (unsubscribe) unsubscribe();
        
        unsubscribe = signerAddress.subscribe(async (address) => {
            let isConnected;
            connected.subscribe(value => { isConnected = value; })();
            
            if (address && isConnected) {
                try {
                    console.log('Fetching user data for address:', address);
                    const user = await getUserByAddress(address);
                    if (user) {
                        console.log('User data fetched:', user);
                        userData.set(user);
                    } else {
                        console.log('No user data found for address:', address);
                        userData.set({});
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    userData.set({});
                }
            } else if (!address || !isConnected) {
                userData.set({});
            }
        });
    }
    
    // Initialize the subscription
    setupSubscription();
    
    // Also update when connection state changes
    connected.subscribe(isConnected => {
        let address;
        signerAddress.subscribe(value => { address = value; })();
        
        if (isConnected && address) {
            updateUserData();
        } else if (!isConnected) {
            userData.set({});
        }
    });
}

export async function updateUserData() {
    let address;
    let isConnected;
    
    signerAddress.subscribe(value => { address = value; })();
    connected.subscribe(value => { isConnected = value; })();
    
    if (address && isConnected) {
        try {
            console.log('Manually updating user data for address:', address);
            const user = await getUserByAddress(address);
            if (user) {
                console.log('User data updated:', user);
                userData.set(user);
                return user;
            } else {
                console.log('No user data found for address:', address);
                userData.set({});
                return null;
            }
        } catch (error) {
            console.error('Error updating user data:', error);
            userData.set({});
            return null;
        }
    }
    return null;
}