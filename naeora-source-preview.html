// Naéora — état partagé du jour (rituels accomplis, dernier exercice tiré)
// Stocké en localStorage, réinitialisé automatiquement chaque nouveau jour.

function naeoraTodayStr(){
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

function naeoraGetState(){
  var raw = localStorage.getItem('naeora_day_state');
  var state = raw ? JSON.parse(raw) : null;
  var today = naeoraTodayStr();
  if(!state || state.date !== today){
    state = { date: today, matin: false, journee: false, soir: false, lastJournee: state ? state.lastJournee : null };
    localStorage.setItem('naeora_day_state', JSON.stringify(state));
  }
  return state;
}

function naeoraMarkDone(key){
  var state = naeoraGetState();
  state[key] = true;
  localStorage.setItem('naeora_day_state', JSON.stringify(state));
}

function naeoraIsDone(key){
  return !!naeoraGetState()[key];
}

function naeoraPickJourneyExercise(){
  // Pool des exercices abonnés tirés au hasard (la Lettre de libération sera ajoutée
  // ici une fois son écran construit).
  var pool = ['hooponopono', 'envol', 'echo', 'dialogue', 'source', 'pendule_explain'];
  var state = naeoraGetState();
  var choices = pool;
  if(state.lastJournee && pool.length > 1){
    choices = pool.filter(function(p){ return p !== state.lastJournee; });
  }
  var choice = choices[Math.floor(Math.random() * choices.length)];
  state.lastJournee = choice;
  localStorage.setItem('naeora_day_state', JSON.stringify(state));
  naeoraNav(choice);
}
