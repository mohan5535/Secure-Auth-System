import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationTokenHash?: string;
  verificationTokenExpires?: Date;
  resetTokenHash?: string;
  resetTokenExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationTokenHash: String,
    verificationTokenExpires: Date,
    resetTokenHash: String,
    resetTokenExpires: Date
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);