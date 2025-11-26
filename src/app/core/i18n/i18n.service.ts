import { Injectable, signal } from '@angular/core';

export type Lang = 'es' | 'en' | 'pt';

type Dict = Record<string, string>;

const ES: Dict = {
  // NAVBAR
  'nav.title': 'Clínica Online',
  'nav.login': 'Login',
  'nav.register': 'Registro',
  'nav.logout': 'Salir',
  'nav.profile': 'Mi perfil',
  'nav.users': 'Usuarios',

  // WELCOME / HOME
  'home.welcomeTitle': 'Bienvenido a la Clínica Online',
  'home.welcomeSubtitle':
    'Gestioná turnos, pacientes y especialistas de forma sencilla.',

  // LOGIN
  'login.title': 'Iniciar sesión',
  'login.email': 'Correo electrónico',
  'login.password': 'Contraseña',
  'login.submit': 'Ingresar',
  'login.goRegister': 'Crear cuenta',

  // REGISTER
  'register.title': 'Registro',
  'register.patient': 'Paciente',
  'register.specialist': 'Especialista',
  'register.name': 'Nombre',
  'register.lastname': 'Apellido',
  'register.age': 'Edad',
  'register.dni': 'DNI',
  'register.healthInsurance': 'Obra social',
  'register.submit': 'Crear cuenta',

  // TURNOS
  'turnos.requestTitle': 'Solicitar turno',
  'turnos.myAppointments': 'Mis turnos',
};

const EN: Dict = {
  'nav.title': 'Online Clinic',
  'nav.login': 'Login',
  'nav.register': 'Sign up',
  'nav.logout': 'Logout',
  'nav.profile': 'My profile',
  'nav.users': 'Users',

  'home.welcomeTitle': 'Welcome to the Online Clinic',
  'home.welcomeSubtitle':
    'Manage appointments, patients and specialists easily.',

  'login.title': 'Sign in',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.goRegister': 'Create account',

  'register.title': 'Sign up',
  'register.patient': 'Patient',
  'register.specialist': 'Specialist',
  'register.name': 'First name',
  'register.lastname': 'Last name',
  'register.age': 'Age',
  'register.dni': 'ID number',
  'register.healthInsurance': 'Health insurance',
  'register.submit': 'Create account',

  'turnos.requestTitle': 'Request appointment',
  'turnos.myAppointments': 'My appointments',
};

const PT: Dict = {
  'nav.title': 'Clínica Online',
  'nav.login': 'Entrar',
  'nav.register': 'Registrar-se',
  'nav.logout': 'Sair',
  'nav.profile': 'Meu perfil',
  'nav.users': 'Usuários',

  'home.welcomeTitle': 'Bem-vindo à Clínica Online',
  'home.welcomeSubtitle':
    'Gerencie consultas, pacientes e especialistas facilmente.',

  'login.title': 'Entrar',
  'login.email': 'E-mail',
  'login.password': 'Senha',
  'login.submit': 'Entrar',
  'login.goRegister': 'Criar conta',

  'register.title': 'Registro',
  'register.patient': 'Paciente',
  'register.specialist': 'Especialista',
  'register.name': 'Nome',
  'register.lastname': 'Sobrenome',
  'register.age': 'Idade',
  'register.dni': 'Documento',
  'register.healthInsurance': 'Convênio',
  'register.submit': 'Criar conta',

  'turnos.requestTitle': 'Solicitar consulta',
  'turnos.myAppointments': 'Minhas consultas',
};

const DICTS: Record<Lang, Dict> = { es: ES, en: EN, pt: PT };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private _lang = signal<Lang>('es');

  constructor() {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved && ['es', 'en', 'pt'].includes(saved)) {
      this._lang.set(saved);
    }
  }

  lang() {
    return this._lang();
  }

  setLang(lang: Lang) {
    this._lang.set(lang);
    localStorage.setItem('lang', lang);
  }

  t(key: string): string {
    const dict = DICTS[this._lang()] || {};
    return dict[key] ?? ES[key] ?? key;
  }
}
