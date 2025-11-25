import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

interface LoginLog {
  id: number;
  user_id: string;
  email: string | null;
  role: string | null;
  logged_at: string;
}

interface TurnoAdmin {
  fecha: string;
  hora: string | null;
  estado: string | null;
  especialidad_nombre: string | null;
  especialista_nombre: string | null;
  specialist_id: string | null;
}

@Component({
  standalone: true,
  selector: 'app-admin-reports',
  imports: [CommonModule],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit, AfterViewInit {
  private sb = inject(SupabaseClientService).client;

  loading = signal(true);
  lastUpdated = signal<Date | null>(null);

  loginLogs = signal<LoginLog[]>([]);

  turnosRaw = signal<TurnoAdmin[]>([]);

  rangeFrom = signal<string>('');
  rangeTo = signal<string>('');

  turnosPorEspecialidad = computed(() => {
    const rows = this.turnosRaw();
    const map = new Map<string, number>();

    for (const t of rows) {
      const key = t.especialidad_nombre || 'Sin especialidad';
      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  });

  turnosPorDia = computed(() => {
    const rows = this.turnosRaw();
    const map = new Map<string, number>();

    for (const t of rows) {
      const key = t.fecha;
      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  medicoStats = computed(() => {
    const from = this.rangeFrom();
    const to = this.rangeTo();
    const rows = this.turnosRaw().filter((t) => {
      if (from && t.fecha < from) return false;
      if (to && t.fecha > to) return false;
      return true;
    });

    const map = new Map<string, { solicitados: number; finalizados: number }>();

    for (const t of rows) {
      const key = t.especialista_nombre || 'Sin nombre';
      const current = map.get(key) || { solicitados: 0, finalizados: 0 };
      current.solicitados++;
      if (t.estado === 'REALIZADO') current.finalizados++;
      map.set(key, current);
    }

    return Array.from(map.entries())
      .map(([medico, v]) => ({ medico, ...v }))
      .sort((a, b) => b.solicitados - a.solicitados);
  });

  @ViewChild('especialidadChart')
  especialidadChartRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('diaChart')
  diaChartRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('medicoChart')
  medicoChartRef?: ElementRef<HTMLCanvasElement>;

  private especialidadChart?: Chart;
  private diaChart?: Chart;
  private medicoChart?: Chart;

  async ngOnInit() {
    this.initDefaultRange();
    await this.loadData();
  }

  ngAfterViewInit() {
    this.refreshCharts();
  }

  private initDefaultRange() {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);

    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    const fromStr = from.toISOString().slice(0, 10);

    this.rangeFrom.set(fromStr);
    this.rangeTo.set(to);
  }

  private async loadData() {
    try {
      await Promise.all([this.loadLoginLogs(), this.loadAppointments()]);
      this.lastUpdated.set(new Date());
    } finally {
      this.loading.set(false);
      this.refreshCharts();
    }
  }

  private async loadLoginLogs() {
    const { data, error } = await this.sb
      .from('login_logs')
      .select('id, user_id, email, role, logged_at')
      .order('logged_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[admin/reports] loadLoginLogs', error);
      this.loginLogs.set([]);
      return;
    }

    this.loginLogs.set((data ?? []) as LoginLog[]);
  }

  private async loadAppointments() {
    const from = new Date();
    from.setMonth(from.getMonth() - 6);
    const fromStr = from.toISOString().slice(0, 10);

    const { data, error } = await this.sb
      .from('v_appointments_admin')
      .select(
        'fecha, hora, estado, especialidad_nombre, especialista_nombre, specialist_id'
      )
      .gte('fecha', fromStr)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) {
      console.error('[admin/reports] loadAppointments', error);
      this.turnosRaw.set([]);
      return;
    }

    this.turnosRaw.set((data ?? []) as TurnoAdmin[]);
  }

  onRangeChange(value: string, which: 'from' | 'to') {
    if (which === 'from') this.rangeFrom.set(value);
    else this.rangeTo.set(value);
    this.refreshCharts();
  }

  private refreshCharts() {
    setTimeout(() => {
      this.buildEspecialidadChart();
      this.buildDiaChart();
      this.buildMedicoChart();
    }, 0);
  }

  private buildEspecialidadChart() {
    const ref = this.especialidadChartRef;
    if (!ref) return;

    const ctx = ref.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.turnosPorEspecialidad();
    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.count);

    if (this.especialidadChart) this.especialidadChart.destroy();

    this.especialidadChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos',
            data: values,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    } as ChartConfiguration);
  }

  private buildDiaChart() {
    const ref = this.diaChartRef;
    if (!ref) return;

    const ctx = ref.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.turnosPorDia();
    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.count);

    if (this.diaChart) this.diaChart.destroy();

    this.diaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos por día',
            data: values,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    } as ChartConfiguration);
  }

  private buildMedicoChart() {
    const ref = this.medicoChartRef;
    if (!ref) return;

    const ctx = ref.nativeElement.getContext('2d');
    if (!ctx) return;

    const stats = this.medicoStats();
    const labels = stats.map((s) => s.medico);
    const solicitados = stats.map((s) => s.solicitados);
    const finalizados = stats.map((s) => s.finalizados);

    if (this.medicoChart) this.medicoChart.destroy();

    this.medicoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Solicitados',
            data: solicitados,
          },
          {
            label: 'Finalizados',
            data: finalizados,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    } as ChartConfiguration);
  }

  exportLoginsExcel() {
    const rows = this.loginLogs();

    if (!rows.length) {
      alert('No hay ingresos registrados para exportar.');
      return;
    }

    const data = rows.map((r) => {
      const d = new Date(r.logged_at);
      return {
        Usuario: r.email ?? '',
        Rol: r.role ?? '',
        Fecha: d.toLocaleDateString('es-AR'),
        Hora: d.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LogIngresos');

    const today = this.formatToday();
    XLSX.writeFile(wb, `log_ingresos_${today}.xlsx`);
  }

  exportLoginsPdf() {
    const rows = this.loginLogs();

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Log de ingresos al sistema', 14, 16);

    const body = rows.map((r) => {
      const d = new Date(r.logged_at);
      return [
        r.email ?? '',
        r.role ?? '',
        d.toLocaleDateString('es-AR'),
        d
          .toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
          .toString(),
      ];
    });

    autoTable(doc, {
      startY: 22,
      head: [['Usuario', 'Rol', 'Fecha', 'Hora']],
      body,
    });

    const today = this.formatToday();
    doc.save(`log_ingresos_${today}.pdf`);
  }

  exportEspecialidadExcel() {
    const rows = this.turnosPorEspecialidad();
    if (!rows.length) {
      alert('No hay turnos para exportar por especialidad.');
      return;
    }

    const data = rows.map((r) => ({
      Especialidad: r.label,
      Cantidad: r.count,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TurnosEspecialidad');

    const today = this.formatToday();
    XLSX.writeFile(wb, `turnos_por_especialidad_${today}.xlsx`);
  }

  exportEspecialidadPdf() {
    const rows = this.turnosPorEspecialidad();

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Turnos por especialidad', 14, 16);

    const body = rows.map((r) => [r.label, r.count.toString()]);

    autoTable(doc, {
      startY: 22,
      head: [['Especialidad', 'Cantidad de turnos']],
      body,
    });

    const today = this.formatToday();
    doc.save(`turnos_por_especialidad_${today}.pdf`);
  }

  exportDiaExcel() {
    const rows = this.turnosPorDia();
    if (!rows.length) {
      alert('No hay turnos para exportar por día.');
      return;
    }

    const data = rows.map((r) => ({
      Fecha: r.label,
      Cantidad: r.count,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TurnosPorDia');

    const today = this.formatToday();
    XLSX.writeFile(wb, `turnos_por_dia_${today}.xlsx`);
  }

  exportDiaPdf() {
    const rows = this.turnosPorDia();

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Turnos por día', 14, 16);

    const body = rows.map((r) => [r.label, r.count.toString()]);

    autoTable(doc, {
      startY: 22,
      head: [['Fecha', 'Cantidad de turnos']],
      body,
    });

    const today = this.formatToday();
    doc.save(`turnos_por_dia_${today}.pdf`);
  }

  exportMedicoExcel() {
    const rows = this.medicoStats();
    if (!rows.length) {
      alert('No hay datos de turnos por médico en el rango seleccionado.');
      return;
    }

    const data = rows.map((r) => ({
      Médico: r.medico,
      Solicitados: r.solicitados,
      Finalizados: r.finalizados,
      Desde: this.rangeFrom(),
      Hasta: this.rangeTo(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TurnosPorMedico');

    const today = this.formatToday();
    XLSX.writeFile(wb, `turnos_por_medico_${today}.xlsx`);
  }

  exportMedicoPdf() {
    const rows = this.medicoStats();

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Turnos por médico', 14, 16);

    const body = rows.map((r) => [
      r.medico,
      r.solicitados.toString(),
      r.finalizados.toString(),
    ]);

    autoTable(doc, {
      startY: 22,
      head: [['Médico', 'Solicitados', 'Finalizados']],
      body,
    });

    const today = this.formatToday();
    doc.save(`turnos_por_medico_${today}.pdf`);
  }

  private formatToday(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }
}
