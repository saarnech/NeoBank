export type RegisterRequest = {
    email: string;
    password: string;
    phone: string;
};

export type RegisterResponse = {
    message: string;
    userId: string;
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