import { error, json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db.js';

export async function GET({ url }) {
    try {
        const address = url.searchParams.get('address');
        
        if (!address) {
            error(400, 'Wallet address is required');
        }
        
        // Connect to the database
        const db = await connectToDatabase();
        
        // Get the whitelist record for this address
        const whitelistRecord = await db.collection('whitelist').findOne({ address });
        
        return json({
            isWhitelisted: whitelistRecord?.isWhitelisted || false,
            twitterConnected: whitelistRecord?.twitterConnected || false,
            twitterUsername: whitelistRecord?.twitterUsername || null,
            status: whitelistRecord?.status || "",
            appliedAt: whitelistRecord?.createdAt || null
        });
    } catch (err) {
        console.error('Whitelist status error:', err);
        error(500, 'Failed to check whitelist status');
    }
}