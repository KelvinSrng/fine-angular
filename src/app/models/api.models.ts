// Interfaces que coinciden con tu estructura Laravel

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: any;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  rol: 'rrhh' | 'coordinador_academico';
  sede: string;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  user: {
    name: string;
    email: string;
    rol: 'rrhh' | 'coordinador_academico';
    sede: string;
  };
  token: string;
}

export interface Docente {
  id: number;
  nombres: string;
  tipo_contrato: 'ocasional' | 'contratado';
  modalidad: string;
  otra_empleadora: boolean;
  horas_contrato?: number;
  horarios_lunes_viernes?: string;
  horarios_sabado?: string;
  programas?: string;
  created_at: string;
  updated_at: string;
}

export interface Componente {
  id: number;
  nombre: string;
  paralelo: string;
  aula_id: number;
  horario: string;
  modalidad: string;
  descripcion?: string;
  capacidad_ofertada: number;
  created_at: string;
  updated_at: string;
  // Relaciones
  aula?: Aula;
  asignaciones?: Asignacion[];
}

export interface Aula {
  id: number;
  numero: string;
  ubicacion: string;
  capacidad: number;
  created_at: string;
  updated_at: string;
  // Relaciones
  componentes?: Componente[];
}

export interface Asignacion {
  id: number;
  docente_id: number;
  componente_id: number;
  horario: string;
  dia: string;
  modalidad: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  docente?: Docente;
  componente?: Componente;
}

export interface SugerenciaAsignacion {
  docente: string;
  componente: string;
  modalidad: string;
  horario: string;
  aula: string;
  dia: string;
}

// Para importaciones
export interface ImportResult {
  success: boolean;
  message: string;
  imported_count?: number;
  errors?: string[];
  failed_rows?: any[];
}