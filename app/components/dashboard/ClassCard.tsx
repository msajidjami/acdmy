"use client";

import {
  CalendarDays,
  Clock,
  Video,
  User,
  BookOpen
} from "lucide-react";


type ClassStatus =
  | "scheduled"
  | "completed"
  | "cancelled";


interface ClassCardProps {

  classData: {

    _id:string;

    title:string;

    date:string;

    duration?:number;

    status:ClassStatus;

    teacher?:{
      name:string;
      email?:string;
    };

    course?:{
      title:string;
    };

    meetingLink?:string;

  };

  onDetails:()=>void;

}



export default function ClassCard({

classData,

onDetails

}:ClassCardProps){



const {

title,

date,

duration,

status,

teacher,

course,

meetingLink

}=classData;




function formatDate(date:string){

return new Date(date)
.toLocaleDateString(
"en-US",
{
weekday:"short",
day:"numeric",
month:"short",
year:"numeric"
}
);

}





const statusStyle:Record<ClassStatus,string>={

scheduled:
"bg-green-100 text-green-700",

completed:
"bg-blue-100 text-blue-700",

cancelled:
"bg-red-100 text-red-700"

};





return (

<div

className="
bg-white
border
rounded-2xl
shadow-sm
hover:shadow-lg
transition
p-5
space-y-5
"

>


<div className="
flex
justify-between
items-start
">


<div className="
flex
gap-3
items-center
">


<div className="
h-12
w-12
rounded-xl
bg-indigo-100
flex
items-center
justify-center
">


<BookOpen
className="text-indigo-600"
/>


</div>



<div>


<h3 className="
font-bold
text-lg
">

{
course?.title || title
}

</h3>


<p className="
text-sm
text-gray-500
">

{title}

</p>


</div>


</div>





<span

className={`
px-3
py-1
rounded-full
text-xs
font-medium
${statusStyle[status]}
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







<div className="
flex
items-center
gap-3
text-sm
">


<User size={18}/>


<div>

<p className="text-gray-500">

Teacher

</p>


<p className="font-medium">

{
teacher?.name || "Not Assigned"
}

</p>


</div>


</div>








<div className="
grid
grid-cols-2
gap-4
">


<div className="
flex
items-center
gap-2
text-sm
">

<CalendarDays size={18}/>


<div>

<p className="text-gray-500">

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
items-center
gap-2
text-sm
">


<Clock size={18}/>


<div>


<p className="text-gray-500">

Duration

</p>


<p className="font-medium">

{
duration ?? 30
}
 Minutes

</p>


</div>


</div>



</div>








<div className="
flex
gap-3
">


{

status==="scheduled" &&

<a

href={meetingLink || "#"}

target="_blank"

className="
flex-1
bg-black
text-white
rounded-xl
py-2
text-center
flex
items-center
justify-center
gap-2
"

>


<Video size={18}/>

Join Class

</a>

}





<button

onClick={onDetails}

className="
flex-1
border
rounded-xl
py-2
hover:bg-gray-50
"

>

Details

</button>



</div>




</div>

);


}