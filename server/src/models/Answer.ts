import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface IAnswer extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  questionId: string;
  content: string;
  answeredAt: Date;
}

const answerSchema = new Schema<IAnswer>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: String, required: true },
  content: { type: String, required: true },
  answeredAt: { type: Date, default: Date.now },
});

answerSchema.index({ userId: 1, questionId: 1 }, { unique: true });

answerSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Answer: Model<IAnswer> = mongoose.model<IAnswer>('Answer', answerSchema);
