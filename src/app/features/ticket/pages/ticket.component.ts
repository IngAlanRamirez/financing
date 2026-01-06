import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircle, 
  close, 
  informationCircle, 
  shareOutline 
} from 'ionicons/icons';
import { PaymentsStateService } from '../../../core/state/payments.state.service';
import { CardService, CardInfo } from '../../../shared/services/card.service';
import { DateTimeReceiptPipe } from '../../../shared/pipes/date-time-receipt.pipe';
import { ConfirmPayment, PaymentGroup } from '../../../models';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    DateTimeReceiptPipe
  ],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss']
})
export class TicketComponent implements OnInit, OnDestroy {
  private paymentsState = inject(PaymentsStateService);
  private router = inject(Router);
  private cardService = inject(CardService);
  private location = inject(Location);
  
  private popStateListener?: () => void;

  confirmPayment = this.paymentsState.confirmPaymentSignal;
  showReminder = signal(true);
  showSuccessBanner = signal(true);
  isHidingBanner = signal(false);

  // Datos del comprobante
  ticketData = computed<ConfirmPayment | null>(() => {
    const confirm = this.confirmPayment();
    if (!confirm) return null;
    
    // Si no tiene datetime, generar uno
    if (!confirm.datetime) {
      return {
        ...confirm,
        datetime: new Date().toISOString(),
        invoice: confirm.invoice || this.generateInvoiceNumber()
      };
    }
    
    return {
      ...confirm,
      invoice: confirm.invoice || this.generateInvoiceNumber()
    };
  });

  // Información de la tarjeta
  cardInfo = computed<CardInfo>(() => {
    return this.cardService.getCardInfo();
  });

  // Compras diferidas
  purchases = computed<PaymentGroup[]>(() => {
    const data = this.ticketData();
    return data?.differedPayments || [];
  });

  // Cantidad de compras
  purchaseCount = computed(() => {
    return this.purchases().length;
  });

  // Verificar si tiene intereses
  hasInterest = computed(() => {
    const data = this.ticketData();
    return data ? (data.paymentAnualRate > 0 || data.paymentMonthRate > 0) : false;
  });

  // Total con intereses
  totalWithInterest = computed(() => {
    const data = this.ticketData();
    if (!data) return 0;
    
    // Si ya tiene paymentTotalRate, calcular el total
    if (data.paymentTotalRate) {
      return data.paymentTotalAmount + data.paymentTotalRate;
    }
    
    // Calcular total con intereses: pago mensual * número de meses
    const monthlyPayment = data.paymentTotalMonth || 0;
    const months = parseInt(data.month) || 0;
    const total = monthlyPayment * months;
    
    // Si el total calculado es mayor que el monto original, usarlo
    // De lo contrario, usar el monto original más los intereses
    return total > data.paymentTotalAmount ? total : data.paymentTotalAmount;
  });

  constructor() {
    addIcons({ checkmarkCircle, close, informationCircle, shareOutline });
  }

  ngOnInit(): void {
    // Verificar que haya datos de confirmación
    if (!this.confirmPayment()) {
      // Si no hay datos, redirigir al home
      this.navigateToHome();
      return;
    }

    // Reemplazar la entrada actual del historial para evitar volver al comprobante
    this.location.replaceState('/');
    
    // Configurar listener para detectar navegación hacia atrás
    this.popStateListener = () => {
      this.handleBackNavigation();
    };
    window.addEventListener('popstate', this.popStateListener);

    // Ocultar el banner de éxito después de 4 segundos con animación
    setTimeout(() => {
      this.isHidingBanner.set(true);
      this.showSuccessBanner.set(false);
      // Remover del DOM después de que termine la animación (0.5s)
      setTimeout(() => {
        this.isHidingBanner.set(false);
      }, 500);
    }, 4000);
  }

  ngOnDestroy(): void {
    // Remover el listener cuando se destruya el componente
    if (this.popStateListener) {
      window.removeEventListener('popstate', this.popStateListener);
    }
  }

  /**
   * Manejar navegación hacia atrás
   */
  private handleBackNavigation(): void {
    // Limpiar las selecciones
    this.paymentsState.clearSelections();
    // Navegar a home y limpiar historial
    this.navigateToHome();
  }

  /**
   * Navegar a home y limpiar el historial de navegación
   */
  private navigateToHome(): void {
    // Limpiar las selecciones
    this.paymentsState.clearSelections();
    
    // Navegar a la ruta inicial reemplazando la entrada actual del historial
    this.router.navigate(['/'], { replaceUrl: true }).then(() => {
      // Limpiar el historial adicional si es necesario
      // Esto asegura que no se pueda volver al comprobante
      if (window.history.length > 1) {
        // Reemplazar el estado actual para limpiar el historial
        window.history.replaceState(null, '', '/');
      }
    });
  }

  close(): void {
    // Usar el método de navegación que limpia el historial
    this.navigateToHome();
  }

  closeReminder(): void {
    this.showReminder.set(false);
  }

  shareReceipt(): void {
    // Implementar lógica de compartir comprobante
    if (navigator.share) {
      const data = this.ticketData();
      if (data) {
        navigator.share({
          title: 'Comprobante de diferimiento',
          text: `Diferiste ${data.paymentTotalAmount} MXN a ${data.month} meses`,
          // En una implementación real, aquí se generaría una imagen o PDF del comprobante
        }).catch((error) => {
          console.error('Error al compartir:', error);
        });
      }
    } else {
      // Fallback: copiar al portapapeles o mostrar opciones
      console.log('Compartir no disponible en este dispositivo');
    }
  }

  private generateInvoiceNumber(): number {
    // Generar un número de referencia aleatorio de 7 dígitos
    return Math.floor(1000000 + Math.random() * 9000000);
  }
}

