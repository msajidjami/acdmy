import mongoose, {
Schema,
models,
model,
} from 'mongoose';

const ZoomMeetingSchema = new Schema(
{
academyId: {
type: Schema.Types.ObjectId,
ref: 'Academy',
required: true,
index: true,
},


teacherId: {
  type: Schema.Types.ObjectId,
  ref: 'Teacher',
  required: true,
  index: true,
},

zoomConnectionId: {
  type: Schema.Types.ObjectId,
  ref: 'ZoomConnection',
  required: true,
  index: true,
},

zoomMeetingId: {
  type: String,
  required: true,
  index: true,
  trim: true,
},

zoomUuid: {
  type: String,
  default: '',
  trim: true,
},

topic: {
  type: String,
  required: true,
  trim: true,
},

description: {
  type: String,
  default: '',
  trim: true,
},

startTime: {
  type: Date,
  required: true,
  index: true,
},

duration: {
  type: Number,
  required: true,
  min: 1,
  max: 1440,
},

timezone: {
  type: String,
  default: 'Asia/Karachi',
  trim: true,
},

password: {
  type: String,
  default: '',
  select: false,
},

startUrl: {
  type: String,
  default: '',
  select: false,
},

joinUrl: {
  type: String,
  default: '',
},

status: {
  type: String,
  enum: [
    'scheduled',
    'started',
    'finished',
    'cancelled',
  ],
  default: 'scheduled',
  index: true,
},

createdFrom: {
  type: String,
  enum: ['academy', 'teacher'],
  default: 'teacher',
},


},
{
timestamps: true,
}
);

ZoomMeetingSchema.index({
academyId: 1,
teacherId: 1,
startTime: 1,
});

ZoomMeetingSchema.index({
academyId: 1,
zoomMeetingId: 1,
});

const ZoomMeeting =
models.ZoomMeeting ||
model(
'ZoomMeeting',
ZoomMeetingSchema
);

export default ZoomMeeting;
