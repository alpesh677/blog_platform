import {
    ApiError,
    asyncHandler,
    handleError,
    handleResponse,
} from '../utils/index.js';
import { User } from '../models/index.js';
import { validateFields } from '../utils/index.js';
import { StatusCodes } from 'http-status-codes';

const signUp = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    validateFields(req, {
        body: ['username', 'email', 'password'],
    });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'User already exists');
    }

    const isUsernameTaken = await User.findOne({ username });
    if (isUsernameTaken) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Username already taken');
    }

    const user = await User.create({ username, email, password });

    const token = user.generateToken();
    handleResponse(res, StatusCodes.CREATED, user, 'User created successfully');
});

const signIn = asyncHandler(async (req, res) => {
    validateFields(req, { body: ['identifier', 'password'] });
    const { identifier, password } = req.body;

    const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    const token = user.generateToken();
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
    });
    if (user.isAdmin) {
        res.redirect('/admin');
    } else {
        res.redirect('/');
    }
    res.redirect('/');
});

const me = asyncHandler(async (req, res) => {
    handleResponse(res, StatusCodes.OK, req?.user, 'User details');
});

const logout = asyncHandler(async (req, res) => {
    res.clearCookie('token');
    handleResponse(res, StatusCodes.OK, null, 'User logged out successfully');
});

const renderSignUp = (req, res) => {
    res.render('pages/signup', { title: 'Sign Up' });
};

const renderSignIn = (req, res) => {
    res.render('pages/signin', { title: 'Sign In' });
};

const authController = {
    signUp,
    signIn,
    me,
    logout,
    renderSignUp,
    renderSignIn,
};

export default authController;
