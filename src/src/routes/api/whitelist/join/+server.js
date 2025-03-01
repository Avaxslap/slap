import { error, json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db.js';

export async function POST({ request }) {
    try {
        const { address } = await request.json();
        
        if (!address) {
            error(400, 'Wallet address is required');
        }
        
        console.log("Joining whitelist for address:", address);
        
        // Connect to the database
        const db = await connectToDatabase();
        
        // Get the whitelist record for this address
        const whitelistRecord = await db.collection('whitelist').findOne({ address });
        
        // Check if Twitter is connected
        if (!whitelistRecord?.twitterConnected) {
            error(400, 'Twitter account must be connected first');
        }
        
        // Add the address to the whitelist with pending status
        await db.collection('whitelist').updateOne(
            { address },
            { 
                $set: { 
                    status: 'pending',
                    appliedAt: new Date()
                }
            }
        );
        
        console.log(`Address ${address} has applied for whitelist`);
        
        return json({ success: true });
    } catch (err) {
        console.error('Whitelist join error:', err);
        error(500, err.message || 'Failed to join whitelist');
    }
}