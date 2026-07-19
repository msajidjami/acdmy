"use client";

import { useEffect, useState } from "react";

import ClassCard from "@/app/components/dashboard/ClassCard";
import ClassDetailsModal from "@/app/components/dashboard/ClassDetailsModal";


interface ClassType {

  _id:string;

  title:string;

  date:string;

  duration:number;

  status:
  | "scheduled"
  | "completed"
  | "cancelled";

  teacher?:{
    name:string;
    email:string;
  };

  student?:{
    name:string;
    email:string;
  };

  course?:{
    title:string;
  };

  meetingLink?:string;

  meetingProvider?:string;

}



export default function ClassesPage(){


const [classes,setClasses]=useState<ClassType[]>([]);

const [loading,setLoading]=useState(true);

const [activeTab,setActiveTab]=useState<
"upcoming"|"completed"|"cancelled"
>("upcoming");


const [selectedClass,setSelectedClass]=
useState<ClassType|null>(null);



async function fetchClasses(){

try{

setLoading(true);


const res=await fetch(
"/api/classes",
{
credentials:"include"
}
);


const data=await res.json();


if(data.success){

setClasses(data.classes);

}


}catch(error){

console.log(error);


}
finally{

setLoading(false);

}


}



useEffect(()=>{

fetchClasses();

},[]);




const filteredClasses =
classes.filter((item)=>{


if(activeTab==="upcoming"){

return item.status==="scheduled";

}


if(activeTab==="completed"){

return item.status==="completed";

}


if(activeTab==="cancelled"){

return item.status==="cancelled";

}


});





return (

<div className="p-6 space-y-6">


<div>

<h1 className="text-3xl font-bold">
My Classes
</h1>


<p className="text-gray-500 mt-2">
Manage your online learning sessions
</p>


</div>



{/* Tabs */}

<div className="
flex gap-3
bg-gray-100
p-2
rounded-xl
w-fit
">


<button

onClick={()=>setActiveTab("upcoming")}

className={`
px-5 py-2 rounded-lg
${activeTab==="upcoming"
?
"bg-black text-white"
:
"bg-white"
}
`}
>

Upcoming (
{
classes.filter(
c=>c.status==="scheduled"
).length
}
)

</button>



<button

onClick={()=>setActiveTab("completed")}

className={`
px-5 py-2 rounded-lg
${activeTab==="completed"
?
"bg-black text-white"
:
"bg-white"
}
`}
>

Completed (
{
classes.filter(
c=>c.status==="completed"
).length
}
)

</button>



<button

onClick={()=>setActiveTab("cancelled")}

className={`
px-5 py-2 rounded-lg
${activeTab==="cancelled"
?
"bg-black text-white"
:
"bg-white"
}
`}
>

Cancelled (
{
classes.filter(
c=>c.status==="cancelled"
).length
}
)

</button>


</div>





{/* Loading */}

{
loading &&

<div className="
grid md:grid-cols-2 lg:grid-cols-3 gap-6
">

{
[1,2,3].map(i=>(

<div

key={i}

className="
h-52
bg-gray-100
rounded-2xl
animate-pulse
"

/>

))
}

</div>

}




{/* Empty */}

{
!loading &&
filteredClasses.length===0 &&

<div className="
border rounded-2xl
p-10
text-center
">

<h2 className="text-xl font-semibold">

No Classes Found

</h2>


<p className="text-gray-500 mt-2">

Your scheduled classes will appear here.

</p>


</div>

}





{/* Cards */}

{

!loading &&

<div className="
grid
sm:grid-cols-2
xl:grid-cols-3
gap-6
">


{
filteredClasses.map((item)=>(


<ClassCard

key={item._id}

classData={item}

onDetails={()=>setSelectedClass(item)}

/>


))
}


</div>


}





{
selectedClass &&


<ClassDetailsModal

classData={selectedClass}

onClose={()=>setSelectedClass(null)}

/>


}



</div>


);


}