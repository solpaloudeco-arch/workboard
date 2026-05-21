
import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "workboard_v3";
const USER_KEY    = "workboard_user_v1";
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
  {id:31,name:"Cris",role:"Team"},{id:32,name:"Emi",role:"Team"},
  {id:33,name:"Yami",role:"Team"},{id:34,name:"P32",role:"Team"},
  {id:35,name:"P33",role:"Team"},{id:36,name:"P34",role:"Team"},
  {id:37,name:"P35",role:"Team"},{id:38,name:"P36",role:"Team"},
  {id:39,name:"P37",role:"Team"},{id:40,name:"P38",role:"Team"},
].map((m,i)=>({...m,color:MEMBER_COLORS[i%MEMBER_COLORS.length]}));

const DEFAULT_PROJECTS = [
  {id:1,name:"Desarrollo Web",description:"Rediseño del sitio principal y mejoras de UX.",color:"#6366f1",memberIds:[1,2,3,4,5,6],createdBy:1,createdAt:Date.now()},
  {id:2,name:"Campaña Marketing Q3",description:"Estrategia y ejecución de la campaña del tercer trimestre.",color:"#f59e0b",memberIds:[1,7,11,12],createdBy:7,createdAt:Date.now()},
];

const DEFAULT_TASKS = [
  {id:1,projectId:1,title:"Definir objetivos Q3",description:"Reunión para establecer las metas y OKRs del trimestre.",assigneeId:1,dueDate:"2026-06-15",priority:"alta",column:"todo",comments:[],links:[],createdAt:Date.now()},
  {id:2,projectId:1,title:"Diseño del nuevo dashboard",description:"Crear wireframes, prototipos y guía de estilo.",assigneeId:3,dueDate:"2026-06-20",priority:"alta",column:"inprogress",comments:[],links:[],createdAt:Date.now()},
  {id:3,projectId:1,title:"API de reportes",description:"Implementar endpoints REST.",assigneeId:2,dueDate:"2026-06-25",priority:"media",column:"inprogress",comments:[],links:[],createdAt:Date.now()},
  {id:4,projectId:1,title:"Setup CI/CD pipeline",description:"Configurar GitHub Actions.",assigneeId:4,dueDate:"2026-05-28",priority:"alta",column:"done",comments:[],links:[],createdAt:Date.now()},
  {id:5,projectId:2,title:"Definir audiencia objetivo",description:"Segmentación y análisis de público.",assigneeId:7,dueDate:"2026-06-10",priority:"alta",column:"done",comments:[],links:[],createdAt:Date.now()},
  {id:6,projectId:2,title:"Diseñar piezas gráficas",description:"Banners, posts y material visual.",assigneeId:11,dueDate:"2026-06-18",priority:"media",column:"inprogress",comments:[],links:[],createdAt:Date.now()},
  {id:7,projectId:2,title:"Lanzar campaña en redes",description:"Publicación coordinada en todas las plataformas.",assigneeId:12,dueDate:"2026-07-01",priority:"alta",column:"todo",comments:[],links:[],createdAt:Date.now()},
];

const PRIORITY = {alta:{label:"Alta",color:"#dc2626",bg:"#fef2f2"},media:{label:"Media",color:"#d97706",bg:"#fffbeb"},baja:{label:"Baja",color:"#16a34a",bg:"#f0fdf4"}};
const COLUMNS  = [{id:"todo",label:"Por hacer",accent:"#6366f1",light:"#eef2ff"},{id:"inprogress",label:"En progreso",accent:"#f59e0b",light:"#fffbeb"},{id:"done",label:"Completado",accent:"#22c55e",light:"#f0fdf4"}];
const MONTHS   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS     = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function initials(name){ return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(); }
async function hashPin(pin){ const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("wb26_"+pin)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join(""); }
function parseMentions(text,members){ return [...new Set([...text.matchAll(/@(\w+)/g)].flatMap(m=>{ const fn=m[1].toLowerCase(); const found=members.find(mem=>mem.name.split(" ")[0].toLowerCase()===fn); return found?[found.id]:[]; }))]; }

function Avatar({member,size=32,style:extra={}}){
  if(!member) return null;
  return <div style={{width:size,height:size,borderRadius:"50%",background:member.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:700,color:"#fff",flexShrink:0,border:"2px solid white",boxSizing:"border-box",...extra}}>{initials(member.name)}</div>;
}
function Badge({label,color,bg}){ return <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:bg,color,letterSpacing:"0.02em"}}>{label}</span>; }
function CommentText({text,members}){
  return <span>{text.split(/(@\w+)/g).map((p,i)=>{ if(p.startsWith("@")){const m=members.find(x=>x.name.split(" ")[0].toLowerCase()===p.slice(1).toLowerCase());if(m)return <span key={i} style={{color:m.color,fontWeight:700}}>{p}</span>;} return <span key={i}>{p}</span>; })}</span>;
}

