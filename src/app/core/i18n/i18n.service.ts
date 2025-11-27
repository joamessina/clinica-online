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
  'welcome.hero.title': 'Clínica Online',
  'welcome.hero.subtitle':
    'Plataforma centralizada para gestionar turnos, historias clínicas y la agenda de tus profesionales desde cualquier dispositivo.',
  'welcome.hero.login': 'Ingresar',
  'welcome.hero.register': 'Registrarse',
  'welcome.hero.subtext':
    'Pensado para instituciones que necesitan ordenar turnos, reducir tiempos administrativos y ofrecer una mejor experiencia a pacientes y especialistas.',

  'welcome.features.title': 'Todo tu consultorio en un solo lugar',
  'welcome.features.item1.title': 'Turnos online',
  'welcome.features.item1.text':
    'con gestión por rol: pacientes, especialistas y administradores.',
  'welcome.features.item2.title': 'Historia clínica digital',
  'welcome.features.item2.text':
    'accesible para el profesional, con seguimiento de cada consulta.',
  'welcome.features.item3.title': 'Accesos seguros',
  'welcome.features.item3.text':
    'y aprobación de especialistas para resguardar la información del paciente.',

  'welcome.intro.title': 'Una clínica moderna, centrada en el paciente',
  'welcome.intro.p1':
    'Clínica Online integra en una única plataforma la administración de turnos, la gestión de profesionales y el acceso a la historia clínica digital. Cada usuario ingresa con su perfil y visualiza únicamente la información que necesita.',
  'welcome.intro.p2':
    'Los administradores pueden aprobar especialistas, revisar estadísticas y exportar datos; mientras que los pacientes gestionan sus turnos y consultan sus atenciones sin depender de llamados telefónicos.',

  'welcome.intro.list1.title': 'Menos tareas manuales:',
  'welcome.intro.list1.text': 'automatizá la carga y el seguimiento de turnos.',
  'welcome.intro.list2.title': 'Mayor trazabilidad:',
  'welcome.intro.list2.text':
    'cada consulta queda registrada en la historia clínica.',
  'welcome.intro.list3.title': 'Experiencia unificada:',
  'welcome.intro.list3.text':
    'pacientes, personal administrativo y especialistas trabajan sobre la misma información.',

  'welcome.benefits.title': 'Beneficios para tu institución',
  'welcome.benefits.metric1.label': 'Gestión de agenda',
  'welcome.benefits.metric1.value': 'Turnos claros y ordenados',
  'welcome.benefits.metric2.label': 'Pacientes informados',
  'welcome.benefits.metric2.value': 'Menos llamadas y consultas',
  'welcome.benefits.metric3.label': 'Información centralizada',
  'welcome.benefits.metric3.value': 'Datos siempre disponibles',
  'welcome.benefits.footer':
    'Esta instancia de Clínica Online se utiliza con fines académicos, simulando el flujo real de una institución sanitaria moderna.',

  // LOGIN
  'login.title': 'Iniciar sesión',
  'login.email': 'Correo electrónico',
  'login.password': 'Contraseña',
  'login.submit': 'Ingresar',
  'login.goRegister': 'Crear cuenta',
  'login.subtitle':
    'Accedé a tu panel de paciente, especialista o administrador.',
  'login.quick.title': 'Accesos rápidos para pruebas',
  'login.registerHint.before':
    'Si aún no tenés cuenta, podés registrarte desde la opción',
  'login.registerHint.after': 'en la parte superior.',

  'login.error.pending': 'Tu cuenta está pendiente de aprobación.',
  'login.error.credentials': 'Email o contraseña incorrectos.',
  'login.error.generic': 'No pudimos iniciar sesión. Intentá nuevamente.',

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
  'register.invalid.name.required': 'Nombre obligatorio.',
  'register.invalid.lastname.required': 'Apellido obligatorio.',
  'register.invalid.age.required': 'Edad obligatoria.',
  'register.invalid.age.min': 'Debe ser mayor a 0.',
  'register.invalid.dni.required': 'DNI obligatorio.',
  'register.invalid.health.required': 'Obra social obligatoria.',
  'register.invalid.email.required': 'Email obligatorio.',
  'register.invalid.email.format': 'Ingresá un email válido.',
  'register.invalid.password.required': 'Contraseña obligatoria.',
  'register.invalid.password.min': 'Mínimo 6 caracteres.',
  'register.helper.password': 'Mínimo 6–8 caracteres recomendados.',

  'register.images.patient.title': 'Imágenes de perfil (obligatorio)',
  'register.images.patient.front': 'Frente',
  'register.images.patient.frontError': 'Subí la imagen frontal.',
  'register.images.patient.side': 'Perfil / adicional',
  'register.images.patient.sideError': 'Subí la imagen adicional.',

  'register.images.specialist.title': 'Imagen de perfil',
  'register.specialties.label': 'Especialidades',
  'register.specialties.placeholder': 'Seleccioná una o varias especialidades',
  'register.specialties.addPlaceholder': 'Agregar nueva especialidad',
  'register.specialties.addButton': 'Agregar',
  'register.specialties.helperOnce':
    'Las especialidades nuevas se usan solo para este registro.',
  'register.specialties.helperMulti':
    'Podés seleccionar una o varias especialidades marcando las casillas.',

  'register.captcha.label': 'Captcha',
  'register.captcha.helper': 'Marcá la casilla "No soy un robot".',

  'register.footer':
    'Al registrarte aceptás nuestros términos y el tratamiento de datos personales.',

  'register.error.nameRequired': 'Nombre requerido',
  'register.error.lastnameRequired': 'Apellido requerido',
  'register.error.ageInvalid': 'Edad inválida',
  'register.error.dniInvalid': 'DNI inválido',
  'register.error.emailInvalid': 'Email inválido',
  'register.error.passwordMin': 'Contraseña mínima 6 caracteres',
  'register.error.healthRequired': 'Obra social requerida',
  'register.error.photosPatient': 'Pacientes: subí 2 imágenes de perfil',
  'register.error.specialtyRequired': 'Elegí al menos una especialidad',
  'register.error.photoSpecialistRequired':
    'Especialistas: subí una imagen de perfil',
  'register.error.chooseRole': 'Elegí un perfil.',
  'register.error.captchaRequired': 'Completá el captcha.',
  'register.error.captchaInvalid': 'Captcha inválido. Intentá nuevamente.',
  'register.error.prepare': 'No se pudo preparar el registro.',
  'register.error.dniCheck': 'No se pudo validar el DNI. Intentá de nuevo.',
  'register.error.dniTaken': 'Ese DNI ya está registrado.',
  'register.error.newSpecialtyEmpty':
    'Escribí el nombre de la nueva especialidad.',
  'register.success.newSpecialtyAdded': 'Especialidad agregada a tu selección.',
  'register.success.signupEmail':
    'Te enviamos un correo para confirmar la cuenta. Luego iniciá sesión para completar el perfil.',

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

  'welcome.hero.title': 'Online Clinic',
  'welcome.hero.subtitle':
    "Centralized platform to manage appointments, medical records and your professionals' schedule from any device.",
  'welcome.hero.login': 'Sign in',
  'welcome.hero.register': 'Register',
  'welcome.hero.subtext':
    'Designed for institutions that need to organize appointments, reduce admin time and offer a better experience to patients and specialists.',

  'welcome.features.title': 'Your entire practice in one place',
  'welcome.features.item1.title': 'Online appointments',
  'welcome.features.item1.text':
    'with role-based management: patients, specialists and administrators.',
  'welcome.features.item2.title': 'Digital medical record',
  'welcome.features.item2.text':
    'accessible to the professional, with traceability for every consultation.',
  'welcome.features.item3.title': 'Secure access',
  'welcome.features.item3.text':
    "with specialist approval and protections for the patient's information.",

  'welcome.intro.title': 'A modern clinic, focused on the patient',
  'welcome.intro.p1':
    'Online Clinic brings together appointment scheduling, professional management and access to the digital medical record in a single platform. Each user signs in with their profile and sees only the information they need.',
  'welcome.intro.p2':
    'Administrators can approve specialists, review statistics and export data, while patients manage their appointments and review their visits without depending on phone calls.',

  'welcome.intro.list1.title': 'Fewer manual tasks:',
  'welcome.intro.list1.text': 'automate appointment creation and follow-up.',
  'welcome.intro.list2.title': 'More traceability:',
  'welcome.intro.list2.text':
    'each consultation is recorded in the medical history.',
  'welcome.intro.list3.title': 'Unified experience:',
  'welcome.intro.list3.text':
    'patients, admin staff and specialists work on the same information.',

  'welcome.benefits.title': 'Benefits for your institution',
  'welcome.benefits.metric1.label': 'Schedule management',
  'welcome.benefits.metric1.value': 'Clear and organized appointments',
  'welcome.benefits.metric2.label': 'Informed patients',
  'welcome.benefits.metric2.value': 'Fewer calls and queries',
  'welcome.benefits.metric3.label': 'Centralized information',
  'welcome.benefits.metric3.value': 'Data always available',
  'welcome.benefits.footer':
    'This Online Clinic instance is used for academic purposes, simulating the real flow of a modern healthcare institution.',

  'login.title': 'Sign in',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.goRegister': 'Create account',
  'login.subtitle': 'Access your patient, specialist or admin dashboard.',
  'login.quick.title': 'Quick access for testing',
  'login.registerHint.before':
    "If you don't have an account yet, you can register using the",
  'login.registerHint.after': 'option at the top.',

  'login.error.pending': 'Your account is pending approval.',
  'login.error.credentials': 'Incorrect email or password.',
  'login.error.generic': "We couldn't sign you in. Please try again.",

  'register.title': 'Sign up',
  'register.patient': 'Patient',
  'register.specialist': 'Specialist',
  'register.name': 'First name',
  'register.lastname': 'Last name',
  'register.age': 'Age',
  'register.dni': 'ID number',
  'register.healthInsurance': 'Health insurance',
  'register.submit': 'Create account',
  'register.invalid.name.required': 'First name is required.',
  'register.invalid.lastname.required': 'Last name is required.',
  'register.invalid.age.required': 'Age is required.',
  'register.invalid.age.min': 'Must be greater than 0.',
  'register.invalid.dni.required': 'ID number is required.',
  'register.invalid.health.required': 'Health insurance is required.',
  'register.invalid.email.required': 'Email is required.',
  'register.invalid.email.format': 'Enter a valid email address.',
  'register.invalid.password.required': 'Password is required.',
  'register.invalid.password.min': 'Minimum 6 characters.',
  'register.helper.password': 'We recommend at least 6–8 characters.',

  'register.images.patient.title': 'Profile images (required)',
  'register.images.patient.front': 'Front',
  'register.images.patient.frontError': 'Upload the front image.',
  'register.images.patient.side': 'Profile / additional',
  'register.images.patient.sideError': 'Upload the additional image.',

  'register.images.specialist.title': 'Profile image',
  'register.specialties.label': 'Specialties',
  'register.specialties.placeholder': 'Select one or more specialties',
  'register.specialties.addPlaceholder': 'Add new specialty',
  'register.specialties.addButton': 'Add',
  'register.specialties.helperOnce':
    'New specialties are only created for this registration.',
  'register.specialties.helperMulti':
    'You can select one or several specialties by checking the boxes.',

  'register.captcha.label': 'Captcha',
  'register.captcha.helper': 'Check the "I am not a robot" box.',

  'register.footer':
    'By registering you accept our terms and data processing policy.',

  'register.error.nameRequired': 'First name is required.',
  'register.error.lastnameRequired': 'Last name is required.',
  'register.error.ageInvalid': 'Invalid age.',
  'register.error.dniInvalid': 'Invalid ID number.',
  'register.error.emailInvalid': 'Invalid email address.',
  'register.error.passwordMin': 'Password must be at least 6 characters.',
  'register.error.healthRequired': 'Health insurance is required.',
  'register.error.photosPatient': 'Patients: upload 2 profile images.',
  'register.error.specialtyRequired': 'Choose at least one specialty.',
  'register.error.photoSpecialistRequired':
    'Specialists: upload a profile image.',
  'register.error.chooseRole': 'Choose a role.',
  'register.error.captchaRequired': 'Complete the captcha.',
  'register.error.captchaInvalid': 'Invalid captcha. Please try again.',
  'register.error.prepare': 'We could not prepare the registration.',
  'register.error.dniCheck': 'We could not validate the ID. Please try again.',
  'register.error.dniTaken': 'That ID is already registered.',
  'register.error.newSpecialtyEmpty': 'Enter the name of the new specialty.',
  'register.success.newSpecialtyAdded': 'Specialty added to your selection.',
  'register.success.signupEmail':
    'We sent you an email to confirm your account. Then sign in to complete your profile.',

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

  'welcome.hero.title': 'Clínica Online',
  'welcome.hero.subtitle':
    'Plataforma centralizada para gerenciar consultas, prontuários e a agenda dos profissionais em qualquer dispositivo.',
  'welcome.hero.login': 'Entrar',
  'welcome.hero.register': 'Cadastrar-se',
  'welcome.hero.subtext':
    'Pensada para instituições que precisam organizar consultas, reduzir o tempo administrativo e oferecer uma melhor experiência para pacientes e especialistas.',

  'welcome.features.title': 'Todo o consultório em um só lugar',
  'welcome.features.item1.title': 'Consultas on-line',
  'welcome.features.item1.text':
    'com gestão por perfil: pacientes, especialistas e administradores.',
  'welcome.features.item2.title': 'Prontuário eletrônico',
  'welcome.features.item2.text':
    'acessível ao profissional, com acompanhamento de cada consulta.',
  'welcome.features.item3.title': 'Acessos seguros',
  'welcome.features.item3.text':
    'e aprovação de especialistas para proteger as informações do paciente.',

  'welcome.intro.title': 'Uma clínica moderna, focada no paciente',
  'welcome.intro.p1':
    'A Clínica Online integra em uma única plataforma o agendamento de consultas, a gestão de profissionais e o acesso ao prontuário eletrônico. Cada usuário entra com seu perfil e vê apenas as informações de que precisa.',
  'welcome.intro.p2':
    'Os administradores podem aprovar especialistas, revisar estatísticas e exportar dados; enquanto os pacientes gerenciam suas consultas e acompanham seus atendimentos sem depender de ligações telefônicas.',

  'welcome.intro.list1.title': 'Menos tarefas manuais:',
  'welcome.intro.list1.text':
    'automatize o registro e o acompanhamento das consultas.',
  'welcome.intro.list2.title': 'Mais rastreabilidade:',
  'welcome.intro.list2.text': 'cada atendimento fica registrado no prontuário.',
  'welcome.intro.list3.title': 'Experiência unificada:',
  'welcome.intro.list3.text':
    'pacientes, equipe administrativa e especialistas trabalham sobre as mesmas informações.',

  'welcome.benefits.title': 'Benefícios para a sua instituição',
  'welcome.benefits.metric1.label': 'Gestão de agenda',
  'welcome.benefits.metric1.value': 'Consultas claras e organizadas',
  'welcome.benefits.metric2.label': 'Pacientes informados',
  'welcome.benefits.metric2.value': 'Menos ligações e dúvidas',
  'welcome.benefits.metric3.label': 'Informação centralizada',
  'welcome.benefits.metric3.value': 'Dados sempre disponíveis',
  'welcome.benefits.footer':
    'Esta instância da Clínica Online é utilizada para fins acadêmicos, simulando o fluxo real de uma instituição de saúde moderna.',

  'login.title': 'Entrar',
  'login.email': 'E-mail',
  'login.password': 'Senha',
  'login.submit': 'Entrar',
  'login.goRegister': 'Criar conta',
  'login.subtitle':
    'Acesse seu painel de paciente, especialista ou administrador.',
  'login.quick.title': 'Acessos rápidos para testes',
  'login.registerHint.before':
    'Se você ainda não tem conta, pode se registrar pela opção',
  'login.registerHint.after': 'no topo da página.',

  'login.error.pending': 'Sua conta está pendente de aprovação.',
  'login.error.credentials': 'E-mail ou senha incorretos.',
  'login.error.generic': 'Não foi possível iniciar a sessão. Tente novamente.',

  'register.title': 'Registro',
  'register.patient': 'Paciente',
  'register.specialist': 'Especialista',
  'register.name': 'Nome',
  'register.lastname': 'Sobrenome',
  'register.age': 'Idade',
  'register.dni': 'Documento',
  'register.healthInsurance': 'Convênio',
  'register.submit': 'Criar conta',
  'register.invalid.name.required': 'Nome obrigatório.',
  'register.invalid.lastname.required': 'Sobrenome obrigatório.',
  'register.invalid.age.required': 'Idade obrigatória.',
  'register.invalid.age.min': 'Deve ser maior que 0.',
  'register.invalid.dni.required': 'Documento obrigatório.',
  'register.invalid.health.required': 'Convênio obrigatório.',
  'register.invalid.email.required': 'E-mail obrigatório.',
  'register.invalid.email.format': 'Informe um e-mail válido.',
  'register.invalid.password.required': 'Senha obrigatória.',
  'register.invalid.password.min': 'Mínimo de 6 caracteres.',
  'register.helper.password': 'Recomendamos pelo menos 6–8 caracteres.',

  'register.images.patient.title': 'Imagens de perfil (obrigatório)',
  'register.images.patient.front': 'Frente',
  'register.images.patient.frontError': 'Envie a imagem de frente.',
  'register.images.patient.side': 'Perfil / adicional',
  'register.images.patient.sideError': 'Envie a imagem adicional.',

  'register.images.specialist.title': 'Imagem de perfil',
  'register.specialties.label': 'Especialidades',
  'register.specialties.placeholder': 'Selecione uma ou várias especialidades',
  'register.specialties.addPlaceholder': 'Adicionar nova especialidade',
  'register.specialties.addButton': 'Adicionar',
  'register.specialties.helperOnce':
    'As novas especialidades são usadas apenas neste registro.',
  'register.specialties.helperMulti':
    'Você pode selecionar uma ou várias especialidades marcando as caixas.',

  'register.captcha.label': 'Captcha',
  'register.captcha.helper': 'Marque a caixa "Não sou um robô".',

  'register.footer':
    'Ao se registrar, você aceita nossos termos e o tratamento de dados pessoais.',

  'register.error.nameRequired': 'Nome obrigatório.',
  'register.error.lastnameRequired': 'Sobrenome obrigatório.',
  'register.error.ageInvalid': 'Idade inválida.',
  'register.error.dniInvalid': 'Documento inválido.',
  'register.error.emailInvalid': 'E-mail inválido.',
  'register.error.passwordMin': 'A senha deve ter no mínimo 6 caracteres.',
  'register.error.healthRequired': 'Convênio obrigatório.',
  'register.error.photosPatient': 'Pacientes: envie 2 imagens de perfil.',
  'register.error.specialtyRequired': 'Escolha pelo menos uma especialidade.',
  'register.error.photoSpecialistRequired':
    'Especialistas: envie uma imagem de perfil.',
  'register.error.chooseRole': 'Escolha um perfil.',
  'register.error.captchaRequired': 'Complete o captcha.',
  'register.error.captchaInvalid': 'Captcha inválido. Tente novamente.',
  'register.error.prepare': 'Não foi possível preparar o registro.',
  'register.error.dniCheck':
    'Não foi possível validar o documento. Tente novamente.',
  'register.error.dniTaken': 'Esse documento já está registrado.',
  'register.error.newSpecialtyEmpty': 'Digite o nome da nova especialidade.',
  'register.success.newSpecialtyAdded':
    'Especialidade adicionada à sua seleção.',
  'register.success.signupEmail':
    'Enviamos um e-mail para confirmar a conta. Depois, faça login para completar o perfil.',

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

  t = (key: string): string => {
    const dict = DICTS[this._lang()] || {};
    return dict[key] ?? ES[key] ?? key;
  };
}
