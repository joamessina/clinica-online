# 🏥 Clínica Online

Aplicación web para gestión de **turnos**, **pacientes** y **especialistas**. Frontend en **Angular 19** y backend **Supabase** (Auth, Postgres, Storage & Edge Functions).  
Este README cubre **hasta lo implementado en el Sprint 2**.

---

## 👥 Roles y capacidades

### 👤 Paciente

- **Solicitar turno**: elegir **Especialidad → Especialista → día/hora** (en 15 días próximos).
- **Mis turnos**: ver solo sus turnos, **filtro único** por especialidad/especialista.
  - **Cancelar** (si _PENDIENTE_ o _ACEPTADO_) con **motivo**.
  - **Ver reseña** (si existe reseña del especialista).
  - **Completar encuesta** (si el especialista marcó como _REALIZADO_ y dejó reseña).
  - **Calificar atención** (si _REALIZADO_).

### 🩺 Especialista

- **Mis turnos**: ver turnos asignados, **filtro único** por especialidad/paciente.
  - **Aceptar** (si no está _REALIZADO_, _CANCELADO_ o _RECHAZADO_).
  - **Rechazar** (si no está _ACEPTADO_, _REALIZADO_ o _CANCELADO_) con **motivo**.
  - **Cancelar** (si no está _ACEPTADO_, _REALIZADO_ o _RECHAZADO_) con **motivo**.
  - **Finalizar** (si _ACEPTADO_) con **reseña** de la consulta.
  - **Ver reseña** (si existe).
- **Mis horarios**: carga de disponibilidad por **especialidad** (weekday, desde–hasta, tamaño de **slot**).

### 🛠️ Administrador

- **Usuarios**: aprobar/desaprobar especialistas, cambio de rol, alta manual (básico).
- **Turnos**: listado global con **filtro** y **cancelación** (si procede).

---

## 🔄 Flujo funcional principal

1. **Bienvenida** → enlaces a **Login** / **Registro**.
2. **Registro + reCAPTCHA** (Paciente o Especialista). Se valida el token vía `verify-recaptcha`.
3. **Login** → redirección al **panel** según rol.
4. **Solicitar turno (Paciente/Admin)**
   - Seleccionar **Especialidad** → **Especialista** → ver **slots disponibles** (próximos 15 días).
   - Confirmar; se crea turno en estado **PENDIENTE**.
5. **Gestión de turnos**
   - **Paciente**: cancelar / ver reseña / completar encuesta / calificar (según estado).
   - **Especialista**: aceptar / rechazar / cancelar / finalizar con reseña (según estado).
   - **Admin**: visualizar todos y cancelar cuando aplica.
6. **Perfil**
   - Datos del usuario; si es especialista, se listan **especialidades** y acceso a **Mis horarios**.

---

## 🧭 Navegación (rutas)

- **Públicas**

  - `/` → Bienvenida
  - `/login` | `/registro`

- **Paciente (auth)**

  - `/paciente` → Panel paciente
  - `/paciente/mis-turnos` → Mis turnos
  - `/turnos/solicitar` → Solicitar turno
  - `/perfil` → Mi perfil

- **Especialista (auth + rol)**

  - `/especialista` → Panel especialista
  - `/especialista/mis-turnos` → Mis turnos
  - `/especialista/mis-horarios` → Mis horarios
  - `/perfil` → Mi perfil

- **Admin (auth + rol)**
  - `/admin/usuarios` → Gestión de usuarios
  - `/admin/turnos` → Turnos de la clínica

> El **navbar** muestra “Mi perfil” y accesos contextuales según el rol.  
> Se agregaron **botones de volver** en vistas de detalle/listados.

---

## 🗓️ Estados del turno y acciones

| Estado    | Paciente                                   | Especialista                                            | Admin    |
| --------- | ------------------------------------------ | ------------------------------------------------------- | -------- |
| PENDIENTE | Cancelar (con motivo)                      | Aceptar / Rechazar (con motivo) / Cancelar (con motivo) | Cancelar |
| ACEPTADO  | Cancelar (con motivo)                      | Finalizar (carga de reseña)                             | —        |
| RECHAZADO | —                                          | —                                                       | —        |
| CANCELADO | —                                          | —                                                       | —        |
| REALIZADO | Ver reseña / Encuesta / Calificar atención | Ver reseña                                              | —        |

> En UI solo se muestran las **acciones permitidas** por estado/rol.

---
