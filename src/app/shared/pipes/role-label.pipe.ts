import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleLabel',
  standalone: true,
})
export class RoleLabelPipe implements PipeTransform {
  transform(role: string | null | undefined): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'especialista':
        return 'Especialista';
      case 'paciente':
        return 'Paciente';
      default:
        return role || '—';
    }
  }
}
