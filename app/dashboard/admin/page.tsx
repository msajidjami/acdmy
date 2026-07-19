"use client";

import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Video
} from "lucide-react";



interface ClassType {

_id:string;

title:string;

date:string;

duration:number;

status:string;

student?:{
name:string;
};

teacher?:{
name:string;
};

course?:{
title:string;
};

meetingLink?:string;

}





export default function AdminClassesPage(){


const [classes,setClasses]=useState<ClassType[]>([]);

const [loading,setLoading]=useState(true);


const [showForm,setShowForm]=useState(false);





const [form,setForm]=useState({

title:"",

student:"",

teacher:"",

course:"",

date:"",

duration:30,

meetingProvider:"Zoom",

meetingLink:""


});







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









async function createClass(){


try{


const res =
await fetch(

"/api/classes",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify(form)

}

);



const data=await res.json();



if(data.success){

setShowForm(false);

setForm({

title:"",

student:"",

teacher:"",

course:"",

date:"",

duration:30,

meetingProvider:"Zoom",

meetingLink:""

});


loadClasses();

}



}

catch(error){

console.log(error);

}



}









async function deleteClass(id:string){


const confirmDelete =
confirm(
"Delete this class?"
);


if(!confirmDelete)return;



await fetch(

`/api/classes/${id}`,

{

method:"DELETE",

credentials:"include"

}

);


loadClasses();


}







return (

<div className="
p-6
space-y-8
">


<div className="
flex
justify-between
items-center
">


<div>

<h1 className="
text-3xl
font-bold
">

Class Management

</h1>


<p className="
text-gray-500
">

Schedule and manage LMS classes

</p>

</div>





<button

onClick={()=>setShowForm(true)}

className="
bg-black
text-white
px-5
py-3
rounded-xl
flex
items-center
gap-2
"

>

<Plus size={18}/>

Schedule Class

</button>


</div>










{
showForm &&


<div className="
border
rounded-2xl
p-6
bg-white
space-y-5
">


<h2 className="
text-xl
font-bold
">

Create New Class

</h2>





<div className="
grid
md:grid-cols-2
gap-4
">



<input

placeholder="Class Title"

className="input"

value={form.title}

onChange={(e)=>

setForm({

...form,

title:e.target.value

})

}

/>





<input

placeholder="Student ID"

className="input"

value={form.student}

onChange={(e)=>

setForm({

...form,

student:e.target.value

})

}

/>






<input

placeholder="Teacher ID"

className="input"

value={form.teacher}

onChange={(e)=>

setForm({

...form,

teacher:e.target.value

})

}

/>






<input

placeholder="Course ID"

className="input"

value={form.course}

onChange={(e)=>

setForm({

...form,

course:e.target.value

})

}

/>







<input

type="datetime-local"

className="input"

value={form.date}

onChange={(e)=>

setForm({

...form,

date:e.target.value

})

}

/>






<input

type="number"

placeholder="Duration"

className="input"

value={form.duration}

onChange={(e)=>

setForm({

...form,

duration:Number(e.target.value)

})

}

/>







<input

placeholder="Meeting Link"

className="input"

value={form.meetingLink}

onChange={(e)=>

setForm({

...form,

meetingLink:e.target.value

})

}

/>



</div>






<div className="
flex
gap-3
">


<button

onClick={createClass}

className="
bg-green-600
text-white
px-5
py-2
rounded-xl
"

>

Create

</button>




<button

onClick={()=>setShowForm(false)}

className="
border
px-5
py-2
rounded-xl
"

>

Cancel

</button>


</div>





</div>


}









{/* Classes List */}


<div className="
grid
md:grid-cols-2
xl:grid-cols-3
gap-5
">


{

classes.map((item)=>(


<div

key={item._id}

className="
border
rounded-2xl
bg-white
p-5
space-y-4
"

>



<div className="
flex
justify-between
">


<h3 className="
font-bold
">

{
item.course?.title ||
item.title
}

</h3>


<span className="
text-xs
bg-gray-100
px-3
py-1
rounded-full
">

{
item.status
}

</span>


</div>






<p>

Student:

<b>

{
item.student?.name ||
"Not Assigned"
}

</b>

</p>




<p>

Teacher:

<b>

{
item.teacher?.name ||
"Not Assigned"
}

</b>

</p>






<div className="
flex
items-center
gap-2
text-sm
">

<CalendarDays size={16}/>

{
new Date(item.date)
.toLocaleString()
}

</div>






<div className="
flex
items-center
gap-2
text-sm
">

<Clock size={16}/>

{
item.duration
}
Minutes

</div>






<div className="
flex
gap-2
">


{

item.meetingLink &&

<a

href={item.meetingLink}

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
gap-2
"

>

<Video size={16}/>

Meeting

</a>

}




<button

onClick={()=>deleteClass(item._id)}

className="
border
rounded-lg
px-3
"

>

<Trash2 size={18}/>

</button>



</div>






</div>


))


}



</div>





</div>


);


}