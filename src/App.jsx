import React, { useEffect, useMemo, useReducer, useState } from 'react'
import Dragon from './components/Dragon.jsx'
import StatBar from './components/StatBar.jsx'
import CarePanel from './components/CarePanel.jsx'
import BattleView from './components/BattleView.jsx'
import Log from './components/Log.jsx'
import { initialState, stageFromXP, nextAlignment, computeIntent, elementFromText, tickNeeds, applyCare } from './game/engine.js'
import { ELEMENT_LABEL, defaultMoves } from './game/data.js'

const SAVE_KEY = 'dragon-tamapoke-save-v1'

function reducer(state, action){
  switch(action.type){
    case 'reset': return { ...initialState }
    case 'import': return { ...state, ...action.payload }
    case 'tick': return tickNeeds(state)
    case 'care': return applyCare(state, action.action)
    case 'speak': {
      const text = action.text
      if (!text.trim()) return state
      const { score, intent, hatch, proposedName } = computeIntent(text)
      let affection = state.affection + Math.max(0, score)
      let temper = state.temper + Math.max(0, -score)
      let energy = Math.max(0, Math.min(10, state.energy - 1 + (intent==='sleep'?2:0) ))
      let xp = state.xp + 1 + (intent==='play'?1:0)
      let stage = state.stage
      let actionKey = 'idle'
      const logs = [{ who:'you', text }]

      // Hatching
      if (stage==='egg' && (hatch || (xp>=5 && affection>=2))){
        stage = 'hatchling'
        xp = Math.max(xp, 5)
        actionKey = 'hatch'
        logs.push({ who:'dragon', text:'🐣 *Craaack* … Bonjour.' })
      }

      // Element change via text
      const element = elementFromText(text, state.element)

      // Name
      let name = state.name
      if (!name && proposedName){
        name = proposedName
        logs.push({ who:'dragon', text:`Je m'appellerai ${name}.` })
      }

      // Alignment
      const align = nextAlignment(affection, temper)

      // Stage advancement
      const newStage = stageFromXP(xp)
      if (stage !== 'adult' && newStage !== stage && newStage==='juvenile'){
        // choose element moves
        logs.push({ who:'system', text:`Tu sens une affinité ${ELEMENT_LABEL[element]} grandir.` })
      }
      if (newStage==='adult' && stage!=='adult'){
        logs.push({ who:'system', text:'Ton dragon évolue !' })
        actionKey = 'evolve'
      }

      // Moves update when element changes at least once
      let moves = state.moves
      if (element !== state.element){
        moves = defaultMoves(element)
        logs.push({ who:'dragon', text:`J'apprends de nouvelles techniques ${ELEMENT_LABEL[element]} !` })
      }

      // Reaction to intents
      if (intent!=='talk'){
        logs.push({ who:'dragon', text: reactionFor(align, intent) })
      }

      return { ...state,
        name, stage:newStage, align, element, xp, affection:clamp(affection,0,30), temper:clamp(temper,0,30), energy,
        moves, action:actionKey, log:[...state.log, ...logs]
      }
    }
    case 'gain': {
      const g = action.payload
      return { ...state,
        xp: state.xp + (g.xp||0),
        affection: clamp(state.affection + (g.affection||0), 0, 30),
        fun: clamp(state.fun + (g.fun||0), 0, 100),
        rest: clamp(state.rest + (g.rest||0), 0, 100),
        log: [...state.log, { who:'system', text:`Gains: ${g.xp||0} XP` }]
      }
    }
    default: return state
  }
}

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v))

function reactionFor(align, intent){
  const friendly = { sleep:['Dors bien.','Zzz…'], feed:['Miam !','Merci !'], play:['On joue ?','Haha !'], wash:['Tout propre !'], attack:['Je préfère protéger.'], sing:['La-la-la 🎶'] }
  const neutral  = { sleep:['Repos.'], feed:['D\'accord.'], play:['Pourquoi pas.'], wash:['Bien.'], attack:['Plus tard.'], sing:['♪'] }
  const evil     = { sleep:['Je veille…'], feed:['Plus.'], play:['Je m\'entraîne.'], wash:['Tsss.'], attack:['Grrr… (en entraînement)'], sing:['Hmmm.'] }
  const bank = align==='gentle'?friendly: align==='evil'?evil:neutral
  return (bank[intent]||bank.feed)[0]
}

