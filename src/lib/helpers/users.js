export async function getUserByAddress(address) {
    if (!address) return null;
    
    try {
        const response = await fetch(`/api/users?address=${address}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching user:', errorData);
            return null;
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        return null;
    }
}