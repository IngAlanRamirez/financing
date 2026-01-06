import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { PaymentsService } from '../../../shared/services/payments.service';
import { DifferedPaymentsService } from '../../../shared/services/differed.payments.service';
import { PaymentsStateService } from '../../../core/state/payments.state.service';
import { UIStateService } from '../../../core/state/ui.state.service';
import { Payment, PaymentGroup, DifferedPayment } from '../../../models';
import { DatePaymentPipe } from '../../../shared/pipes/date-payment.pipe';

@Component({
  selector: 'app-differ',
  standalone: true,
  imports: [
    CommonModule,
    DatePaymentPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon
  ],
  templateUrl: './differ.component.html',
  styleUrls: ['./differ.component.scss']
})
export class DifferComponent implements OnInit {
  // Inyectar servicios con inject()
  private paymentsService = inject(PaymentsService);
  private differedPaymentsService = inject(DifferedPaymentsService);
  private paymentsState = inject(PaymentsStateService);
  private uiState = inject(UIStateService);
  private router = inject(Router);

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
    
    // Effect para detectar cuando se limpian las selecciones y limpiar los grupos locales
    effect(() => {
      const processPayment = this.paymentsState.processPaymentSignal();
      if (processPayment.length === 0) {
        // Si el estado global está vacío, limpiar los flags offer de todos los grupos locales
        this.clearOfferFlags();
      }
    });
  }

  /**
   * Limpiar flags offer de todos los grupos locales sin regenerarlos
   */
  clearOfferFlags(): void {
    // Limpiar flags offer de todos los grupos existentes
    this.group24msi.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group24mci.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group18msi.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group18mci.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group12msi.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group12mci.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group9msi.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group9mci.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group6msi.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group6mci.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group3msi.update(groups => groups.map(g => ({ ...g, offer: false })));
    this.group3mci.update(groups => groups.map(g => ({ ...g, offer: false })));
    
    // Limpiar selecciones
    this.selectedPayments.set([]);
  }

  // Signals del estado global
  paymentsToDiffer = this.paymentsState.paymentsToDifferSignal;
  differedPayments = this.paymentsState.differedPaymentsSignal;
  processPayment = this.paymentsState.processPaymentSignal;
  processPaymentGroup = this.paymentsState.processPaymentGroupSignal;

  // Signals locales
  selectedPayments = signal<PaymentGroup[]>([]);
  currentMonth = signal<string>('');
  activeTab = signal<'available' | 'history'>('available');
  isLoading = this.uiState.isLoadingSignal;

  // Computed signals
  canContinue = computed(() => this.selectedPayments().length > 0);
  totalSelected = computed(() => this.selectedPayments().length);

  // Grupos de pagos por plazo y tipo
  group24msi = signal<PaymentGroup[]>([]);
  group24mci = signal<PaymentGroup[]>([]);
  group18msi = signal<PaymentGroup[]>([]);
  group18mci = signal<PaymentGroup[]>([]);
  group12msi = signal<PaymentGroup[]>([]);
  group12mci = signal<PaymentGroup[]>([]);
  group9msi = signal<PaymentGroup[]>([]);
  group9mci = signal<PaymentGroup[]>([]);
  group6msi = signal<PaymentGroup[]>([]);
  group6mci = signal<PaymentGroup[]>([]);
  group3msi = signal<PaymentGroup[]>([]);
  group3mci = signal<PaymentGroup[]>([]);

  // Contadores
  counterAvailable = signal({
    twentyFourMsi: 0,
    twentyFourMci: 0,
    eighteenMsi: 0,
    eighteenMci: 0,
    twelveMsi: 0,
    twelveMci: 0,
    nineMsi: 0,
    nineMci: 0,
    sixMsi: 0,
    sixMci: 0,
    threeMsi: 0,
    threeMci: 0
  });

  ngOnInit(): void {
    // Verificar si las selecciones fueron limpiadas (estado global vacío)
    const processPayment = this.paymentsState.processPaymentSignal();
    const shouldClearSelections = processPayment.length === 0;
    
    // Si se limpiaron las selecciones, limpiar primero los signals locales
    if (shouldClearSelections) {
      this.clearLocalSelections();
    }
    
    // Siempre recargar los datos para asegurar que los grupos se regeneren
    // con offer: false cuando se limpian las selecciones
    this.loadData();
  }

  /**
   * Limpiar selecciones locales
   */
  clearLocalSelections(): void {
    // Limpiar todos los grupos locales
    this.group24msi.set([]);
    this.group24mci.set([]);
    this.group18msi.set([]);
    this.group18mci.set([]);
    this.group12msi.set([]);
    this.group12mci.set([]);
    this.group9msi.set([]);
    this.group9mci.set([]);
    this.group6msi.set([]);
    this.group6mci.set([]);
    this.group3msi.set([]);
    this.group3mci.set([]);
    
    // Limpiar selecciones
    this.selectedPayments.set([]);
  }

  loadData(): void {
    this.uiState.setLoading(true);

    // Cargar pagos disponibles
    this.paymentsService.getPaymentsToDiffer().subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.processPayments(data);
        }
        this.uiState.setLoading(false);
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.uiState.showError('Error al cargar los pagos disponibles');
        this.uiState.setLoading(false);
      }
    });

    // Cargar pagos diferidos
    this.differedPaymentsService.getDifferedPayments().subscribe({
      next: (data) => {
        // Los pagos diferidos se almacenan en el estado
        console.log('Differed payments loaded:', data);
      },
      error: (err) => {
        console.error('Error loading differed payments:', err);
      }
    });
  }

  /**
   * Procesar y agrupar pagos por plazo y tipo
   */
  processPayments(payments: Payment[]): void {
    // Verificar si las selecciones fueron limpiadas (estado global vacío)
    const processPayment = this.paymentsState.processPaymentSignal();
    const shouldClearSelections = processPayment.length === 0;
    
    // Agrupar por plazos y tipos (siempre con offer: false inicialmente)
    const groups24msi = this.reGroup(payments, 'MSI', '24', false);
    const groups24mci = this.reGroup(payments, 'MCI', '24', false);
    const groups18msi = this.reGroup(payments, 'MSI', '18', false);
    const groups18mci = this.reGroup(payments, 'MCI', '18', false);
    const groups12msi = this.reGroup(payments, 'MSI', '12', false);
    const groups12mci = this.reGroup(payments, 'MCI', '12', false);
    const groups9msi = this.reGroup(payments, 'MSI', '9', false);
    const groups9mci = this.reGroup(payments, 'MCI', '9', false);
    const groups6msi = this.reGroup(payments, 'MSI', '6', false);
    const groups6mci = this.reGroup(payments, 'MCI', '6', false);
    const groups3msi = this.reGroup(payments, 'MSI', '3', false);
    const groups3mci = this.reGroup(payments, 'MCI', '3', false);

    // Si las selecciones fueron limpiadas, asegurar que todos los grupos tengan offer: false
    if (shouldClearSelections) {
      groups24msi.forEach(g => g.offer = false);
      groups24mci.forEach(g => g.offer = false);
      groups18msi.forEach(g => g.offer = false);
      groups18mci.forEach(g => g.offer = false);
      groups12msi.forEach(g => g.offer = false);
      groups12mci.forEach(g => g.offer = false);
      groups9msi.forEach(g => g.offer = false);
      groups9mci.forEach(g => g.offer = false);
      groups6msi.forEach(g => g.offer = false);
      groups6mci.forEach(g => g.offer = false);
      groups3msi.forEach(g => g.offer = false);
      groups3mci.forEach(g => g.offer = false);
    }

    // Establecer los grupos
    this.group24msi.set(groups24msi);
    this.group24mci.set(groups24mci);
    this.group18msi.set(groups18msi);
    this.group18mci.set(groups18mci);
    this.group12msi.set(groups12msi);
    this.group12mci.set(groups12mci);
    this.group9msi.set(groups9msi);
    this.group9mci.set(groups9mci);
    this.group6msi.set(groups6msi);
    this.group6mci.set(groups6mci);
    this.group3msi.set(groups3msi);
    this.group3mci.set(groups3mci);

    // Limpiar selecciones locales si se limpiaron las selecciones globales
    if (shouldClearSelections) {
      this.selectedPayments.set([]);
    }

    // Actualizar estado global
    this.updateProcessPayment();
  }

  /**
   * Reagrupar pagos por tipo y plazo
   */
  reGroup(
    payments: Payment[],
    type: 'MSI' | 'MCI',
    months: string,
    filter: boolean
  ): PaymentGroup[] {
    const result: PaymentGroup[] = [];
    const monthListMsi: number[] = [];
    const monthListMci: number[] = [];

    // Primera pasada: encontrar pagos con la oferta específica
    payments.forEach((payment) => {
      payment.ofertas.forEach((oferta) => {
        if (oferta.tipo === type && oferta.noMeses === months) {
          const title = payment.nomCom.length > 23 
            ? payment.nomCom.slice(0, 23) + '...' 
            : payment.nomCom;

          result.push({
            id: payment.id,
            title,
            date: payment.fechaCompra,
            amount: payment.montoCompra,
            offer: false,
            offerIdTest: oferta.id,
            month: oferta.noMeses,
            type: oferta.tipo,
            total: oferta.totalPago ? parseFloat(oferta.totalPago.toString()) : 0.0,
            rate: oferta.interesMensual ? parseFloat(oferta.interesMensual.toString()) : 0.0
          });
        }
      });
    });

    // Segunda pasada: encontrar el máximo MSI y MCI para cada pago
    result.forEach((element) => {
      payments.forEach((payment) => {
        if (payment.id === element.id) {
          payment.ofertas.forEach((oferta) => {
            if (oferta.tipo === 'MSI') {
              monthListMsi.push(parseInt(oferta.noMeses));
            }
            if (oferta.tipo === 'MCI') {
              monthListMci.push(parseInt(oferta.noMeses));
            }
          });
        }
      });

      if (element.type === 'MSI' && monthListMsi.length > 0) {
        element.msi = Math.max(...monthListMsi).toString();
      }
      if (element.type === 'MCI' && monthListMci.length > 0) {
        element.mci = Math.max(...monthListMci).toString();
      }
    });

    // Filtrar si es necesario
    if (filter) {
      if (type === 'MSI') {
        return result.filter((row) => row.month === row.msi);
      } else if (type === 'MCI') {
        return result.filter((row) => row.month === row.mci);
      }
    }

    // Ordenar por fecha (más reciente primero)
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * Actualizar estado global de pagos procesados
   */
  updateProcessPayment(): void {
    const allGroups = [
      this.group24msi(),
      this.group24mci(),
      this.group18msi(),
      this.group18mci(),
      this.group12msi(),
      this.group12mci(),
      this.group9msi(),
      this.group9mci(),
      this.group6msi(),
      this.group6mci(),
      this.group3msi(),
      this.group3mci()
    ];

    this.paymentsState.setProcessPayment(allGroups);
    this.paymentsState.setProcessPaymentGroup(allGroups);
  }

  /**
   * Manejar click en el label
   */
  onLabelClick(event: Event, payment: PaymentGroup, groupType: string): void {
    // Si el click fue directamente en el checkbox, no hacer nada (el change se encargará)
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('input')) {
      return;
    }
    
    // Si el click fue en otra parte del label, activar el checkbox manualmente
    event.preventDefault();
    payment.offer = !payment.offer;
    
    // Actualizar el grupo correspondiente
    this.updateGroup(groupType, payment);

    // Actualizar estado
    this.updateProcessPayment();
    this.updateSelectedPayments();
  }

  /**
   * Manejar cambio en el checkbox
   */
  onPaymentClick(payment: PaymentGroup, groupType: string, event: Event): void {
    // Usar el valor del checkbox directamente
    const checkbox = event.target as HTMLInputElement;
    payment.offer = checkbox.checked;

    // Actualizar el grupo correspondiente
    this.updateGroup(groupType, payment);

    // Actualizar estado
    this.updateProcessPayment();
    this.updateSelectedPayments();
  }

  /**
   * Actualizar grupo específico
   */
  updateGroup(groupType: string, payment: PaymentGroup): void {
    const groups = {
      'g24msi': this.group24msi,
      'g24mci': this.group24mci,
      'g18msi': this.group18msi,
      'g18mci': this.group18mci,
      'g12msi': this.group12msi,
      'g12mci': this.group12mci,
      'g9msi': this.group9msi,
      'g9mci': this.group9mci,
      'g6msi': this.group6msi,
      'g6mci': this.group6mci,
      'g3msi': this.group3msi,
      'g3mci': this.group3mci
    };

    const group = groups[groupType as keyof typeof groups];
    if (group) {
      group.update((items) =>
        items.map((item) =>
          item.id === payment.id ? { ...item, offer: payment.offer } : item
        )
      );
    }
  }

  /**
   * Actualizar lista de pagos seleccionados
   */
  updateSelectedPayments(): void {
    const allGroups = [
      ...this.group24msi(),
      ...this.group24mci(),
      ...this.group18msi(),
      ...this.group18mci(),
      ...this.group12msi(),
      ...this.group12mci(),
      ...this.group9msi(),
      ...this.group9mci(),
      ...this.group6msi(),
      ...this.group6mci(),
      ...this.group3msi(),
      ...this.group3mci()
    ];

    const selected = allGroups.filter((p) => p.offer);
    this.selectedPayments.set(selected);
    this.paymentsState.setPaymentGeneralCounter(selected.length);
  }

  /**
   * Continuar al simulador
   */
  continue(): void {
    if (this.canContinue()) {
      this.router.navigate(['/products/simulator']);
    }
  }

  /**
   * Ver detalle de compra diferida
   */
  viewDifferedPayment(id: number): void {
    this.router.navigate(['/products/differed', id]);
  }

  /**
   * Manejar cambio de tab
   */
  onTabChange(event: any): void {
    const value = event.detail.value;
    this.activeTab.set(value as 'available' | 'history');
  }

  /**
   * Obtener monto de compra diferida
   */
  getDifferedAmount(payment: DifferedPayment): number {
    // Si tiene ofertas, usar el total de la primera oferta, sino usar el monto de compra
    if (payment.ofertas && payment.ofertas.length > 0) {
      return payment.ofertas[0].totalPago || payment.montoCompra;
    }
    return payment.montoCompra;
  }
}

