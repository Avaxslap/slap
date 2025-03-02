import { error, json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db.js';

export async function POST({ request }) {
    try {
        const { address, tier } = await request.json();
        
        if (!address) {
            error(400, 'Wallet address is required');
        }

        if(!tier) {
            error(400, 'Tier selection required');
        }
        
        console.log("Joining whitelist for address:", address);
        
        const db = await connectToDatabase();
        const whitelists = await db.collection('whitelist');

        const whitelistRecord = await whitelists.findOne({ address });
        
        if (!whitelistRecord?.twitterConnected) {
            error(400, 'Twitter account must be connected first');
        }
        
        // Add the address to the whitelist with pending status
        await whitelists.updateOne(
            { address },
            { 
                $set: { 
                    status: 'pending',
                    tier: tier,
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