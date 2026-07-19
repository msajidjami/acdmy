"use client";

import {
  X,
  CalendarDays,
  Clock,
  User,
  BookOpen,
  Video,
  CheckCircle,
  FileText
} from "lucide-react";



interface ClassDetailsModalProps {

  classData:any;

  onClose:()=>void;

}



export default function ClassDetailsModal({

  classData,

  onClose

}:ClassDetailsModalProps){



if(!classData) return null;



const {

title,

date,

duration,

status,

teacher,

course,

meetingLink,

meetingProvider,

meetingId,

meetingPassword,

notes,

homework

}=classData;





function formatDate(date:string){

return new Date(date)
.toLocaleDateString(
"en-US",
{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
}
);

}




function formatTime(date:string){

return new Date(date)
.toLocaleTimeString(
"en-US",
{
hour:"2-digit",
minute:"2-digit"
}
);

}






return (

<div

className="
fixed
inset-0
z-50
flex
items-center
justify-center
bg-black/50
p-4
"

onClick={onClose}

>



<div

className="
bg-white
rounded-3xl
w-full
max-w-xl
shadow-xl
overflow-hidden
"

onClick={(e)=>e.stopPropagation()}

>



{/* Header */}

<div

className="
flex
justify-between
items-start
p-6
border-b
"

>


<div>


<h2 className="
text-2xl
font-bold
">

{course?.title || title}

</h2>


<p className="
text-gray-500
mt-1
">

{title}

</p>


</div>



<button

onClick={onClose}

className="
p-2
rounded-full
hover:bg-gray-100
"

>

<X size={22}/>

</button>



</div>







{/* Body */}

<div className="
p-6
space-y-5
">





{/* Status */}


<div>

<span

className={`
px-3
py-1
rounded-full
text-sm
font-medium

${
status==="scheduled"
?
"bg-green-100 text-green-700"
:
status==="completed"
?
"bg-blue-100 text-blue-700"
:
"bg-red-100 text-red-700"
}

`}

>

{
status==="scheduled"
?
"Upcoming"
:
status
}

</span>

</div>






{/* Teacher */}


<div className="
flex
items-center
gap-3
">

<User/>

<div>

<p className="
text-sm
text-gray-500
">

Teacher

</p>


<p className="
font-semibold
">

{
teacher?.name ||
"Not Assigned"
}

</p>


<p className="
text-sm
text-gray-500
">

{
teacher?.email
}

</p>


</div>


</div>








{/* Course */}


<div className="
flex
items-center
gap-3
">

<BookOpen/>

<div>

<p className="
text-sm
text-gray-500
">

Course

</p>


<p className="
font-semibold
">

{
course?.title ||
"Not Available"
}

</p>


</div>


</div>







{/* Date Time */}

<div className="
grid
grid-cols-2
gap-4
">


<div className="
flex
gap-3
items-center
">

<CalendarDays/>


<div>

<p className="
text-sm
text-gray-500
">

Date

</p>


<p className="font-medium">

{
formatDate(date)
}

</p>


</div>


</div>






<div className="
flex
gap-3
items-center
">

<Clock/>


<div>

<p className="
text-sm
text-gray-500
">

Time

</p>


<p className="font-medium">

{
formatTime(date)
}

</p>


</div>


</div>



</div>








{/* Meeting */}

{

meetingLink &&

<div className="
bg-gray-50
rounded-xl
p-4
space-y-3
">


<div className="
flex
items-center
gap-2
font-semibold
">

<Video size={18}/>

Online Meeting

</div>



<p className="
text-sm
text-gray-600
">

Provider:
{
meetingProvider || "Zoom"
}

</p>



{
meetingId &&
<p className="text-sm">

Meeting ID:
{
meetingId
}

</p>
}




{
meetingPassword &&

<p className="text-sm">

Password:
{
meetingPassword
}

</p>

}




<a

href={meetingLink}

target="_blank"

className="
block
text-center
bg-black
text-white
rounded-xl
py-3
mt-3
"

>

Join Class

</a>



</div>


}









{/* Notes */}

{

notes &&

<div className="
border
rounded-xl
p-4
">


<h3 className="
font-semibold
flex
gap-2
items-center
">

<FileText size={18}/>

Notes

</h3>


<p className="
text-gray-600
mt-2
">

{notes}

</p>


</div>


}









{/* Homework Placeholder */}


<div className="
border
rounded-xl
p-4
">


<h3 className="
font-semibold
flex
items-center
gap-2
">

<CheckCircle size={18}/>

Homework & Attendance

</h3>


<p className="
text-gray-500
text-sm
mt-2
">

Homework submission and attendance tracking will appear here.

</p>


</div>







</div>





{/* Footer */}

<div className="
border-t
p-4
flex
justify-end
">


<button

onClick={onClose}

className="
px-5
py-2
rounded-xl
border
hover:bg-gray-50
"

>

Close

</button>


</div>






</div>


</div>


);


}