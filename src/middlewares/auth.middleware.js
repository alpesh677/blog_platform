import { User } from "../models/index.js";
import { handleError } from "../utils/handleError.js";
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET, TOKEN_EXPIRY } from '../config/serverConfig.js';
import { StatusCodes } from "http-status-codes";

const authMiddleware = async (req, res, next) => {
    try {
        const token =
            req.header('Authorization')?.replace('Bearer ', '') ||
            req.cookies?.token;

        if (!token) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: "Invalid token" });
        }

        const decoded = jwt.verify(token, TOKEN_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        handleError(error, res);
    }
};

export { authMiddleware };