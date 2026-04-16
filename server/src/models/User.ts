import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  nickname: string;
  email: string;
  passwordHash: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  nickname: { type: String, required: true, unique: false },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.virtual('id').get(function (this: IUser) {
  return this._id.toString();
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.resetToken;
    delete ret.resetTokenExpiry;
    return ret;
  },
});

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
