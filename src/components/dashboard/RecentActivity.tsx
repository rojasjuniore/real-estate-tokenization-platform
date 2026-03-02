"use client";

interface Activity {
  id: string;
  type: "purchase" | "sale" | "dividend" | "claim";
  propertyName: string;
  amount: string;
  timestamp: Date;
  status: "completed" | "pending" | "failed";
  txHash?: string;
}

interface RecentActivityProps {
  activities?: Activity[];
  maxItems?: number;
}

const activityConfig = {
  purchase: {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
    label: "Purchase",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  sale: {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    label: "Sale",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
  },
  dividend: {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
      />
    ),
    label: "Dividend",
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-400",
  },
  claim: {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    label: "Claim",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
  },
};

const statusConfig = {
  completed: {
    label: "Completed",
    color: "text-green-400",
  },
  pending: {
    label: "Pending",
    color: "text-yellow-400",
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
  },
};

/**
 * RecentActivity - Displays a list of recent transactions and activities
 *
 * Usage:
 * <RecentActivity
 *   activities={[
 *     {
 *       id: "1",
 *       type: "purchase",
 *       propertyName: "Miami Apartment",
 *       amount: "500 USDT",
 *       timestamp: new Date(),
 *       status: "completed",
 *       txHash: "0x123..."
 *     }
 *   ]}
 *   maxItems={5}
 * />
 */
export function RecentActivity({
  activities = [],
  maxItems = 5,
}: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems);
  const hasActivities = displayActivities.length > 0;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        {hasActivities && (
          <button className="text-sm text-purple-400 hover:text-purple-300 transition">
            View All
          </button>
        )}
      </div>

      {hasActivities ? (
        <div className="space-y-4">
          {displayActivities.map((activity) => {
            const config = activityConfig[activity.type];
            const status = statusConfig[activity.status];

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-700/30 transition"
              >
                <div
                  className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <svg
                    className={`w-5 h-5 ${config.textColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {config.icon}
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {config.label}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {activity.propertyName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {activity.amount}
                      </p>
                      <p className={`text-xs ${status.color}`}>
                        {status.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                    {activity.txHash && (
                      <a
                        href={`https://polygonscan.com/tx/${activity.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 transition"
                      >
                        {shortenHash(activity.txHash)}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm mb-1">No recent activity</p>
          <p className="text-gray-500 text-xs text-center">
            Your transactions will appear here
          </p>
        </div>
      )}
    </div>
  );
}
