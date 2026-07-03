// Naéora — état partagé du jour

function naeoraTodayStr(){
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

function naeoraIsSubscriber(){
  return localStorage.getItem('naeora_subscriber') === 'true';
}

function naeoraGetState(){
  var raw = localStorage.getItem('naeora_day_state');
  var state = raw ? JSON.parse(raw) : null;
  var today = naeoraTodayStr();
  if(!state || state.date !== today){
    state = {
      date: today,
      matin: false,
      journeeCount: 0,   // nb d'exercices journée faits aujourd'hui
      soir: false,
      lastJourneeList: state ? (state.lastJourneeList || []) : []
    };
    localStorage.setItem('naeora_day_state', JSON.stringify(state));
  }
  return state;
}

function naeoraMarkDone(key){
  var state = naeoraGetState();
  if(key === 'journee'){
    state.journeeCount = (state.journeeCount || 0) + 1;
  } else {
    state[key] = true;
  }
  localStorage.setItem('naeora_day_state', JSON.stringify(state));
}

function naeoraIsDone(key){
  var state = naeoraGetState();
  var sub = naeoraIsSubscriber();
  if(key === 'journee'){
    var max = sub ? 2 : 1;
    return (state.journeeCount || 0) >= max;
  }
  return !!state[key];
}

function naeoraJourneeCount(){
  return naeoraGetState().journeeCount || 0;
}

function naeoraPickJourneyExercise(){
  var pool = ['lettre', 'hooponopono', 'envol', 'echo', 'dialogue', 'source', 'pendule_explain'];
  var state = naeoraGetState();
  var lastList = state.lastJourneeList || [];
  var choices = pool.filter(function(p){ return lastList.indexOf(p) === -1; });
  if(choices.length === 0) choices = pool;
  var choice = choices[Math.floor(Math.random() * choices.length)];
  lastList.push(choice);
  if(lastList.length > 2) lastList.shift();
  state.lastJourneeList = lastList;
  localStorage.setItem('naeora_day_state', JSON.stringify(state));
  naeoraNav(choice);
}
