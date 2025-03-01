export async function getUserByAddress(address) {
    if (!address) return null;
    
    try {
        const response = await fetch(`/api/users?address=${address}`);
        
        if (!response.ok) {
            // Instead of throwing an error, just return null
            console.log(`User not found for address: ${address}`);
            return null;
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        return null;
    }
}