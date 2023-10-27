import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;

export interface Iuser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    },
    role: string;
    isVerified: boolean;
    courses: Array<{ courseId: string }>;
    comparePassword: (password: string) => Promise<boolean>;
    createAccessToken: () => Promise<string>;
    createRefreshToken: () => Promise<string>;
}

const userSchema: Schema<Iuser> = new mongoose.Schema({
    name: { type: String, required: [true, "Please provide name of user"] },
    email: {
        type: String, unique: true, required: [true, "Please provide name of user"], validate: {
            validator: function (val: string) {
                return emailRegexPattern.test(val);
            },
            message: "Please provide email address",
        }
    },
    password: { type: String, minLength: [8, "password must be of 8 characters"], select: false },
    avatar: { public_id: String, url: String },
    role: { type: String, default: "user" },
    isVerified: { type: Boolean, default: false },
    courses: [{ courseId: String }]
}, { timestamps: true })

// hash password
userSchema.pre<Iuser>("save", async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.createAccessToken = async function (): Promise<string> {
    return jwt.sign({ id: this._id }, process.env.ACESSTOKENPRIVATEKEY as string, { expiresIn: '5m' })
}

userSchema.methods.createRefreshToken = async function (): Promise<string> {
    return jwt.sign({ id: this._id }, process.env.REFRESHTOKENPRIVATEKEY as string, { expiresIn: '3d' })
}

const userModel: Model<Iuser> = mongoose.model('User', userSchema);

export default userModel;