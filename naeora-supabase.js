// Naéora — Connexion Supabase
// Ce fichier gère toute la communication avec la base de données

const SUPABASE_URL = 'https://psclvsiunfuqngrsepty.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2x2c2l1bmZ1cW5ncnNlcHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzA0OTksImV4cCI6MjA5OTAwNjQ5OX0.1tNXzAMJ_gAQVEM2xH25LX2B_z6rtiS6Qo_8IR_jlhE';

// Client Supabase léger (sans SDK complet, via fetch direct)
const supabase = {
  url: SUPABASE_URL,
  key: SUPABASE_KEY,

  headers(){
    const token = localStorage.getItem('naeora_access_token');
    return {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': token ? 'Bearer ' + token : 'Bearer ' + this.key
    };
  },

  // ── AUTH ──
  async signUp(email, password, prenom, date_naissance){
    const r = await fetch(this.url + '/auth/v1/signup', {
      method:'POST', headers:{'Content-Type':'application/json','apikey':this.key},
      body: JSON.stringify({ email, password, options:{ data:{ prenom, date_naissance } } })
    });
    const data = await r.json();
    if(data.access_token){ this._saveSession(data); }
    return data;
  },

  async signIn(email, password){
    const r = await fetch(this.url + '/auth/v1/token?grant_type=password', {
      method:'POST', headers:{'Content-Type':'application/json','apikey':this.key},
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if(data.access_token){ this._saveSession(data); }
    return data;
  },

  async signOut(){
    const token = localStorage.getItem('naeora_access_token');
    if(token){
      await fetch(this.url + '/auth/v1/logout', {
        method:'POST', headers: this.headers()
      });
    }
    localStorage.removeItem('naeora_access_token');
    localStorage.removeItem('naeora_refresh_token');
    localStorage.removeItem('naeora_user_id');
    localStorage.removeItem('naeora_profile');
    localStorage.removeItem('naeora_day_state');
  },

  async refreshSession(){
    const refresh = localStorage.getItem('naeora_refresh_token');
    if(!refresh) return null;
    const r = await fetch(this.url + '/auth/v1/token?grant_type=refresh_token', {
      method:'POST', headers:{'Content-Type':'application/json','apikey':this.key},
      body: JSON.stringify({ refresh_token: refresh })
    });
    const data = await r.json();
    if(data.access_token){ this._saveSession(data); return data; }
    return null;
  },

  _saveSession(data){
    localStorage.setItem('naeora_access_token', data.access_token);
    if(data.refresh_token) localStorage.setItem('naeora_refresh_token', data.refresh_token);
    if(data.user) localStorage.setItem('naeora_user_id', data.user.id);
  },

  isLoggedIn(){ return !!localStorage.getItem('naeora_access_token'); },
  getUserId(){ return localStorage.getItem('naeora_user_id'); },

  // ── MOT DE PASSE OUBLIÉ ──
  async resetPasswordForEmail(email, redirectTo){
    const r = await fetch(this.url + '/auth/v1/recover?redirect_to=' + encodeURIComponent(redirectTo), {
      method:'POST', headers:{'Content-Type':'application/json','apikey':this.key},
      body: JSON.stringify({ email })
    });
    if(r.ok) return { error: null };
    const data = await r.json().catch(function(){ return {}; });
    return { error: data.error_description || data.msg || 'Erreur inconnue' };
  },

  async updatePasswordWithToken(accessToken, newPassword){
    const r = await fetch(this.url + '/auth/v1/user', {
      method:'PUT',
      headers:{'Content-Type':'application/json','apikey':this.key,'Authorization':'Bearer ' + accessToken},
      body: JSON.stringify({ password: newPassword })
    });
    const data = await r.json().catch(function(){ return {}; });
    if(!r.ok){ return { error: data.error_description || data.msg || 'Erreur inconnue' }; }
    return { error: null, user: data };
  },

  // ── PROFIL ──
  async getProfile(){
    const cache = localStorage.getItem('naeora_profile');
    if(cache) return JSON.parse(cache);
    const r = await fetch(this.url + '/rest/v1/profiles?id=eq.' + this.getUserId() + '&limit=1', {
      headers: this.headers()
    });
    const data = await r.json();
    if(data && data[0]){
      localStorage.setItem('naeora_profile', JSON.stringify(data[0]));
      return data[0];
    }
    return null;
  },

  async updateProfile(fields){
    await fetch(this.url + '/rest/v1/profiles?id=eq.' + this.getUserId(), {
      method:'PATCH', headers:{...this.headers(),'Prefer':'return=minimal'},
      body: JSON.stringify(fields)
    });
    // Invalider le cache
    const cache = localStorage.getItem('naeora_profile');
    if(cache){
      const p = JSON.parse(cache);
      localStorage.setItem('naeora_profile', JSON.stringify({...p, ...fields}));
    }
  },

  // ── ÉTAT JOURNALIER ──
  _todayStr(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },

  async getDayState(force){
    const today = this._todayStr();
    const cacheKey = 'naeora_day_' + today;
    const cache = localStorage.getItem(cacheKey);
    if(cache && !force) return JSON.parse(cache);

    const r = await fetch(this.url + '/rest/v1/day_state?user_id=eq.' + this.getUserId() + '&date=eq.' + today + '&limit=1', {
      headers: this.headers()
    });
    const data = await r.json();
    if(data && data[0]){
      localStorage.setItem(cacheKey, JSON.stringify(data[0]));
      return data[0];
    }
    if(cache) return JSON.parse(cache);
    // Créer l'état du jour
    const newState = { user_id: this.getUserId(), date: today, matin_done:false, journee_count:0, soir_done:false, matin_phrase:'', last_journee_list:[] };
    await fetch(this.url + '/rest/v1/day_state', {
      method:'POST', headers:{...this.headers(),'Prefer':'return=minimal'},
      body: JSON.stringify(newState)
    });
    localStorage.setItem(cacheKey, JSON.stringify(newState));
    return newState;
  },

  async updateDayState(fields){
    const today = this._todayStr();
    const cacheKey = 'naeora_day_' + today;
    await fetch(this.url + '/rest/v1/day_state?user_id=eq.' + this.getUserId() + '&date=eq.' + today, {
      method:'PATCH', headers:{...this.headers(),'Prefer':'return=minimal'},
      body: JSON.stringify(fields)
    });
    const cache = localStorage.getItem(cacheKey);
    if(cache){
      localStorage.setItem(cacheKey, JSON.stringify({...JSON.parse(cache), ...fields}));
    }
  },

  // ── GRATITUDES ──
  async getGratitudes(force){
    const cache = localStorage.getItem('naeora_gratitudes');
    if(cache && !force) return JSON.parse(cache);
    const r = await fetch(this.url + '/rest/v1/gratitudes?user_id=eq.' + this.getUserId() + '&limit=1', {
      headers: this.headers()
    });
    const data = await r.json();
    if(data && data[0]){
      localStorage.setItem('naeora_gratitudes', JSON.stringify(data[0]));
      return data[0];
    }
    if(cache) return JSON.parse(cache);
    return { total_stars:0, positions:[] };
  },

  async updateGratitudes(total_stars, positions){
    await fetch(this.url + '/rest/v1/gratitudes?user_id=eq.' + this.getUserId(), {
      method:'PATCH', headers:{...this.headers(),'Prefer':'return=minimal'},
      body: JSON.stringify({ total_stars, positions, updated_at: new Date().toISOString() })
    });
    localStorage.setItem('naeora_gratitudes', JSON.stringify({ total_stars, positions }));
  }
};
