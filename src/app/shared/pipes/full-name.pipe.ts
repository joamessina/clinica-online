import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fullName',
  standalone: true,
})
export class FullNamePipe implements PipeTransform {
  transform(
    value: { nombre?: string | null; apellido?: string | null } | null,
    placeholder = '—'
  ): string {
    if (!value) return placeholder;

    const nombre = (value.nombre ?? '').toString().trim();
    const apellido = (value.apellido ?? '').toString().trim();
    const full = `${nombre} ${apellido}`.trim();

    return full || placeholder;
  }
}
