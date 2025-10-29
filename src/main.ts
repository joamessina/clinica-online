import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

(function selfCleanLegacySupabaseKeys() {
  try {
    const keep = 'clinicaonline-auth';
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('sb-') && !k.includes(keep)) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
})();


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
