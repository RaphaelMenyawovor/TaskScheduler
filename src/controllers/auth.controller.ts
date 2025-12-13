import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import logger from '../utils/logger.js';

export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }

        const { email, password, name } = parsed.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            logger.warn(`Registration failed: Email ${email} already exists`);
            return res.status(409).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name ?? null, 
            },
        });

        logger.info(`New user registered with ID ${user.id}`);

        return res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, name: user.name }
        });

    } catch (error) {
        const errorMessage = (error as Error).message;
        logger.error(`Registration error: ${errorMessage}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

