/** Standard API response wrapper for single-item mutations */
export interface ApiResponse<T = unknown> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
}

/** Standard API response for list queries */
export interface ApiListResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T[];
}

/** Auth verify-otp response */
export interface VerifyOtpResponse {
    success: boolean;
    error?: string;
    token?: string;
    user?: {
        id: string;
        email: string;
        createdAt: string;
    };
    profile?: any;
    onboardingCompleted?: boolean;
}

/** Role query response */
export interface RoleResponse {
    data: { role: string } | null;
    error?: string;
}
