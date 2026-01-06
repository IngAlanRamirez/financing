import { Injectable, signal } from '@angular/core';

/**
 * State Service para gestión de UI usando Signals
 */
@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  // Signals privados
  private _isLoading = signal<boolean>(false);
  private _showErrorModal = signal<boolean>(false);
  private _showMaintenanceModal = signal<boolean>(false);
  private _errorMessage = signal<string>('');

  // Signals públicos (readonly)
  readonly isLoadingSignal = this._isLoading.asReadonly();
  readonly showErrorModalSignal = this._showErrorModal.asReadonly();
  readonly showMaintenanceModalSignal = this._showMaintenanceModal.asReadonly();
  readonly errorMessageSignal = this._errorMessage.asReadonly();

  // Métodos para actualizar estado
  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  showError(message: string = ''): void {
    this._errorMessage.set(message);
    this._showErrorModal.set(true);
  }

  hideError(): void {
    this._showErrorModal.set(false);
    this._errorMessage.set('');
  }

  showMaintenance(): void {
    this._showMaintenanceModal.set(true);
  }

  hideMaintenance(): void {
    this._showMaintenanceModal.set(false);
  }
}

