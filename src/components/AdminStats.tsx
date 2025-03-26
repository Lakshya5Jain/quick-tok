
import React from 'react';
import { motion } from 'framer-motion';

interface AdminStatsProps {
  stats: {
    total_users: number;
    total_videos: number;
    updated_at: string;
  } | null;
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-6 bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg"
    >
      <h2 className="text-xl font-bold mb-4 text-white">System Statistics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-800 rounded-lg">
          <p className="text-sm text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-quicktok-orange">{stats.total_users}</p>
        </div>
        <div className="p-4 bg-zinc-800 rounded-lg">
          <p className="text-sm text-gray-400">Total Videos</p>
          <p className="text-2xl font-bold text-quicktok-orange">{stats.total_videos}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Last updated: {new Date(stats.updated_at).toLocaleString()}
      </p>
    </motion.div>
  );
};

export default AdminStats;
