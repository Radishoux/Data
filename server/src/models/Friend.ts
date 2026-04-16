import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface IFriend extends Document {
  _id: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted';
  createdAt: Date;
}

const friendSchema = new Schema<IFriend>({
  requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

friendSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });

friendSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Friend: Model<IFriend> = mongoose.model<IFriend>('Friend', friendSchema);
