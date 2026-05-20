import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBZM4_n_EPWnzUPGYf3UMOIEipMYvHRS_U",
  authDomain: "workboard-b05d8.firebaseapp.com",
  projectId: "workboard-b05d8",
  storageBucket: "workboard-b05d8.firebasestorage.app",
  messagingSenderId: "212877013133",
  appId: "1:212877013133:web:260e6bac95955fc01e32c4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

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
  {id:36,name:"P36"},{id:37,name:"P37"},{id:38,name:"P38"},{id:39,name:"P39"},{id:40,name:"P40"}
];

const COLORS = ["#6366f1","#f59e0b","#22c55e","#ef4444","#14b8a6","#8b5cf6","#f97316","#ec4899","#0ea5e9","#84cc16"];

export default function WorkBoard() {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [view, setView] = useState('kanban');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, 'users', u.uid);
        const userData = { email: u.email, name: u.displayName, uid: u.uid, photoURL: u.photoURL, updatedAt: new Date() };
        await setDoc(userRef, userData, { merge: true });
        setCurrentUser(userData);
      } else {
        setUser(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Projects listener
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    });
    return unsubscribe;
  }, [user]);

  // Tasks listener
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    });
    return unsubscribe;
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createProject = async (name, description, color, memberIds) => {
    try {
      setSaving(true);
      await addDoc(collection(db, 'projects'), {
        name,
        description,
        color,
        memberIds,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setShowNewProject(false);
      setSaving(false);
    } catch (error) {
      console.error('Error:', error);
      setSaving(false);
    }
  };

  const createTask = async (projectId, title, description, assigneeId, priority, dueDate) => {
    try {
      setSaving(true);
      await addDoc(collection(db, 'tasks'), {
        projectId,
        title,
        description,
        assigneeId,
        priority: priority || 'media',
        dueDate,
        column: 'todo',
        comments: [],
        links: [],
        createdBy: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setShowNewTask(false);
      setSaving(false);
    } catch (error) {
      console.error('Error:', error);
      setSaving(false);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'tasks', taskId), { ...updates, updatedAt: new Date() });
      setSaving(false);
    } catch (error) {
      console.error('Error:', error);
      setSaving(false);
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
          authorId: currentUser.uid,
          authorName: currentUser.name,
          createdAt: new Date()
        };
        await updateTask(taskId, { comments: [...(task.comments || []), newComment] });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0f172a',color:'white',fontSize:18}}>Cargando...</div>;

  if (!user) {
    return (
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100vh',background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',textAlign:'center'}}>
        <h1 style={{color:'white',marginBottom:20,fontSize:40}}>📋 WorkBoard</h1>
        <p style={{color:'#cbd5e1',marginBottom:40,fontSize:16}}>Gestor de Proyectos en Tiempo Real</p>
        <button onClick={handleLogin} style={{padding:'15px 40px',fontSize:16,background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold',boxShadow:'0 10px 25px rgba(0,0,0,0.3)'}}>
          🔐 Iniciar sesión con Google
        </button>
      </div>
    );
  }

  const userProjects = projects.filter(p => !p.memberIds || p.memberIds.length === 0 || p.memberIds.includes(currentUser.uid));
  const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id) : [];

  // Kanban View
  const KanbanView = () => {
    const columns = ['todo', 'progress', 'done'];
    const columnNames = { todo: 'Por hacer', progress: 'En progreso', done: 'Completado' };
    
    return (
      <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:20,marginTop:20}}>
        {columns.map(col => (
          <div key={col} style={{background:'#1e293b',borderRadius:8,padding:15}}>
            <h3 style={{marginBottom:15,fontSize:16,fontWeight:'bold'}}>{columnNames[col]} ({projectTasks.filter(t => t.column === col).length})</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {projectTasks.filter(t => t.column === col).map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)} style={{background:'#0f172a',padding:12,borderRadius:6,cursor:'pointer',borderLeft:`4px solid ${task.priority === 'alta' ? '#ef4444' : task.priority === 'media' ? '#f59e0b' : '#22c55e'}`}}>
                  <p style={{fontWeight:'bold',fontSize:14,marginBottom:5}}>{task.title}</p>
                  <p style={{fontSize:12,color:'#94a3b8'}}>{task.comments?.length || 0} comentarios</p>
                </div>
              ))}
              <button onClick={() => setShowNewTask(true)} style={{padding:10,background:'rgba(255,255,255,0.05)',border:'1px dashed #475569',borderRadius:6,color:'#94a3b8',cursor:'pointer',fontSize:14}}>
                + Agregar tarea
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Calendar View
  const CalendarView = () => {
    const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const cells = [];
    for (let i = 0; i < startingDayOfWeek; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);

    return (
      <div style={{marginTop:20}}>
        <h3 style={{marginBottom:20,fontSize:18,fontWeight:'bold'}}>{firstDay.toLocaleDateString('es-ES', {month:'long', year:'numeric'})}</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7, 1fr)',gap:10}}>
          {days.map(day => <div key={day} style={{textAlign:'center',fontWeight:'bold',color:'#94a3b8',marginBottom:10}}>{day}</div>)}
          {cells.map((day, idx) => (
            <div key={idx} style={{background:day ? '#1e293b' : 'transparent',padding:10,borderRadius:6,minHeight:80,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              {day && <p style={{fontWeight:'bold',marginBottom:8}}>{day}</p>}
              {day && projectTasks.filter(t => {
                const taskDate = t.dueDate ? new Date(t.dueDate).getDate() : null;
                return taskDate === day;
              }).map(task => (
                <p key={task.id} style={{fontSize:11,background:'rgba(59, 130, 246, 0.2)',padding:2,borderRadius:3,marginBottom:2,width:'100%',textAlign:'center',cursor:'pointer'}} onClick={() => setSelectedTask(task)}>
                  {task.title.substring(0,8)}...
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Task Modal
  const TaskModal = () => {
    if (!selectedTask) return null;
    
    return (
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div style={{background:'#1e293b',borderRadius:12,padding:30,maxWidth:600,width:'90%',maxHeight:'80vh',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <h2 style={{fontSize:20,fontWeight:'bold'}}>{selectedTask.title}</h2>
            <button onClick={() => setSelectedTask(null)} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:24}}>✕</button>
          </div>

          <p style={{color:'#cbd5e1',marginBottom:15}}>{selectedTask.description}</p>

          <div style={{background:'#0f172a',padding:15,borderRadius:8,marginBottom:20}}>
            <h3 style={{marginBottom:10,fontWeight:'bold'}}>Comentarios</h3>
            {selectedTask.comments?.map(c => (
              <div key={c.id} style={{background:'#1e293b',padding:10,borderRadius:6,marginBottom:10}}>
                <p style={{fontSize:12,color:'#94a3b8'}}><strong>{c.authorName}</strong> • {new Date(c.createdAt).toLocaleDateString('es-ES')}</p>
                <p style={{marginTop:5}}>{c.text}</p>
              </div>
            ))}
            <input type="text" placeholder="Agregar comentario..." style={{width:'100%',padding:10,borderRadius:6,border:'1px solid #475569',background:'#0f172a',color:'white',marginTop:10}} 
              onKeyPress={(e) => {
                if(e.key === 'Enter' && e.target.value) {
                  addComment(selectedTask.id, e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>

          <div style={{display:'flex',gap:10}}>
            <button onClick={() => deleteTask(selectedTask.id)} style={{flex:1,padding:10,background:'#ef4444',border:'none',borderRadius:6,color:'white',cursor:'pointer',fontWeight:'bold'}}>
              Eliminar
            </button>
            <button onClick={() => setSelectedTask(null)} style={{flex:1,padding:10,background:'#475569',border:'none',borderRadius:6,color:'white',cursor:'pointer',fontWeight:'bold'}}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{display:'flex',height:'100vh',background:'#0f172a',color:'white'}}>
      {/* Sidebar */}
      <div style={{width:280,background:'#1e293b',padding:20,borderRight:'1px solid rgba(255,255,255,0.1)',overflowY:'auto'}}>
        <h2 style={{marginBottom:20,fontSize:18,fontWeight:'bold'}}>📋 WorkBoard</h2>
        <div style={{marginBottom:20,padding:12,background:'rgba(255,255,255,0.05)',borderRadius:8}}>
          <p style={{fontSize:12,color:'#94a3b8'}}>Conectado</p>
          <p style={{fontWeight:'bold',marginTop:5}}>{currentUser?.name}</p>
        </div>
        <button onClick={handleLogout} style={{width:'100%',padding:10,background:'#ef4444',border:'none',borderRadius:6,color:'white',cursor:'pointer',fontWeight:'bold',marginBottom:20}}>
          Cerrar sesión
        </button>
        <button onClick={() => setShowNewProject(true)} style={{width:'100%',padding:10,background:'#3b82f6',border:'none',borderRadius:6,color:'white',cursor:'pointer',fontWeight:'bold',marginBottom:20}}>
          + Nuevo Proyecto
        </button>

        <h3 style={{fontSize:13,fontWeight:'bold',marginTop:20,marginBottom:10,color:'#94a3b8',textTransform:'uppercase'}}>Mis Proyectos ({userProjects.length})</h3>
        {userProjects.map(p => (
          <div key={p.id} onClick={() => {setSelectedProject(p);setSelectedTask(null);}} style={{padding:10,background:selectedProject?.id === p.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',borderRadius:6,marginBottom:8,cursor:'pointer',borderLeft:`4px solid ${p.color}`}}>
            <p style={{fontWeight:'bold',fontSize:13}}>{p.name}</p>
            <p style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{tasks.filter(t => t.projectId === p.id).length} tareas</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{flex:1,padding:30,overflowY:'auto'}}>
        {!selectedProject ? (
          <>
            <h1 style={{marginBottom:30}}>👋 Bienvenido, {currentUser?.name}!</h1>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:20}}>
              {userProjects.map(p => (
                <div key={p.id} onClick={() => setSelectedProject(p)} style={{background:'#1e293b',padding:20,borderRadius:8,borderLeft:`6px solid ${p.color}`,cursor:'pointer',transition:'all 0.3s'}}>
                  <h3 style={{marginBottom:10,fontWeight:'bold'}}>{p.name}</h3>
                  <p style={{fontSize:13,color:'#cbd5e1',marginBottom:10}}>{p.description}</p>
                  <p style={{fontSize:12,color:'#64748b'}}>📌 {tasks.filter(t => t.projectId === p.id).length} tareas</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:30}}>
              <h1>{selectedProject.name}</h1>
              <button onClick={() => setSelectedProject(null)} style={{padding:'8px 16px',background:'#475569',border:'none',borderRadius:6,color:'white',cursor:'pointer'}}>
                ← Volver
              </button>
            </div>

            <div style={{display:'flex',gap:10,marginBottom:20}}>
              {['kanban', 'calendar'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{padding:'10px 20px',background:view === v ? '#3b82f6' : '#475569',border:'none',borderRadius:6,color:'white',cursor:'pointer',fontWeight:'bold'}}>
                  {v === 'kanban' ? '⊞ Tablero' : '📅 Calendario'}
                </button>
              ))}
            </div>

            {view === 'kanban' && <KanbanView />}
            {view === 'calendar' && <CalendarView />}
          </>
        )}

        <TaskModal />

        {saving && <p style={{position:'fixed',bottom:20,right:20,background:'#3b82f6',padding:'10px 20px',borderRadius:6}}>💾 Guardando...</p>}
      </div>
    </div>
  );
}
