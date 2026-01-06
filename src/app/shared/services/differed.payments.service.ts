import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map } from 'rxjs';
import { DifferedPayment } from '../../models';
import { PaymentsStateService } from '../../core/state/payments.state.service';

@Injectable({
  providedIn: 'root'
})
export class DifferedPaymentsService {
  private http = inject(HttpClient);
  private paymentsState = inject(PaymentsStateService);

  /**
   * Obtener compras ya diferidas desde datos dummy
   */
  getDifferedPayments(): Observable<DifferedPayment[]> {
    return this.http.get<DifferedPayment[]>('assets/data/dummy-differed-payments.json').pipe(
      delay(500), // Simular latencia de red
      map(data => data || []),
      map(data => {
        // Actualizar estado con Signals
        this.paymentsState.setDifferedPayments(data);
        return data;
      })
    );
  }
}

