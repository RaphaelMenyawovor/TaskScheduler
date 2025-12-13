import 'express';

declare global {
    namespace Express {
        interface Request {
            // adding payload to user property
            user?: {
                userId: number;
                email: string;
            };
        }
    }
}