import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

interface JwtPayload {
    userId: number;
    email: string;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Access denied. No token provided.');
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        if (!(process.env.JWT_SECRET)) {
            logger.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ error: 'Internal server error' });
        }
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = decoded;

        next();

    } catch (err) {
        const errorMessage = (err as Error).message;
        logger.warn(`Invalid token: ${errorMessage}`);
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};