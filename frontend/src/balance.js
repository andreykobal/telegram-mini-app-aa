// balance.js
import { publicClient } from './client';
import { formatEther } from 'viem';

export const getWalletBalance = async (address) => {
    try {
        const balance = await publicClient.getBalance({
            address,
        });
        return formatEther(balance);
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
};
