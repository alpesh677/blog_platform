import mongoose from 'mongoose';
import slugify from 'slugify';

const blogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        slug: { type: String, unique: true },
        categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
        description: { type: String, required: true },
        content: { type: String, required: true },
        publishDate: { type: Date, default: Date.now },
        image: { type: String },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    },
    { timestamps: true }
);

blogSchema.pre('save', function (next) {
    if (!this.isModified('title')) return next();
    this.slug = slugify(this.title, { lower: true, strict: true });
    next();
});

export const Blog = mongoose.model('Blog', blogSchema);


