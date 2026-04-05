/**
 * Mock Reward Service
 * Handles reward generation, storage, and retrieval using localStorage.
 * Simulates backend logic.
 */

const STORAGE_KEY = "catalyst_rewards";

const REWARD_TYPES = [
    {
        type: "priority_pickup",
        label: "Priority Pickup 🚚",
        description: "Your donation will be prioritized for pickup within 24 hours."
    },
    {
        type: "fast_verification",
        label: "Fast Verification ⚡",
        description: "Your donation will be verified by a volunteer immediately."
    },
    {
        type: "boosted_visibility",
        label: "Boosted Visibility 🌟",
        description: "Your fundraiser will appear at the top of the browse page."
    }
];

const RewardService = {
    /**
     * Generates a new reward for the user upon completing the puzzle.
     * @returns {Object} The generated reward object.
     */
    claimReward: () => {
        const rewards = RewardService.getAllRewards();
        const userId = localStorage.getItem("user_id") || "guest"; // Simulate user association

        // Check if user already has an unused reward (optional rule, but good for anti-farming)
        const hasUnused = rewards.some(r => r.userId === userId && r.status === "unused");
        if (hasUnused) {
            console.warn("User already has an unused reward.");
            return null;
        }

        const randomReward = REWARD_TYPES[Math.floor(Math.random() * REWARD_TYPES.length)];
        const newReward = {
            id: "rwd_" + Date.now() + Math.random().toString(36).substr(2, 5),
            userId: userId,
            rewardType: randomReward.type,
            rewardLabel: randomReward.label,
            rewardDescription: randomReward.description,
            code: "LOGIC-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
            status: "unused",
            createdAt: new Date().toISOString(),
            appliedToDonationId: null
        };

        rewards.push(newReward);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
        return newReward;
    },

    /**
     * Retrieves the first unused reward for the current user.
     * @returns {Object|null} The unused reward or null.
     */
    getUnusedReward: () => {
        const rewards = RewardService.getAllRewards();
        const userId = localStorage.getItem("user_id") || "guest";
        return rewards.find(r => r.userId === userId && r.status === "unused") || null;
    },

    /**
     * Marks a reward as used and links it to a donation.
     * @param {string} rewardId 
     * @param {string} donationId 
     */
    useReward: (rewardId, donationId) => {
        const rewards = RewardService.getAllRewards();
        const index = rewards.findIndex(r => r.id === rewardId);

        if (index !== -1) {
            rewards[index].status = "used";
            rewards[index].appliedToDonationId = donationId;
            rewards[index].usedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
            console.log(`Reward ${rewardId} applied to donation ${donationId}`);
            return true;
        }
        return false;
    },

    /**
     * Gets all rewards for the current user (history).
     */
    getUserRewards: () => {
        const rewards = RewardService.getAllRewards();
        const userId = localStorage.getItem("user_id") || "guest";
        return rewards.filter(r => r.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    /**
     * Helper to get all rewards from storage.
     */
    getAllRewards: () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to parse rewards", e);
            return [];
        }
    }
};

export default RewardService;
