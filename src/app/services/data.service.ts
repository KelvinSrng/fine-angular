import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, combineLatest, forkJoin } from 'rxjs';
import { DocenteService } from './docente.service';
import { ApiService } from './api.service';
import { Docente, Componente, Aula, Asignacion } from '../models/api.models';

export interface Teacher {
  id: number;
  nombre: string;
  disponibilidad: string[];
  grupos: number;
  tipo_contrato: string;
  modalidad: string;
}

export interface Classroom {
  id: string;
  numero: string;
  ubicacion: string;
  capacidad: number;
}

export interface Program {
  id: number;
  nombre: string;
  paralelo: string;
  modalidad: string;
  capacidad: number;
}

export interface Schedule {
  id?: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  aula: string;
  docente: string;
  paralelo: string;
  programa?: string;
  modalidad?: string;
  componente_id?: number;
  capacidad?: number;
  descripcion?: string;
}

export interface Conflict {
  id: number;
  type: string;
  message: string;
  schedules: Schedule[];
  suggestion: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private teachersSubject = new BehaviorSubject<Teacher[]>([]);
  private classroomsSubject = new BehaviorSubject<Classroom[]>([]);
  private programsSubject = new BehaviorSubject<Program[]>([]);
  private schedulesSubject = new BehaviorSubject<Schedule[]>([]);
  private docentesSubject = new BehaviorSubject<Docente[]>([]);
  private aulasSubject = new BehaviorSubject<Aula[]>([]);
  private componentesSubject = new BehaviorSubject<Componente[]>([]);
  private asignacionesSubject = new BehaviorSubject<Asignacion[]>([]);

  constructor(
    private docenteService: DocenteService,
    private apiService: ApiService
  ) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    // Cargar docentes
    this.docenteService.getDocentes().subscribe({
      next: (docentes) => {
        this.docentesSubject.next(docentes);
        
        const teachers: Teacher[] = docentes.map(docente => ({
          id: docente.id,
          nombre: docente.nombres,
          disponibilidad: this.parseHorarios(docente.horarios_lunes_viernes, docente.horarios_sabado),
          grupos: 0,
          tipo_contrato: docente.tipo_contrato,
          modalidad: docente.modalidad
        }));
        this.teachersSubject.next(teachers);
        
        // Actualizar conteo de grupos basado en asignaciones
        this.updateTeacherGroupCounts();
      },
      error: (error) => {
        console.error('Error loading docentes:', error);
        this.docentesSubject.next([]);
        this.teachersSubject.next([]);
      }
    });

    // Cargar aulas
    this.apiService.getAulas().subscribe({
      next: (aulas) => {
        this.aulasSubject.next(aulas);
        
        const classrooms: Classroom[] = aulas.map(aula => ({
          id: aula.numero,
          numero: aula.numero,
          ubicacion: aula.ubicacion,
          capacidad: aula.capacidad
        }));
        this.classroomsSubject.next(classrooms);
      },
      error: (error) => {
        console.error('Error loading aulas:', error);
        this.aulasSubject.next([]);
        this.classroomsSubject.next([]);
      }
    });

    // Cargar componentes
    this.apiService.getComponentes().subscribe({
      next: (componentes) => {
        this.componentesSubject.next(componentes);
        
        const programs: Program[] = componentes.map(componente => ({
          id: componente.id,
          nombre: componente.nombre,
          paralelo: componente.paralelo,
          modalidad: componente.modalidad,
          capacidad: componente.capacidad_ofertada
        }));
        this.programsSubject.next(programs);
      },
      error: (error) => {
        console.error('Error loading componentes:', error);
        this.componentesSubject.next([]);
        this.programsSubject.next([]);
      }
    });

