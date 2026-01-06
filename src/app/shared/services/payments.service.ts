import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map } from 'rxjs';
import { Payment } from '../../models';
import { PaymentsStateService } from '../../core/state/payments.state.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private http = inject(HttpClient);
  private paymentsState = inject(PaymentsStateService);

  /**
   * Obtener compras disponibles para diferir desde datos dummy
   */
  getPaymentsToDiffer(): Observable<Payment[]> {
    return this.http.get<Payment[]>('assets/data/dummy-payments.json').pipe(
      delay(500), // Simular latencia de red
      map(data => data || []),
      map(data => {
        // Actualizar estado con Signals
        this.paymentsState.setPaymentsToDiffer(data);
        return data;
      })
    );
  }
}

