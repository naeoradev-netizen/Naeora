// Naéora — état partagé (hybride localStorage + Supabase)

function naeoraIsSubscriber(){
  var p = localStorage.getItem('naeora_profile');
  if(p){
    try{
      var profil = JSON.parse(p);
      if(profil.is_subscriber !== true) return false;
      if(profil.subscriber_until){
        var until = new Date(profil.subscriber_until);
        if(!isNaN(until.getTime()) && until.getTime() < Date.now()) return false;
      }
      return true;
    }catch(e){}
  }
  return false;
}

function naeoraTodayStr(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function naeoraGetState(){
  var today = naeoraTodayStr();
  var cacheKey = 'naeora_day_' + today;
  var raw = localStorage.getItem(cacheKey);
  var state = raw ? JSON.parse(raw) : null;
  if(!state){
    state = { date:today, matin_done:false, journee_count:0, soir_done:false, matin_phrase:'', last_journee_list:[] };
    localStorage.setItem(cacheKey, JSON.stringify(state));
  }
  return state;
}

function naeoraMarkDone(key){
  var state = naeoraGetState();
  var today = naeoraTodayStr();
  var cacheKey = 'naeora_day_' + today;
  var fields = {};
  if(key === 'journee'){
    state.journee_count = (state.journee_count || 0) + 1;
    fields.journee_count = state.journee_count;
  } else {
    state[key + '_done'] = true;
    fields[key + '_done'] = true;
  }
  localStorage.setItem(cacheKey, JSON.stringify(state));
  // Sync Supabase en arrière-plan si connecté
  if(typeof supabase !== 'undefined' && supabase.isLoggedIn()){
    supabase.updateDayState(fields).catch(function(){});
  }
}

function naeoraIsDone(key){
  var state = naeoraGetState();
  var sub = naeoraIsSubscriber();
  if(key === 'journee'){
    var max = sub ? 2 : 1;
    return (state.journee_count || 0) >= max;
  }
  return !!state[key + '_done'];
}

function naeoraJourneeCount(){
  return naeoraGetState().journee_count || 0;
}

function naeoraPickJourneyExercise(){
  // Offre gratuite : un seul exercice de journée disponible, toujours le même.
  if(typeof naeoraIsSubscriber !== 'undefined' && !naeoraIsSubscriber()){
    naeoraNav('lettre');
    return;
  }
  // Abonnées Horizon : tirage aléatoire parmi le pool complet, avec anti-répétition.
  var pool = ['lettre', 'hooponopono', 'envol', 'echo', 'dialogue', 'source', 'pendule_explain'];
  var state = naeoraGetState();
  var today = naeoraTodayStr();
  var cacheKey = 'naeora_day_' + today;
  var lastList = state.last_journee_list || [];
  var choices = pool.filter(function(p){ return lastList.indexOf(p) === -1; });
  if(choices.length === 0) choices = pool;
  var choice = choices[Math.floor(Math.random() * choices.length)];
  lastList.push(choice);
  if(lastList.length > 2) lastList.shift();
  state.last_journee_list = lastList;
  localStorage.setItem(cacheKey, JSON.stringify(state));
  if(typeof supabase !== 'undefined' && supabase.isLoggedIn()){
    supabase.updateDayState({ last_journee_list: lastList }).catch(function(){});
  }
  naeoraNav(choice);
}

// Chargement initial depuis Supabase si connecté (sync au démarrage)
(function(){
  if(typeof supabase === 'undefined' || !supabase.isLoggedIn()) return;
  var today = naeoraTodayStr();
  var cacheKey = 'naeora_day_' + today;
  if(localStorage.getItem(cacheKey)) return; // déjà en cache
  supabase.getDayState().then(function(data){
    if(data){
      var state = {
        date: today,
        matin_done: data.matin_done || false,
        journee_count: data.journee_count || 0,
        soir_done: data.soir_done || false,
        matin_phrase: data.matin_phrase || '',
        last_journee_list: data.last_journee_list || []
      };
      localStorage.setItem(cacheKey, JSON.stringify(state));
    }
  }).catch(function(){});
})();
