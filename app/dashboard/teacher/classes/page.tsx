"use client";

import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock,
  User,
  Video,
  CheckCircle,
  XCircle
} from "lucide-react";



interface TeacherClass {

_id:string;

title:string;

date:string;

duration:number;

status:
"scheduled"
|
"completed"
|
"cancelled";


student?:{
name:string;
email:string;
};


course?:{
title:string;
};


meetingLink?:string;


}




export default function TeacherClassesPage(){



const [classes,setClasses]=useState<TeacherClass[]>([]);

const [loading,setLoading]=useState(true);





async function loadClasses(){


try{


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



}
catch(error){

console.log(error);

}
finally{

setLoading(false);

}



}





useEffect(()=>{

loadClasses();

},[]);







async function updateStatus(

id:string,

status:string

){


try{


const res=await fetch(

`/api/classes/${id}`,

{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

status

})

}

);



const data=await res.json();



if(data.success){

loadClasses();

}



}
catch(error){

console.log(error);

}



}







const todayClasses =
classes.filter((item)=>{

const today =
new Date()
.toDateString();


return (
new Date(item.date)
.toDateString()
===
today
);

});






const upcomingClasses =
classes.filter((item)=>

item.status==="scheduled"

);







return (

<div className="
p-6
space-y-8
">


<div>


<h1 className="
text-3xl
font-bold
">

Teacher Classes

</h1>


<p className="
text-gray-500
mt-2
">

Manage your teaching schedule

</p>


</div>








{/* Today */}


<section>


<h2 className="
text-xl
font-semibold
mb-4
">

Today's Classes

</h2>



{

todayClasses.length===0 ?

<div className="
border
rounded-xl
p-6
text-gray-500
">

No classes today.

</div>


:


<div className="
grid
md:grid-cols-2
gap-5
">


{
todayClasses.map((item)=>(

<TeacherCard

key={item._id}

item={item}

updateStatus={updateStatus}

/>


))

}


</div>


}



</section>










{/* Upcoming */}


<section>


<h2 className="
text-xl
font-semibold
mb-4
">

Upcoming Classes

</h2>



<div className="
grid
md:grid-cols-2
xl:grid-cols-3
gap-5
">


{

upcomingClasses.map((item)=>(


<TeacherCard

key={item._id}

item={item}

updateStatus={updateStatus}

/>


))


}


</div>


</section>





</div>


);


}









function TeacherCard({

item,

updateStatus

}:{

item:TeacherClass;

updateStatus:(id:string,status:string)=>void;

}){


return (

<div

className="
border
rounded-2xl
p-5
bg-white
shadow-sm
space-y-4
"

>


<div className="
flex
justify-between
">


<div>


<h3 className="
font-bold
text-lg
">

{
item.course?.title ||
item.title
}

</h3>


<p className="
text-sm
text-gray-500
">

{item.title}

</p>


</div>



<span

className="
bg-green-100
text-green-700
px-3
py-1
rounded-full
text-xs
"

>

{
item.status
}

</span>



</div>







<div className="
space-y-2
text-sm
">


<div className="
flex
gap-2
items-center
">

<User size={16}/>


Student:

<strong>

{
item.student?.name ||
"Unknown"
}

</strong>


</div>






<div className="
flex
gap-2
items-center
">


<CalendarDays size={16}/>


{
new Date(item.date)
.toLocaleDateString()
}


</div>






<div className="
flex
gap-2
items-center
">

<Clock size={16}/>


{
item.duration || 30
}
Minutes


</div>



</div>







<div className="
flex
gap-2
">


{

item.status==="scheduled" &&

<>


<a

href={item.meetingLink || "#"}

target="_blank"

className="
flex-1
bg-black
text-white
rounded-lg
py-2
text-center
flex
justify-center
items-center
gap-2
"

>

<Video size={16}/>

Start

</a>




<button

onClick={()=>updateStatus(
item._id,
"completed"
)}

className="
flex-1
bg-green-600
text-white
rounded-lg
"

>

<CheckCircle size={16}/>

Complete

</button>


</>


}








{

item.status==="scheduled" &&


<button

onClick={()=>updateStatus(
item._id,
"cancelled"
)}

className="
px-3
border
rounded-lg
"

>

<XCircle size={18}/>

</button>


}




</div>





</div>

);


}