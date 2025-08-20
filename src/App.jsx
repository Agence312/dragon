import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react'
const lexicon = {
  fr: {
    positive: ['bonjour','salut','bravo','merci','gentil','aime','amour','calin','bisou','ami','protege','soigne','doux','sage','content','heureux','plaisir','joue','chante','danse','s il te plait','please','bien','cool','super'],
    negative: ['attaque','brule','detruire','casse','vole','hurle','crie','mechant','haine','deteste','menace','griffe','mords','agresse','frappe'],
    intents: { sleep:['dors','dodo','endors','sieste','calme-toi','repose-toi'], feed:['mange','manger','nourris','nourrir','miam','repas'], play:['joue','jouer','jeu','amuse-toi'], soothe:['calme','calmer','caresse','calin','rassure'], attack:['attaque','brule','detruis','mords','griffe','ecrase'], sing:['chante','chanson','la la la','musique'] },
    hatchHints: ['eclore','eclot','reveille','reveil','reveille-toi','revele-toi','bonjour','salut','coucou'],
    nameRegex: /(?:je t'app(?:elle)?|tu t'appelles|ton nom est)\s+([a-zA-Z\-]{2,20})/i,
    ui: { appTitle:'Dragon parleur', placeholder:'Dis quelque chose au dragon…', talk:'Parler', reset:'Réinitialiser', affection:'Affection', temper:'Tempérament', energy:'Énergie', xp:'XP', stageTitle:'Étapes', help: 'Conseil : parle-lui gentiment pour l\'aider à éclore. Essaie « Bonjour », « Réveille-toi », ou donne-lui un nom : « Je t\'appelle Lumi ».' },
    stages: { egg:'Œuf', hatchling:'Bébé', juvenile:'Jeune', adult:'Adulte' },
    align: { gentle:'Gentil', neutral:'Neutre', evil:'Méchant' },
  },
  en: {
    positive: ['hello','hi','bravo','thanks','kind','love','hug','kiss','friend','protect','heal','nice','good','happy','play','sing','dance','please','cool','great'],
    negative: ['attack','burn','destroy','break','steal','shout','scream','evil','hate','threaten','scratch','bite','hit'],
    intents: { sleep:['sleep','nap','rest'], feed:['eat','food','feed'], play:['play'], soothe:['calm','soothe','pet','hug'], attack:['attack','burn','destroy','bite','scratch'], sing:['sing','song','la la la'] },
    hatchHints: ['hatch','wake','hello','hi','rise'],
    nameRegex: /(?:your name is|i call you)\s+([a-zA-Z\-]{2,20})/i,
    ui: { appTitle:'Talking Dragon', placeholder:'Say something to the dragon…', talk:'Talk', reset:'Reset', affection:'Affection', temper:'Temper', energy:'Energy', xp:'XP', stageTitle:'Stages', help:'Tip: be kind to help it hatch. Try “Hello”, “Wake up”, or give it a name: “I call you Lumi”.' },
    stages: { egg:'Egg', hatchling:'Hatchling', juvenile:'Juvenile', adult:'Adult' },
    align: { gentle:'Gentle', neutral:'Neutral', evil:'Evil' },
  }
}
const removeDiacritics = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v))
const STAGE_THRESHOLDS = { hatchling:5, juvenile:20, adult:50 }
const stageFromXP = (xp)=> xp>=50?'adult': xp>=20?'juvenile': xp>=5?'hatchling':'egg'
const nextAlignment = (affection, temper)=> (affection-temper)>=5?'gentle': (affection-temper)<=-5?'evil':'neutral'
function computeIntent(text, dict){
  const t = ' ' + removeDiacritics(text) + ' '
  let score = 0
  for (const w of dict.positive) if (t.includes(' '+removeDiacritics(w)+' ')) score += 1
  for (const w of dict.negative) if (t.includes(' '+removeDiacritics(w)+' ')) score -= 1
  let intent = 'talk'
  for (const [key, words] of Object.entries(dict.intents)){
    for (const w of words){ if (t.includes(' '+removeDiacritics(w)+' ')){ intent=key; break } }
    if (intent!=='talk') break
  }
  const hatchHint = dict.hatchHints.some(w=> t.includes(' '+removeDiacritics(w)+' '))
  const nameMatch = dict.nameRegex.exec(text)
  const proposedName = nameMatch ? nameMatch[1] : null
  return { score, intent, hatchHint, proposedName }
}
function lineFor({ align, intent }){
  const friendly = { talk:["Je t'écoute !","J'apprends vite."], feed:["Miam !","Merci !"], play:["On joue ? ✨","Je cours après la lumière."], sleep:["*bâillement*","Bonne nuit…"], soothe:["Je me sens en sécurité.","Merci pour la douceur."], attack:["Je préfère protéger.","Pas besoin de blesser."], sing:["La‑la‑la 🎶","Une ballade ancienne s'élève."] }
  const neutral  = { talk:["...","Hmm ?"], feed:["Je mange.","D'accord."], play:["Pourquoi pas.","Un peu."], sleep:["Repos.","Je ferme les yeux."], soothe:["Je suis calme.","Bien."], attack:["Je réfléchis…","Plus tard."], sing:["Hum hum.","♪"] }
  const evil     = { talk:["Parle, humain.","Tes mots me fortifient."], feed:["Plus.","Des fruits suffiront."], play:["Je m'entraîne.","Des jeux dangereux."], sleep:["Je guette dans l'ombre.","Un bref repos."], soothe:["Je n'ai pas besoin d'être apaisé.","Tsss."], attack:["Grrr… (en imagination)","Que tout s'embrase…"], sing:["Un chant sombre résonne.","Hmmm."] }
  const bank = align==='gentle'?friendly: align==='evil'?evil:neutral
  const arr = bank[intent] || bank.talk
  return arr[Math.floor(Math.random()*arr.length)]
}
const initialState = { name:null, stage:'egg', align:'neutral', xp:0, affection:0, temper:0, energy:7, lang:'fr', log:[{who:'system', text:"Un œuf mystérieux repose dans un nid chaud. Parle-lui pour le révéler."}], achievements:{} }
const SAVE_KEY = 'dragon-save-vite-v1'
function reducer(state, action){
  switch(action.type){
    case 'reset': return { ...initialState, lang: state.lang }
    case 'import': return { ...state, ...action.payload }
    case 'lang': return { ...state, lang: action.lang }
    case 'speak': {
      const { dict, text } = action
      if (!text.trim()) return state
      const { score, intent, hatchHint, proposedName } = computeIntent(text, dict)
      let affection = state.affection + Math.max(0, score)
      let temper = state.temper + Math.max(0, -score)
      let energy = clamp(state.energy - 1 + (intent==='sleep'?2:0) + (intent==='feed'?2:0), 0, 10)
      let xp = state.xp + 1 + (intent==='play'?1:0)
      let stage = state.stage
      const canHatch = stage==='egg' && (hatchHint || (xp>=5 && affection>=2))
      let narrative = []
      if (canHatch){ stage='hatchling'; xp = Math.max(xp,5); narrative.push({who:'dragon',text:'🐣 *Craaack* … Bonjour.'}) }
      const align = nextAlignment(affection, temper)
      let name = state.name
      if (!name && proposedName){ name=proposedName; narrative.push({who:'dragon', text:`Je m'appellerai ${name}.`}) }
      if (intent==='attack' && align==='gentle'){ temper = Math.max(0, temper-1); affection = Math.min(30, affection+1) }
      const reply = lineFor({ align, intent })
      const ach = { ...state.achievements }
      if (stage==='hatchling' && !ach.hatched) ach.hatched = true
      if (name && !ach.named) ach.named = true
      if (align==='gentle' && (state.align!=='gentle') && !ach.gentlePath) ach.gentlePath = true
      if (align==='evil' && (state.align!=='evil') && !ach.evilPath) ach.evilPath = true
      return { ...state, name, stage: stageFromXP(xp), align, xp, affection: Math.min(30,Math.max(0,affection)), temper: Math.min(30,Math.max(0,temper)), energy, achievements: ach, log:[...state.log, {who:'you', text}, {who:'dragon', text:reply}, ...narrative] }
    }
    default: return state
  }
}
function StatBar({ label, value, max }){
  const pct = Math.round((value/max)*100)
  return (<div className="stat"><div className="stat-top"><span>{label}</span><span>{value}/{max}</span></div><div className="bar"><div className="fill" style={{width: pct+'%'}}/></div></div>)
}
export default function App(){
  const [state, dispatch] = React.useReducer(reducer, initialState, (init)=>{
    try{ const raw = localStorage.getItem(SAVE_KEY); return raw? { ...init, ...JSON.parse(raw) } : init }catch{return init}
  })
  const [input, setInput] = useState('')
  const logRef = useRef(null)
  const dict = useMemo(()=> lexicon[state.lang] ?? lexicon.fr, [state.lang])
  useEffect(()=>{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)) }, [state])
  useEffect(()=>{ if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [state.log.length])
  const stageLabel = dict.stages[state.stage]
  const alignLabel = { gentle: dict.align.gentle, neutral: dict.align.neutral, evil: dict.align.evil }[state.align]
  const hour = (new Date()).getHours()
  const isNight = hour < 7 || hour > 20
  const talk = ()=>{ dispatch({ type:'speak', dict, text: input }); setInput('') }
  const exportSave = ()=>{ const data = btoa(unescape(encodeURIComponent(JSON.stringify(state)))); navigator.clipboard.writeText(data); alert('Sauvegarde copiée dans le presse‑papiers.') }
  const importSave = async ()=>{ const data = prompt('Colle ici une sauvegarde exportée :'); if (!data) return; try{ const json=JSON.parse(decodeURIComponent(escape(atob(data)))); dispatch({ type:'import', payload: json }) }catch{ alert('Import invalide.') } }
  return (
    <div className={'page '+(isNight?'night':'')}>
      <header className="top">
        <h1>🐉 {dict.ui.appTitle}</h1>
        <div className="actions">
          <button className="ghost" onClick={()=>dispatch({type:'reset'})}>{dict.ui.reset}</button>
          <select value={state.lang} onChange={(e)=>dispatch({type:'lang', lang:e.target.value})}>
            <option value="fr">FR</option><option value="en">EN</option>
          </select>
        </div>
      </header>
      <main className="layout">
        <section className="left">
          <div className="avatar" title={`État: ${stageLabel} • Alignement: ${alignLabel}`}><span className="emoji">{state.stage==='egg'?'🥚':state.stage==='hatchling'?'🐣':state.stage==='juvenile'?'🐲':'🐉'}</span></div>
          <div className="chips"><span className="chip">{stageLabel}</span><span className="chip alt">{alignLabel}</span><span className="chip">XP {state.xp}</span></div>
          <StatBar label={dict.ui.affection} value={state.affection} max={30} />
          <StatBar label={dict.ui.temper} value={state.temper} max={30} />
          <StatBar label={dict.ui.energy} value={state.energy} max={10} />
          <div className="hint">{dict.ui.help}</div>
          <div className="panel"><button onClick={exportSave}>Exporter</button><button className="ghost" onClick={importSave}>Importer</button></div>
          <div className="panel small"><h3>Succès</h3><ul className="ach">
            <li className={state.achievements.hatched?'ok':''}>Éclosion</li>
            <li className={state.achievements.named?'ok':''}>Baptême</li>
            <li className={state.achievements.gentlePath?'ok':''}>Chemin de lumière</li>
            <li className={state.achievements.evilPath?'ok':''}>Chemin d'ombre</li>
          </ul></div>
        </section>
        <section className="right">
          <div ref={logRef} className="log">{state.log.map((m,i)=> (<div key={i} className={'msg '+m.who}>{m.text}</div>))}</div>
          <div className="composer">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter') talk() }} placeholder={dict.ui.placeholder} aria-label={dict.ui.placeholder} autoFocus/>
            <button onClick={talk}>{dict.ui.talk}</button>
          </div>
        </section>
      </main>
      <footer className="foot"><div>Étapes : Œuf → Bébé (5 XP) → Jeune (20 XP) → Adulte (50 XP)</div><div>Intents : dors, mange, joue, calme, attaque, chante + texte libre.</div></footer>
    </div>
  )
}
