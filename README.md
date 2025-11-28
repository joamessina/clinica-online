# 🏥 Clínica Online

La Clinica Online es una aplicación web para la gestión de turnos, pacientes, historias clínicas y especialistas de la salud. Desarrollada con Angular 19 y Supabase como backend, permite a pacientes, especialistas y administradores interactuar en la plataforma.

🚀 Características principales
---
- Registro y autenticacion de usuarios (paciente, especialista, administrador)
- Asignacion y gestion de turnos
- Carga y visualizacion de historias clinicas
- Comentarios y reseñas sobre la atencion recibida
- Gestion de horarios personalizados por especialidad
- Panel de administrador con control sobre usuarios y turnos

---
## 👥 Roles y capacidades

### 👤 Paciente

- Solicita turnos con especialistas segun la especialidad
- Puede cancelar turnos, calificar la atencion y completar encuestas
- Visualizar su historial clinico

### 🩺 Especialista

- Planifica sus horarios por especialidad
- Puede aceptar o rechazar turnos (debe dar motivo de cancelar)
- Carga la historia clinica

### 🛠️ Administrador

- Visualiza todos los turnos del sistema
- Gestiona todos los usuarios y sus permisos
- Genera Reportes segun necesidad

---

## 🔄 Flujo funcional de la aplicación

0. **Bienvenida**
   - Pantalla de bienvenida con la descripción de la clínica.
   - Botones para ir a **Login** o **Registro**.
   - https://postimg.cc/MMff3sH3

1. **Registro / Login**
   - El usuario se registra como **paciente** o **especialista**. (https://postimg.cc/PvGpgm8b)
   - El paciente carga datos personales y dos imágenes de perfil. (https://postimg.cc/JHbDMGbT)
   - El especialista carga datos personales, imagen de perfil y sus especialidades. (https://postimg.cc/5QcYhwFm)
   - Luego inicia sesión con su correo y contraseña desde la pantalla de **Login**. (https://postimg.cc/Vr00Z7vD)

2. **Solicitar turnos (paciente)**
   - El paciente elige **especialidad**, **especialista**, día y horario disponible. (https://postimg.cc/ZvkBGryp)
   - Se genera un turno en estado **“PENDIENTE”**.
   - El turno aparece en la sección **Mis turnos** del paciente.(https://postimg.cc/ThmWrHZr)

3. **Gestión de turnos**
   - **Especialista**: acepta, rechaza, cancela o finaliza turnos desde **Mis turnos especialista**. (https://postimg.cc/gwJZ8cWn)
   - **Paciente**: puede cancelar sus turnos mientras no hayan sido realizados.

4. **Historia clínica**
   - Al finalizar el turno, el especialista carga la informacion clinica de la consulta. (https://postimg.cc/F7y3Qnpr)
   - Esa información se guarda en la **historia clínica** del paciente. (https://postimg.cc/F7y3Qnpr)
   

5. **Calificación y encuesta de la atención**
   - Cuando el turno se marca como realizado, el paciente puede:
     - Calificar la atención con un puntaje de **1 a 5 estrellas**. (https://postimg.cc/XZzy8Mjw)
     - Completar una **encuesta de satisfacción** con preguntas rápidas y un comentario opcional. (https://postimg.cc/gwT6D9zt)

6. **Descargar historia clínica (paciente)**
   - Desde su panel, el paciente puede descargar su **historia clínica completa**. (https://postimg.cc/0zZSzMhF)

7. **Ver historias clínicas y turnos del paciente (especialista)**
   - El especialista puede ver las historias clínicas de pacientes que atendió alguna vez. (https://postimg.cc/zyphyb9m)

8. **Panel de administración – usuarios**
   - El administrador ve el listado completo de usuarios. (https://postimg.cc/hXMmXzHK)
   - Puede aprobar especialistas, cambiar roles, activar o desactivar cuentas. (https://postimg.cc/w3sDwBsV)
   - Puede descargar los turnos asociados a cada usuario **Excel**. (https://postimg.cc/yk4ctzF5)

9. **Panel de administración – turnos**
   - Vista general de todos los turnos de la clínica. (https://postimg.cc/ZWVhX4yH)
   - Filtros por estado, fecha, paciente y especialista. (https://postimg.cc/3knHzYD2)

10. **Informes y reportes de la clínica**
    - Sección de **Reportes** para el administrador. (https://postimg.cc/ctQg0rQz)
    - Incluye:
      - Log de ingresos al sistema.
      - Indicadores de visitas, turnos totales, pacientes únicos y encuestas recibidas.
      - Gráficos de turnos por especialidad, por día y por médico.
    - Los reportes se pueden exportar a **PDF** o **Excel**.

11. **Idiomas**
    - Selector de idioma en la barra superior.
    - La aplicación puede usarse en **Español, Inglés y Portugués**.