function MentionInput({value,onChange,onSubmit,placeholder,style,members}){
  const [search,setSearch]=useState(null); const [atPos,setAtPos]=useState(0); const ref=useRef();
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

/* ── PIN AUTH ── */
function PinDots({value}){
  return <div style={{display:"flex",gap:14,justifyContent:"center",margin:"20px 0"}}>{[0,1,2,3].map(i=>(<div key={i} style={{width:18,height:18,borderRadius:"50%",background:i<value.length?"#f59e0b":"transparent",border:`2px solid ${i<value.length?"#f59e0b":"#334155"}`,transition:"all 0.15s"}}/>))}</div>;
}
function Keypad({onPress,onDelete}){
  const keys=["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:220,margin:"0 auto"}}>{keys.map((k,i)=>k===""?<div key={i}/>:<button key={i} onClick={()=>k==="⌫"?onDelete():onPress(k)} style={{padding:"16px 0",borderRadius:10,border:"1px solid #1e293b",background:k==="⌫"?"#0f172a":"#1e293b",color:k==="⌫"?"#64748b":"#fff",fontSize:k==="⌫"?20:18,fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=k==="⌫"?"#1e293b":"#334155"} onMouseLeave={e=>e.currentTarget.style.background=k==="⌫"?"#0f172a":"#1e293b"}>{k}</button>)}</div>;
}
function AuthFlow({members,onLogin}){
  const [step,setStep]=useState("pick");
  const [selected,setSelected]=useState(null);
  const [pin,setPin]=useState(""); const [pinConfirm,setPinConfirm]=useState("");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const [q,setQ]=useState(""); const [newPin,setNewPin]=useState("");
  const filtered=members.filter(m=>m.name.toLowerCase().includes(q.toLowerCase()));
  const pickMember=(member)=>{ setSelected(member);setError("");setPin("");setLoading(true); try{const r=localStorage.getItem(`pin_${member.id}`);setStep(r?"enter":"create");}catch{setStep("create");} setLoading(false); };
  const pressPin=(d)=>{ if(step==="create"||step==="enter")setPin(p=>p.length<4?p+d:p); if(step==="confirm")setPinConfirm(p=>p.length<4?p+d:p); };
  const deletePin=()=>{ if(step==="confirm")setPinConfirm(p=>p.slice(0,-1));else setPin(p=>p.slice(0,-1)); };
  useEffect(()=>{ if(step==="create"&&pin.length===4){setTimeout(()=>{setStep("confirm");setError("");},150);} },[pin,step]);
  useEffect(()=>{ if(step==="confirm"&&pinConfirm.length===4){(async()=>{ if(pinConfirm!==pin){setError("Los PINs no coinciden.");setPin("");setPinConfirm("");setStep("create");return;} const h=await hashPin(pin);try{localStorage.setItem(`pin_${selected.id}`,h);}catch{} onLogin(selected); })();} },[pinConfirm,step]);
  useEffect(()=>{ if(step==="enter"&&pin.length===4){(async()=>{ setLoading(true);const h=await hashPin(pin);try{const r=localStorage.getItem(`pin_${selected.id}`);if(r===h){onLogin(selected);}else{setError("PIN incorrecto.");setPin("");}}catch{setError("Error al verificar.");setPin("");} setLoading(false); })();} },[pin,step]);
  const forgotPin=async()=>{ const gen=String(Math.floor(1000+Math.random()*9000));const h=await hashPin(gen);try{localStorage.setItem(`pin_${selected.id}`,h);}catch{} setNewPin(gen);const sub=encodeURIComponent(`Solicitud de cambio de PIN - ${selected.name}`);const body=encodeURIComponent(`${selected.name} solicitó un cambio de PIN en WorkBoard.\n\nNuevo PIN: ${gen}\n\nComunícale este PIN al usuario.`);window.open(`https://mail.google.com/mail/u/0/?view=cm&fs=1&to=info@solpaloudeco.com.ar&su=${sub}&body=${body}`);setStep("forgot"); };
  const back=()=>{setStep("pick");setSelected(null);setPin("");setPinConfirm("");setError("");setNewPin("");};
  const currentPin=step==="confirm"?pinConfirm:pin;
  return (
    <div style={{position:"fixed",inset:0,background:"#0f172a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:2000,padding:24}}>
      <div style={{fontSize:28,fontWeight:800,color:"#fff",marginBottom:4,letterSpacing:"-1px"}}><span style={{color:"#f59e0b"}}>◈</span> WorkBoard</div>
      {step==="pick"&&(<div style={{width:"100%",maxWidth:440,marginTop:24}}><p style={{textAlign:"center",color:"#64748b",marginBottom:20,fontSize:15}}>¿Quién sos?</p><div style={{background:"#1e293b",borderRadius:16,padding:20,maxHeight:"58vh",display:"flex",flexDirection:"column"}}><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar tu nombre..." style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #334155",background:"#0f172a",color:"#fff",fontSize:14,outline:"none",marginBottom:10,boxSizing:"border-box",fontFamily:"inherit"}}/><div style={{overflowY:"auto",flex:1}}>{filtered.map(m=>(<div key={m.id} onClick={()=>pickMember(m)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:8,cursor:"pointer",marginBottom:3}} onMouseEnter={e=>e.currentTarget.style.background="#334155"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Avatar member={m} size={36}/><div><div style={{fontWeight:600,color:"#f1f5f9",fontSize:14}}>{m.name}</div><div style={{fontSize:11,color:"#64748b"}}>{m.role}</div></div></div>))}</div></div>{loading&&<p style={{textAlign:"center",color:"#64748b",marginTop:12,fontSize:13}}>Verificando...</p>}</div>)}
      {(step==="create"||step==="confirm"||step==="enter"||step==="forgot")&&selected&&(
        <div style={{width:"100%",maxWidth:300,marginTop:24,textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:20}}><Avatar member={selected} size={44}/><div style={{textAlign:"left"}}><div style={{fontWeight:700,color:"#f1f5f9",fontSize:15}}>{selected.name}</div><div style={{fontSize:12,color:"#64748b"}}>{selected.role}</div></div></div>
          <div style={{background:"#1e293b",borderRadius:16,padding:"24px 20px"}}>
            {step!=="forgot"&&<><p style={{color:"#94a3b8",fontSize:14,margin:"0 0 4px"}}>{step==="create"&&"Creá tu PIN de 4 dígitos"}{step==="confirm"&&"Confirmá tu PIN"}{step==="enter"&&"Ingresá tu PIN"}</p>{step==="create"&&<p style={{color:"#475569",fontSize:11,margin:"0 0 4px"}}>Es la primera vez que entrás</p>}<PinDots value={currentPin}/>{error&&<p style={{color:"#f87171",fontSize:12,margin:"0 0 12px",fontWeight:600}}>{error}</p>}<Keypad onPress={pressPin} onDelete={deletePin}/>{loading&&<p style={{color:"#64748b",fontSize:12,marginTop:12}}>Verificando...</p>}{step==="enter"&&<button onClick={forgotPin} style={{marginTop:16,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:12,textDecoration:"underline",display:"block",width:"100%"}}>¿Olvidaste tu PIN?</button>}</>}
            {step==="forgot"&&<><div style={{fontSize:28,marginBottom:8}}>📧</div><p style={{color:"#f1f5f9",fontWeight:700,fontSize:14,margin:"0 0 8px"}}>¡Solicitud enviada!</p><p style={{color:"#64748b",fontSize:12,margin:"0 0 16px"}}>Se abrió tu correo con la solicitud para<br/><span style={{color:"#f59e0b"}}>{ADMIN_EMAIL}</span></p><div style={{background:"#0f172a",borderRadius:10,padding:"14px 16px",marginBottom:16,textAlign:"left"}}><p style={{color:"#94a3b8",fontSize:11,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>¿Qué pasa ahora?</p><p style={{color:"#64748b",fontSize:12,margin:"0 0 4px"}}>1. Enviá el correo al administrador</p><p style={{color:"#64748b",fontSize:12,margin:"0 0 4px"}}>2. El admin te va a pasar tu nuevo PIN</p><p style={{color:"#64748b",fontSize:12,margin:0}}>3. Volvé acá e ingresalo</p></div><button onClick={()=>{setPin("");setStep("enter");}} style={{width:"100%",padding:"10px 0",borderRadius:8,background:"#334155",border:"none",cursor:"pointer",color:"#94a3b8",fontWeight:600,fontSize:13}}>Ya tengo mi nuevo PIN →</button></>}
          </div>
          <button onClick={back} style={{marginTop:16,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13}}>← Volver a elegir usuario</button>
        </div>
      )}
    </div>
  );
}

/* ── PROJECTS HOME ── */
function ProjectCard({project,members,tasks,onClick}){
  const pm=members.filter(m=>project.memberIds.includes(m.id));
  const pt=tasks.filter(t=>t.projectId===project.id);
  const done=pt.filter(t=>t.column==="done").length;
  const pct=pt.length>0?Math.round(done/pt.length*100):0;
  const [hover,setHover]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{background:"#fff",borderRadius:14,overflow:"hidden",cursor:"pointer",border:"1px solid #e2e8f0",boxShadow:hover?"0 8px 24px rgba(0,0,0,0.10)":"0 1px 4px rgba(0,0,0,0.06)",transform:hover?"translateY(-3px)":"translateY(0)",transition:"all 0.18s"}}>
      <div style={{height:7,background:project.color}}/>
      <div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#0f172a"}}>{project.name}</h3>
          <span style={{fontSize:11,fontWeight:700,background:"#f1f5f9",color:"#64748b",padding:"2px 8px",borderRadius:10}}>{pt.length} tareas</span>
        </div>
        {project.description&&<p style={{margin:"0 0 16px",fontSize:13,color:"#64748b",lineHeight:1.5}}>{project.description}</p>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex"}}>
            {pm.slice(0,5).map((m,i)=>(<div key={m.id} style={{marginLeft:i===0?0:-8,zIndex:10-i}}><Avatar member={m} size={28}/></div>))}
            {pm.length>5&&<div style={{width:28,height:28,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#64748b",marginLeft:-8,border:"2px solid white"}}>+{pm.length-5}</div>}
          </div>
          <span style={{fontSize:12,fontWeight:600,color:project.color}}>{pct}% completado</span>
        </div>
        <div style={{height:5,borderRadius:3,background:"#f1f5f9",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:project.color,borderRadius:3,transition:"width 0.4s"}}/>
        </div>
      </div>
    </div>
  );
}

function ProjectsHome({projects,members,tasks,currentUser,onSelectProject,onNewProject}){
  const myProjects=projects.filter(p=>p.memberIds.includes(currentUser.id));
  return (
    <div style={{flex:1,overflowY:"auto",padding:"28px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#0f172a"}}>Mis proyectos</h2>
          <p style={{margin:0,fontSize:13,color:"#94a3b8"}}>{myProjects.length} proyecto{myProjects.length!==1?"s":""} activo{myProjects.length!==1?"s":""}</p>
        </div>
        <button onClick={onNewProject} style={{padding:"10px 20px",borderRadius:9,background:"#0f172a",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
          + Nuevo proyecto
        </button>
      </div>
      {myProjects.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
          <div style={{fontSize:40,marginBottom:12}}>📋</div>
          <p style={{fontSize:15,fontWeight:600,color:"#475569",marginBottom:6}}>No estás en ningún proyecto todavía</p>
          <p style={{fontSize:13}}>Creá uno nuevo o pedile a alguien que te agregue.</p>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
          {myProjects.map(p=>(<ProjectCard key={p.id} project={p} members={members} tasks={tasks} onClick={()=>onSelectProject(p)}/>))}
        </div>
      )}
    </div>
  );
}

function NewProjectModal({members,currentUser,onClose,onSave,editProject}){
  const [name,setName]=useState(editProject?.name||"");
  const [desc,setDesc]=useState(editProject?.description||"");
  const [color,setColor]=useState(editProject?.color||PROJECT_COLORS[0]);
  const [selectedMembers,setSelectedMembers]=useState(editProject?.memberIds||[currentUser.id]);
  const [search,setSearch]=useState("");
  const toggle=(id)=>setSelectedMembers(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const filtered=members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase()));
  const submit=()=>{
    if(!name.trim()) return;
    const ids=selectedMembers.includes(currentUser.id)?selectedMembers:[...selectedMembers,currentUser.id];
    onSave({id:editProject?.id||Date.now(),name:name.trim(),description:desc.trim(),color,memberIds:ids,createdBy:editProject?.createdBy||currentUser.id,createdAt:editProject?.createdAt||Date.now()});
    onClose();
  };
  const IS={width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",background:"#f8fafc",color:"#1e293b",boxSizing:"border-box"};
  const LS={fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6,display:"block"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(3px)"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.22)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#1e293b"}}>{editProject?"Editar proyecto":"Nuevo proyecto"}</h2>
          <button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer",fontSize:22,color:"#94a3b8"}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"22px"}}>
          <div style={{marginBottom:16}}><label style={LS}>Nombre del proyecto *</label><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Rediseño web, Campaña Q4..." style={IS}/></div>
          <div style={{marginBottom:16}}><label style={LS}>Descripción</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="¿De qué trata este proyecto?" style={{...IS,minHeight:65,resize:"vertical"}}/></div>
          <div style={{marginBottom:20}}>
            <label style={LS}>Color del proyecto</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {PROJECT_COLORS.map(c=>(<div key={c} onClick={()=>setColor(c)} style={{width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #1e293b":"3px solid transparent",boxSizing:"border-box",transition:"border 0.15s"}}/>))}
            </div>
          </div>
          <div>
            <label style={LS}>Participantes ({selectedMembers.length} seleccionados)</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar miembro..." style={{...IS,marginBottom:10}}/>
            <div style={{maxHeight:220,overflowY:"auto",border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
              {filtered.map(m=>{
                const sel=selectedMembers.includes(m.id);
                const isMe=m.id===currentUser.id;
                return (
                  <div key={m.id} onClick={()=>!isMe&&toggle(m.id)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",cursor:isMe?"default":"pointer",background:sel?"#f0fdf4":"#fff",borderBottom:"1px solid #f8fafc",transition:"background 0.1s"}}
                    onMouseEnter={e=>{ if(!isMe&&!sel) e.currentTarget.style.background="#f8fafc"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=sel?"#f0fdf4":"#fff"; }}>
                    <Avatar member={m} size={32}/>
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:"#1e293b"}}>{m.name}{isMe&&<span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}> (vos)</span>}</div><div style={{fontSize:11,color:"#94a3b8"}}>{m.role}</div></div>
                    <div style={{width:20,height:20,borderRadius:5,background:sel?"#22c55e":"#f1f5f9",border:`2px solid ${sel?"#22c55e":"#d1d5db"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",flexShrink:0}}>{sel?"✓":""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{padding:"16px 22px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontSize:13,color:"#64748b"}}>Cancelar</button>
          <button onClick={submit} style={{padding:"9px 22px",borderRadius:8,background:"#0f172a",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:700}}>{editProject?"Guardar cambios":"Crear proyecto"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── WITHIN-PROJECT COMPONENTS ── */
function DueBanner({tasks,onClose}){
  const today=new Date(); today.setHours(0,0,0,0); const tom=new Date(today); tom.setDate(tom.getDate()+1);
  const alerts=tasks.filter(t=>{ if(t.column==="done"||!t.dueDate) return false; return new Date(t.dueDate+"T00:00:00")<=tom; });
  if(!alerts.length) return null;
  const ov=alerts.filter(t=>new Date(t.dueDate+"T00:00:00")<today);
  const td=alerts.filter(t=>{const d=new Date(t.dueDate+"T00:00:00");return d>=today&&d<tom;});
  const tm=alerts.filter(t=>new Date(t.dueDate+"T00:00:00").getTime()===tom.getTime());
  return (
    <div style={{background:"#fef2f2",borderBottom:"1px solid #fecaca",padding:"9px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:12}}>
      <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        {ov.length>0&&<span style={{fontSize:13,color:"#dc2626",fontWeight:700}}>⚠ {ov.length} vencida{ov.length>1?"s":""}</span>}
        {td.length>0&&<span style={{fontSize:13,color:"#d97706",fontWeight:700}}>🕐 {td.length} vence{td.length>1?"n":""} hoy</span>}
        {tm.length>0&&<span style={{fontSize:13,color:"#475569",fontWeight:600}}>📅 {tm.length} vence{tm.length>1?"n":""} mañana</span>}
        <span style={{fontSize:12,color:"#9f1239"}}>→ {alerts.map(t=>t.title).join(" · ")}</span>
      </div>
      <button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer",color:"#94a3b8",fontSize:18,flexShrink:0}}>×</button>
    </div>
  );
}

function NotificationsPanel({notifications,members,onClose,onMarkRead,currentUser}){
  const mine=notifications.filter(n=>n.mentionedId===currentUser.id).sort((a,b)=>b.createdAt-a.createdAt);
  const unread=mine.filter(n=>!n.read).length;
  return (
    <div style={{position:"fixed",inset:0,zIndex:500}} onClick={onClose}>
      <div style={{position:"absolute",top:0,right:0,bottom:0,width:350,background:"#fff",boxShadow:"-4px 0 24px rgba(0,0,0,0.13)",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><h2 style={{margin:0,fontSize:16,fontWeight:700,color:"#1e293b"}}>Notificaciones</h2><p style={{margin:0,fontSize:12,color:"#94a3b8"}}>{unread} sin leer</p></div>
          <div style={{display:"flex",gap:8}}>
            {unread>0&&<button onClick={()=>onMarkRead("all")} style={{fontSize:12,padding:"5px 10px",borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",color:"#64748b"}}>Marcar todas</button>}
            <button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer",fontSize:20,color:"#94a3b8"}}>×</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px"}}>
          {mine.length===0&&<div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8",fontSize:13}}>Sin notificaciones aún.<br/><span style={{fontSize:12}}>Te avisamos cuando alguien te mencione con @.</span></div>}
          {mine.map(n=>{ const from=members.find(m=>m.id===n.fromId); return (
            <div key={n.id} onClick={()=>onMarkRead(n.id)} style={{padding:"12px 14px",borderRadius:10,marginBottom:8,background:n.read?"#fff":"#eff6ff",border:`1px solid ${n.read?"#f1f5f9":"#bfdbfe"}`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=n.read?"#f8fafc":"#dbeafe"} onMouseLeave={e=>e.currentTarget.style.background=n.read?"#fff":"#eff6ff"}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Avatar member={from} size={26}/><div style={{flex:1}}><span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{from?.name}</span><span style={{fontSize:12,color:"#64748b"}}> te mencionó</span></div>{!n.read&&<div style={{width:8,height:8,borderRadius:"50%",background:"#3b82f6",flexShrink:0}}/>}</div>
              <div style={{fontSize:12,color:"#64748b",marginBottom:5}}>En: <span style={{fontWeight:600,color:"#1e293b"}}>{n.taskTitle}</span></div>
              <div style={{fontSize:12,color:"#475569",background:"#f8fafc",padding:"6px 10px",borderRadius:6,fontStyle:"italic"}}>"{n.commentText.slice(0,90)}{n.commentText.length>90?"...":""}"</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:5}}>{new Date(n.createdAt).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

function CalendarView({tasks,onTaskClick}){
  const today=new Date(); const [yr,setYr]=useState(today.getFullYear()); const [mo,setMo]=useState(today.getMonth());
  const prev=()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);}; const next=()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);};
  const firstDay=new Date(yr,mo,1).getDay(); const daysInMonth=new Date(yr,mo+1,0).getDate();
  const byDay={};
  tasks.forEach(t=>{if(!t.dueDate)return;const d=new Date(t.dueDate+"T00:00:00");if(d.getFullYear()===yr&&d.getMonth()===mo){const k=d.getDate();if(!byDay[k])byDay[k]=[];byDay[k].push(t);}});
  const cells=[]; for(let i=0;i<firstDay;i++)cells.push(null); for(let d=1;d<=daysInMonth;d++)cells.push(d);
  const isToday=(d)=>d&&yr===today.getFullYear()&&mo===today.getMonth()&&d===today.getDate();
  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",maxWidth:860,margin:"0 auto"}}>
        <div style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f5f9"}}>
          <button onClick={prev} style={{border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:8,padding:"5px 14px",cursor:"pointer",fontSize:16,color:"#64748b"}}>←</button>
          <h2 style={{margin:0,fontSize:16,fontWeight:700,color:"#1e293b"}}>{MONTHS[mo]} {yr}</h2>
          <button onClick={next} style={{border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:8,padding:"5px 14px",cursor:"pointer",fontSize:16,color:"#64748b"}}>→</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid #f1f5f9"}}>
          {DAYS.map(d=><div key={d} style={{padding:"7px 0",textAlign:"center",fontSize:12,fontWeight:700,color:"#94a3b8"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {cells.map((day,i)=>{
            const dt=day?(byDay[day]||[]):[];
            return (
              <div key={i} style={{minHeight:86,padding:"5px 6px",borderRight:(i+1)%7!==0?"1px solid #f1f5f9":"none",borderBottom:i<cells.length-7?"1px solid #f1f5f9":"none",background:day?"#fff":"#fafafa"}}>
                {day&&<><div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday(day)?"#1e293b":"transparent",color:isToday(day)?"#fff":"#475569",fontSize:12,fontWeight:isToday(day)?700:400,marginBottom:3}}>{day}</div>
                {dt.slice(0,3).map(t=>{const p=PRIORITY[t.priority];return(<div key={t.id} onClick={()=>onTaskClick(t)} title={t.title} style={{fontSize:11,padding:"2px 5px",borderRadius:4,background:t.column==="done"?"#f0fdf4":p.bg,color:t.column==="done"?"#16a34a":p.color,marginBottom:2,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{t.title}</div>);})}
                {dt.length>3&&<div style={{fontSize:10,color:"#94a3b8",paddingLeft:3}}>+{dt.length-3} más</div>}</>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const MBS={fontSize:11,padding:"3px 10px",borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",color:"#475569",fontWeight:500};

function TaskCard({task,members,colIdx,onClick,onMove}){
  const assignee=members.find(m=>m.id===task.assigneeId);
  const prio=PRIORITY[task.priority];
  const overdue=task.dueDate&&task.column!=="done"&&new Date(task.dueDate)<new Date();
  const [hover,setHover]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{background:"#fff",borderRadius:10,padding:"14px 15px",marginBottom:10,cursor:"pointer",border:"1px solid #e8edf2",boxShadow:hover?"0 6px 18px rgba(0,0,0,0.10)":"0 1px 4px rgba(0,0,0,0.06)",transform:hover?"translateY(-2px)":"translateY(0)",transition:"box-shadow 0.15s,transform 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <Badge label={prio.label} color={prio.color} bg={prio.bg}/>
        <div style={{display:"flex",gap:7}}>{task.links?.length>0&&<span style={{fontSize:11,color:"#94a3b8"}}>🔗{task.links.length}</span>}{task.comments?.length>0&&<span style={{fontSize:11,color:"#94a3b8"}}>💬{task.comments.length}</span>}</div>
      </div>
      <div style={{fontWeight:600,fontSize:14,color:"#1e293b",marginBottom:5,lineHeight:1.45}}>{task.title}</div>
      {task.description&&<div style={{fontSize:12,color:"#94a3b8",marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.description}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:hover?10:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><Avatar member={assignee} size={22}/><span style={{fontSize:11,color:"#64748b",fontWeight:500}}>{assignee?.name.split(" ")[0]||"Sin asignar"}</span></div>
        {task.dueDate&&<span style={{fontSize:11,color:overdue?"#ef4444":"#94a3b8",fontWeight:overdue?700:400}}>{overdue?"⚠ ":"📅 "}{new Date(task.dueDate+"T00:00:00").toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</span>}
      </div>
      {hover&&<div style={{display:"flex",gap:6,justifyContent:"flex-end"}} onClick={e=>e.stopPropagation()}>{colIdx>0&&<button onClick={()=>onMove(-1)} style={MBS}>← Mover</button>}{colIdx<2&&<button onClick={()=>onMove(1)} style={MBS}>Mover →</button>}</div>}
    </div>
  );
}

function TaskModal({task,members,currentUser,onClose,onUpdate,onDelete,onAddNotifications}){
  const [title,setTitle]=useState(task.title); const [desc,setDesc]=useState(task.description||"");
  const [comment,setComment]=useState(""); const [assigneeId,setAssigneeId]=useState(task.assigneeId);
  const [priority,setPriority]=useState(task.priority); const [dueDate,setDueDate]=useState(task.dueDate||"");
  const [linkUrl,setLinkUrl]=useState(""); const [linkLabel,setLinkLabel]=useState("");
  const [replyingTo,setReplyingTo]=useState(null); const [replyText,setReplyText]=useState("");
  const assignee=members.find(m=>m.id===Number(assigneeId));
  const save=(extra={})=>onUpdate({...task,title,description:desc,assigneeId:Number(assigneeId),priority,dueDate,...extra});
  const addComment=()=>{ if(!comment.trim()) return; const newC={id:Date.now(),text:comment,authorId:currentUser.id,createdAt:new Date().toISOString(),replies:[]}; const updated={...task,title,description:desc,assigneeId:Number(assigneeId),priority,dueDate,comments:[...(task.comments||[]),newC]}; onUpdate(updated); const mentioned=parseMentions(comment,members).filter(id=>id!==currentUser.id); if(mentioned.length>0)onAddNotifications(mentioned.map(mid=>({id:Date.now()+Math.random(),taskId:task.id,taskTitle:task.title,commentText:comment,fromId:currentUser.id,mentionedId:mid,read:false,createdAt:Date.now()}))); setComment(""); };
  const addReply=(commentId)=>{if(!replyText.trim()) return;const newReply={id:Date.now(),text:replyText,authorId:currentUser.id,createdAt:new Date().toISOString()};const updatedComments=task.comments.map(c=>c.id===commentId?{...c,replies:[...(c.replies||[]),newReply]}:c);onUpdate({...task,comments:updatedComments});setReplyText("");setReplyingTo(null);};
  const addLink=()=>{ if(!linkUrl.trim()) return; let url=linkUrl.trim(); if(!/^https?:\/\//i.test(url))url="https://"+url; save({links:[...(task.links||[]),{id:Date.now(),url,label:linkLabel.trim()||url}]}); setLinkUrl("");setLinkLabel(""); };
  const removeLink=(id)=>save({links:(task.links||[]).filter(l=>l.id!==id)});
  const LS={fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5,display:"block"};
  const IS={width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",background:"#f8fafc",color:"#1e293b",boxSizing:"border-box"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(3px)"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:580,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.22)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 22px 14px",borderBottom:"1px solid #f1f5f9"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><Badge label={PRIORITY[priority].label} color={PRIORITY[priority].color} bg={PRIORITY[priority].bg}/><div style={{display:"flex",gap:8}}><button onClick={()=>{if(window.confirm("¿Eliminar?"))onDelete(task.id);}} style={{fontSize:12,padding:"5px 12px",borderRadius:7,border:"1px solid #fee2e2",background:"#fef2f2",color:"#ef4444",cursor:"pointer"}}>Eliminar</button><button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer",fontSize:20,color:"#94a3b8",padding:"4px 8px"}}>×</button></div></div>
          <input value={title} onChange={e=>setTitle(e.target.value)} onBlur={()=>save()} style={{width:"100%",fontSize:20,fontWeight:700,color:"#1e293b",border:"none",outline:"none",background:"transparent",boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
            <div><label style={LS}>Asignado a</label><select value={assigneeId} onChange={e=>setAssigneeId(e.target.value)} onBlur={()=>save()} style={IS}>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div><label style={LS}>Prioridad</label><select value={priority} onChange={e=>setPriority(e.target.value)} onBlur={()=>save()} style={IS}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></div>
            <div><label style={LS}>Fecha límite</label><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} onBlur={()=>save()} style={IS}/></div>
            <div><label style={LS}>Estado</label><div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,background:"#f8fafc",border:"1px solid #e2e8f0"}}><Avatar member={assignee} size={20}/><span style={{fontSize:13,color:"#475569"}}>{COLUMNS.find(c=>c.id===task.column)?.label}</span></div></div>
          </div>
          <div style={{marginBottom:18}}><label style={LS}>Descripción</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} onBlur={()=>save()} placeholder="Agregar descripción..." style={{...IS,minHeight:65,resize:"vertical",lineHeight:1.6}}/></div>
          <div style={{marginBottom:22}}>
            <label style={LS}>Archivos adjuntos ({task.links?.length||0})</label>
            {(task.links||[]).map(link=>(<div key={link.id} style={{display:"flex",alignItems:"center",padding:"8px 12px",background:"#f0f9ff",borderRadius:8,marginBottom:7,border:"1px solid #bae6fd"}}><a href={link.url} target="_blank" rel="noreferrer" style={{fontSize:13,color:"#0369a1",textDecoration:"none",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8}} onClick={e=>e.stopPropagation()}>🔗 {link.label}</a><button onClick={()=>removeLink(link.id)} style={{border:"none",background:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,flexShrink:0}}>×</button></div>))}
            <div style={{display:"flex",gap:6,marginTop:6}}><input value={linkLabel} onChange={e=>setLinkLabel(e.target.value)} placeholder="Nombre del archivo" style={{...IS,flex:"0 0 38%"}}/><input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addLink()} placeholder="URL (Drive, Dropbox...)" style={{...IS,flex:1}}/><button onClick={addLink} style={{padding:"9px 14px",borderRadius:8,background:"#0369a1",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,flexShrink:0}}>+</button></div>
          </div>
          <div>
            <label style={LS}>Comentarios ({task.comments?.length||0})</label>
            <div style={{marginBottom:10}}>{(task.comments||[]).map(c=>{const author=members.find(m=>m.id===c.authorId);return(<div key={c.id} style={{padding:"10px 14px",background:"#f8fafc",borderRadius:8,marginBottom:8,border:"1px solid #f1f5f9"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>{author&&<Avatar member={author} size={20}/>}<span style={{fontSize:12,fontWeight:600,color:"#475569"}}>{author?.name||"Alguien"}</span><span style={{fontSize:11,color:"#94a3b8"}}>{new Date(c.createdAt).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span></div><div style={{fontSize:13,color:"#334155",lineHeight:1.5,marginBottom:8}}><CommentText text={c.text} members={members}/></div>{(c.replies||[]).length>0&&<div style={{marginLeft:24,paddingLeft:12,borderLeft:"2px solid #e2e8f0",marginBottom:8}}>{c.replies.map(r=>{const rauthor=members.find(m=>m.id===r.authorId);return(<div key={r.id} style={{padding:"8px 10px",background:"#f1f5f9",borderRadius:6,marginBottom:6}}><div style={{display:"flex",gap:6,marginBottom:3}}>{rauthor&&<Avatar member={rauthor} size={16}/>}<span style={{fontSize:11,fontWeight:600,color:"#334155"}}>{rauthor?.name}</span><span style={{fontSize:10,color:"#94a3b8"}}>{new Date(r.createdAt).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span></div><div style={{fontSize:12,color:"#475569"}}><CommentText text={r.text} members={members}/></div></div>)})}</div>}<button onClick={()=>setReplyingTo(c.id)} style={{fontSize:11,color:"#0369a1",background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:"4px 0"}}>💬 Responder</button></div>);})}</div>
            {replyingTo&&<div style={{background:"#f0f9ff",padding:10,borderRadius:8,marginBottom:10,border:"1px solid #bae6fd"}}><div style={{fontSize:12,fontWeight:600,color:"#0369a1",marginBottom:8}}>Respondiendo...</div><div style={{display:"flex",gap:8}}><input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Escribir respuesta..." style={{...IS,flex:1}}/><button onClick={()=>addReply(replyingTo)} style={{padding:"9px 14px",borderRadius:8,background:"#0369a1",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,flexShrink:0}}>Enviar</button><button onClick={()=>{setReplyingTo(null);setReplyText("");}} style={{padding:"9px 14px",borderRadius:8,background:"#e2e8f0",color:"#475569",border:"none",cursor:"pointer",fontSize:13,flexShrink:0}}>Cancelar</button></div></div>}
            <div style={{display:"flex",gap:8,alignItems:"center"}}><Avatar member={currentUser} size={28}/><MentionInput value={comment} onChange={setComment} onSubmit={addComment} members={members} placeholder="Escribir comentario... usá @ para mencionar" style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",background:"#f8fafc",color:"#1e293b"}}/><button onClick={addComment} style={{padding:"9px 16px",borderRadius:8,background:"#1e293b",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,flexShrink:0}}>Enviar</button></div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:5,paddingLeft:36}}>Escribí @ para mencionar a alguien 🔔</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewTaskModal({members,projectId,onClose,onAdd}){
  const [form,setForm]=useState({title:"",description:"",assigneeId:members[0]?.id||1,dueDate:"",priority:"media",column:"todo"});
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const IS={width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",background:"#f8fafc",color:"#1e293b",boxSizing:"border-box"};
  const LS={fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5,display:"block"};
  const submit=()=>{ if(!form.title.trim()) return; onAdd({...form,id:Date.now(),projectId,assigneeId:Number(form.assigneeId),comments:[],links:[],createdAt:Date.now()}); onClose(); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(3px)"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,0.22)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#1e293b"}}>Nueva tarea</h2><button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer",fontSize:22,color:"#94a3b8"}}>×</button></div>
        <div style={{padding:"22px"}}>
          <div style={{marginBottom:14}}><label style={LS}>Título *</label><input autoFocus value={form.title} onChange={e=>f("title",e.target.value)} placeholder="Nombre de la tarea" style={IS}/></div>
          <div style={{marginBottom:14}}><label style={LS}>Descripción</label><textarea value={form.description} onChange={e=>f("description",e.target.value)} placeholder="Detalles opcionales..." style={{...IS,minHeight:55,resize:"vertical"}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div><label style={LS}>Asignado a</label><select value={form.assigneeId} onChange={e=>f("assigneeId",e.target.value)} style={IS}>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div><label style={LS}>Prioridad</label><select value={form.priority} onChange={e=>f("priority",e.target.value)} style={IS}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:22}}>
            <div><label style={LS}>Fecha límite</label><input type="date" value={form.dueDate} onChange={e=>f("dueDate",e.target.value)} style={IS}/></div>
            <div><label style={LS}>Columna</label><select value={form.column} onChange={e=>f("column",e.target.value)} style={IS}>{COLUMNS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={onClose} style={{padding:"9px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontSize:13,color:"#64748b"}}>Cancelar</button>
            <button onClick={submit} style={{padding:"9px 20px",borderRadius:8,background:"#1e293b",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:700}}>Crear tarea</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN APP ── */
export default function App(){
  const [projects,setProjects]=useState(DEFAULT_PROJECTS);
  const [tasks,setTasks]=useState(DEFAULT_TASKS);
  const [notifications,setNotifications]=useState([]);
  const [currentUser,setCurrentUser]=useState(null);
  const [currentProject,setCurrentProject]=useState(null);
  const [view,setView]=useState("board");
  const [selected,setSelected]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [showNewProject,setShowNewProject]=useState(false);
  const [editingProject,setEditingProject]=useState(null);
  const [showNotifs,setShowNotifs]=useState(false);
  const [showAlert,setShowAlert]=useState(true);
  const [loaded,setLoaded]=useState(false);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const ur=localStorage.getItem(USER_KEY); if(ur)setCurrentUser(JSON.parse(ur));
        const dr=localStorage.getItem(STORAGE_KEY);
        if(dr){const d=JSON.parse(dr);if(d.tasks)setTasks(d.tasks);if(d.notifications)setNotifications(d.notifications);if(d.projects)setProjects(d.projects);}
      }catch{}
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{
    if(!loaded) return;
    setSaving(true);
    const t=setTimeout(async()=>{ try{localStorage.setItem(STORAGE_KEY,JSON.stringify({tasks,notifications,projects}));}catch{} setSaving(false); },600);
    return()=>clearTimeout(t);
  },[tasks,notifications,projects,loaded]);

  const handleLogin=async(m)=>{ setCurrentUser(m); try{localStorage.setItem(USER_KEY,JSON.stringify(m));}catch{} };
  const handleLogout=()=>{ setCurrentUser(null); setCurrentProject(null); };

  const updateTask=(u)=>{setTasks(p=>p.map(t=>t.id===u.id?u:t));setSelected(u);};
  const deleteTask=(id)=>{setTasks(p=>p.filter(t=>t.id!==id));setSelected(null);};
  const moveTask=(id,dir)=>setTasks(p=>p.map(t=>{if(t.id!==id)return t;const ci=COLUMNS.findIndex(c=>c.id===t.column);return COLUMNS[ci+dir]?{...t,column:COLUMNS[ci+dir].id}:t;}));
  const addTask=(task)=>setTasks(p=>[...p,task]);
  const saveProject=(p)=>setProjects(prev=>prev.find(x=>x.id===p.id)?prev.map(x=>x.id===p.id?p:x):[...prev,p]);
  const addNotifications=(ns)=>setNotifications(p=>[...p,...ns]);
  const markRead=(id)=>setNotifications(p=>id==="all"?p.map(n=>({...n,read:true})):p.map(n=>n.id===id?{...n,read:true}:n));

  const unread=currentUser?notifications.filter(n=>n.mentionedId===currentUser.id&&!n.read).length:0;

  // Project-scoped data
  const projectTasks=currentProject?tasks.filter(t=>t.projectId===currentProject.id):[];
  const projectMembers=currentProject?DEFAULT_MEMBERS.filter(m=>currentProject.memberIds.includes(m.id)):[];
  const stats=currentProject?{todo:projectTasks.filter(t=>t.column==="todo").length,inprogress:projectTasks.filter(t=>t.column==="inprogress").length,done:projectTasks.filter(t=>t.column==="done").length}:{};

  if(!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0f172a",color:"#64748b",fontSize:14}}>Cargando...</div>;
  if(!currentUser) return <AuthFlow members={DEFAULT_MEMBERS} onLogin={handleLogin}/>;

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif",background:"#f1f5f9",overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:230,background:"#0f172a",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"18px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.5px",marginBottom:2}}><span style={{color:"#f59e0b",marginRight:6}}>◈</span>WorkBoard</div>
          <div style={{fontSize:11,color:"#475569"}}>Tu empresa · 18 miembros</div>
        </div>

        {currentProject?(
          <>
            <div style={{padding:"12px 16px 6px"}}>
              <button onClick={()=>{setCurrentProject(null);setView("board");setShowAlert(true);}} style={{width:"100%",padding:"8px 12px",borderRadius:7,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",color:"#94a3b8",fontSize:12,textAlign:"left",display:"flex",alignItems:"center",gap:6,marginBottom:8}}>← Mis proyectos</button>
              <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(255,255,255,0.05)",borderLeft:`3px solid ${currentProject.color}`,marginBottom:8}}>
                <div style={{fontWeight:700,color:"#f1f5f9",fontSize:13,marginBottom:1}}>{currentProject.name}</div>
                <div style={{fontSize:11,color:"#64748b"}}>{projectMembers.length} participantes</div>
              </div>
              <button onClick={()=>setShowNew(true)} style={{width:"100%",padding:"9px 0",borderRadius:7,background:"#f59e0b",border:"none",cursor:"pointer",color:"#0f172a",fontWeight:800,fontSize:12}}>+ Nueva tarea</button>
            </div>
            <nav style={{padding:"8px 12px",flex:1}}>
              {[{id:"board",icon:"⊞",label:"Tablero"},{id:"calendar",icon:"📅",label:"Calendario"},{id:"members",icon:"◎",label:"Participantes"}].map(item=>(
                <button key={item.id} onClick={()=>setView(item.id)} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"none",background:view===item.id?"rgba(245,158,11,0.12)":"transparent",color:view===item.id?"#f59e0b":"#cbd5e1",cursor:"pointer",textAlign:"left",fontSize:15,fontWeight:view===item.id?700:500,display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <span style={{fontSize:16}}>{item.icon}</span>{item.label}
                </button>
              ))}
              <button onClick={()=>{setEditingProject(currentProject);setShowNewProject(true);}} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"none",background:"transparent",color:"#cbd5e1",cursor:"pointer",textAlign:"left",fontSize:15,fontWeight:500,display:"flex",alignItems:"center",gap:10,marginTop:6}}>
                <span style={{fontSize:16}}>⚙️</span>Editar proyecto
              </button>
            </nav>
            <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:12,fontWeight:800,color:"#cbd5e1",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Resumen</div>
              {[{label:"Por hacer",count:stats.todo,color:"#818cf8"},{label:"En progreso",count:stats.inprogress,color:"#fbbf24"},{label:"Completadas",count:stats.done,color:"#4ade80"}].map(s=>(
                <div key={s.label} style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{fontSize:12,color:"#64748b"}}>{s.label}</span><span style={{fontSize:12,fontWeight:800,color:s.color,background:"rgba(255,255,255,0.05)",padding:"1px 8px",borderRadius:10}}>{s.count}</span></div>
              ))}
              <div style={{fontSize:10,color:saving?"#475569":"#22c55e",marginTop:8,textAlign:"center"}}>{saving?"Guardando...":"✓ Guardado"}</div>
            </div>
          </>
        ):(
          <div style={{flex:1,padding:"12px 12px",display:"flex",flexDirection:"column",gap:2}}>
            <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em",padding:"8px 12px 6px"}}>Navegación</div>
            <button onClick={()=>setShowNewProject(true)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"none",background:"rgba(245,158,11,0.12)",color:"#f59e0b",cursor:"pointer",textAlign:"left",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:10}}>
              <span>+</span> Nuevo proyecto
            </button>
            <div style={{fontSize:10,color:saving?"#475569":"#22c55e",marginTop:"auto",textAlign:"center",padding:"8px"}}>{saving?"Guardando...":"✓ Guardado"}</div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{padding:"12px 24px",background:"#fff",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            {currentProject?(
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:12,height:12,borderRadius:3,background:currentProject.color,flexShrink:0}}/>
                <div>
                  <h1 style={{margin:0,fontSize:17,fontWeight:800,color:"#0f172a"}}>{currentProject.name}</h1>
                  <p style={{margin:0,fontSize:12,color:"#94a3b8"}}>{{board:`${projectTasks.length} tareas`,calendar:"Calendario del proyecto",members:`${projectMembers.length} participantes`}[view]}</p>
                </div>
              </div>
            ):(
              <div><h1 style={{margin:0,fontSize:17,fontWeight:800,color:"#0f172a"}}>Mis proyectos</h1><p style={{margin:0,fontSize:12,color:"#94a3b8"}}>Bienvenido, {currentUser.name.split(" ")[0]}</p></div>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setShowNotifs(true)} style={{position:"relative",border:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:8,padding:"7px 10px",cursor:"pointer",fontSize:18,lineHeight:1}}>
              🔔{unread>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#ef4444",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 5px",minWidth:16,textAlign:"center"}}>{unread}</span>}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",cursor:"pointer"}} onClick={handleLogout} title="Cerrar sesión">
              <Avatar member={currentUser} size={26}/>
              <span style={{fontSize:12,fontWeight:600,color:"#475569"}}>{currentUser.name.split(" ")[0]}</span>
              <span style={{fontSize:11,color:"#94a3b8"}}>salir</span>
            </div>
          </div>
        </div>

        {currentProject&&showAlert&&<DueBanner tasks={projectTasks} onClose={()=>setShowAlert(false)}/>}

        {/* Views */}
        {!currentProject&&<ProjectsHome projects={projects} members={DEFAULT_MEMBERS} tasks={tasks} currentUser={currentUser} onSelectProject={p=>{setCurrentProject(p);setView("board");setShowAlert(true);}} onNewProject={()=>{setEditingProject(null);setShowNewProject(true);}}/>}

        {currentProject&&view==="board"&&(
          <div style={{flex:1,overflowX:"auto",padding:"18px 22px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,minWidth:640,height:"100%"}}>
              {COLUMNS.map((col,ci)=>{
                const ct=projectTasks.filter(t=>t.column===col.id);
                return (
                  <div key={col.id} style={{display:"flex",flexDirection:"column",minHeight:0}}>
                    <div style={{padding:"11px 14px",borderRadius:"10px 10px 0 0",background:col.light,borderBottom:`2px solid ${col.accent}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:7,height:7,borderRadius:"50%",background:col.accent}}/><span style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{col.label}</span></div>
                      <span style={{background:col.accent,color:"#fff",borderRadius:12,padding:"1px 9px",fontSize:12,fontWeight:800}}>{ct.length}</span>
                    </div>
                    <div style={{flex:1,background:col.light,borderRadius:"0 0 10px 10px",padding:"10px",overflowY:"auto"}}>
                      {ct.map(task=><TaskCard key={task.id} task={task} members={projectMembers} colIdx={ci} onClick={()=>setSelected(task)} onMove={dir=>moveTask(task.id,dir)}/>)}
                      {ct.length===0&&<div style={{textAlign:"center",padding:"30px 12px",color:"#cbd5e1",fontSize:13}}>Sin tareas</div>}
                      <button onClick={()=>setShowNew(true)} style={{width:"100%",padding:"7px",borderRadius:8,border:"1px dashed #cbd5e1",background:"transparent",cursor:"pointer",color:"#94a3b8",fontSize:12,marginTop:4}}>+ Agregar tarea</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentProject&&view==="calendar"&&<CalendarView tasks={projectTasks} onTaskClick={t=>setSelected(t)}/>}

        {currentProject&&view==="members"&&(
          <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
              {projectMembers.map(member=>{
                const mt=projectTasks.filter(t=>t.assigneeId===member.id);
                const done=mt.filter(t=>t.column==="done").length;
                const inp=mt.filter(t=>t.column==="inprogress").length;
                const pct=mt.length>0?Math.round(done/mt.length*100):0;
                return (
                  <div key={member.id} style={{background:"#fff",borderRadius:12,padding:"18px 16px",border:"1px solid #e2e8f0"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,0.09)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><Avatar member={member} size={42}/><div><div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{member.name}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{member.role}</div></div></div>
                    <div style={{display:"flex",gap:7,marginBottom:12}}>{[{label:"TOTAL",val:mt.length,color:"#1e293b",bg:"#f8fafc"},{label:"ACTIVAS",val:inp,color:"#d97706",bg:"#fffbeb"},{label:"HECHAS",val:done,color:"#16a34a",bg:"#f0fdf4"}].map(s=>(<div key={s.label} style={{flex:1,textAlign:"center",background:s.bg,borderRadius:7,padding:"7px 4px"}}><div style={{fontSize:17,fontWeight:800,color:s.color}}>{s.val}</div><div style={{fontSize:9,fontWeight:700,color:"#94a3b8",letterSpacing:"0.05em"}}>{s.label}</div></div>))}</div>
                    {mt.length>0&&<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:"#94a3b8"}}>Progreso</span><span style={{fontSize:10,fontWeight:700,color:"#22c55e"}}>{pct}%</span></div><div style={{height:5,borderRadius:3,background:"#e2e8f0",overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"#22c55e",borderRadius:3}}/></div></div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selected&&<TaskModal task={selected} members={projectMembers} currentUser={currentUser} onClose={()=>setSelected(null)} onUpdate={updateTask} onDelete={deleteTask} onAddNotifications={addNotifications}/>}
      {showNew&&currentProject&&<NewTaskModal members={projectMembers} projectId={currentProject.id} onClose={()=>setShowNew(false)} onAdd={addTask}/>}
      {(showNewProject||editingProject)&&<NewProjectModal members={DEFAULT_MEMBERS} currentUser={currentUser} editProject={editingProject} onClose={()=>{setShowNewProject(false);setEditingProject(null);}} onSave={p=>{saveProject(p);if(editingProject)setCurrentProject(p);}}/>}
      {showNotifs&&<NotificationsPanel notifications={notifications} members={DEFAULT_MEMBERS} currentUser={currentUser} onClose={()=>setShowNotifs(false)} onMarkRead={markRead}/>}
    </div>
  );
}
