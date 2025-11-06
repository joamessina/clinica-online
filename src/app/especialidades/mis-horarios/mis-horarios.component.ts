import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpecialtyService } from '../../core/services/specialty.service';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';

@Component({
  standalone: true,
  selector: 'app-mis-horarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.scss'],
})
export class MisHorariosComponent implements OnInit {
  private sb = inject(SupabaseClientService).client;
  private specSvc = inject(SpecialtyService);

  specialties:any[]=[]; avail:any[]=[];
  form = { specialty:null as string|null, weekday:1, desde:'09:00', hasta:'12:00', slot:30 };

  async ngOnInit(){
    const { data } = await this.specSvc.listActive(); this.specialties = data ?? [];
    await this.loadAvail();
  }
  async loadAvail(){ const {data}=await this.sb.from('v_availability_me').select('*').order('weekday'); this.avail=data??[]; }
  async add(){
    if(!this.form.specialty) return;
    const { error } = await this.sb.rpc('fn_add_availability', {
      _specialty: this.form.specialty, _weekday: this.form.weekday,
      _desde: this.form.desde+':00', _hasta: this.form.hasta+':00', _slot: this.form.slot
    });
    if (error) { alert(error.message); return; }
    await this.loadAvail();
  }
}
