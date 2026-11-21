import mongoose, { Schema, Types, Model } from 'mongoose';

export type CallKind = 'audio' | 'video';
export type CallSessionStatus =
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'busy'
  | 'cancelled'
  | 'missed'
  | 'ended'
  | 'failed';

export interface ICallSession {
  _id: Types.ObjectId;
  callerId: Types.ObjectId;
  receiverId: Types.ObjectId;
  kind: CallKind;
  roomName: string;
  status: CallSessionStatus;
  createdAt: Date;
  acceptedAt?: Date | null;
  endedAt?: Date | null;
  endedBy?: Types.ObjectId | null;
  durationSeconds: number;
  expiresAt: Date;
}

const CallSessionSchema = new Schema<ICallSession>(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['audio', 'video'], required: true },
    roomName: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['ringing', 'accepted', 'rejected', 'busy', 'cancelled', 'missed', 'ended', 'failed'],
      default: 'ringing',
      index: true,
    },
    acceptedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    endedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    durationSeconds: { type: Number, default: 0, min: 0 },
    // Retained for cleanup/expiry logic; not a TTL index because call history is useful.
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

CallSessionSchema.index({ callerId: 1, status: 1, createdAt: -1 });
CallSessionSchema.index({ receiverId: 1, status: 1, createdAt: -1 });

const CallSession: Model<ICallSession> =
  (mongoose.models.CallSession as Model<ICallSession>) ||
  mongoose.model<ICallSession>('CallSession', CallSessionSchema);

export default CallSession;
