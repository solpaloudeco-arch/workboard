import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ollqwsspjerttgwzmxkg.supabase.co";
const SUPABASE_KEY = "sb_publishable_xtKliNdt0Bl2GFU1HdeO4g_QKJlZRUB";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MEMBER_COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6","#8b5cf6","#ec4899"];
const PRIORITY = {alta:{label:"Alta",color:"#dc2626",bg:"#fef2f2"},media:{label:"Media",color:"#d97706",bg:"#fffbeb"},baja:{label:"Baja",color:"#16a34a",bg:"#f0fdf4"}};
const COLUMNS = [{id:"todo",label:"Por hacer"},{id:"inprogress",label:"En progreso"},{id:"done",label:"Completado"}];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const DEFAULT_MEMBERS = [
  {id:1,name:"Sol"},{id:2,name:"Dolo"},{id:3,name:"Grace"},{id:4,name:"Caro"},{id:5,name:"Meli"},{id:6,name:"Rita"},
  {id:7,name:"Mariela"},{id:8,name:"Tobal"},{id:9,name:"Belen"},{id:10,name:"Azul"},{id:11,name:"Cami"},{id:12,name:"Lu"},
  {id:13,name:"Mary"},{id:14,name:"Lara B"},{id:15,name:"Gaston"},{id:16,name:"Nico"},{id:17,name:"Lean"},{id:18,name:"Leo"},
  {id:19,name:"Dai"},{id:20,name:"Ailen"},{id:21,name:"Lourdes"},{id:22,name:"Eze"},{id:23,name:"Nina"},{id:24,name:"Naty"},
  {id:25,name:"Paloma"},{id:26,name:"Tamara"},{id:27,name:"Lara L"},{id:28,name:"Carlos"},{id:29,name:"Juan Cruz"},{id:30,name:"Melisa"},
  {id:31,name:"Cris"},{id:32,name:"Emi"},{id:33,name:"Yami"},{id:34,name:"P32"},{id:35,name:"P33"},{id:36,name:"P34"},
  {id:37,name:"P35"},{id:38,name:"P36"},{id:39,name:"P37"},{id:40,name:"P38"}
].map((m,i)=>({...m,color:MEMBER_COLORS[i%MEMBER_COLORS.length],role:"Team"}));

function Avatar({member,size=32}){
  if(!member) return null;
  return <div style={{width:size,height:size,borderRadius:"50%",background:member.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:"#fff",border:"2px solid white"}}>{member.name.slice(0,2).toUpperCase()}</div>;
}

function Badge({label,color}){
  return <span style={{fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,background:color+"15",color,border:`1px solid ${color}`}}>{label}</span>;
}

