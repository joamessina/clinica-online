# Clínica Online — README

## Visión general
**Clínica Online** es una aplicación web para gestionar turnos médicos con tres perfiles de usuario:

- **Administrador**: gestiona usuarios y visualiza todos los turnos de la clínica.
- **Especialista**: administra su agenda (disponibilidad), acepta/rechaza/finaliza turnos y deja reseñas.
- **Paciente**: solicita turnos, cancela cuando corresponda, completa encuestas y califica la atención.

Tecnologías principales: **Angular (standalone)** + **Bootstrap** + **Supabase** (auth, DB, storage).

---

## Acceso y navegación

### Autenticación
- **Registro**: correo + contraseña, con **Captcha** en el formulario de registro.
- **Login/Logout**: desde el navbar.
- Tras autenticarse, el sistema redirige según el **rol**.

### Navbar (común)
- **Clínica Online** (logo): lleva al inicio/landing.
- **Usuarios** (solo admin).
- **Mi perfil** (todos los roles).
- **Salir**.

> En todas las vistas se incluye un botón **Volver** para regresar a la pantalla anterior.

---

## Secciones por rol

### 1) Administrador

#### a. Usuarios  
**Ruta**: `/admin/usuarios`  
**Qué muestra**  
- Tabla con: Foto, Nombre/Apellido, Rol, Email, DNI, Obra social, **Especialidades** (todas las que tenga el especialista), Estado de aprobación y Acciones.
- **Filtros**:
  - Búsqueda por nombre, email, DNI, obra social, rol.
  - Selector de rol (Todos/Admin/Especialista/Paciente).
  - “Solo pendientes de aprobación”.
- **Acciones**:
  - **Aprobar/Desaprobar** usuario.
  - Cambiar **Rol** (Admin / Especialista / Paciente).
  - **Nuevo usuario** (alta manual; envía email de confirmación si corresponde).
  - **Actualizar** (recarga datos).
- **Notas**:
  - Las **especialidades** se listan como chips y pueden ser múltiples (relación *muchos a muchos*).

#### b. Turnos (Admin)  
**Ruta**: `/admin/turnos`  
**Qué muestra**
- Todos los turnos de la clínica.
- Filtro único por **Especialidad** y **Especialista** (texto, no combo).
- **Acción**: **Cancelar** turnos (siempre que no estén Aceptados/Realizados/Rechazados). Debe cargarse un **motivo**.

---

### 2) Especialista

#### a. Panel Especialista  
**Ruta**: `/especialista`  
**Qué muestra**
- Atajos a **Mis turnos** y **Mis horarios**.

#### b. Mis turnos (Especialista)  
**Ruta**: `/especialista/mis-turnos`  
**Qué muestra**
- Tabla con Fecha, Hora, **Especialidad**, **Paciente**, **Estado** y **Acciones**.
- Filtro único por **Especialidad** o **Paciente** (texto).
- **Estados** con badges: `PENDIENTE`, `ACEPTADO`, `RECHAZADO`, `CANCELADO`, `REALIZADO`.
- **Acciones (visibles según estado)**:
  - **Aceptar**: visible si **no** está Realizado/Cancelado/Rechazado.
  - **Rechazar** (con motivo): visible si **no** está Aceptado/Realizado/Cancelado.
  - **Cancelar** (con motivo): visible si **no** está Aceptado/Realizado/Rechazado.
  - **Finalizar** (con **reseña/diagnóstico**): visible **solo si está Aceptado**.
  - **Ver reseña**: visible si existe comentario/reseña.

#### c. Mis horarios (Disponibilidad)  
**Ruta**: `/especialista/mis-horarios`  
**Qué muestra**
- Selector de **Especialidad** (chips), **Día de la semana**, **Desde/Hasta** y **Slot** (minutos).
- Botón **Agregar** para registrar tramos de disponibilidad.
- Tabla con tramos cargados (weekday, desde, hasta, slot).
- Un especialista con múltiples **especialidades** puede cargar disponibilidad por cada una.

---

### 3) Paciente

