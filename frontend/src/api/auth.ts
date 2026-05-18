import apiClient from './client';

export type RegisterInput = {
    email: string;
    password: string;
    phone: string;
};

export type RegisterResponse = {
    message: string;
    userId: string;
};

export async function registerUser(input: RegisterInput): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', input);
    return response.data;
}

export type VerifyOtpInput = {
    email: string;
    otp: string;
};

export type User = {
    id: string;
    email: string;
    balance: string;
};

export type AuthResponse = {
    token: string;
    user: User;
};

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', input);
    return response.data;
}

export async function resendOtp(email: string): Promise<void> {
    await apiClient.post('/auth/resend-otp', { email });
}