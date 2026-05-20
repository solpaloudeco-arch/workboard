import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

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
  {id:32,name:"Yami"},{id:33,name:"Emi"},{id:34,name:"P34"},{id:35,name:"P35"},
  {id:36,name:"P36"},{id:37,name:"P37"},{id:38,name:"P38"},{id:39,name:"P39"},{id:40,name:"P40"}
];

const COLORS = ["#6366f1","#f59e0b","#22c55e","#ef4444","#14b8a6","#8b5cf6","#f97316","#ec4899","#0ea5e9"];

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
  const [view, setView] = useState('kanban');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [commentText, setCommentText] = useState('');

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
    setStage('pin');
    setPinInput('');
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

  const handleLogin = () => {
    if (pinInput.length === 4) {
      setStage('app');
    } else {
      alert('PIN debe tener 4 dígitos');
    }
  };

  const createProject = async () => {
    if (newProjectName.trim()) {
      try {
        const colorIdx = projects.length % COLORS.length;
        await addDoc(collection(db, 'projects'), {
          name: newProjectName,
          description: '',
          color: COLORS[colorIdx],
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
          description: '',
          assigneeId: currentUser.id,
          priority: 'media',
          column: 'todo',
          comments: [],
          createdBy: currentUser.id,
          createdAt: new Date()
        });
        setNewTaskTitle('');
        setShowNewTask(false);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const updateTaskColumn = async (taskId, newColumn) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { column: newColumn });
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
          authorId: currentUser.id,
          authorName: currentUser.name,
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

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setSelectedTask(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // LOGIN SCREEN
  if (!currentUser) {
    const filteredMembers = MEMBERS.filter(m => m.name.toLowerCase().includes(searchText.toLowerCase()));

    return (
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100vh',background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',padding:20}}>
        <h1 style={{color:'white',marginBottom:10,fontSize:40}}>📋 WorkBoard</h1>
        <p style={{color:'#cbd5e1',marginBottom:30}}>Sol Palou Deco</p>
        
        {stage === 'selectUser' && (
          <div style={{width:'100%',maxWidth:500}}>
            <input type="text" placeholder="Buscar nombre..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{width:'100%',padding:12,marginBottom:20,borderRadius:8,border:'1px solid #475569',background:'#0f172a',color:'white',fontSize:16}} />
            <div style={{maxHeight:400,overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',gap:10}}>
              {filteredMembers.map(m => (
                <button key={m.id} onClick={() => handleSelectUser(m)} style={{padding:12,background:'#1e293b',border:'1px solid #475569',borderRadius:8,color:'white',cursor:'pointer',fontWeight:'bold',fontSize:14,transition:'all 0.2s'}}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'pin' && (
          <div style={{width:'100%',maxWidth:300,textAlign:'center'}}>
            <p style={{color:'#cbd5e1',marginBottom:20,fontSize:16}}>Creá tu PIN de 4 dígitos</p>
            <p style={{color:'#94a3b8',marginBottom:20}}>{currentUser.name}</p>
            <input type="password" maxLength="4" value={pinInput} onChange={(e) => setPinInput(e.target.value)} style={{width:'100%',padding:14,marginBottom:20,borderRadius:8,border:'1px solid #475569',background:'#0f172a',color:'white',fontSize:24,textAlign:'center',letterSpacing:'0.5em'}} />
            <button onClick={handleCreatePin} disabled={pinInput.length !== 4} style={{width:'100%',padding:12,background:pinInput.length === 4 ? '#3b82f6' : '#475569',border:'none',borderRadius:8,color:'white',cursor:pinInput.length === 4 ? 'pointer' : 'not-allowed',fontWeight:'bold'}}>
              Siguiente
            </button>
            <button onClick={() => {setCurrentUser(null);setPinInput('');}} style={{width:'100%',padding:12,marginTop:10,background:'transparent',border:'1px solid #475569',borderRadius:8,color:'#94a3b8',cursor:'pointer'}}>
              ← Atrás
            </button>
          </div>
        )}

        {stage === 'confirmPin' && (
          <div style={{width:'100%',maxWidth:300,textAlign:'center'}}>
            <p style={{color:'#cbd5e1',marginBottom:20,fontSize:16}}>Confirmá tu PIN</p>
            <input type="password" maxLength="4" value={pinInput} onChange={(e) => setPinInput(e.target.value)} style={{width:'100%',padding:14,marginBottom:20,borderRadius:8,border:'1px solid #475569',background:'#0f172a',color:'white',fontSize:24,textAlign:'center',letterSpacing:'0.5em'}} />
            <button onClick={handleConfirmPin} style={{width:'100%',padding:12,background:'#22c55e',border:'none',borderRadius:8,color:'white',cursor:'pointer',fontWeight:'bold'}}>
              Confirmar
            </button>
            <button onClick={() => {setStage('pin');setPinInput('');}} style={{width:'100%',padding:12,marginTop:10,background:'transparent',border:'1px solid #475569',borderRadius:8,color:'#94a3b8',cursor:'pointer'}}>
              ← Atrás
            </button>
          </div>
        )}
      </div>
    );
  }

  // APP SCREEN
  const userProjects = projects.filter(p => !p.memberIds || p.memberIds.length === 0 || p.memberIds.includes(currentUser.id));
  const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id) : [];

  // KANBAN VIEW
  const KanbanView = () => {
    const columns = [
      {id: 'todo', name: 'Por hacer'},
      {id: 'progress', name: 'En progreso'},
      {id: 'done', name: 'Completado'}
    ];

    return (
      <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:20,marginTop:20}}>
        {columns.map(col => (
          <div key={col.id} style={{background:'#1e293b',borderRadius:8,padding:15}}>
            <h3 style={{marginBottom:15,fontSize:16,fontWeight:'bold'}}>{col.name} ({projectTasks.filter(t => t.column === col.id).length})</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {projectTasks.filter(t => t.column === col.id).map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)} style={{background:'#0f172a',padding:12,borderRadius:6,cursor:'pointer',borderLeft:`4px solid ${task.priority === 'alta' ? '#ef4444' : task.priority === 'media' ? '#f59e0b' : '#22c55e'}`}}>
                  <p style={{fontWeight:'bold',fontSize:14,marginBottom:5}}>{task.title}</p>
                  <p style={{fontSize:12,color:'#94a3b8'}}>💬 {task.comments?.length || 0}</p>
                </div>
              ))}
              <button onClick={() => setShowNewTask(true)} style={{padding:10,background:'rgba(255,255,255,0.05)',border:'1px dashed #475569',borderRadius:6,color:'#94a3b8',cursor:'pointer',fontSize:14,marginTop:5}}>
                + Agregar tarea
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // CALENDAR VIEW
  const CalendarView = () => {
    const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const today = new Date();
    const year = today.getFullYear();
    const month = t
