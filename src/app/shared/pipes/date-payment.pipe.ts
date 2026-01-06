import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'datePayment',
  standalone: true
})
export class DatePaymentPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';

    const listOfMonths = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const day = date.getDate();
    const month = listOfMonths[date.getMonth()];
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }
}

