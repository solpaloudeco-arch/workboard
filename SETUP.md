# WorkBoard - Project Management Tool

Herramienta de gestión de proyectos y tareas para equipos.

## Características

✅ Tablero Kanban por proyecto  
✅ Calendario de tareas  
✅ Equipo y asignación de tareas  
✅ Menciones con @ y notificaciones  
✅ Comentarios en tareas  
✅ Archivos adjuntos (links)  
✅ PIN de seguridad  
✅ Almacenamiento local (sin servidor)  

## Instalación local

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/workboard.git
cd workboard

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start
```

La app abrirá en `http://localhost:3000`

## Deploy en Netlify

1. Sube el código a GitHub
2. Conecta tu repo en https://app.netlify.com
3. En build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Click en Deploy

## Datos de login (18 miembros)

```
1. Ana García (Project Manager)
2. Carlos López (Desarrollador)
3. María Rodríguez (Diseñadora UX)
4. Juan Martínez (Backend Dev)
5. Laura Sánchez (Frontend Dev)
6. Pedro Fernández (QA Engineer)
7. Sofía Torres (Product Owner)
8. Miguel Ruiz (DevOps)
9. Elena Díaz (Data Analyst)
10. Roberto Jiménez (Scrum Master)
11. Patricia Morales (Marketing)
12. Andrés Castro (Ventas)
13. Carmen Vega (RRHH)
14. Francisco Herrera (Finanzas)
15. Isabel Mendoza (Legal)
16. Diego Reyes (Soporte)
17. Valentina Cruz (Operaciones)
18. Martín Flores (Logística)
```

Cada miembro crea su PIN (4 dígitos) en el primer login.

## Almacenamiento

Los datos se guardan en el navegador (localStorage), no se usa base de datos.
- Cada usuario tiene su propio almacenamiento
- Los datos persisten entre sesiones
- Se sincroniza entre pestañas

## Support

📧 info@solpaloudeco.com.ar
