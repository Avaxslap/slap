import { error, json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db.js';
import * as config from '$lib/config';
import { ADMIN_PASSWORD } from '$env/static/private';

const ADMIN_ADDRESSES = config.ADMIN_ADDRESSES;

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { address, adminAddress, adminPassword } = await request.json();
        
        if (!address) {
            error(400, 'User address is required');
        }
        
        if (!adminAddress) {
            error(400, 'Admin address is required');
        }
        
        if (!ADMIN_ADDRESSES.includes(adminAddress)) {
            error(403, 'Unauthorized access');
        }

        if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
            error(400, 'Admin password is required');
        }
        
        const db = await connectToDatabase();
        
        // Update the whitelist status
        const result = await db.collection('whitelist').updateOne(
            { address },
            { 
                $set: { 
                    isWhitelisted: false,
                    status: 'denied',
                    deniedAt: new Date(),
                    deniedBy: adminAddress
                }
            }
        );
        
        if (result.matchedCount === 0) {
            error(404, 'Application not found');
        }
        
        console.log(`Address ${address} denied by admin ${adminAddress}`);
        
        return json({ success: true });
    } catch (err) {
        console.error('Admin whitelist denial error:', err);
        error(500, err.message || 'Failed to deny whitelist application');
    }
}