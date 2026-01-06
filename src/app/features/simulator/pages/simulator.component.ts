import { Component, OnInit, AfterViewInit, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';
import { PaymentsStateService } from '../../../core/state/payments.state.service';
import { PaymentGroup } from '../../../models';
import { ConfirmComponent } from '../../confirm/pages/confirm.component';

interface SimulatorPayment extends PaymentGroup {
  selected?: boolean;
  monthlyPayment?: number;
}

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon
  ],
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.scss']
})
export class SimulatorComponent implements OnInit, AfterViewInit {
  private paymentsState = inject(PaymentsStateService);
  private router = inject(Router);
  private modalController = inject(ModalController);

  // Signals
  selectedMonths = signal<string>('24');
  availableMonths = ['6', '9', '12', '18', '24'];
  showDetails = signal<boolean>(false);
  private paymentSelectionMap = signal<Map<number, boolean>>(new Map());
  
  // Obtener todos los pagos seleccionados del estado
  allSelectedPayments = computed(() => {
    const allGroups = ([] as PaymentGroup[]).concat(...this.paymentsState.processPaymentSignal());
    return allGroups.filter(p => p.offer && p.type === 'MCI');
  });

  // Obtener el plazo por defecto basado en las compras seleccionadas
  defaultMonths = computed(() => {
    const payments = this.allSelectedPayments();
    if (payments.length > 0) {
      // Obtener el plazo más común o el primero
      const months = payments.map(p => p.month);
      const mostCommon = months.sort((a, b) =>
        months.filter(v => v === a).length - months.filter(v => v === b).length
      ).pop();
      return mostCommon || payments[0].month;
    }
    return '6';
  });

  // Filtrar pagos por plazo seleccionado y recalcular para ese plazo
  filteredPayments = computed(() => {
    const payments = this.allSelectedPayments();
    const selectedMonth = this.selectedMonths();
    const selectionMap = this.paymentSelectionMap(); // Leer el signal para reactividad
    
    // Si hay pagos seleccionados, mostrar los que coinciden con el plazo seleccionado
    // Si no hay pagos para ese plazo, mostrar todos los seleccionados pero recalcular para el nuevo plazo
    const paymentsForMonth = payments.filter(p => p.month === selectedMonth);
    
    if (paymentsForMonth.length > 0) {
      // Hay pagos para el plazo seleccionado
      return paymentsForMonth.map(p => {
        const isSelected = selectionMap.has(p.id) 
          ? selectionMap.get(p.id)! 
          : true; // Por defecto seleccionado
        
        return {
          ...p,
          selected: isSelected,
          monthlyPayment: p.total ? p.total / parseInt(p.month) : p.amount / parseInt(p.month)
        } as SimulatorPayment;
      });
    } else {
      // No hay pagos para este plazo, pero mostramos todos los seleccionados
      // y recalculamos para el nuevo plazo
      return payments.map(p => {
        const baseAmount = p.amount; // Usar el monto base, no el total
        const rate = p.rate || 0;
        // Recalcular total para el nuevo plazo
        const newTotal = baseAmount * (1 + (rate * parseInt(selectedMonth)));
        
        const isSelected = selectionMap.has(p.id) 
          ? selectionMap.get(p.id)! 
          : true; // Por defecto seleccionado
        
        return {
          ...p,
          month: selectedMonth,
          total: newTotal,
          selected: isSelected,
          monthlyPayment: newTotal / parseInt(selectedMonth)
        } as SimulatorPayment;
      });
    }
  });

  // Resumen calculado - se actualiza automáticamente cuando cambian los pagos seleccionados o el plazo
  summary = computed(() => {
    // Obtener pagos filtrados y seleccionados
    const allFiltered = this.filteredPayments();
    const selectedPayments = allFiltered.filter(p => p.selected !== false);
    
    if (selectedPayments.length === 0) {
      return {
        totalAmount: 0,
        monthlyPayment: 0,
        annualRate: '0.00',
        monthlyRate: '0.00',
        count: 0
      };
    }
    
    // Calcular totales basados en los pagos seleccionados
    const totalAmount = selectedPayments.reduce((sum, p) => {
      // Si tiene total calculado, usarlo; sino usar el monto base
      return sum + (p.total || p.amount);
    }, 0);
    
    const monthlyPayment = selectedPayments.reduce((sum, p) => {
      return sum + (p.monthlyPayment || 0);
    }, 0);
    
    // Obtener tasa de interés del primer pago seleccionado (todos deberían tener la misma)
    const firstPayment = selectedPayments[0];
    const monthlyRate = firstPayment?.rate || 0;
    const annualRate = monthlyRate * 12 * 100;

    return {
      totalAmount,
      monthlyPayment,
      annualRate: annualRate.toFixed(2),
      monthlyRate: (monthlyRate * 100).toFixed(2),
      count: selectedPayments.length
    };
  });

  constructor() {
    addIcons({ calendarOutline });
    
    // Effect para hacer scroll cuando cambie el mes seleccionado
    effect(() => {
      this.selectedMonths();
      setTimeout(() => this.scrollToSelectedMonth(), 50);
    });
  }

  ngOnInit(): void {
    // Si no hay pagos seleccionados, redirigir
    if (this.allSelectedPayments().length === 0) {
      this.router.navigate(['/']);
      return;
    }
    
    // El plazo por defecto siempre es 24 meses
    this.selectedMonths.set('24');
  }

  ngAfterViewInit(): void {
    // Scroll al botón de 24 meses después de que se renderice la vista
    setTimeout(() => this.scrollToSelectedMonth(), 100);
  }

  scrollToSelectedMonth(): void {
    const monthsContainer = document.querySelector('.simulator__months');
    const selectedButton = document.querySelector('.simulator__month-button--selected');
    if (monthsContainer && selectedButton) {
      const containerRect = monthsContainer.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();
      const scrollLeft = buttonRect.left - containerRect.left + monthsContainer.scrollLeft - (containerRect.width / 2) + (buttonRect.width / 2);
      monthsContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }

  selectMonths(months: string): void {
    this.selectedMonths.set(months);
    // El computed filteredPayments se actualizará automáticamente
    // y recalculará los montos para el nuevo plazo
  }

  togglePayment(payment: SimulatorPayment): void {
    // Obtener el estado actual del Map
    const currentMap = this.paymentSelectionMap();
    const newMap = new Map(currentMap);
    
    // Obtener el estado actual (por defecto true si no está en el Map)
    const currentState = newMap.get(payment.id) ?? true;
    const newState = !currentState;
    
    // Actualizar el Map
    newMap.set(payment.id, newState);
    
    // Actualizar el signal para que los computed se reactiven
    this.paymentSelectionMap.set(newMap);
    
    // Actualizar también el objeto directamente para la UI
    payment.selected = newState;
  }

  toggleDetails(): void {
    this.showDetails.update(value => !value);
  }

  async continue(): Promise<void> {
    // Guardar los pagos seleccionados para la confirmación
    const selected = this.filteredPayments().filter(p => p.selected);
    
    if (selected.length === 0) {
      return; // No hay pagos seleccionados
    }
    
    this.paymentsState.setProcessPaymentConfirm([selected]);
    
    // Abrir modal de confirmación usando ModalController
    const modal = await this.modalController.create({
      component: ConfirmComponent,
      cssClass: 'confirm-modal',
      backdropDismiss: true,
      showBackdrop: true,
      breakpoints: [0, 0.7, 1],
      initialBreakpoint: 0.7,
      handle: false
    });

    await modal.present();
  }
}
