import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'yesNo',
  standalone: true,
})
export class YesNoPipe implements PipeTransform {
  transform(
    value: boolean | null | undefined,
    yesText: string = 'Sí',
    noText: string = 'No',
    emptyText: string = '—'
  ): string {
    if (value === true) return yesText;
    if (value === false) return noText;
    return emptyText;
  }
}
