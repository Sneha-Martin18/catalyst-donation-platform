import React, { useEffect, useState } from 'react';
import RewardService from '../../api/mockRewardService';

const RewardHistory = () => {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Retrieve rewards from "backend"
        const data = RewardService.getUserRewards();
        setRewards(data);
        setLoading(false);
    }, []);

    if (loading) return <div>Loading history...</div>;

    if (rewards.length === 0) {
        return (
            <div className="text-gray-500 text-sm text-center py-4 italic">
                No rewards earned yet. Complete logic puzzles to earn boosts!
            </div>
        );
    }

    return (
        <div className="reward-history-container">
            <h3 className="text-md font-bold text-gray-800 mb-3 border-b pb-2">Reward History</h3>
            <div className="space-y-3">
                {rewards.map(reward => (
                    <div
                        key={reward.id}
                        className={`p-3 rounded-lg border text-sm ${reward.status === 'unused'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200 opacity-75'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${reward.status === 'unused' ? 'text-green-700' : 'text-gray-600'}`}>
                                {reward.rewardLabel}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${reward.status === 'unused'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                {reward.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-600 text-xs mb-1">{reward.rewardDescription}</p>
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>Comp: {new Date(reward.createdAt).toLocaleDateString()}</span>
                            {reward.appliedToDonationId && (
                                <span>Applied to: {reward.appliedToDonationId}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RewardHistory;