export default function App(){
  const [user,setUser]=useState(null);
  const [pin,setPin]=useState("");
  const [pinInput,setPinInput]=useState("");
  const [stage,setStage]=useState("selectUser");
  const [search,setSearch]=useState("");
  const [projects,setProjects]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [selected,setSelected]=useState(null);
  const [task,setTask]=useState(null);
  const [view,setView]=useState("board");
  const [newProj,setNewProj]=useState("");
  const [comment,setComment]=useState("");
  const [replyingTo,setReplyingTo]=useState(null);
  const [replyText,setReplyText]=useState("");

  // CARGAR DATOS DE SUPABASE
  useEffect(()=>{
    const load=async()=>{
      try{
        const {data:pData}=await supabase.from("projects").select("*");
        if(pData) setProjects(pData);
        const {data:tData}=await supabase.from("tasks").select("*");
        if(tData) setTasks(tData);
      }catch(e){
        console.log("Error loading:",e);
      }
    };
    load();
  },[]);

  // REAL-TIME SYNC - PROJECTS
  useEffect(()=>{
    const sub=supabase.channel("projects").on("postgres_changes",{event:"*",schema:"public",table:"projects"},payload=>{
      if(payload.eventType==="INSERT") setProjects(p=>[...p,payload.new]);
      if(payload.eventType==="UPDATE") setProjects(p=>p.map(x=>x.id===payload.new.id?payload.new:x));
      if(payload.eventType==="DELETE") setProjects(p=>p.filter(x=>x.id!==payload.old.id));
    }).subscribe();
    return ()=>supabase.removeChannel(sub);
  },[]);

  // REAL-TIME SYNC - TASKS
  useEffect(()=>{
    const sub=supabase.channel("tasks").on("postgres_changes",{event:"*",schema:"public",table:"tasks"},payload=>{
      if(payload.eventType==="INSERT") setTasks(t=>[...t,payload.new]);
      if(payload.eventType==="UPDATE"){
        setTasks(t=>t.map(x=>x.id===payload.new.id?payload.new:x));
        if(task?.id===payload.new.id) setTask(payload.new);
      }
      if(payload.eventType==="DELETE") setTasks(t=>t.filter(x=>x.id!==payload.old.id));
    }).subscribe();
    return ()=>supabase.removeChannel(sub);
  },[task?.id]);

  const selectUser=member=>{
    setUser(member);
    setStage("pin");
    setPinInput("");
  };

  const createPin=()=>{
    if(pinInput.length===4){
      setPin(pinInput);
      setStage("confirmPin");
      setPinInput("");
    }
  };

  const confirmPin=()=>{
    if(pinInput===pin){
      setStage("app");
    }else{
      alert("PIN incorrecto");
      setPinInput("");
    }
  };

  const createProject=async()=>{
    if(!newProj.trim()) return;
    const newP={id:Date.now(),name:newProj,description:"",color:"#3b82f6",memberIds:[user.id],createdBy:user.id,createdAt:new Date().toISOString()};
    try{
      await supabase.from("projects").insert([newP]);
    }catch(e){
      console.log("Error:",e);
    }
    setNewProj("");
  };

  const createTask=async()=>{
    if(!selected) return;
    const newT={id:Date.now(),projectId:selected.id,title:"Nueva tarea",description:"",assigneeId:user.id,priority:"media",dueDate:"",col:"todo",comments:[],links:[],createdAt:new Date().toISOString()};
    try{
      await supabase.from("tasks").insert([newT]);
    }catch(e){
      console.log("Error:",e);
    }
  };

  const updateTask=async(updates)=>{
    try{
      await supabase.from("tasks").update(updates).eq("id",task.id);
    }catch(e){
      console.log("Error:",e);
    }
  };

  const deleteTask=async()=>{
    try{
      await supabase.from("tasks").delete().eq("id",task.id);
      setTask(null);
    }catch(e){
      console.log("Error:",e);
    }
  };

  const addComment=async()=>{
    if(!comment.trim() || !task) return;
    const newC={id:Date.now(),text:comment,authorId:user.id,createdAt:new Date().toISOString(),replies:[]};
    await updateTask({comments:[...(task.comments||[]),newC]});
    setComment("");
  };

  const addReply=async()=>{
    if(!replyText.trim() || !replyingTo || !task) return;
    const newReply={id:Date.now(),text:replyText,authorId:user.id,createdAt:new Date().toISOString()};
    const updated=task.comments.map(c=>c.id===replyingTo?{...c,replies:[...(c.replies||[]),newReply]}:c);
    await updateTask({comments:updated});
    setReplyText("");
    setReplyingTo(null);
  };

  if(!user){
    const filtered=DEFAULT_MEMBERS.filter(m=>m.name.toLowerCase().includes(search.toLowerCase()));
    return (
      <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",height:"100vh",background:"linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",padding:20}}>
        <h1 style={{color:"white",marginBottom:40,fontSize:44,fontWeight:700}}>📋 WorkBoard</h1>
        {stage==="selectUser"&&(
          <div style={{maxWidth:500,width:"100%"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{width:"100%",padding:12,marginBottom:20,borderRadius:8,border:"1px solid #3b82f6",background:"#0f172a",color:"white",fontSize:14}}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))",gap:10,maxHeight:400,overflowY:"auto"}}>
              {filtered.map(m=><button key={m.id} onClick={()=>selectUser(m)} style={{padding:12,borderRadius:8,border:"1px solid #475569",background:"#0f172a",color:"white",cursor:"pointer",fontSize:13,fontWeight:600}}>{m.name}</button>)}
            </div>
          </div>
        )}
        {stage==="pin"&&(
          <div style={{textAlign:"center",background:"#1e293b",padding:40,borderRadius:12,border:"1px solid #334155",maxWidth:350,width:"100%"}}>
            <p style={{color:"#cbd5e1",marginBottom:20,fontSize:14,fontWeight:600}}>Crea tu PIN (4 dígitos)</p>
            <input type="password" maxLength="4" value={pinInput} onChange={e=>setPinInput(e.target.value)} style={{fontSize:20,textAlign:"center",padding:12,marginBottom:20,borderRadius:8,border:"1px solid #3b82f6",background:"#0f172a",color:"white",width:"100%"}}/>
            <button onClick={createPin} disabled={pinInput.length!==4} style={{width:"100%",padding:10,background:pinInput.length===4?"#3b82f6":"#475569",border:"none",borderRadius:8,color:"white",cursor:"pointer",fontWeight:600}}>Siguiente</button>
          </div>
        )}
        {stage==="confirmPin"&&(
          <div style={{textAlign:"center",background:"#1e293b",padding:40,borderRadius:12,border:"1px solid #334155",maxWidth:350,width:"100%"}}>
            <p style={{color:"#cbd5e1",marginBottom:20,fontSize:14,fontWeight:600}}>Confirma tu PIN</p>
            <input type="password" maxLength="4" value={pinInput} onChange={e=>setPinInput(e.target.value)} style={{fontSize:20,textAlign:"center",padding:12,marginBottom:20,borderRadius:8,border:"1px solid #10b981",background:"#0f172a",color:"white",width:"100%"}}/>
            <button onClick={confirmPin} style={{width:"100%",padding:10,background:"#10b981",border:"none",borderRadius:8,color:"white",cursor:"pointer",fontWeight:600}}>Confirmar</button>
          </div>
        )}
      </div>
    );
  }

  const userProjects=projects.filter(p=>!p.memberIds||p.memberIds.includes(user.id));
  const projTasks=selected?tasks.filter(t=>t.projectId===selected.id):[];

  return (
    <div style={{display:"flex",height:"100vh",background:"#0f172a",color:"white"}}>
      <div style={{width:280,background:"#1e293b",padding:20,overflowY:"auto",borderRight:"1px solid #334155"}}>
        <h2 style={{marginBottom:20,fontSize:18,fontWeight:700}}>📋 WorkBoard</h2>
        <div style={{padding:12,background:"#0f172a",borderRadius:8,marginBottom:20}}>
          <p style={{fontSize:12,color:"#94a3b8"}}>Conectado: {user.name}</p>
        </div>
        <button onClick={()=>setUser(null)} style={{width:"100%",padding:10,background:"#ef4444",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600,marginBottom:20}}>Cerrar sesión</button>
        <button onClick={()=>setNewProj("new")} style={{width:"100%",padding:10,background:"#3b82f6",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600,marginBottom:20}}>+ Proyecto</button>
        <h3 style={{fontSize:12,fontWeight:700,marginBottom:12,color:"#94a3b8"}}>PROYECTOS ({userProjects.length})</h3>
        {userProjects.map(p=>(
          <div key={p.id} onClick={()=>setSelected(p)} style={{padding:12,background:selected?.id===p.id?"#3b82f6":"#0f172a",borderRadius:8,marginBottom:8,cursor:"pointer",border:"1px solid #334155"}}>
            <p style={{fontWeight:600,fontSize:13,margin:0}}>{p.name}</p>
            <p style={{fontSize:11,color:"#94a3b8",margin:"5px 0 0 0"}}>📌 {projTasks.length}</p>
          </div>
        ))}
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {selected?(
          <>
            <div style={{padding:20,borderBottom:"1px solid #334155",background:"#1e293b"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h1 style={{margin:0,fontSize:24,fontWeight:700}}>{selected.name}</h1>
                <div style={{display:"flex",gap:10}}>
                  {[{id:"board",label:"⊞ Tablero"},{id:"calendar",label:"📅 Calendario"}].map(v=>(
                    <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"8px 16px",background:view===v.id?"#3b82f6":"#475569",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600,fontSize:13}}>{v.label}</button>
                  ))}
                  <button onClick={()=>setSelected(null)} style={{padding:"8px 16px",background:"#475569",border:"none",borderRadius:6,color:"white",cursor:"pointer"}}>← Volver</button>
                </div>
              </div>
            </div>

            <div style={{flex:1,overflow:"hidden",padding:20}}>
              {view==="board"&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:20,height:"100%"}}>
                  {COLUMNS.map(col=>(
                    <div key={col.id} style={{background:"#1e293b",borderRadius:12,padding:15,border:"1px solid #334155",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                      <h3 style={{marginBottom:15,fontSize:14,fontWeight:700}}>{col.label} ({projTasks.filter(t=>t.col===col.id).length})</h3>
                      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
                        {projTasks.filter(t=>t.col===col.id).map(t=>(
                          <div key={t.id} onClick={()=>setTask(t)} style={{background:"#0f172a",padding:12,borderRadius:8,cursor:"pointer",border:`2px solid ${PRIORITY[t.priority||"media"].color}`}}>
                            <p style={{fontWeight:600,fontSize:13,margin:0,marginBottom:5}}>{t.title}</p>
                            <div style={{display:"flex",gap:5,fontSize:11}}><Badge label={PRIORITY[t.priority||"media"].label} color={PRIORITY[t.priority||"media"].color}/></div>
                          </div>
                        ))}
                      </div>
                      <button onClick={createTask} style={{marginTop:10,padding:10,background:"rgba(59,130,246,0.1)",border:"1px dashed #3b82f6",borderRadius:6,color:"#3b82f6",cursor:"pointer",fontWeight:600,fontSize:13}}>+ Tarea</button>
                    </div>
                  ))}
                </div>
              )}

              {view==="calendar"&&(
                <div style={{overflowY:"auto",height:"100%"}}>
                  <h2 style={{marginBottom:20}}>{MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</h2>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10}}>
                    {DAYS.map(d=><div key={d} style={{textAlign:"center",fontWeight:700,color:"#94a3b8",fontSize:12}}>{d}</div>)}
                    {Array(42).fill(0).map((_, i)=><div key={i} style={{minHeight:60,background:"#1e293b",borderRadius:8,padding:8,border:"1px solid #334155",fontSize:11}}></div>)}
                  </div>
                </div>
              )}
            </div>
          </>
        ):<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8"}}><p>Selecciona un proyecto</p></div>}

        {task&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
            <div style={{background:"#1e293b",borderRadius:12,padding:30,maxWidth:600,width:"90%",maxHeight:"80vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
                <h2 style={{margin:0}}>{task.title}</h2>
                <button onClick={()=>setTask(null)} style={{background:"none",border:"none",color:"white",cursor:"pointer",fontSize:20}}>×</button>
              </div>
              <div style={{background:"#0f172a",padding:15,borderRadius:8,marginBottom:20}}>
                <h4 style={{marginBottom:10}}>💬 Comentarios ({task.comments?.length||0})</h4>
                {task.comments?.map(c=>{
                  const author=DEFAULT_MEMBERS.find(m=>m.id===c.authorId);
                  return (
                    <div key={c.id} style={{background:"#1e293b",padding:10,borderRadius:6,marginBottom:10}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                        <Avatar member={author} size={24}/>
                        <div>
                          <p style={{margin:0,fontWeight:600,fontSize:12}}>{author?.name}</p>
                          <p style={{margin:0,fontSize:10,color:"#94a3b8"}}>{new Date(c.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <p style={{margin:0,fontSize:12,color:"#cbd5e1"}}>{c.text}</p>
                      {(c.replies||[]).length>0&&<div style={{marginLeft:20,marginTop:8,paddingLeft:10,borderLeft:"2px solid #334155"}}>{c.replies.map(r=>{const rauth=DEFAULT_MEMBERS.find(m=>m.id===r.authorId);return(<div key={r.id} style={{marginBottom:8}}><div style={{display:"flex",gap:6}}><Avatar member={rauth} size={18}/><div><p style={{margin:0,fontSize:11,fontWeight:600}}>{rauth?.name}</p><p style={{margin:0,fontSize:10,color:"#cbd5e1"}}>{r.text}</p></div></div></div>);})}</div>}
                      <button onClick={()=>setReplyingTo(c.id)} style={{fontSize:11,color:"#3b82f6",background:"none",border:"none",cursor:"pointer",marginTop:6}}>💬 Responder</button>
                    </div>
                  );
                })}
                {replyingTo&&<div style={{background:"#f0f9ff",padding:10,borderRadius:8,marginBottom:10}}><input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Respuesta..." style={{width:"100%",padding:8,marginBottom:8,borderRadius:6,border:"1px solid #bae6fd",background:"#f8fafc",color:"#1e293b"}}/><div style={{display:"flex",gap:8}}><button onClick={addReply} style={{flex:1,padding:8,background:"#3b82f6",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600,fontSize:12}}>Enviar</button><button onClick={()=>{setReplyingTo(null);setReplyText("");}} style={{flex:1,padding:8,background:"#e2e8f0",border:"none",borderRadius:6,color:"#475569",cursor:"pointer",fontSize:12}}>Cancelar</button></div></div>}
                <div style={{display:"flex",gap:8}}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Nuevo comentario..." style={{flex:1,padding:8,borderRadius:6,border:"1px solid #e2e8f0",background:"#0f172a",color:"white",fontSize:12}}/><button onClick={addComment} style={{padding:8,background:"#3b82f6",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600,fontSize:12}}>Enviar</button></div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={deleteTask} style={{flex:1,padding:10,background:"#ef4444",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600}}>Eliminar</button>
                <button onClick={()=>setTask(null)} style={{flex:1,padding:10,background:"#475569",border:"none",borderRadius:6,color:"white",cursor:"pointer"}}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {newProj&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
            <div style={{background:"#1e293b",borderRadius:12,padding:30,maxWidth:400,width:"90%"}}>
              <h2 style={{marginBottom:20}}>Nuevo Proyecto</h2>
              <input value={newProj==="new"?"":newProj} onChange={e=>setNewProj(e.target.value)} placeholder="Nombre" style={{width:"100%",padding:10,marginBottom:20,borderRadius:8,border:"1px solid #3b82f6",background:"#0f172a",color:"white"}}/>
              <div style={{display:"flex",gap:10}}>
                <button onClick={createProject} style={{flex:1,padding:10,background:"#3b82f6",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontWeight:600}}>Crear</button>
                <button onClick={()=>setNewProj("")} style={{flex:1,padding:10,background:"#475569",border:"none",borderRadius:6,color:"white",cursor:"pointer"}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
