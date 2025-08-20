import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * App mobile-first qui met l'œuf/dragon au centre + dictée vocale (Web Speech API).
 * ➜ Remplace ton fichier src/App.jsx par ce composant.
 * ⚠️ Nécessite framer-motion (déjà présent dans la version TAMA × POKE fournie).
 * ✨ Bonus : barre d’actions façon bottom sheet, grosses cibles tactiles, animations.
 */

// --- Moteur minimal (compatible avec le state existant de la version TAMA×POKE) ---
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const strip = (s)=> s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const STAGE = { EGG:'egg', HATCH:'hatchling', JUV:'juvenile', ADULT:'adult' }

function stageFromXP(xp){ if (xp>=50) return STAGE.ADULT; if (xp>=20) return STAGE.JUV; if (xp>=5) return STAGE.HATCH; return STAGE.EGG }
function nextAlignment(aff, temp){ const d = aff - temp; if (d>=5) return 'gentle'; if (d<=-5) return 'evil'; return 'neutral' }

function computeIntent(text){
  const t = ' '+strip(text)+' '
  const pos = ['bonjour','salut','merci','gentil','aime','amour','ami','protege','soigne','doux','sage','content','heureux','plaisir','joue','chante','danse','bien','cool','super']
  const neg = ['attaque','brule','detruire','casse','vole','hurle','crie','mechant','haine','deteste','menace','griffe','mords','agresse','frappe']
  let score = 0
  pos.forEach(w=> t.includes(' '+w+' ') && (score+=1))
  neg.forEach(w=> t.includes(' '+w+' ') && (score-=1))
  const intents = {
    sleep:['dors','dodo','endors','sieste','repos'],
    feed:['mange','manger','nourris','nourrir','miam','repas'],
    play:['joue','jouer','jeu','amuse-toi'],
    wash:['lave','laver','bain','nettoie','nettoyer'],
    soothe:['calme','calmer','caresse','calin','rassure'],
    attack:['attaque','brule','detruis','mords','griffe','ecrase'],
    sing:['chante','chanson','la la la','musique']
  }
  let intent='talk'
  for (const [k,ws] of Object.entries(intents)) if (ws.some(w=> t.includes(' '+w+' '))) { intent=k; break }
  const hatch = ['eclore','eclot','reveille','reveille-toi','revele-toi','bonjour','salut','coucou'].some(w=>t.includes(' '+w+' '))
  const nameMatch = /(?:je t'app(?:elle)?|tu t'appelles|ton nom est)\s+([a-zA-Z\-]{2,20})/i.exec(text)
  const proposedName = nameMatch ? nameMatch[1] : null
  return { score, intent, hatch, proposedName }
}

const initialState = {
  name:null, stage:STAGE.EGG, align:'neutral', xp:0, affection:0, temper:0, energy:8,
  hunger:55, hygiene:60, fun:55, rest:60, mood:60, action:'idle',
  log:[{ who:'system', text:"Un œuf mystérieux t'écoute. Parle-lui ou prends-en soin." }]
}

function tickNeeds(s){
  const hunger = clamp(s.hunger - 0.4, 0, 100)
  const hygiene = clamp(s.hygiene - 0.25, 0, 100)
  const fun = clamp(s.fun - 0.35, 0, 100)
  const rest = clamp(s.rest - 0.3, 0, 100)
  const mood = clamp((hunger+hygiene+fun+rest)/4, 0, 100)
  return { ...s, hunger, hygiene, fun, rest, mood }
}

function reactionFor(align, intent){
  const friendly = { sleep:['Dors bien.'], feed:['Miam !'], play:['On joue ?'], wash:['Tout propre !'], attack:["Je préfère protéger."], sing:['La-la-la 🎶'], talk:["Je t'écoute !"] }
  const neutral  = { sleep:['Repos.'], feed:['D\'accord.'], play:['Pourquoi pas.'], wash:['Bien.'], attack:['Plus tard.'], sing:['♪'], talk:['...'] }
  const evil     = { sleep:['Je veille…'], feed:['Plus.'], play:["Je m'entraîne."], wash:['Tsss.'], attack:['Grrr… (entraînement)'], sing:['Hmmm.'], talk:['Parle, humain.'] }
  const bank = align==='gentle'?friendly: align==='evil'?evil:neutral
  return (bank[intent]||bank.talk)[0]
}

