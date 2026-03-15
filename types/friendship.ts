export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface Friendship {
    id: string;
    status: FriendshipStatus;
    userId: string;
    friendId: string;
    createdAt: string;
    updatedAt: string;

    // Joined data (optional)
    friendName?: string;
    friendEmail?: string;
}