#### a. Solicitar turno  
**Ruta**: `/turnos/solicitar`  
**Qué muestra**
- Paso 1: elegir **Especialidad** (chips).
- Paso 2: elegir **Especialista** disponible en esa especialidad.
- Paso 3: elegir **Día/Horario** dentro de los **próximos 15 días**, en función de la disponibilidad del especialista.
- **Nota**: No se usa datepicker; se listan opciones válidas.

#### b. Mis turnos (Paciente)  
**Ruta**: `/paciente/mis-turnos`  
**Qué muestra**
- Tabla con Fecha, Hora, **Especialidad**, **Especialista**, **Estado** y **Acciones**.
- Filtro único por **Especialidad** o **Especialista** (texto).
- **Acciones (visibles según estado)**:
  - **Cancelar** (con motivo): visible si el turno **no** fue Realizado.
  - **Ver reseña**: visible si hay comentario del especialista.
  - **Completar encuesta**: visible si el especialista marcó el turno como **Realizado**.
  - **Calificar atención** (comentario del paciente): visible si el turno fue **Realizado**.

---

## Mi perfil (todos los roles)
**Ruta**: `/perfil`  
**Qué muestra**
- Avatar, Nombre/Apellido, Email, DNI, Edad.
- Para **Especialista**: chips con **todas** sus especialidades y acceso a **Mis horarios**.

---

## Estados y reglas (resumen)

| Actor        | Acción                       | Cuándo se muestra |
|--------------|------------------------------|-------------------|
| Paciente     | Cancelar                     | Si el turno **no** fue Realizado |
| Paciente     | Completar encuesta           | Si el turno fue **Realizado** |
| Paciente     | Calificar atención           | Si el turno fue **Realizado** |
| Paciente     | Ver reseña                   | Si hay reseña del especialista |
| Especialista | Aceptar                      | Si **no** está Realizado/Cancelado/Rechazado |
| Especialista | Rechazar (con motivo)       | Si **no** está Aceptado/Realizado/Cancelado |
| Especialista | Cancelar (con motivo)       | Si **no** está Aceptado/Realizado/Rechazado |
| Especialista | Finalizar (con reseña)      | Si está **Aceptado** |
| Especialista | Ver reseña                   | Si hay reseña |
| Admin        | Cancelar (admin/turnos)      | Si **no** está Aceptado/Realizado/Rechazado |
| Admin        | Aprobar/Desaprobar usuario   | Siempre |
| Admin        | Cambiar rol                  | Siempre |

---

## Estructura de datos (alto nivel)

- **profiles**: usuarios (nombre, apellido, email, dni, edad, obra_social, role, is_approved, avatar_url).
- **specialties**: catálogo de especialidades.
- **profile_specialty**: (profile_id, specialty_id) — *muchos a muchos*.
- **specialist_availability**: tramos de disponibilidad por especialista y especialidad.
- **appointments**: turnos (fecha, hora, estado, especialidad, especialista, paciente, comentarios/diagnóstico).
- **patient_survey / patient_feedback**: encuestas y calificaciones posteriores al turno.

---

## Accesos rápidos (rutas)

- `/login` – Iniciar sesión  
- `/registro` – Crear cuenta (con Captcha)  
- `/perfil` – Mi perfil (todos)  
- `/admin/usuarios` – Gestión de usuarios (Admin)  
- `/admin/turnos` – Turnos globales (Admin)  
- `/especialista` – Panel especialista  
- `/especialista/mis-turnos` – Turnos del especialista  
- `/especialista/mis-horarios` – Disponibilidad del especialista  
- `/turnos/solicitar` – Solicitud de turno (Paciente)  
- `/paciente/mis-turnos` – Turnos del paciente

---

## Consideraciones UI
- **Badges** de estado con colores (pendiente/aceptado/rechazado/cancelado/realizado).
- **Chips** para especialidades.
- **Botón Volver** en páginas internas, además del historial del navegador.
- **Acciones contextuales**: se muestran sólo si la regla de negocio lo permite.

---

## Notas finales
- La **asignación de especialidades** a especialistas es múltiple (relación N:N).  
- La **disponibilidad** se carga por **especialidad** y **día de semana**, con rango horario y slot en minutos.  
- La **generación de turnos** disponibles considera disponibilidad + próxima ventana de **15 días**.