function reducer(state, action){
  switch(action.type){
    case 'reset': return { ...initialState }
    case 'tick': return tickNeeds(state)
    case 'care': {
      let { hunger, hygiene, fun, rest, energy, xp } = state
      let act='idle', line=''
      if (action.key==='feed'){ hunger=clamp(hunger+28,0,100); energy=clamp(energy+1,0,10); xp+=1; act='feed'; line='Miam !' }
      if (action.key==='wash'){ hygiene=clamp(hygiene+30,0,100); xp+=1; act='wash'; line='Tout propre !' }
      if (action.key==='play'){ fun=clamp(fun+26,0,100); energy=clamp(energy-1,0,10); xp+=2; act='play'; line='Haha !' }
      if (action.key==='sleep'){ rest=clamp(rest+32,0,100); energy=clamp(energy+3,0,10); xp+=1; act='sleep'; line='Zzz…' }
      const mood = clamp((hunger+hygiene+fun+rest)/4,0,100)
      return { ...state, hunger, hygiene, fun, rest, energy, xp, mood, action:act, log:[...state.log, { who:'dragon', text: line }] }
    }
    case 'speak': {
      const text = action.text
      if (!text.trim()) return state
      const { score, intent, hatch, proposedName } = computeIntent(text)
      let affection = state.affection + Math.max(0, score)
      let temper = state.temper + Math.max(0, -score)
      let energy = clamp(state.energy - 1 + (intent==='sleep'?2:0), 0, 10)
      let xp = state.xp + 1 + (intent==='play'?1:0)
      let stage = state.stage
      let logs = [{ who:'you', text }]

      if (stage===STAGE.EGG && (hatch || (xp>=5 && affection>=2))){
        stage = STAGE.HATCH
        xp = Math.max(xp, 5)
        logs.push({ who:'dragon', text:'🐣 *Craaack* … Bonjour.' })
      }
      const align = nextAlignment(affection, temper)
      let name = state.name
      if (!name && proposedName){ name = proposedName; logs.push({ who:'dragon', text:`Je m'appellerai ${name}.` }) }
      if (intent==='attack' && align==='gentle'){ temper = Math.max(0, temper-1); affection = Math.min(30, affection+1) }
      const reply = reactionFor(align, intent)

      return { ...state,
        name, stage: stageFromXP(xp), align, xp,
        affection: clamp(affection,0,30), temper: clamp(temper,0,30), energy,
        action: intent==='sleep'?'sleep': intent==='play'?'play': intent==='feed'?'feed': intent==='wash'?'wash':'idle',
        log: [...state.log, ...logs, { who:'dragon', text: reply }]
      }
    }
    default: return state
  }
}

// --- Hook de dictée (Web Speech API) ---
function useSpeechRecognition({ onFinal, lang='fr-FR' }){
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(()=>{
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e)=>{
      let final = ''
      for (let i=0;i<e.results.length;i++){
        const res = e.results[i]
        if (res.isFinal) final += res[0].transcript
      }
      if (final.trim()) onFinal(final)
    }
    rec.onend = ()=> setListening(false)
    recognitionRef.current = rec
    setSupported(true)
  }, [lang, onFinal])

  const start = ()=>{ if (recognitionRef.current && !listening){ setListening(true); recognitionRef.current.start() } }
  const stop  = ()=>{ if (recognitionRef.current && listening){ recognitionRef.current.stop() } }

  return { supported, listening, start, stop }
}

// --- Avatar animé ---
function Avatar({ stage, align, action }){
  const emoji = stage===STAGE.EGG?'🥚': stage===STAGE.HATCH?'🐣': stage===STAGE.JUV?'🐲':'🐉'
  const glow = align==='gentle' ? 'rgba(34,197,94,.35)' : align==='evil' ? 'rgba(244,63,94,.35)' : 'rgba(99,102,241,.25)'
  const anim = action==='sleep' ? { y:[0,-4,0], scale:[1,.98,1] } : action==='play' ? { rotate:[0,-3,3,0], scale:[1,1.04,1] } : action==='feed' ? { y:[0,-12,4,0] } : { y:[0,-6,0], scale:[1,1.01,1] }
  return (
    <div className="hero">
      <div className="halo" style={{ boxShadow:`inset 0 0 140px ${glow}` }} />
      <motion.div className="dragon" animate={anim} transition={{ duration: action==='feed'? .8 : 2.6, repeat: Infinity, ease:'easeInOut' }}>
        <span aria-label="dragon" className="emoji">{emoji}</span>
      </motion.div>
    </div>
  )
}

