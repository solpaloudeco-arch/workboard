import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBZM4_n_EPWnzUPGYf3UMOIEipMYvHRS_U",
  authDomain: "workboard-b05d8.firebaseapp.com",
  projectId: "workboard-b05d8",
  storageBucket: "workboard-b05d8.firebasestorage.app",
  messagingSenderId: "212877013133",
  appId: "1:212877013133:web:260e6bac95955fc01e32c4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MEMBERS = [
  {id:1,name:"Sol"},{id:2,name:"Dolo"},{id:3,name:"Grace"},{id:4,name:"Caro"},
  {id:5,name:"Meli"},{id:6,name:"Rita"},{id:7,name:"Mariela"},{id:8,name:"Tobal"},
  {id:9,name:"Belen"},{id:10,name:"Azul"},{id:11,name:"Cami"},{id:12,name:"Lu"},
  {id:13,name:"Mary"},{id:14,name:"Lara B"},{id:15,name:"Gaston"},{id:16,name:"Nico"},
  {id:17,name:"Lean"},{id:18,name:"Leo"},{id:19,name:"Dai"},{id:20,name:"Ailen"},
  {id:21,name:"Lourdes"},{id:22,name:"Eze"},{id:23,name:"Nina"},{id:24,name:"Naty"},
  {id:25,name:"Paloma"},{id:26,name:"Tamara"},{id:27,name:"Lara L"},{id:28,name:"Carlos"},
  {id:29,name:"Juan Cruz"},{id:30,name:"Melisa"},{id:31,name:"Cris"},
  {id:32,name:"P32"},{id:33,name:"P33"},{id:34,name:"P34"},{id:35,name:"P35"},
  {id:36,name:"P36"},{id:37,name:"P37"},{id:38,name:"P38"},{id:39,name:"Emi"},{id:40,name:"Yami"}
];

const PROJECT_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316"];
const PRIORITY_COLORS = {alta:"#ef4444",media:"#f59e0b",baja:"#10b981"};

