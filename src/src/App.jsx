import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ollqwsspjerttgwzmxkg.supabase.co";
const SUPABASE_KEY = "sb_publishable_xtKliNdt0Bl2GFU1HdeO4g_QKJlZRUB";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STORAGE_KEY = "workboard_v3";
const USER_KEY = "workboard_user_v1";
const ADMIN_EMAIL = "info@solpaloudeco.com.ar";

const MEMBER_COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f43f5e","#a855f7","#0ea5e9","#10b981","#f59e0b","#6366f1","#d946ef","#fb923c"];
const PROJECT_COLORS = ["#6366f1","#f59e0b","#22c55e","#ef4444","#14b8a6","#8b5cf6","#f97316","#ec4899","#0ea5e9","#84cc16"];

const DEFAULT_MEMBERS = [
  {id:1,name:"Sol",role:"Team"},{id:2,name:"Dolo",role:"Team"},
  {id:3,name:"Grace",role:"Team"},{id:4,name:"Caro",role:"Team"},
  {id:5,name:"Meli",role:"Team"},{id:6,name:"Rita",role:"Team"},
  {id:7,name:"Mariela",role:"Team"},{id:8,name:"Tobal",role:"Team"},
  {id:9,name:"Belen",role:"Team"},{id:10,name:"Azul",role:"Team"},
  {id:11,name:"Cami",role:"Team"},{id:12,name:"Lu",role:"Team"},
  {id:13,name:"Mary",role:"Team"},{id:14,name:"Lara B",role:"Team"},
  {id:15,name:"Gaston",role:"Team"},{id:16,name:"Nico",role:"Team"},
  {id:17,name:"Lean",role:"Team"},{id:18,name:"Leo",role:"Team"},
  {id:19,name:"Dai",role:"Team"},{id:20,name:"Ailen",role:"Team"},
  {id:21,name:"Lourdes",role:"Team"},{id:22,name:"Eze",role:"Team"},
  {id:23,name:"Nina",role:"Team"},{id:24,name:"Naty",role:"Team"},
  {id:25,name:"Paloma",role:"Team"},{id:26,name:"Tamara",role:"Team"},
  {id:27,name:"Lara L",role:"Team"},{id:28,name:"Carlos",role:"Team"},
  {id:29,name:"Juan Cruz",role:"Team"},{id:30,name:"Melisa",role:"Team"},
  {id:31,name:"Cris",role:"Team"},{id:32,name:"P32",role:"Team"},
  {id:33,name:"P33",role:"Team"},{id:34,name:"P34",role:"Team"},
  {id:35,name:"P35",role:"Team"},{id:36,name:"P36",role:"Team"},
  {id:37,name:"P37",role:"Team"},{id:38,name:"P38",role:"Team"},
  {id:39,name:"Emi",role:"Team"},{id:40,name:"Yami",role:"Team"}
].map((m,i)=>({...m,color:MEMBER_COLORS[i%MEMBER_COLORS.length]}));

const DEFAULT_PROJECTS = [
  {id:1,name:"Desarrollo Web",description:"Rediseño del sitio principal y mejoras de UX.",color:"#6366f1",memberIds:[1,2,3,4,5,6],createdBy:1,createdAt:Date.now()},
  {id:2,name:"Campaña Marketing Q3",description:"Estrategia y ejecución de la campaña del tercer trimestre.",color:"#f59e0b",memberIds:[1,7,11,12],createdBy:7,createdAt:Date.now()},
];

const DEFAULT_TASKS = [
  {id:1,projectId:1,title:"Definir objetivos Q3",description:"Reunión para establecer las metas y OKRs del trimestre.",assigneeId:1,dueDate:"2026-06-15",priority:"alta",column:"todo",comments:[],links:[],createdAt:Date.now()},
  {id:2,projectId:1,title:"Diseño del nuevo dashboard",description:"Crear wireframes, prototipos y guía de estilo.",assigneeId:3,dueDate:"2026-06-20",priority:"alta",column:"inprogress",comments:[],links:[],createdAt:Date.now()},
];

const PRIORITY = {alta:{label:"Alta",color:"#dc2626",bg:"#fef2f2"},media:{label:"Media",color:"#d97706",bg:"#fffbeb"},baja:{label:"Baja",color:"#16a34a",bg:"#f0fdf4"}};
const COLUMNS = [{id:"todo",label:"Por hacer",accent:"#6366f1",light:"#eef2ff"},{id:"inprogress",label:"En progreso",accent:"#f59e0b",light:"#fffbeb"},{id:"done",label:"Completado",accent:"#22c55e",light:"#f0fdf4"}];

