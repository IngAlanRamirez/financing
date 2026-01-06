import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

export interface DifferRequest {
  buyId: number;
  offerId: number;
}

export interface DifferResponse {
  success: boolean;
  message: string;
  processedItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class DifferService {
  /**
   * Simular diferimiento de compras
   */
  performDiffer(body: DifferRequest[]): Observable<DifferResponse> {
    // Simular procesamiento del diferimiento
    return of({
      success: true,
      message: 'Diferimiento procesado correctamente',
      processedItems: body.length
    }).pipe(
      delay(1500) // Simular tiempo de procesamiento
    );
  }
}

