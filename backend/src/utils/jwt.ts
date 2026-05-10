import jwt, { SignOptions } from 'jsonwebtoken';

export type JwtPayload = {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
};

const SECRET: string = process.env.JWT_SECRET ?? '';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET) {
    throw new Error('JWT_SECRET not set in environment');
}

export function signToken(payload: JwtPayload): string {
    const options: SignOptions = { expiresIn: EXPIRES_IN as SignOptions['expiresIn'] };
    return jwt.sign(payload, SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, SECRET);
    return decoded as unknown as JwtPayload;
}