function initials(name){ return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(); }
async function hashPin(pin){ const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("wb26_"+pin)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join(""); }

function Avatar({member,size=32,style:extra={}}){
  if(!member) return null;
  return <div style={{width:size,height:size,borderRadius:"50%",background:member.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:700,color:"#fff",flexShrink:0,border:"2px solid white",boxSizing:"border-box",...extra}}>{initials(member.name)}</div>;
}

function MentionInput({value,onChange,onSubmit,placeholder,style,members}){
  const [search,setSearch]=useState(null);
  const [atPos,setAtPos]=useState(0);
  const ref=useRef();
  const handle=(e)=>{ const val=e.target.value,pos=e.target.selectionStart; const m=val.slice(0,pos).match(/@(\w*)$/); if(m){setSearch(m[1]);setAtPos(pos-m[0].length);}else setSearch(null); onChange(val); };
  const insert=(member)=>{ const fn=member.name.split(" ")[0]; const cur=ref.current?ref.current.selectionStart:value.length; onChange(value.slice(0,atPos)+"@"+fn+" "+value.slice(cur)); setSearch(null); setTimeout(()=>ref.current?.focus(),0); };
  const filtered=search!==null?members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())).slice(0,6):[];
  return (
    <div style={{position:"relative",flex:1}}>
      <input ref={ref} value={value} onChange={handle} onKeyDown={e=>{if(e.key==="Enter"&&search===null)onSubmit();if(e.key==="Escape")setSearch(null);}} placeholder={placeholder} style={style}/>
      {filtered.length>0&&(
        <div style={{position:"absolute",bottom:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.14)",zIndex:300,marginBottom:4,overflow:"hidden"}}>
          {filtered.map(m=>(<div key={m.id} onMouseDown={e=>{e.preventDefault();insert(m);}} style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontSize:13}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Avatar member={m} size={24}/><div><div style={{fontWeight:600,color:"#1e293b"}}>{m.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{m.role}</div></div></div>))}
        </div>
      )}
    </div>
  );
}

