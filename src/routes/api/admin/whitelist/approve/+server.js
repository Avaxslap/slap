import { error, json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db.js';
import * as config from "$lib/config";
import { ADMIN_PASSWORD } from '$env/static/private';

const ADMIN_ADDRESSES = config.ADMIN_ADDRESSES;

export async function POST({ request }) {
    try {
        const { address, adminPassword, adminAddress, tier } = await request.json();
        
        if (!address) {
            error(400, 'User address is required');
        }
        
        if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
            error(400, 'Admin password is required');
        }
        
        if (!tier) {
            error(400, 'Tier selection is required');
        }
        
        
        // Connect to the database
        const db = await connectToDatabase();
        const whitelist = await db.collection('whitelist');
        
        const result = whitelist.updateOne(
            { address },
            { 
                $set: { 
                    isWhitelisted: true,
                    status: 'approved',
                    tier: tier,
                    approvedAt: new Date(),
                    approvedBy: adminAddress
                }
            }
        );
        
        if (result.matchedCount === 0) {
            error(404, 'Application not found');
        }
        
        console.log(`Address ${address} approved with tier ${tier}`);
        
        return json({ success: true });
    } catch (err) {
        console.error('Admin whitelist approval error:', err);
        error(500, err.message || 'Failed to approve whitelist application');
    }
}