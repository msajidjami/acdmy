import mongoose,{Schema} from "mongoose";

const AvailabilitySchema = new Schema({

teacherId:{
type:Schema.Types.ObjectId,
ref:"Teacher",
required:true
},

day:{
type:String,
required:true
},

startTime:{
type:String,
required:true
},

endTime:{
type:String,
required:true
},

booked:{
type:Boolean,
default:false
}

},{
timestamps:true
});

export default mongoose.models.TeacherAvailability ||

mongoose.model(
"TeacherAvailability",
AvailabilitySchema
);