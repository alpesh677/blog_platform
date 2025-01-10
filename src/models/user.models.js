import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET,TOKEN_EXPIRY } from '../config/serverConfig.js';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        blogs: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Blog',
            },
        ],
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.generateToken = function () {
    return jwt.sign(
        {
            id: this._id,
            username: this.username,
            email: this.email,
            role: this.role,
        },
        TOKEN_SECRET,
        {
            expiresIn: TOKEN_EXPIRY,
        }
    );
};

userSchema.statics.decodedToken = function (token) {
    try {
        return jwt.verify(token, TOKEN_SECRET);
    } catch {
        return null;
    }
};

export const User = mongoose.model('User', userSchema);

