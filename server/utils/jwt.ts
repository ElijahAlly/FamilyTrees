import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is required');
    return new TextEncoder().encode(secret);
};

export interface JWTPayload {
    userId: string;
    email: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, getSecret());
    return {
        userId: payload.userId as string,
        email: payload.email as string,
    };
}