    // Cargar asignaciones y convertir a horarios
    this.apiService.getAsignaciones().subscribe({
      next: (asignaciones) => {
        this.asignacionesSubject.next(asignaciones);
        
        const schedules: Schedule[] = asignaciones.map(asignacion => {
          const horario = this.parseHorario(asignacion.horario);
          return {
            id: asignacion.id,
            dia: asignacion.dia,
            hora_inicio: horario.inicio,
            hora_fin: horario.fin,
            aula: asignacion.componente?.aula?.numero || `${asignacion.componente?.aula_id}`,
            docente: asignacion.docente?.nombres || '',
            paralelo: asignacion.componente?.paralelo || '',
            programa: asignacion.componente?.nombre || '',
            modalidad: asignacion.modalidad
          };
        });
        this.schedulesSubject.next(schedules);
        
        // Actualizar conteo de grupos después de cargar asignaciones
        this.updateTeacherGroupCounts();
      },
      error: (error) => {
        console.error('Error loading asignaciones:', error);
        this.asignacionesSubject.next([]);
        this.schedulesSubject.next([]);
      }
    });
  }

  // Métodos para acceder a datos originales de la API
  getDocentes(): Observable<Docente[]> {
    return this.docentesSubject.asObservable();
  }

  getAulas(): Observable<Aula[]> {
    return this.aulasSubject.asObservable();
  }

  getComponentes(): Observable<Componente[]> {
    return this.componentesSubject.asObservable();
  }

  getAsignaciones(): Observable<Asignacion[]> {
    return this.asignacionesSubject.asObservable();
  }

  // Método para obtener horarios con información completa
  getSchedulesWithDetails(): Observable<Schedule[]> {
    return combineLatest([
      this.getComponentes(),
      this.getDocentes(),
      this.getAulas()
    ]).pipe(
      map(([componentes, docentes, aulas]) => {
        // Crear horarios basados en los componentes existentes
        const schedules: Schedule[] = [];
        
        componentes.forEach(componente => {
          const aula = aulas.find(a => a.id === componente.aula_id);
          
          // Parsear el horario del componente
          const horario = this.parseHorario(componente.horario || '08:00-10:00');
          
          // Crear horarios para cada día de la semana (ejemplo)
          const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
          
          dias.forEach(dia => {
            // Asignar un docente disponible (por ahora el primero disponible)
            const docenteAsignado = docentes.find(d => d.modalidad === componente.modalidad) || docentes[0];
            
            if (docenteAsignado) {
              schedules.push({
                id: componente.id * 10 + dias.indexOf(dia), // ID único
                dia: dia,
                hora_inicio: horario.inicio,
                hora_fin: horario.fin,
                aula: aula?.numero || `Aula ${componente.aula_id}`,
                docente: docenteAsignado.nombres,
                paralelo: componente.paralelo,
                programa: componente.nombre,
                modalidad: componente.modalidad,
                componente_id: componente.id,
                capacidad: componente.capacidad_ofertada,
                descripcion: componente.descripcion || ''
              });
            }
          });
        });
        
        return schedules;
      })
    );
  }

  // Método alternativo usando asignaciones reales si existen
    getSchedulesFromAssignments(): Observable<Schedule[]> {
    console.log('=== ENTRANDO A getSchedulesFromAssignments() ===');
    return combineLatest([
      this.getDocentes(),
      this.getComponentes(),
      this.getAulas()
    ]).pipe(
      map(([docentes, componentes, aulas]) => {
        console.log('=== INICIO DE GENERACIÓN DE HORARIOS ===');
        console.log('Docentes encontrados:', docentes.length);
        console.log('Componentes encontrados:', componentes.length);
        console.log('Aulas encontradas:', aulas.length);
        
        // Mostrar información de componentes y aulas
        console.log('=== INFORMACIÓN DE COMPONENTES ===');
        componentes.forEach((componente, index) => {
          console.log(`${index + 1}. ${componente.nombre} - Paralelo: ${componente.paralelo} - Aula: ${componente.aula_id} - Horario: ${componente.horario}`);
        });
        
        console.log('=== INFORMACIÓN DE AULAS ===');
        aulas.forEach((aula, index) => {
          console.log(`${index + 1}. Aula ${aula.numero} - Ubicación: ${aula.ubicacion} - Capacidad: ${aula.capacidad}`);
        });
        
        const schedules: Schedule[] = [];
        
        // Generar horarios basados en los componentes reales
        console.log('=== GENERANDO HORARIOS DESDE COMPONENTES ===');
        console.log('Componentes disponibles:', componentes.map(c => `${c.nombre} (${c.paralelo})`));
        console.log('Docentes disponibles:', docentes.map(d => `${d.nombres} - Programas: ${d.programas}`));
        // Mantener un registro de docentes ya asignados para evitar duplicados
        const docentesAsignadosAComponentes = new Set<string>();
        
        componentes.forEach(componente => {
          console.log(`\n=== Procesando componente: ${componente.nombre} - Paralelo: ${componente.paralelo} ===`);
          
          if (componente.horario) {
            const [inicio, fin] = componente.horario.split(' - ');
            
            // Buscar el aula correspondiente
            const aula = aulas.find(a => a.id === componente.aula_id);
            const numeroAula = aula ? aula.numero : 'Aula no encontrada';
            
            // Buscar docente que puede enseñar el componente
            let docenteAsignado = null;
            let componenteEncontrado = false;
            
            for (const docente of docentes) {
              // Evitar asignar docentes que ya están asignados a otros componentes
              if (docentesAsignadosAComponentes.has(docente.nombres)) {
                console.log(`Docente ${docente.nombres} ya está asignado a otro componente, saltando...`);
                continue;
              }
              
              if (!docente.programas) continue;
              
              console.log(`\n--- Buscando docente para componente: ${componente.nombre} ---`);
              console.log(`Docente: ${docente.nombres}`);
              console.log(`Programas del docente: ${docente.programas}`);
              
              // Comparar cada programa del docente con todos los componentes disponibles
              const programasDocente = docente.programas.toLowerCase();
              const programasIndividuales = this.extraerProgramasIndividuales(programasDocente);
              
              for (const programa of programasIndividuales) {
                console.log(`Comparando programa: "${programa}" con componente: "${componente.nombre}"`);
                
                // Comparar con el componente actual
                if (this.coincidePrograma(componente.nombre.toLowerCase(), programa)) {
                  docenteAsignado = docente;
                  componenteEncontrado = true;
                  docentesAsignadosAComponentes.add(docente.nombres); // Marcar como asignado
                  console.log(`✓ Docente encontrado: ${docente.nombres} para componente: ${componente.nombre} (programa: ${programa})`);
                  break;
                }
              }
              
              if (componenteEncontrado) break;
            }
            
            const nombreDocente = componenteEncontrado ? docenteAsignado!.nombres : 'Componente no encontrado';
            
            console.log(`Componente: ${componente.nombre}`);
            console.log(`Docente encontrado: ${nombreDocente}`);
            if (docenteAsignado) {
              console.log(`Programas del docente: ${docenteAsignado.programas}`);
            }
            
            // Determinar los días basados en la disponibilidad del docente asignado
            let dias: string[] = [];
            
            if (docenteAsignado) {
              // Si hay docente asignado, usar su disponibilidad
              dias = this.getDiasDisponibles(docenteAsignado);
              console.log(`Días disponibles del docente ${docenteAsignado.nombres}:`, dias);
            } else {
              // Si no hay docente asignado, usar días por defecto
              dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
              console.log('No hay docente asignado, usando días por defecto:', dias);
            }
            
            dias.forEach(dia => {
              const schedule = {
                id: componente.id,
                dia: dia,
                hora_inicio: inicio,
                hora_fin: fin,
                aula: numeroAula,
                docente: nombreDocente,
                paralelo: componente.paralelo, // Usar el paralelo del componente
                programa: componente.nombre,
                modalidad: componente.modalidad || 'presencial',
                componente_id: componente.id,
                capacidad: componente.capacidad_ofertada || 0,
                descripcion: componente.descripcion || ''
              };
              
              schedules.push(schedule);
              console.log(`✓ Creado horario: ${dia} ${inicio}-${fin} para ${componente.nombre} - Paralelo: ${componente.paralelo} - Aula: ${numeroAula} - Docente: ${nombreDocente}`);
            });
          } else {
            console.log(`✗ ${componente.nombre} no tiene horario asignado`);
          }
        });
        
        // Generar horarios para docentes que no están asignados a componentes específicos
        console.log('=== GENERANDO HORARIOS PARA DOCENTES NO ASIGNADOS ===');
        
        const docentesAsignados = new Set(schedules.map(s => s.docente));
        console.log('Docentes ya asignados a componentes:', Array.from(docentesAsignados));
        
        docentes.forEach(docente => {
          // Solo procesar docentes que no están asignados a componentes
          if (!docentesAsignados.has(docente.nombres)) {
            console.log(`\n=== Procesando docente no asignado: ${docente.nombres} ===`);
            
            if (docente.horarios_lunes_viernes || docente.horarios_sabado) {
              const disponibilidad = this.parseHorarios(docente.horarios_lunes_viernes, docente.horarios_sabado);
              const diasDisponibles = this.getDiasDisponibles(docente);
              
              console.log(`Disponibilidad de ${docente.nombres}:`, disponibilidad);
              console.log(`Días disponibles de ${docente.nombres}:`, diasDisponibles);
              
              disponibilidad.forEach(horario => {
                const [inicio, fin] = horario.split(' - ');
                
                diasDisponibles.forEach(dia => {
                  // Asignar aula disponible
                  const aulaDisponible = aulas.length > 0 ? aulas[0].numero : 'Sin aula';
                  
                  const schedule = {
                    id: docente.id,
                    dia: dia,
                    hora_inicio: inicio,
                    hora_fin: fin,
                    aula: aulaDisponible,
                    docente: docente.nombres,
                    paralelo: 'Disponible', // Indicar que está disponible
                    programa: docente.programas || 'Sin asignar',
                    modalidad: docente.modalidad || 'presencial',
                    componente_id: 0,
                    capacidad: 0,
                    descripcion: 'Horario disponible del docente'
                  };
                  
                  schedules.push(schedule);
                  console.log(`✓ Creado horario disponible: ${dia} ${inicio}-${fin} para ${docente.nombres} - Aula: ${aulaDisponible}`);
                });
              });
            } else {
              console.log(`✗ ${docente.nombres} no tiene horarios asignados`);
            }
          } else {
            console.log(`✓ ${docente.nombres} ya está asignado a componentes`);
          }
        });
        
        console.log('Total de schedules generados:', schedules.length);
        
        // Mostrar resumen final
        console.log('=== RESUMEN FINAL ===');
        console.log('Total de schedules generados:', schedules.length);
        console.log('Componentes procesados:', componentes.length);
        console.log('Aulas utilizadas:', [...new Set(schedules.map(s => s.aula))]);
        console.log('Paralelos utilizados:', [...new Set(schedules.map(s => s.paralelo))]);
        console.log('=== FIN DE GENERACIÓN DE HORARIOS ===');
        console.log('=== SALIENDO DE getSchedulesFromAssignments() ===');
        
        // ACTUALIZAR EL SUBJECT CON LOS HORARIOS GENERADOS
        console.log('=== ACTUALIZANDO SCHEDULES SUBJECT ===');
        this.schedulesSubject.next(schedules);
        console.log('Subject actualizado con', schedules.length, 'schedules');
        
        return schedules;
      })
    );
  }

  private updateTeacherGroupCounts(): void {
    const teachers = this.teachersSubject.value;
    const schedules = this.schedulesSubject.value;
    
    teachers.forEach(teacher => {
      const teacherSchedules = schedules.filter(s => s.docente === teacher.nombre);
      teacher.grupos = new Set(teacherSchedules.map(s => s.paralelo)).size;
    });
    
    this.teachersSubject.next([...teachers]);
  }

  private parseHorarios(lunesViernes?: string, sabado?: string): string[] {
    const horarios: string[] = [];
    
    if (lunesViernes) {
      // Parsear horarios de lunes a viernes
      // El formato puede ser "14:00:00 18:00:00" o "15:00:00 18:00:00 19:00:00 21:00:00"
      const times = lunesViernes.split(' ').filter(time => time.trim() !== '');
      console.log(`Parseando lunes-viernes: "${lunesViernes}" -> times:`, times);
      
      for (let i = 0; i < times.length; i += 2) {
        if (i + 1 < times.length) {
          const inicio = times[i].substring(0, 5); // Tomar solo HH:MM
          const fin = times[i + 1].substring(0, 5); // Tomar solo HH:MM
          const horario = `${inicio} - ${fin}`;
          horarios.push(horario);
          console.log(`Agregando horario lunes-viernes: ${horario}`);
        }
      }
    }
    
    if (sabado) {
      // Parsear horarios de sábado
      const times = sabado.split(' ').filter(time => time.trim() !== '');
      console.log(`Parseando sábado: "${sabado}" -> times:`, times);
      
      for (let i = 0; i < times.length; i += 2) {
        if (i + 1 < times.length) {
          const inicio = times[i].substring(0, 5); // Tomar solo HH:MM
          const fin = times[i + 1].substring(0, 5); // Tomar solo HH:MM
          const horario = `${inicio} - ${fin}`;
          horarios.push(horario);
          console.log(`Agregando horario sábado: ${horario}`);
        }
      }
    }
    
    console.log('Horarios parseados finales:', horarios);
    return horarios;
  }

  private parseHorario(horario: string): { inicio: string, fin: string } {
    // Elimina espacios antes y después del guion
    const clean = horario.replace(/\s*-\s*/, '-');
    const parts = clean.split('-');
    return {
      inicio: parts[0]?.trim() || '08:00',
      fin: parts[1]?.trim() || '10:00'
    };
  }

  private getDiasDisponibles(docente: Docente): string[] {
    const dias: string[] = [];
    
    // Si tiene horarios de lunes a viernes, agregar esos días
    if (docente.horarios_lunes_viernes) {
      dias.push('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes');
    }
    
    // Si tiene horarios de sábado, agregar sábado
    if (docente.horarios_sabado) {
      dias.push('Sábado');
    }
    
    return dias;
  }

  private coincidePrograma(nombreComponente: string, programa: string): boolean {
    // Normalizar y limpiar strings para comparación
    const componente = nombreComponente.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    const programaNormalizado = programa.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    
    // 1. Comparación exacta (ignorando números)
    const programaLimpio = programaNormalizado.replace(/\d+/g, '').trim();
    const componenteLimpio = componente.replace(/\d+/g, '').trim();
    
    if (programaLimpio === componenteLimpio && programaLimpio.length > 0) {
      console.log(`✓ Coincidencia exacta: "${programa}" = "${componente}"`);
      return true;
    }
    
    // 2. Comparación por prefijos específicos (más estricta)
    const prefijosComunes = [
      'a1.1.', 'a1.2.', 'a1.3.', 'a1.4.', 'a1.5.', 'a1.6.', 'a1.8.',
      'a2.1.', 'a2.2.', 'a2.3.', 'a2.4.',
      'b1.1.', 'b1.2.', 'b1.3.', 'b1.4.',
      'b2.1.', 'b2.2.', 'b2.3.'
    ];
    
    for (const prefijo of prefijosComunes) {
      if (componente.startsWith(prefijo)) {
        const componenteSinPrefijo = componente.replace(prefijo, '').trim();
        if (programaNormalizado.includes(componenteSinPrefijo)) {
          console.log(`✓ Coincidencia por prefijo: "${programa}" ~ "${componente}" (prefijo: "${prefijo}")`);
          return true;
        }
      }
    }
    
    // 3. Comparación por números específicos (más estricta)
    const numerosPrograma = programaNormalizado.match(/\d+/g);
    const numerosComponente = componente.match(/\d+/g);
    
    if (numerosPrograma && numerosComponente) {
      for (const numProg of numerosPrograma) {
        for (const numComp of numerosComponente) {
          if (numProg === numComp) {
            // Verificar que las palabras base coincidan exactamente
            const basePrograma = programaNormalizado.replace(/\d+/g, '').trim();
            const baseComponente = componente.replace(/\d+/g, '').trim();
            
            if (basePrograma === baseComponente || this.tienenPalabrasComunes(basePrograma, baseComponente)) {
              console.log(`✓ Coincidencia por número: "${programa}" ~ "${componente}" (número: "${numProg}")`);
              return true;
            }
          }
        }
      }
    }
    
    // 4. Comparación específica para casos especiales (más estricta)
    const casosEspeciales = [
      { programa: 'teens starter', componente: 'teens starter' },
      { programa: 'youth intensive', componente: 'youth intensive' },
      { programa: 'seniors intensive', componente: 'seniors intensive' },
      { programa: 'children online', componente: 'children online' },
      { programa: 'teens online', componente: 'teens online' },
      { programa: 'tiny kids', componente: 'tiny kids' }
    ];
    
    for (const caso of casosEspeciales) {
      if (programaNormalizado.includes(caso.programa) && componente.includes(caso.componente)) {
        console.log(`✓ Coincidencia por caso especial: "${programa}" (caso: "${caso.programa}")`);
        return true;
      }
    }
    
    // 5. Comparación por inclusión (más estricta - solo si es muy específica)
    if (programaNormalizado.length > 3 && componente.length > 3) {
      // Solo si una es substring de la otra y tienen al menos 3 caracteres
      if (programaNormalizado.includes(componente) || componente.includes(programaNormalizado)) {
        // Verificar que no sea solo una palabra común
        const palabrasComunes = ['teens', 'youth', 'seniors', 'children', 'tiny', 'online', 'intensive', 'starter'];
        const esPalabraComun = palabrasComunes.some(palabra => 
          programaNormalizado === palabra || componente === palabra
        );
        
        if (!esPalabraComun) {
          console.log(`✓ Coincidencia por inclusión: "${programa}" incluye "${componente}"`);
          return true;
        }
      }
    }
    
    console.log(`✗ No coincide: "${componente}" con programa "${programa}"`);
    return false;
  }

  private esFraseValida(frase: string): boolean {
    // Verificar si la frase contiene palabras clave válidas
    const palabrasClave = [
      'tiny', 'kids', 'children', 'teens', 'youth', 'seniors', 
      'english', 'express', 'intensive', 'online', 'starter'
    ];
    
    const fraseLower = frase.toLowerCase();
    return palabrasClave.some(palabra => fraseLower.includes(palabra));
  }

  private tienenPalabrasComunes(texto1: string, texto2: string): boolean {
    const palabras1 = texto1.toLowerCase().split(/\s+/).filter(p => p.length > 2);
    const palabras2 = texto2.toLowerCase().split(/\s+/).filter(p => p.length > 2);
    
    for (const palabra1 of palabras1) {
      for (const palabra2 of palabras2) {
        if (palabra1 === palabra2 || palabra1.includes(palabra2) || palabra2.includes(palabra1)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private sonSimilares(texto1: string, texto2: string): boolean {
    // Normalizar ambos textos
    const t1 = texto1.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    const t2 = texto2.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    
    // Si son exactamente iguales
    if (t1 === t2) return true;
    
    // Dividir en palabras
    const palabras1 = t1.split(/\s+/).filter(p => p.length > 0);
    const palabras2 = t2.split(/\s+/).filter(p => p.length > 0);
    
    // Contar palabras comunes con tolerancia a errores tipográficos
    let palabrasComunes = 0;
    for (const palabra1 of palabras1) {
      for (const palabra2 of palabras2) {
        if (this.palabrasSimilares(palabra1, palabra2)) {
          palabrasComunes++;
        }
      }
    }
    
    // Calcular similitud (al menos 40% de palabras deben coincidir para ser más flexible)
    const totalPalabras = Math.max(palabras1.length, palabras2.length);
    const similitud = palabrasComunes / totalPalabras;
    
    console.log(`Similitud entre "${t1}" y "${t2}": ${similitud} (${palabrasComunes}/${totalPalabras} palabras)`);
    
    return similitud >= 0.4;
  }

  private palabrasSimilares(palabra1: string, palabra2: string): boolean {
    // Comparación exacta
    if (palabra1 === palabra2) return true;
    
    // Comparación por inclusión
    if (palabra1.includes(palabra2) || palabra2.includes(palabra1)) return true;
    
    // Comparación para errores tipográficos comunes
    const erroresComunes = [
      { original: 'intensive', error: 'intensice' },
      { original: 'intensive', error: 'intensivo' },
      { original: 'intensive', error: 'intensiv' },
      { original: 'seniors', error: 'senior' },
      { original: 'children', error: 'child' },
      { original: 'youth', error: 'young' },
      { original: 'teens', error: 'teen' }
    ];
    
    for (const error of erroresComunes) {
      if ((palabra1 === error.original && palabra2 === error.error) ||
          (palabra1 === error.error && palabra2 === error.original)) {
        return true;
      }
    }
    
    return false;
  }

  private extraerProgramasIndividuales(programas: string): string[] {
    // Normalizar y limpiar strings para comparación
    const programasNormalizados = programas.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    
    // Dividir programas usando separadores específicos: " , " y " y "
    let programasIndividuales: string[] = [];
    
    // Primero dividir por " , " (coma con espacios)
    const porComas = programasNormalizados.split(' , ').map(p => p.trim()).filter(p => p.length > 0);
    
    for (const grupo of porComas) {
      // Luego dividir cada grupo por " y " (y con espacios)
      const porY = grupo.split(' y ').map(p => p.trim()).filter(p => p.length > 0);
      
      for (const item of porY) {
        // Limpiar y normalizar cada item
        const itemLimpio = item.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
        
        if (itemLimpio.length > 2) {
          programasIndividuales.push(itemLimpio);
        }
      }
    }
    
    // Si no se encontraron separadores específicos, intentar con separadores genéricos
    if (programasIndividuales.length === 0) {
      const porComasGenericas = programasNormalizados.split(',').map(p => p.trim()).filter(p => p.length > 0);
      
      for (const grupo of porComasGenericas) {
        const porYGenericas = grupo.split(/\by\b/).map(p => p.trim()).filter(p => p.length > 0);
        
        for (const item of porYGenericas) {
          const itemLimpio = item.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
          
          if (itemLimpio.length > 2) {
            programasIndividuales.push(itemLimpio);
          }
        }
      }
    }
    
    // Procesar cada programa individual para separar frases compuestas
    const programasFinales: string[] = [];
    for (const programa of programasIndividuales) {
      // Dividir por espacios y reconstruir frases significativas
      const palabras = programa.split(/\s+/);
      let fraseActual = '';
      
      for (const palabra of palabras) {
        if (fraseActual) {
          fraseActual += ' ' + palabra;
        } else {
          fraseActual = palabra;
        }
        
        // Si la frase contiene palabras clave, agregarla
        if (this.esFraseValida(fraseActual)) {
          programasFinales.push(fraseActual);
        }
      }
      
      // Agregar la frase completa si no se agregó por partes
      if (fraseActual.length > 2 && !programasFinales.includes(fraseActual)) {
        programasFinales.push(fraseActual);
      }
    }
    
    // Eliminar duplicados y retornar
    return [...new Set(programasFinales)];
  }

  // Teachers
  getTeachers(): Observable<Teacher[]> {
    return this.teachersSubject.asObservable();
  }

  addTeachers(teachers: Teacher[]): void {
    this.teachersSubject.next([...this.teachersSubject.value, ...teachers]);
  }

  // Classrooms
  getClassrooms(): Observable<Classroom[]> {
    return this.classroomsSubject.asObservable();
  }

  addClassrooms(classrooms: Classroom[]): void {
    this.classroomsSubject.next([...this.classroomsSubject.value, ...classrooms]);
  }

  // Programs
  getPrograms(): Observable<Program[]> {
    return this.programsSubject.asObservable();
  }

  addPrograms(programs: Program[]): void {
    this.programsSubject.next([...this.programsSubject.value, ...programs]);
  }

  // Schedules
  getSchedules(): Observable<Schedule[]> {
    console.log('=== getSchedules() LLAMADO ===');
    console.log('Valor actual de schedulesSubject:', this.schedulesSubject.value);
    console.log('Total de schedules en subject:', this.schedulesSubject.value.length);
    return this.schedulesSubject.asObservable();
  }

  addSchedules(schedules: Schedule[]): void {
    const newSchedules = schedules.map((schedule, index) => ({
      ...schedule,
      id: this.schedulesSubject.value.length + index + 1
    }));
    this.schedulesSubject.next([...this.schedulesSubject.value, ...newSchedules]);
  }

  updateSchedule(updatedSchedule: Schedule): void {
    const schedules = this.schedulesSubject.value;
    const index = schedules.findIndex(s => s.id === updatedSchedule.id);
    if (index !== -1) {
      schedules[index] = updatedSchedule;
      this.schedulesSubject.next([...schedules]);
    }
  }

  // Conflict Detection
  detectConflicts(): Observable<Conflict[]> {
    return new Observable(observer => {
      const schedules = this.schedulesSubject.value;
      const conflicts: Conflict[] = [];
      let conflictId = 1;

      // Teacher conflicts - same teacher in different places at same time
      schedules.forEach((schedule1, i) => {
        schedules.forEach((schedule2, j) => {
          if (i < j && 
              schedule1.docente === schedule2.docente &&
              schedule1.dia === schedule2.dia &&
              schedule1.hora_inicio === schedule2.hora_inicio) {
            conflicts.push({
              id: conflictId++,
              type: 'teacher_conflict',
              message: `El docente ${schedule1.docente} tiene conflicto de horario`,
              schedules: [schedule1, schedule2],
              suggestion: `Reasignar uno de los horarios del docente ${schedule1.docente}`
            });
          }
        });
      });

      // Classroom conflicts - same classroom booked twice
      schedules.forEach((schedule1, i) => {
        schedules.forEach((schedule2, j) => {
          if (i < j && 
              schedule1.aula === schedule2.aula &&
              schedule1.dia === schedule2.dia &&
              schedule1.hora_inicio === schedule2.hora_inicio) {
            conflicts.push({
              id: conflictId++,
              type: 'classroom_conflict',
              message: `El aula ${schedule1.aula} está ocupada por dos clases al mismo tiempo`,
              schedules: [schedule1, schedule2],
              suggestion: `Mover una de las clases a otra aula disponible`
            });
          }
        });
      });

      observer.next(conflicts);
      observer.complete();
    });
  }

  // Simulation methods
  duplicateSchedules(): Schedule[] {
    return this.schedulesSubject.value.map(schedule => ({
      ...schedule,
      id: schedule.id ? schedule.id + 1000 : 1000 // Simulate new IDs for duplicated schedules
    }));
  }

  // Refresh data from API
  refreshData(): void {
    this.loadInitialData();
  }

  // Statistics methods
  getTotalTeachers(): number {
    return this.docentesSubject.value.length;
  }

  getTotalClassrooms(): number {
    return this.aulasSubject.value.length;
  }

  getTotalComponents(): number {
    return this.componentesSubject.value.length;
  }

  getTotalAssignments(): number {
    return this.asignacionesSubject.value.length;
  }

  getTotalCapacity(): number {
    return this.componentesSubject.value.reduce((total, componente) => total + componente.capacidad_ofertada, 0);
  }
}