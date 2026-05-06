export type RegisterRequest = {
    email: string;
    password: string;
    phone: string;
};

export type RegisterResponse = {
    message: string;
    userId: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type UserProfile = {
    id: string;
    email: string;
    balance: string;
};

export type AuthResponse = {
    token: string;
    user: UserProfile;
};

export type StoredUser = {
    id: string;
    email: string;
    passwordHash: string;
    phone: string;
    status: 'inactive' | 'active';
    balance: string;
    createdAt: Date;
};

export type VerifyOtpRequest = {
    email: string;
    otp: string;
};