export default function WorkBoard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [stage, setStage] = useState('selectUser');
  const [searchText, setSearchText] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('media');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [commentText, setCommentText] = useState('');
  const [taskEditTitle, setTaskEditTitle] = useState('');
  const [taskEditPriority, setTaskEditPriority] = useState('media');
  const [taskEditLink, setTaskEditLink] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const handleSelectUser = (member) => {
    setCurrentUser(member);
    setPinInput('');
    setPin('');
    setTimeout(() => setStage('pin'), 10);
  };

  const handleCreatePin = () => {
    if (pinInput.length === 4) {
      setPin(pinInput);
      setStage('confirmPin');
      setPinInput('');
    }
  };

  const handleConfirmPin = () => {
    if (pinInput === pin) {
      setStage('app');
    } else {
      alert('PIN no coincide');
      setPinInput('');
    }
  };

  const createProject = async () => {
    if (newProjectName.trim()) {
      try {
        await addDoc(collection(db, 'projects'), {
          name: newProjectName,
          color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length],
          createdBy: currentUser.id,
          createdAt: new Date(),
          memberIds: [currentUser.id]
        });
        setNewProjectName('');
        setShowNewProject(false);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const createTask = async () => {
    if (newTaskTitle.trim() && selectedProject) {
      try {
        await addDoc(collection(db, 'tasks'), {
          projectId: selectedProject.id,
          title: newTaskTitle,
          priority: newTaskPriority,
          link: newTaskLink,
          column: 'todo',
          comments: [],
          createdBy: currentUser.id,
          createdAt: new Date()
        });
        setNewTaskTitle('');
        setNewTaskPriority('media');
        setNewTaskLink('');
        setShowNewTask(false);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), updates);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setSelectedTask(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addComment = async (taskId, text) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newComment = {
          id: Date.now(),
          text,
          author: currentUser.name,
          createdAt: new Date().toISOString()
        };
        await updateDoc(doc(db, 'tasks', taskId), {
          comments: [...(task.comments || []), newComment]
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // LOGIN SCREEN
  if (!currentUser) {
    const filteredMembers = MEMBERS.filter(m => m.name.toLowerCase().includes(searchText.toLowerCase()));

    return (
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100vh',background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',padding:20}}>
        <h1 style={{color:'white',marginBottom:10,fontSize:48,fontWeight:'bold'}}>📋 WorkBoard</h1>
        <p style={{color:'#94a3b8',marginBottom:40,fontSize:16}}>Sol Palou Deco - Gestor de Proyectos</p>
        
        {stage === 'selectUser' && (
          <div style={{width:'100%',maxWidth:550}}>
            <input type="text" placeholder="🔍 Buscar tu nombre..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{width:'100%',padding:14,marginBottom:25,borderRadius:10,border:'2px solid #3b82f6',background:'#0f172a',color:'white',fontSize:16}} />
            <div style={{maxHeight:400,overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))',gap:12}}>
              {filteredMembers.map(m => (
                <button key={m.id} onClick={() => handleSelectUser(m)} style={{padding:14,background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',border:'2px solid #475569',borderRadius:10,color:'white',cursor:'pointer',fontWeight:'bold',fontSize:15,transition:'all 0.2s',hover:{background:'#3b82f6'}}}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'pin' && (
          <div style={{width:'100%',maxWidth:350,textAlign:'center',background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',padding:40,borderRadius:15,border:'2px solid #3b82f6'}}>
            <p style={{color:'#cbd5e1',marginBottom:15,fontSize:18,fontWeight:'bold'}}>Creá tu PIN de 4 dígitos</p>
            <p style={{color:'#94a3b8',marginBottom:25,fontSize:16}}>{currentUser.name}</p>
            <input type="password" maxLength="4" value={pinInput} onChange={(e) => setPinInput(e.target.value)} style={{width:'100%',padding:16,marginBottom:25,borderRadius:10,border:'2px solid #3b82f6',background:'#0f172a',color:'white',fontSize:28,textAlign:'center',letterSpacing:'0.3em',fontWeight:'bold'}} />
            <button onClick={handleCreatePin} disabled={pinInput.length !== 4} style={{width:'100%',padding:14,background:pinInput.length === 4 ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#475569',border:'none',borderRadius:10,color:'white',cursor:'pointer',fontWeight:'bold',fontSize:16}}>
              Siguiente →
            </button>
          </div>
        )}

        {stage === 'confirmPin' && (
          <div style={{width:'100%',maxWidth:350,textAlign:'center',background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',padding:40,borderRadius:15,border:'2px solid #10b981'}}>
            <p style={{color:'#cbd5e1',marginBottom:25,fontSize:18,fontWeight:'bold'}}>Confirmá tu PIN</p>
            <input type="password" maxLength="4" value={pinInput} onChange={(e) => setPinInput(e.target.value)} style={{width:'100%',padding:16,marginBottom:25,borderRadius:10,border:'2px solid #10b981',background:'#0f172a',color:'white',fontSize:28,textAlign:'center',letterSpacing:'0.3em',fontWeight:'bold'}} />
            <button onClick={handleConfirmPin} style={{width:'100%',padding:14,background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',border:'none',borderRadius:10,color:'white',cursor:'pointer',fontWeight:'bold',fontSize:16}}>
              ✓ Confirmar
            </button>
          </div>
        )}
      </div>
    );
  }

  const userProjects = projects.filter(p => !p.memberIds || p.memberIds.includes(currentUser.id));
  const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id) : [];

  return (
    <div style={{display:'flex',height:'100vh',background:'linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)',color:'white'}}>
      <div style={{width:300,background:'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',padding:25,borderRight:'1px solid #3b82f6',overflowY:'auto'}}>
        <h2 style={{marginBottom:25,fontSize:20,fontWeight:'bold',background:'linear-gradient(135deg, #3b82f6, #8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>📋 WorkBoard</h2>
        
        <div style={{marginBottom:25,padding:15,background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',borderRadius:12,border:'1px solid #3b82f6'}}>
          <p style={{fontSize:12,color:'#94a3b8',textTransform:'uppercase'}}>Conectado</p>
          <p style={{fontWeight:'bold',marginTop:8,fontSize:17,color:'#3b82f6'}}>{currentUser.name}</p>
        </div>

        <button onClick={() => {setCurrentUser(null);setPin('');setPinInput('');setStage('selectUser');}} style={{width:'100%',padding:12,background:'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',border:'none',borderRadius:10,color:'white',cursor:'pointer',fontWeight:'bold',marginBottom:20}}>
          🚪 Cerrar sesión
        </button>

        <button onClick={() => setShowNewProject(true)} style={{width:'100%',padding:12,background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',border:'none',borderRadius:10,color:'white',cursor:'pointer',fontWeight:'bold',marginBottom:25}}>
          ➕ Nuevo Proyecto
        </button>

        <h3 style={{fontSize:13,fontWeight:'bold',marginTop:25,marginBottom:15,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em'}}>Mis Proyectos ({userProjects.length})</h3>
        {userProjects.map(p => (
          <div key={p.id} onClick={() => {setSelectedProject(p);setSelectedTask(null);}} style={{padding:13,background:selectedProject?.id === p.id ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',borderRadius:10,marginBottom:10,cursor:'pointer',borderLeft:`5px solid ${p.color}`,transition:'all 0.2s'}}>
            <p style={{fontWeight:'bold',fontSize:14}}>{p.name}</p>
            <p style={{fontSize:11,color:'#94a3b8',marginTop:5}}>📌 {tasks.filter(t => t.projectId === p.id).length} tareas</p>
          </div>
        ))}
      </div>

      <div style={{flex:1,padding:35,overflowY:'auto'}}>
        {!selectedProject ? (
          <div style={{textAlign:'center',paddingTop:50}}>
            <h1 style={{fontSize:48,marginBottom:15,background:'linear-gradient(135deg, #3b82f6, #8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>👋 Bienvenido, {currentUser.name}!</h1>
            <p style={{color:'#94a3b8',fontSize:16}}>Selecciona un proyecto para comenzar</p>
          </div>
        ) : (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:35}}>
              <h1 style={{fontSize:36,background:`linear-gradient(135deg, ${selectedProject.color}, #8b5cf6)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{selectedProject.name}</h1>
              <button onClick={() => setSelectedProject(null)} style={{padding:'10px 20px',background:'linear-gradient(135deg, #475569 0%, #334155 100%)',border:'none',borderRadius:8,color:'white',cursor:'pointer',fontWeight:'bold'}}>
                ← Volver
              </button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:25,marginTop:30}}>
              {['todo','progress','done'].map(col => (
                <div key={col} style={{background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',borderRadius:12,padding:20,border:'1px solid #3b82f6'}}>
                  <h3 style={{marginBottom:20,fontSize:16,fontWeight:'bold',color:'#3b82f6'}}>
                    {col === 'todo' ? '📋 Por hacer' : col === 'progress' ? '⚡ En progreso' : '✅ Completado'} ({projectTasks.filter(t => t.column === col).length})
                  </h3>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {projectTasks.filter(t => t.column === col).map(task => (
                      <div key={task.id} onClick={() => {setSelectedTask(task);setTaskEditTitle(task.title);setTaskEditPriority(task.priority||'media');setTaskEditLink(task.link||'');}} style={{background:'linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)',padding:15,borderRadius:10,cursor:'pointer',borderLeft:`4px solid ${PRIORITY_COLORS[task.priority] || '#94a3b8'}`,transition:'all 0.2s'}}>
                        <p style={{fontWeight:'bold',fontSize:14,marginBottom:8}}>{task.title}</p>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8'}}>
                          <span>💬 {task.comments?.length || 0}</span>
                          <span style={{color:PRIORITY_COLORS[task.priority]}}>📊 {task.priority}</span>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {setShowNewTask(true);setNewTaskPriority('media');setNewTaskTitle('');setNewTaskLink('');}} style={{padding:12,background:'rgba(59, 130, 246, 0.1)',border:'2px dashed #3b82f6',borderRadius:10,color:'#3b82f6',cursor:'pointer',fontSize:14,fontWeight:'bold',marginTop:5}}>
                      ➕ Agregar tarea
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedTask && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
            <div style={{background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',borderRadius:15,padding:40,maxWidth:700,width:'90%',maxHeight:'85vh',overflowY:'auto',border:'2px solid #3b82f6'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:30}}>
                <h2 style={{fontSize:24,fontWeight:'bold'}}>{taskEditTitle}</h2>
                <button onClick={() => setSelectedTask(null)} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:28}}>✕</button>
              </div>

              <div style={{background:'linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)',padding:20,borderRadius:12,marginBottom:25}}>
                <h4 style={{marginBottom:15,fontSize:14,fontWeight:'bold',color:'#3b82f6'}}>Editar Tarea</h4>
                <input type="text" value={taskEditTitle} onChange={(e) => setTaskEditTitle(e.target.value)} placeholder="Título" style={{width:'100%',padding:12,marginBottom:15,borderRadius:8,border:'1px solid #3b82f6',background:'#0f172a',color:'white'}} />
                <select value={taskEditPriority} onChange={(e) => setTaskEditPriority(e.target.value)} style={{width:'100%',padding:12,marginBottom:15,borderRadius:8,border:'1px solid #3b82f6',background:'#0f172a',color:'white'}}>
                  <option value="baja">🟢 Baja</option>
                  <option value="media">🟠 Media</option>
                  <option value="alta">🔴 Alta</option>
                </select>
                <input type="text" value={taskEditLink} onChange={(e) => setTaskEditLink(e.target.value)} placeholder="Enlace (URL)" style={{width:'100%',padding:12,marginBottom:15,borderRadius:8,border:'1px solid #3b82f6',background:'#0f172a',color:'white'}} />
                <button onClick={() => updateTask(selectedTask.id, {title:taskEditTitle,priority:taskEditPriority,link:taskEditLink})} style={{width:'100%',padding:10,background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',border:'none',borderRadius:8,color:'white',cursor:'pointer',fontWeight:'bold'}}>
                  💾 Guardar cambios
                </button>
              </div>

              {taskEditLink && (
                <div style={{background:'linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)',padding:15,borderRadius:12,marginBottom:25}}>
                  <a href={taskEditLink} target="_blank" rel="noopener noreferrer" style={{color:'#3b82f6',textDecoration:'none',fontWeight:'bold'}}>
                    🔗 {taskEditLink}
                  </a>
                </div>
              )}

              <div style={{background:'linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)',padding:20,borderRadius:12,marginBottom:25}}>
                <h4 style={{marginBottom:15,fontSize:14,fontWeight:'bold',color:'#3b82f6'}}>💬 Comentarios</h4>
                {selectedTask.comments?.map(c => (
                  <div key={c.id} style={{background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',padding:12,borderRadius:8,marginBottom:10}}>
                    <p style={{fontSize:12,color:'#3b82f6',fontWeight:'bold'}}>{c.author}</p>
                    <p style={{marginTop:6,color:'#cbd5e1'}}>{c.text}</p>
                  </div>
                ))}
                <div style={{display:'flex',gap:10,marginTop:15}}>
                  <input type="text" placeholder="Agrega un comentario..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{flex:1,padding:10,borderRadius:8,border:'1px solid #3b82f6',background:'#0f172a',color:'white'}} 
                    onKeyPress={(e) => {if(e.key === 'Enter' && commentText) {addComment(selectedTask.id, commentText);setCommentText('');}}}
                  />
                </div>
              </div>

              <div style={{display:'flex',gap:10}}>
                <button onClick={() => deleteTask(selectedTask.id)} style={{flex:1,padding:12,background:'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',border:'none',borderRadius:8,color:'white',cursor:'pointer',fontWeight:'bold'}}>
                  🗑️ Eliminar
                </button>
                <button onClick={() => setSelectedTask(null)} style={{flex:1,padding:12,background:'linear-gradient(135deg, #475569 0%, #334155 100%)',border:'none',borderRadius:8,color:'white',cursor:'pointer',fontWeight:'bold'}}>
                  ✕ Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {showNewProject && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
            <div style={{background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',borderRadius:15,padding:40,maxWidth:450,width:'90%',border:'2px solid #3b82f6'}}>
              <h2 style={{marginBottom:25,fontSize:24,fontWeight:'bold'}}>Nuevo Proyecto</h2>
              <input type="text" placeholder="Nombre del proyecto" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} style={{width:'100%',padding:14,marginBottom:20,borderRadius:10,border:'2px solid #3b82f6',background:'#0f172a',color:'white',fontSize:15}} />
              <div style={{display:'flex',gap:12}}>
                <button onClick={createProject} style={{flex:1,padding:12,background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',border:'none',borderRadius:10,color:'white',cursor:'pointer',fontWeight:'bold'}}>
                  ✓ Crear
                </button>
                <button onClick={() => setShowNewProject(false)} style={{flex:1,padding:12,background:'linear-gradient(135deg, #475569 0%, #334155 100%)',border:'none',borderRadius:10,color:'white',cursor:'pointer'}}>
                  ✕ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showNewTask && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
            <div style={{background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',borderRadius:15,padding:40,maxWidth:500,width:'90%',border:'2px solid #3b82f6'}}>
              <h2 style={{marginBottom:25,fontSize:24,fontWeight:'bold'}}>Nueva Tarea</h2>
              <input type="text" placeholder="Título de la tarea" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} style={{width:'100%',padding:12,marginBottom:15,borderRadius:10,border:'2px solid #3b82f6',background:'#0f172a',color:'white'}} />
              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} style={{width:'100%',padding:12,marginBottom:15,borderRadius:10,border:'2px solid #3b82f6',background:'#0f172a',color:'white'}}>
                <option value="baja">🟢 Baja</option>
                <option value="media">🟠 Media</option>
                <option value="alta">🔴 Alta</option>
              </select>
              <input type="text" placeholder="Enlace (URL)" value={newTaskLink} onChange={(e) => setNewTaskLink(e.target.value)} style={{width:'100%',padding:12,marginBottom:20,borderRadius:10,border:'2px solid #3b82f6',background:'#0f172a',color:'white'}} />
              <div style={{display:'flex',gap:12}}>
                <button onClick={createTask} style={{flex:1,padding:12,background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',border:'none',borderRadius:10,color:'white',cursor:'pointer',fontWeight:'bold'}}>
                  ✓ Crear
                </button>
                <button onClick={() => setShowNewTask(false)} style={{flex:1,padding:12,background:'linear-gradient(135deg, #475569 0%, #334155 100%)',border:'none',borderRadius:10,color:'white',cursor:'pointer'}}>
                  ✕ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
