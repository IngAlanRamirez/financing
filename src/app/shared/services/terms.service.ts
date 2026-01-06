import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay } from 'rxjs';

export interface TermsResponse {
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class TermsService {
  private http = inject(HttpClient);

  /**
   * Obtener términos y condiciones desde datos dummy
   */
  getTermsAndConditions(): Observable<TermsResponse> {
    return this.http.get<TermsResponse>('assets/data/dummy-terms.json').pipe(
      delay(300) // Simular latencia de red
    );
  }
}

