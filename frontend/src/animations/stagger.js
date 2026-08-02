// Shared framer-motion variants — previously copy-pasted identically across
// GroupList, ActivityList, and FriendsList.
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// FriendsList's cards use a scale-in rather than slide-up entrance.
export const staggerItemScale = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};
