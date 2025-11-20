import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink, Router } from '@angular/router';
import { BackButtonComponent } from '../../shared/back-button/back-button.component';
import {
  HistoryService,
  ClinicalHistory,
} from '../../core/services/history.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type Perfil = {
  id: string;
  role: 'paciente' | 'especialista' | 'admin';
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  dni: string | null;
  edad: number | null;
  obra_social: string | null;
  avatar_url: string | null;
  specialties?: { id: string; nombre: string }[];
};

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, BackButtonComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private history = inject(HistoryService);

  historial = signal<ClinicalHistory[]>([]);

  private sb = inject(SupabaseClientService).client;
  private auth = inject(AuthService);

  perfil = signal<Perfil | null>(null);
  loading = signal(true);

  private getLogoPublicUrl(): string {
    return this.sb.storage.from('avatars').getPublicUrl('system/logo.png').data
      .publicUrl;
  }

  private async fetchImageAsDataURL(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('No se pudo cargar el logo para el PDF', e);
      return null;
    }
  }

  async descargarHistoriaPdf() {
    const perfil = this.perfil();
    const hist = this.historial();

    if (!perfil || perfil.role !== 'paciente' || !hist.length) {
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const marginX = 15;
    let currentY = 15;

    const logoUrl = this.getLogoPublicUrl();
    const logoData = await this.fetchImageAsDataURL(logoUrl);

    if (logoData) {
      doc.addImage(logoData, 'PNG', marginX, currentY, 20, 20);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Historia clínica', 105, currentY + 8, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`,
      105,
      currentY + 14,
      { align: 'center' }
    );

    currentY += 24;

    doc.setFontSize(11);
    doc.text(
      `Paciente: ${perfil.nombre ?? ''} ${perfil.apellido ?? ''}`,
      marginX,
      currentY
    );
    currentY += 6;

    if (perfil.dni) {
      doc.setFontSize(10);
      doc.text(`DNI: ${perfil.dni}`, marginX, currentY);
      currentY += 6;
    }

    if (perfil.obra_social) {
      doc.setFontSize(10);
      doc.text(`Obra social: ${perfil.obra_social}`, marginX, currentY);
      currentY += 6;
    }

    currentY += 4;

    const porProfesional = new Map<string, ClinicalHistory[]>();

    for (const h of hist) {
      const key = h.especialista_nombre || 'Profesional sin nombre';
      if (!porProfesional.has(key)) {
        porProfesional.set(key, []);
      }
      porProfesional.get(key)!.push(h);
    }

    porProfesional.forEach((atenciones, profesional) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Profesional: ${profesional}`, marginX, currentY);
      currentY += 4;

      atenciones.sort((a, b) =>
        (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || ''))
      );

      const body = atenciones.map((h) => {
        const fecha = h.fecha
          ? new Date(h.fecha as string).toLocaleDateString('es-AR')
          : '';

        const esp = h.especialidad_nombre || '';
        const altura = h.altura ? `${h.altura} cm` : '—';
        const peso = h.peso ? `${h.peso} kg` : '—';
        const temp = h.temperatura ? `${h.temperatura} °C` : '—';
        const pres = h.presion || '—';

        const extrasTxt = (h.extras || [])
          .map((e: any) => `${e.key}: ${e.value}`)
          .join(' • ');

        const notas = [h.detalle || '', extrasTxt]
          .filter((x) => !!x)
          .join('\n');

        return [fecha, esp, altura, peso, temp, pres, notas];
      });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            'Fecha',
            'Especialidad',
            'Altura',
            'Peso',
            'Temp.',
            'Presión',
            'Detalle / Datos adicionales',
          ],
        ],
        body,
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [13, 110, 253],
          textColor: 255,
        },
        theme: 'striped',
        margin: { left: marginX, right: marginX },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    });

    const fechaNombre = new Date().toISOString().slice(0, 10);
    doc.save(`historia_clinica_${fechaNombre}.pdf`);
  }

  async ngOnInit() {
    const user = await this.auth.getCurrentUser();
    if (!user) return;

    const { data: p } = await this.sb
      .from('profiles')
      .select(
        'id, role, nombre, apellido, email, dni, edad, obra_social, avatar_url'
      )
      .eq('id', user.id)
      .maybeSingle();

    let specs: { id: string; nombre: string }[] = [];
    if (p?.role === 'especialista') {
      const { data: rows } = await this.sb
        .from('profile_specialty')
        .select('specialty: specialty_id (id, nombre)')
        .eq('profile_id', user.id);

      specs = (rows ?? []).map((r: any) => r.specialty).filter(Boolean);
    }

    const avatar = p?.avatar_url
      ? this.sb.storage.from('avatars').getPublicUrl(p.avatar_url).data
          .publicUrl
      : this.sb.storage.from('avatars').getPublicUrl('system/user.jpg').data
          .publicUrl;

    this.perfil.set({
      ...(p as Perfil),
      avatar_url: avatar,
      specialties: specs,
    });

    if (p?.role === 'paciente') {
      const hist = await this.history.listForCurrentPatient();
      this.historial.set(hist);
    }

    this.loading.set(false);
  }
}