function Keypad({onPress,onDelete}){
  const keys=["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:220,margin:"0 auto"}}>{keys.map((k,i)=>k===""?<div key={i}/>:<button key={i} onClick={()=>k==="⌫"?onDelete():onPress(k)} style={{padding:"16px 0",borderRadius:10,border:"1px solid #1e293b",background:k==="⌫"?"#0f172a":"#1e293b",color:k==="⌫"?"#64748b":"#fff",fontSize:k==="⌫"?20:18,fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=k==="⌫"?"#1e293b":"#334155"} onMouseLeave={e=>e.currentTarget.style.background=k==="⌫"?"#0f172a":"#1e293b"}>{k}</button>)}</div>;
}

function AuthFlow({members,onLogin}){
  const [step,setStep]=useState("pick");
  const [selected,setSelected]=useState(null);
  const [pin,setPin]=useState("");
  const [pinConfirm,setPinConfirm]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [q,setQ]=useState("");
  const filtered=members.filter(m=>m.name.toLowerCase().includes(q.toLowerCase()));
  
  const pickMember=(member)=>{ 
    setSelected(member);
    setError("");
    setPin("");
    setLoading(true); 
    try{
      const r=localStorage.getItem(`pin_${member.id}`);
      setStep(r?"enter":"create");
    }catch{
      setStep("create");
    } 
    setLoading(false); 
  };
  
  const pressPin=(d)=>{ 
    if(step==="create"||step==="enter")setPin(p=>p.length<4?p+d:p); 
    if(step==="confirm")setPinConfirm(p=>p.length<4?p+d:p); 
  };
  
  const deletePin=()=>{ 
    if(step==="confirm")setPinConfirm(p=>p.slice(0,-1));
    else setPin(p=>p.slice(0,-1)); 
  };
  
  useEffect(()=>{ 
    if(step==="create"&&pin.length===4){
      setTimeout(()=>{setStep("confirm");setError("");},150);
    } 
  },[pin,step]);
  
  useEffect(()=>{ 
    if(step==="confirm"&&pinConfirm.length===4){
      (async()=>{ 
        if(pinConfirm!==pin){
          setError("Los PINs no coinciden.");
          setPin("");
          setPinConfirm("");
          setStep("create");
          return;
        } 
        const h=await hashPin(pin);
        try{
          localStorage.setItem(`pin_${selected.id}`,h);
        }catch{} 
        onLogin(selected); 
      })();
    } 
  },[pinConfirm,step]);
  
  useEffect(()=>{ 
    if(step==="enter"&&pin.length===4){
      (async()=>{ 
        setLoading(true);
        const h=await hashPin(pin);
        try{
          const r=localStorage.getItem(`pin_${selected.id}`);
          if(r===h){
            onLogin(selected);
          }else{
            setError("PIN incorrecto.");
            setPin("");
          }
        }catch{
          setError("Error al verificar.");
          setPin("");
        } 
        setLoading(false); 
      })();
    } 
  },[pin,step]);

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <h1 style={{color:"white",marginBottom:40,fontSize:44,fontWeight:700}}>📋 WorkBoard</h1>
      
      {step==="pick"&&(
        <div style={{maxWidth:500,width:"100%",background:"#1e293b",padding:30,borderRadius:12,border:"1px solid #334155"}}>
          <p style={{color:"#cbd5e1",marginBottom:20,fontSize:13,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>Selecciona tu nombre</p>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={{width:"100%",padding:12,marginBottom:20,borderRadius:8,border:"1px solid #475569",background:"#0f172a",color:"white",fontSize:14}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))",gap:10,maxHeight:400,overflowY:"auto"}}>
            {filtered.map(m=><button key={m.id} onClick={()=>pickMember(m)} style={{padding:12,borderRadius:8,border:"1px solid #475569",background:"#0f172a",color:"white",cursor:"pointer",fontSize:13,fontWeight:600,transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="#1e293b"} onMouseLeave={e=>e.currentTarget.style.background="#0f172a"}>{m.name}</button>)}
          </div>
        </div>
      )}
      
      {(step==="create"||step==="confirm"||step==="enter")&&selected&&(
        <div style={{textAlign:"center",background:"#1e293b",padding:40,borderRadius:12,border:"1px solid #334155",maxWidth:350,width:"100%"}}>
          <p style={{color:"#cbd5e1",marginBottom:10,fontSize:13,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>
            {step==="create"?"Crea tu PIN":(step==="confirm"?"Confirma tu PIN":"Ingresa tu PIN")}
          </p>
          <div style={{display:"flex",gap:8,justifyContent:"center",margin:"20px 0"}}>
            {[0,1,2,3].map(i=>(<div key={i} style={{width:18,height:18,borderRadius:"50%",background:(step==="create"||step==="confirm")?((step==="confirm"?pinConfirm:pin).length>i?"#f59e0b":"transparent"):((pin).length>i?"#f59e0b":"transparent"),border:`2px solid ${(step==="create"||step==="confirm")?((step==="confirm"?pinConfirm:pin).length>i?"#f59e0b":"#334155"):((pin).length>i?"#f59e0b":"#334155")}`,transition:"all 0.15s"}}/>))}
          </div>
          <Keypad onPress={pressPin} onDelete={deletePin}/>
          {error&&<p style={{color:"#ef4444",marginTop:15,fontSize:13}}>{error}</p>}
          {loading&&<p style={{color:"#94a3b8",marginTop:15,fontSize:13}}>Verificando...</p>}
        </div>
      )}
    </div>
  );
}

export default function App(){
  const [user,setUser]=useState(null);
  const [projects,setProjects]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [selectedProject,setSelectedProject]=useState(null);
  const [selectedTask,setSelectedTask]=useState(null);
  const [newProjectName,setNewProjectName]=useState("");
  const [newTaskData,setNewTaskData]=useState({title:"",description:"",assigneeId:null,dueDate:"",priority:"media"});
  const [commentText,setCommentText]=useState("");
  const [draggedTask,setDraggedTask]=useState(null);
  const [loading,setLoading]=useState(true);

  // CARGAR DATOS DE SUPABASE
  useEffect(()=>{
    const initData=async()=>{
      try{
        // Cargar proyectos
        const{data:projData}=await supabase.from("projects").select("*");
        if(projData)setProjects(projData);
        else{
          setProjects(DEFAULT_PROJECTS);
          for(let p of DEFAULT_PROJECTS)await supabase.from("projects").insert([p]);
        }
        
        // Cargar tareas
        const{data:taskData}=await supabase.from("tasks").select("*");
        if(taskData)setTasks(taskData);
        else{
          setTasks(DEFAULT_TASKS);
          for(let t of DEFAULT_TASKS)await supabase.from("tasks").insert([t]);
        }
      }catch(e){
        console.log("Error loading from Supabase, using localStorage");
        const stored=localStorage.getItem(STORAGE_KEY);
        if(stored){
          const{projects:p,tasks:t}=JSON.parse(stored);
          setProjects(p||DEFAULT_PROJECTS);
          setTasks(t||DEFAULT_TASKS);
        }else{
          setProjects(DEFAULT_PROJECTS);
          setTasks(DEFAULT_TASKS);
        }
      }
      setLoading(false);
    };
    initData();
  },[]);

  // SUSCRIPCIÓN EN TIEMPO REAL A CAMBIOS
  useEffect(()=>{
    const sub=supabase.from("projects").on("*",payload=>{
      if(payload.eventType==="INSERT")setProjects(p=>[...p,payload.new]);
      if(payload.eventType==="UPDATE")setProjects(p=>p.map(x=>x.id===payload.new.id?payload.new:x));
      if(payload.eventType==="DELETE")setProjects(p=>p.filter(x=>x.id!==payload.old.id));
    }).subscribe();
    return()=>supabase.removeSubscription(sub);
  },[]);

  useEffect(()=>{
    const sub=supabase.from("tasks").on("*",payload=>{
      if(payload.eventType==="INSERT")setTasks(t=>[...t,payload.new]);
      if(payload.eventType==="UPDATE")setTasks(t=>t.map(x=>x.id===payload.new.id?payload.new:x));
      if(payload.eventType==="DELETE")setTasks(t=>t.filter(x=>x.id!==payload.old.id));
    }).subscribe();
    return()=>supabase.removeSubscription(sub);
  },[]);

  // GUARDAR LOCALMENTE TAMBIÉN PARA BACKUP
  useEffect(()=>{
    if(projects.length>0||tasks.length>0)localStorage.setItem(STORAGE_KEY,JSON.stringify({projects,tasks}));
  },[projects,tasks]);

  const createProject=async()=>{
    if(!newProjectName.trim())return;
    const newProj={id:Date.now(),name:newProjectName,description:"",color:PROJECT_COLORS[projects.length%PROJECT_COLORS.length],memberIds:[user.id],createdBy:user.id,createdAt:Date.now()};
    try{
      await supabase.from("projects").insert([newProj]);
      setProjects([...projects,newProj]);
    }catch(e){
      setProjects([...projects,newProj]);
    }
    setNewProjectName("");
  };

  const createTask=async()=>{
    if(!newTaskData.title.trim()||!selectedProject)return;
    const newTask={id:Date.now(),projectId:selectedProject.id,...newTaskData,column:"todo",comments:[],links:[],createdAt:Date.now()};
    try{
      await supabase.from("tasks").insert([newTask]);
      setTasks([...tasks,newTask]);
    }catch(e){
      setTasks([...tasks,newTask]);
    }
    setNewTaskData({title:"",description:"",assigneeId:null,dueDate:"",priority:"media"});
  };

  const updateTask=async(taskId,updates)=>{
    try{
      await supabase.from("tasks").update(updates).eq("id",taskId);
      setTasks(tasks.map(t=>t.id===taskId?{...t,...updates}:t));
    }catch(e){
      setTasks(tasks.map(t=>t.id===taskId?{...t,...updates}:t));
    }
  };

  const deleteTask=async(taskId)=>{
    try{
      await supabase.from("tasks").delete().eq("id",taskId);
      setTasks(tasks.filter(t=>t.id!==taskId));
    }catch(e){
      setTasks(tasks.filter(t=>t.id!==taskId));
    }
    setSelectedTask(null);
  };

  const addComment=async(taskId,text)=>{
    const task=tasks.find(t=>t.id===taskId);
    if(!task)return;
    const newComments=[...(task.comments||[]),{id:Date.now(),author:user.name,text,createdAt:Date.now()}];
    await updateTask(taskId,{comments:newComments});
    if(selectedTask?.id===taskId)setSelectedTask({...selectedTask,comments:newComments});
    setCommentText("");
  };

  const handleDragStart=(e,task)=>{
    setDraggedTask(task);
    e.dataTransfer.effectAllowed="move";
  };

  const handleDragOver=(e)=>{
    e.preventDefault();
    e.dataTransfer.dropEffect="move";
  };

  const handleDrop=(e,column)=>{
    e.preventDefault();
    if(draggedTask&&draggedTask.projectId===selectedProject?.id){
      updateTask(draggedTask.id,{column});
      setDraggedTask(null);
    }
  };

  if(!user)return <AuthFlow members={DEFAULT_MEMBERS} onLogin={setUser}/>;

  const userProjects=projects.filter(p=>!p.memberIds||p.memberIds.includes(user.id));
  const projTasks=selectedProject?tasks.filter(t=>t.projectId===selectedProject.id):[];
  const assignee=DEFAULT_MEMBERS.find(m=>m.id===selectedTask?.assigneeId);

  return(
    <div style={{display:"flex",height:"100vh",background:"#0f172a",color:"#fff",fontFamily:"system-ui, -apple-system, sans-serif"}}>
      <div style={{width:280,background:"#1e293b",borderRight:"1px solid #334155",padding:20,overflowY:"auto"}}>
        <h2 style={{marginBottom:20,fontSize:18,fontWeight:700}}>📋 WorkBoard</h2>
        <div style={{padding:12,background:"#0f172a",borderRadius:8,marginBottom:20,border:"1px solid #334155"}}>
          <p style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>Conectado</p>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
            <Avatar member={user} size={32}/>
            <div><p style={{fontWeight:600,fontSize:14}}>{user.name}</p><p style={{fontSize:11,color:"#94a3b8"}}>{user.role}</p></div>
          </div>
        </div>
        <button onClick={()=>setUser(null)} style={{width:"100%",padding:10,background:"#ef4444",border:"none",borderRadius:8,color:"white",cursor:"pointer",fontWeight:600,marginBottom:20}}>Cerrar sesión</button>
        <button onClick={()=>setNewProjectName("new")} style={{width:"100%",padding:10,background:"#3b82f6",border:"none",borderRadius:8,color:"white",cursor:"pointer",fontWeight:600,marginBottom:25}}>+ Nuevo proyecto</button>
        <h3 style={{fontSize:12,fontWeight:700,marginBottom:12,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.05em"}}>Proyectos ({userProjects.length})</h3>
        {userProjects.map(p=>(
          <div key={p.id} onClick={()=>setSelectedProject(p)} style={{padding:12,background:selectedProject?.id===p.id?"#3b82f6":"#0f172a",borderRadius:8,marginBottom:8,cursor:"pointer",border:selectedProject?.id===p.id?"1px solid #60a5fa":"1px solid #334155",transition:"all 0.2s",borderLeft:`4px solid ${p.color}`}}>
            <p style={{fontWeight:600,fontSize:13}}>{p.name}</p>
            <p style={{fontSize:11,color:"#94a3b8",marginTop:5}}>📌 {projTasks.filter(t=>t.projectId===p.id).length}</p>
          </div>
        ))}
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {selectedProject?(
          <>
            <div style={{padding:25,borderBottom:"1px solid #334155",background:"#1e293b"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h1 style={{fontSize:28,fontWeight:700,color:selectedProject.color,margin:0}}>{selectedProject.name}</h1>
                <button onClick={()=>setSelectedProject(null)} style={{padding:"8px 16px",background:"#475569",border:"none",borderRadius:8,color:"white",cursor:"pointer",fontWeight:600}}>← Volver</button>
              </div>
            </div>
            <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:20,padding:25,overflowY:"auto"}}>
              {COLUMNS.map(col=>(
                <div key={col.id} onDragOver={handleDragOver} onDrop={e=>handleDrop(e,col.id)} style={{background:"#1e293b",borderRadius:12,padding:15,border:`1px solid ${col.accent}`,opacity:draggedTask?.column!==col.id?1:0.5}}>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:15,color:col.accent,display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{width:24,height:24,borderRadius:"50%",background:col.light,color:col.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>
                      {projTasks.filter(t=>t.column===col.id).length}
                    </span>
                    {col.label}
                  </h3>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {projTasks.filter(t=>t.column===col.id).map(t=>{
                      const tassignee=DEFAULT_MEMBERS.find(m=>m.id===t.assigneeId);
                      return(
                        <div key={t.id} draggable onDragStart={e=>handleDragStart(e,t)} onClick={()=>setSelectedTask(t)} style={{background:"#0f172a",padding:12,borderRadius:8,cursor:"move",border:`1px solid ${t.priority===undefined||t.priority==="baja"?"#16a34a":t.priority==="media"?"#d97706":"#dc2626"}`,borderLeft:`4px solid ${t.priority===undefined||t.priority==="baja"?"#16a34a":t.priority==="media"?"#d97706":"#dc2626"}`,transition:"all 0.2s"}}>
                          <p style={{fontWeight:600,fontSize:13,marginBottom:8}}>{t.title}</p>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:"#94a3b8"}}>
                            {tassignee&&<Avatar member={tassignee} size={20}/>}
                            <span>{PRIORITY[t.priority||"baja"].label}</span>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={()=>setNewTaskData({...newTaskData,title:""})} style={{padding:10,background:"rgba(255,255,255,0.05)",border:"1px dashed #475569",borderRadius:8,color:"#94a3b8",cursor:"pointer",fontSize:13,fontWeight:600,marginTop:5}}>+ Tarea</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ):<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,color:"#94a3b8"}}><p style={{fontSize:20,fontWeight:600}}>Selecciona un proyecto</p></div>}

        {selectedTask&&(
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
            <div style={{background:"#1e293b",borderRadius:12,padding:30,maxWidth:600,width:"90%",maxHeight:"80vh",overflowY:"auto",border:"1px solid #334155"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:25}}>
                <div><h2 style={{margin:0,fontSize:20,fontWeight:700}}>{selectedTask.title}</h2><p style={{fontSize:12,color:"#94a3b8",marginTop:5}}>{selectedTask.description}</p></div>
                <button onClick={()=>setSelectedTask(null)} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:24,padding:0}}>✕</button>
              </div>
              <div style={{display:"flex",gap:15,marginBottom:25,fontSize:12}}>
                {assignee&&<div><span style={{color:"#94a3b8"}}>Asignado a: </span><Avatar member={assignee} size={24} style={{marginTop:5}}/></div>}
                <div><span style={{color:"#94a3b8"}}>Prioridad: </span><span style={{color:PRIORITY[selectedTask.priority||"baja"].color,fontWeight:600}}>{PRIORITY[selectedTask.priority||"baja"].label}</span></div>
                {selectedTask.dueDate&&<div><span style={{color:"#94a3b8"}}>Vence: </span><span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span></div>}
              </div>
              <div style={{background:"#0f172a",padding:15,borderRadius:8,marginBottom:20}}>
                <h4 style={{marginBottom:12,fontSize:13,fontWeight:600,color:"#3b82f6"}}>💬 Comentarios ({selectedTask.comments?.length||0})</h4>
                {selectedTask.comments?.map(c=><div key={c.id} style={{background:"#1e293b",padding:10,borderRadius:6,marginBottom:10}}><p style={{fontSize:12,color:"#3b82f6",fontWeight:600,margin:"0 0 5px 0"}}>{c.author}</p><p style={{margin:0,fontSize:13,color:"#cbd5e1"}}>{c.text}</p></div>)}
                <MentionInput value={commentText} onChange={setCommentText} onSubmit={()=>commentText.trim()&&addComment(selectedTask.id,commentText)} placeholder="Agregar comentario..." members={DEFAULT_MEMBERS} style={{width:"100%",padding:10,marginTop:10,borderRadius:6,border:"1px solid #475569",background:"#0f172a",color:"white",fontSize:13}}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>deleteTask(selectedTask.id)} style={{flex:1,padding:10,background:"#ef4444",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600,fontSize:13}}>🗑 Eliminar</button>
                <button onClick={()=>setSelectedTask(null)} style={{flex:1,padding:10,background:"#475569",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600,fontSize:13}}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {newProjectName&&(
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
            <div style={{background:"#1e293b",borderRadius:12,padding:30,maxWidth:400,width:"90%",border:"1px solid #334155"}}>
              <h2 style={{marginBottom:20,fontSize:18,fontWeight:600}}>Nuevo proyecto</h2>
              <input value={newProjectName==="new"?"":newProjectName} onChange={e=>setNewProjectName(e.target.value)} placeholder="Nombre del proyecto" style={{width:"100%",padding:12,marginBottom:20,borderRadius:8,border:"1px solid #475569",background:"#0f172a",color:"white",fontSize:13}}/>
              <div style={{display:"flex",gap:10}}>
                <button onClick={createProject} style={{flex:1,padding:10,background:"#3b82f6",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600}}>Crear</button>
                <button onClick={()=>setNewProjectName("")} style={{flex:1,padding:10,background:"#475569",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

