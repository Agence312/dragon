import { ELEMENTS, defaultMoves } from './data.js'

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v))
const strip = (s)=> s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')

export const STAGE_THRESHOLDS = { hatchling: 5, juvenile: 20, adult: 50 }

export const initialState = {
  name: null,
  stage: 'egg',
  align: 'neutral', // 'gentle' | 'neutral' | 'evil'
  element: 'vent', // par défaut, reconfiguré à l'adolescence
  xp: 0,
  affection: 0,
  temper: 0,
  energy: 8,
  hunger: 50, // 0..100
  hygiene: 60,
  fun: 55,
  rest: 60,
  mood: 60,
  moves: defaultMoves('vent'),
  lang: 'fr',
  log: [ { who:'system', text:"Un œuf mystérieux repose dans un nid chaud. Prends-en soin et parle-lui." } ],
  achievements: {},
}

export function stageFromXP(xp){
  if (xp >= STAGE_THRESHOLDS.adult) return 'adult'
  if (xp >= STAGE_THRESHOLDS.juvenile) return 'juvenile'
  if (xp >= STAGE_THRESHOLDS.hatchling) return 'hatchling'
  return 'egg'
}

export function nextAlignment(affection, temper){
  const d = affection - temper
  if (d >= 5) return 'gentle'
  if (d <= -5) return 'evil'
  return 'neutral'
}

export function elementFromText(text, current){
  const t = ' '+strip(text)+' '
  if (t.includes(' feu ')) return 'feu'
  if (t.includes(' eau ')) return 'eau'
  if (t.includes(' vent ') || t.includes(' air ')) return 'vent'
  if (t.includes(' terre ') || t.includes(' roc ') || t.includes(' pierre ')) return 'terre'
  if (t.includes(' lumiere ') || t.includes(' lumière ')) return 'lumiere'
  if (t.includes(' ombre ') || t.includes(' nuit ')) return 'ombre'
  return current
}

export function computeIntent(text){
  const t = ' '+strip(text)+' '
  const pos = ['bonjour','salut','bravo','merci','gentil','aime','amour','ami','protege','soigne','doux','sage','content','heureux','plaisir','joue','chante','danse','bien','cool','super']
  const neg = ['attaque','brule','detruire','casse','vole','hurle','crie','mechant','haine','deteste','menace','griffe','mords','agresse','frappe']
  let score = 0
  pos.forEach(w=>{ if (t.includes(' '+w+' ')) score+=1 })
  neg.forEach(w=>{ if (t.includes(' '+w+' ')) score-=1 })
  let intent='talk'
  const intents={
    sleep:['dors','dodo','endors','sieste','repos'],
    feed:['mange','manger','nourris','nourrir','miam','repas'],
    play:['joue','jouer','jeu','amuse-toi'],
    wash:['lave','laver','bain','nettoie','nettoyer'],
    soothe:['calme','calmer','caresse','calin','rassure'],
    attack:['attaque','brule','detruis','mords','griffe','ecrase'],
    sing:['chante','chanson','la la la','musique']
  }
  for (const [k,ws] of Object.entries(intents)){
    if (ws.some(w=> t.includes(' '+w+' '))){ intent=k; break }
  }
  const hatch = ['eclore','eclot','reveille','reveille-toi','revele-toi','bonjour','salut','coucou'].some(w=>t.includes(' '+w+' '))
  const nameMatch = /(?:je t'app(?:elle)?|tu t'appelles|ton nom est)\s+([a-zA-Z\-]{2,20})/i.exec(text)
  const proposedName = nameMatch ? nameMatch[1] : null
  return { score, intent, hatch, proposedName }
}

export function tickNeeds(s){ // passive decay
  let hunger = clamp(s.hunger - 0.5, 0, 100)
  let hygiene = clamp(s.hygiene - 0.25, 0, 100)
  let fun = clamp(s.fun - 0.35, 0, 100)
  let rest = clamp(s.rest - 0.3, 0, 100)
  // mood influenced by needs
  const mood = clamp((hunger + hygiene + fun + rest)/4, 0, 100)
  return { ...s, hunger, hygiene, fun, rest, mood }
}

export function applyCare(s, action){ // buttons
  let log = []
  let { hunger, hygiene, fun, rest, energy, xp } = s
  let actionKey = 'idle'
  if (action==='feed'){ hunger = clamp(hunger + 28, 0, 100); energy = clamp(energy + 1, 0, 10); xp += 1; actionKey='feed' }
  if (action==='wash'){ hygiene = clamp(hygiene + 30, 0, 100); xp += 1; actionKey='wash' }
  if (action==='play'){ fun = clamp(fun + 26, 0, 100); energy = clamp(energy - 1, 0, 10); xp += 2; actionKey='play' }
  if (action==='sleep'){ rest = clamp(rest + 32, 0, 100); energy = clamp(energy + 3, 0, 10); xp += 1; actionKey='sleep' }
  const mood = clamp((hunger + hygiene + fun + rest)/4, 0, 100)
  return { ...s, hunger, hygiene, fun, rest, mood, energy, xp, action:actionKey, log: [...s.log, { who:'dragon', text: reactionLine(action) }] }
}

function reactionLine(action){
  const lines={
    feed:['Miam !','Merci !'],
    wash:['Tout propre !','Ça chatouille !'],
    play:['On joue ? ✨','Haha !'],
    sleep:['*bâillement*','À plus tard…'],
  }[action] || ['*ronronnement draconique*']
  return lines[Math.floor(Math.random()*lines.length)]
}