// --- Composant principal (mobile-first) ---
export default function App(){
  const [state, dispatch] = useReducer(reducer, initialState, (init)=>{
    try{ const raw = localStorage.getItem('dragon-mobile-save'); return raw? { ...init, ...JSON.parse(raw) } : init }catch{return init}
  })
  const [text, setText] = useState('')
  const logRef = useRef(null)

  useEffect(()=>{ localStorage.setItem('dragon-mobile-save', JSON.stringify(state)) }, [state])
  useEffect(()=>{ if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [state.log.length])
  useEffect(()=>{ const id=setInterval(()=>dispatch({type:'tick'}), 2200); return ()=>clearInterval(id) }, [])

  const { supported, listening, start, stop } = useSpeechRecognition({ onFinal: (t)=> dispatch({ type:'speak', text:t }) })

  const send = ()=>{ dispatch({ type:'speak', text }); setText('') }

  return (
    <div className="m-page">
      <header className="m-top">
        <div className="title">🐉 Dragon</div>
        <button className="ghost" onClick={()=>dispatch({type:'reset'})}>Réinit.</button>
      </header>

      <main className="m-main">
        <section className="m-hero">
          <Avatar stage={state.stage} align={state.align} action={state.action} />
          <div className="chips">
            <span className="chip">{({egg:'Œuf', hatchling:'Bébé', juvenile:'Jeune', adult:'Adulte'})[state.stage]}</span>
            <span className="chip alt">{({gentle:'Gentil', neutral:'Neutre', evil:'Méchant'})[state.align]}</span>
            <span className="chip">XP {state.xp}</span>
          </div>
        </section>

        <section ref={logRef} className="m-log">
          {state.log.map((m,i)=> <div key={i} className={'m-msg '+m.who}>{m.text}</div>)}
        </section>

        <section className="m-bottom">
          <div className="m-actions">
            <button onClick={()=>dispatch({type:'care', key:'feed'})}>🍖 Nourrir</button>
            <button onClick={()=>dispatch({type:'care', key:'wash'})}>🧼 Laver</button>
            <button onClick={()=>dispatch({type:'care', key:'play'})}>🎾 Jouer</button>
            <button onClick={()=>dispatch({type:'care', key:'sleep'})}>🛌 Dormir</button>
          </div>
          <div className="m-composer">
            <input
              value={text}
              onChange={(e)=>setText(e.target.value)}
              onKeyDown={(e)=>{ if (e.key==='Enter') send() }}
              placeholder="Parle à ton dragon…"
              aria-label="Parle à ton dragon"
            />
            <button className="primary" onClick={send}>Parler</button>
            {supported && (
              <button className={'mic'+(listening?' on':'')} onClick={()=> listening? stop() : start()} title="Dictée vocale">
                🎙️
              </button>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .m-page{min-height:100svh;display:flex;flex-direction:column;background:radial-gradient(1200px 600px at 50% -10%, #0e182d 0, #0a0f1a 55%, #080d16 100%);color:#e5e7eb}
        .m-top{position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(8,13,22,.6);backdrop-filter:saturate(140%) blur(6px);border-bottom:1px solid #1f2937}
        .title{font-weight:800}
        .ghost{background:transparent;border:1px solid #223047;border-radius:10px;color:#e5e7eb;padding:8px 10px}
        .m-main{display:flex;flex-direction:column;gap:10px;padding:10px}
        .m-hero{display:flex;flex-direction:column;align-items:center;gap:8px}
        .hero{position:relative;width:100%;max-width:460px;aspect-ratio:1/1;border-radius:20px;background:linear-gradient(135deg,#1f2937,#0f172a);border:1px solid #223047;box-shadow:0 10px 40px rgba(0,0,0,.25);overflow:hidden}
        .halo{position:absolute;inset:0}
        .dragon{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
        .emoji{font-size:min(30vw,160px);text-shadow:0 10px 20px rgba(0,0,0,.35)}
        .chips{display:flex;gap:6px;flex-wrap:wrap}
        .chip{background:#1f2937;padding:6px 10px;border-radius:999px;border:1px solid #223047;font-size:12px}
        .chip.alt{background:#111827}
        .m-log{height:36svh;min-height:200px;overflow:auto;border-radius:16px;background:linear-gradient(180deg,#0c1322,#0a101b);border:1px solid #223047;padding:10px}
        .m-msg{max-width:86%;padding:10px 12px;border-radius:14px;margin:6px 0;line-height:1.35}
        .m-msg.system{background:rgba(255,255,255,.03);border:1px solid #1e293b}
        .m-msg.you{background:rgba(34,197,94,.08);border:1px solid #1b4d2c;margin-left:auto}
        .m-msg.dragon{background:rgba(96,165,250,.10);border:1px solid #1e3a8a}
        .m-bottom{position:sticky;bottom:0;display:flex;flex-direction:column;gap:8px;padding-bottom:10px}
        .m-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        .m-actions button{padding:12px 8px;border-radius:12px;border:1px solid #223047;background:#0d1728;color:#e5e7eb}
        .m-composer{display:grid;grid-template-columns:1fr auto auto;gap:8px}
        .m-composer input{padding:12px 14px;border-radius:12px;border:1px solid #223047;background:#0d1728;color:#e5e7eb}
        .primary{padding:12px 14px;border-radius:12px;border:none;background:#60a5fa;color:#06121e;font-weight:800}
        .mic{padding:12px 14px;border-radius:12px;border:1px solid #223047;background:#0d1728}
        .mic.on{outline:2px solid #60a5fa}
        @media (min-width: 860px){ .m-main{max-width:860px;margin:0 auto} }
      `}</style>
    </div>
  )
}