export default function App(){
  const [state, dispatch] = useReducer(reducer, initialState, (init)=>{
    try{ const raw = localStorage.getItem(SAVE_KEY); return raw? { ...init, ...JSON.parse(raw) } : init }catch{return init}
  })
  const [tab, setTab] = useState('care')
  const [showBattle, setShowBattle] = useState(false)

  useEffect(()=>{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)) }, [state])

  // Passive needs decay
  useEffect(()=>{
    const id = setInterval(()=> dispatch({ type:'tick' }), 2000)
    return ()=> clearInterval(id)
  }, [])

  function exportSave(){ const data=btoa(unescape(encodeURIComponent(JSON.stringify(state)))); navigator.clipboard.writeText(data); alert('Sauvegarde copiée.') }
  function importSave(){ const data=prompt('Colle une sauvegarde :'); if(!data) return; try{ const json=JSON.parse(decodeURIComponent(escape(atob(data)))); dispatch({ type:'import', payload: json }) }catch{ alert('Import invalide.') } }

  return (
    <div className="page">
      <header className="top">
        <h1>🐉 Dragon — TAMA × POKE</h1>
        <div className="actions">
          <button onClick={()=>dispatch({type:'reset'})}>Réinitialiser</button>
          <button onClick={exportSave}>Exporter</button>
          <button onClick={importSave}>Importer</button>
        </div>
      </header>

      <main className="layout">
        <section className="left">
          <Dragon stage={state.stage} align={state.align} element={state.element} action={state.action||'idle'} />
          <div className="panel">
            <div className="badges">
              <span className="badge">Niveau {state.xp}</span>
              <span className="badge">Étape {({egg:'Œuf',hatchling:'Bébé',juvenile:'Jeune',adult:'Adulte'})[state.stage]}</span>
              <span className="badge">Alignement {({gentle:'Gentil',neutral:'Neutre',evil:'Méchant'})[state.align]}</span>
              <span className="badge">Élément {ELEMENT_LABEL[state.element]}</span>
            </div>
            <div className="grid2" style={{ marginTop:8 }}>
              <StatBar label="Affection" value={state.affection} max={30} />
              <StatBar label="Tempérament" value={state.temper} max={30} />
            </div>
            <div className="grid2" style={{ marginTop:8 }}>
              <StatBar label="Faim" value={state.hunger} />
              <StatBar label="Hygiène" value={state.hygiene} />
              <StatBar label="Fun" value={state.fun} />
              <StatBar label="Repos" value={state.rest} />
            </div>
          </div>

          <div className="panel">
            <div className="tabs">
              <button className={'tab '+(tab==='care'?'active':'')} onClick={()=>setTab('care')}>Soin</button>
              <button className={'tab '+(tab==='train'?'active':'')} onClick={()=>setTab('train')}>Entraînement</button>
              <button className={'tab '+(tab==='journal'?'active':'')} onClick={()=>setTab('journal')}>Journal</button>
            </div>

            {tab==='care' && <CarePanel
              state={state}
              onCare={(a)=>dispatch({ type:'care', action:a })}
              onSpeak={(t)=>dispatch({ type:'speak', text:t })}
            />}

            {tab==='train' && (
              <div className="panel">
                <div style={{ marginBottom:8 }}>L'entraînement améliore l'humeur et l'XP. Non violent — juste un duel amical ✨</div>
                <button className="primary" onClick={()=>setShowBattle(true)}>Lancer un duel</button>
              </div>
            )}

            {tab==='journal' && <Log items={state.log}/>}
          </div>
        </section>

        <section className="right">
          {showBattle ? (
            <BattleView
              state={state}
              onEnd={()=>setShowBattle(false)}
              onGain={(g)=>dispatch({ type:'gain', payload:g })}
            />
          ) : (
            <div className="panel">
              <div><strong>Conseils</strong></div>
              <ul>
                <li>Parle de son élément pour l'orienter : <em>feu, eau, vent, terre, lumière, ombre</em>.</li>
                <li>Entre 5 et 20 XP : il devient <em>Jeune</em> et commence à apprendre des techniques liées à son élément.</li>
                <li>À 50 XP : évolution <em>Adulte</em> — animation spéciale ✨</li>
                <li>La <strong>Faim / Hygiène / Fun / Repos</strong> baissent avec le temps — pense aux soins (Tamagotchi).</li>
                <li>L'<strong>Alignement</strong> dépend de la bienveillance de tes mots.</li>
              </ul>
            </div>
          )}
        </section>
      </main>

      <footer style={{ textAlign:'center', padding:12, opacity:.7 }}>
        Tamagotchi × Pokémon — entraînement amical, évolutions par soin & affinité. Sauvegarde locale.
      </footer>
    </div>
  )
}
