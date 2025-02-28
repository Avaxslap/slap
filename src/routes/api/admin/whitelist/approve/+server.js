import { error, json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db.js';

// List of admin addresses (should be moved to a secure location or database)
const ADMIN_ADDRESSES = [
    "0x06C8E296cc63B15b17878b673a9d58E71EA7508b", // Replace with actual admin addresses
    // Add more admin addresses as needed
];

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { address, adminAddress } = await request.json();
        
        if (!address) {
            error(400, 'User address is required');
        }
        
        if (!adminAddress) {
            error(400, 'Admin address is required');
        }
        
        // Check if the requester is an admin
        if (!ADMIN_ADDRESSES.includes(adminAddress)) {
            error(403, 'Unauthorized access');
        }
        
        // Connect to the database
        const db = await connectToDatabase();
        
        // Update the whitelist status
        const result = await db.collection('whitelist').updateOne(
            { address },
            { 
                $set: { 
                    isWhitelisted: true,
                    status: 'approved',
                    approvedAt: new Date(),
                    approvedBy: adminAddress
                }
            }
        );
        
        if (result.matchedCount === 0) {
            error(404, 'Application not found');
        }
        
        console.log(`Address ${address} approved by admin ${adminAddress}`);
        
        return json({ success: true });
    } catch (err) {
        console.error('Admin whitelist approval error:', err);
        error(500, err.message || 'Failed to approve whitelist application');
    }
}