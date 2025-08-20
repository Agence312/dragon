import React, { useEffect, useReducer, useRef, useState } from 'react'
import DragonSprite from './components/DragonSprite.jsx'
import useSpeechRecognition from './hooks/useSpeechRecognition.js'

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
const strip=(s)=> s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const STAGE={ EGG:'egg', HATCH:'hatchling', JUV:'juvenile', ADULT:'adult' }
const SAVE_KEY='dragon-mobile-sprites-save-v1'
function stageFromXP(xp){ if(xp>=50) return STAGE.ADULT; if(xp>=20) return STAGE.JUV; if(xp>=5) return STAGE.HATCH; return STAGE.EGG }
function nextAlignment(aff,temp){ const d=aff-temp; if(d>=5) return 'gentle'; if(d<=-5) return 'evil'; return 'neutral' }
function computeIntent(text){
  const t=' '+strip(text)+' '; const pos=['bonjour','salut','merci','gentil','aime','amour','ami','protege','soigne','doux','sage','content','heureux','plaisir','joue','chante','danse','bien','cool','super']
  const neg=['attaque','brule','detruire','casse','vole','hurle','crie','mechant','haine','deteste','menace','griffe','mords','agresse','frappe']
  let score=0; pos.forEach(w=>t.includes(' '+w+' ')&&(score+=1)); neg.forEach(w=>t.includes(' '+w+' ')&&(score-=1))
  const intents={ sleep:['dors','dodo','endors','sieste','repos'], feed:['mange','manger','nourris','nourrir','miam','repas'], play:['joue','jouer','jeu','amuse-toi'], wash:['lave','laver','bain','nettoie','nettoyer'], soothe:['calme','calmer','caresse','calin','rassure'], attack:['attaque','brule','detruis','mords','griffe','ecrase'], sing:['chante','chanson','la la la','musique'] }
  let intent='talk'; for(const [k,ws] of Object.entries(intents)){ if(ws.some(w=>t.includes(' '+w+' '))){ intent=k; break } }
  const hatch=['eclore','eclot','reveille','reveille-toi','revele-toi','bonjour','salut','coucou'].some(w=>t.includes(' '+w+' '))
  const nameMatch=/(?:je t'app(?:elle)?|tu t'appelles|ton nom est)\s+([a-zA-Z\-]{2,20})/i.exec(text); const proposedName=nameMatch?nameMatch[1]:null
  return { score,intent,hatch,proposedName }
}
const initialState={ name:null, stage:STAGE.EGG, align:'neutral', element:'vent', xp:0, affection:0, temper:0, energy:8, hunger:55, hygiene:60, fun:55, rest:60, mood:60, action:'idle', log:[{who:'system', text:"Un œuf mystérieux t'écoute. Parle-lui ou prends-en soin."}] }
function tickNeeds(s){ const hunger=clamp(s.hunger-.4,0,100); const hygiene=clamp(s.hygiene-.25,0,100); const fun=clamp(s.fun-.35,0,100); const rest=clamp(s.rest-.3,0,100); const mood=clamp((hunger+hygiene+fun+rest)/4,0,100); return { ...s, hunger,hygiene,fun,rest,mood } }
function reducer(state,action){
  switch(action.type){
    case 'reset': return { ...initialState }
    case 'tick': return tickNeeds(state)
    case 'care':{
      let { hunger,hygiene,fun,rest,energy,xp }=state; let act='idle', line=''
      if(action.key==='feed'){ hunger=clamp(hunger+28,0,100); energy=clamp(energy+1,0,10); xp+=1; act='feed'; line='Miam !' }
      if(action.key==='wash'){ hygiene=clamp(hygiene+30,0,100); xp+=1; act='wash'; line='Tout propre !' }
      if(action.key==='play'){ fun=clamp(fun+26,0,100); energy=clamp(energy-1,0,10); xp+=2; act='play'; line='Haha !' }
      if(action.key==='sleep'){ rest=clamp(rest+32,0,100); energy=clamp(energy+3,0,10); xp+=1; act='sleep'; line='Zzz…' }
      const mood=clamp((hunger+hygiene+fun+rest)/4,0,100); return { ...state, hunger,hygiene,fun,rest,energy,xp,mood, action:act, log:[...state.log, {who:'dragon', text: line}] }
    }
    case 'speak':{
      const text=action.text; if(!text.trim()) return state
      const { score,intent,hatch,proposedName }=computeIntent(text)
      let affection=state.affection+Math.max(0,score); let temper=state.temper+Math.max(0,-score)
      let energy=Math.max(0, Math.min(10, state.energy - 1 + (intent==='sleep'?2:0) ))
      let xp=state.xp + 1 + (intent==='play'?1:0); let stage=state.stage
      const logs=[{who:'you', text}]
      if(stage===STAGE.EGG && (hatch || (xp>=5 && affection>=2))){ stage=STAGE.HATCH; xp=Math.max(xp,5); logs.push({who:'dragon', text:'🐣 *Craaack* … Bonjour.'}) }
      const align=nextAlignment(affection,temper)
      let name=state.name; if(!name && proposedName){ name=proposedName; logs.push({who:'dragon', text:`Je m'appellerai ${name}.`}) }
      if(intent==='attack' && align==='gentle'){ temper=Math.max(0, state.temper-1); affection=Math.min(30, affection+1) }
      const reply=reactionFor(align,intent); const newStage=stageFromXP(xp)
      const actionKey=(intent==='sleep'?'sleep': intent==='play'?'play': intent==='feed'?'feed': intent==='wash'?'wash':'idle')
      return { ...state, name, stage:newStage, align, xp, affection:clamp(affection,0,30), temper:clamp(temper,0,30), energy, action:actionKey, log:[...state.log, ...logs, {who:'dragon', text: reply}] }
    }
    default: return state
  }
}
function reactionFor(align,intent){ const friendly={ sleep:['Dors bien.'], feed:['Miam !'], play:['On joue ?'], wash:['Tout propre !'], attack:["Je préfère protéger."], sing:['La-la-la 🎶'], talk:["Je t'écoute !"] }
  const neutral={ sleep:['Repos.'], feed:['D\'accord.'], play:['Pourquoi pas.'], wash:['Bien.'], attack:['Plus tard.'], sing:['♪'], talk:['...'] }
  const evil={ sleep:['Je veille…'], feed:['Plus.'], play:["Je m'entraîne."], wash:['Tsss.'], attack:['Grrr… (entraînement)'], sing:['Hmmm.'], talk:['Parle, humain.'] }
  const bank=align==='gentle'?friendly: align==='evil'?evil:neutral; return (bank[intent]||bank.talk)[0] }
export default function App(){
  const [state, dispatch]=React.useReducer(reducer, initialState, (init)=>{ try{ const raw=localStorage.getItem(SAVE_KEY); return raw? { ...init, ...JSON.parse(raw) } : init }catch{return init} })
  const [text, setText]=useState(''); const logRef=useRef(null)
  useEffect(()=>{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)) }, [state])
  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight }, [state.log.length])
  useEffect(()=>{ const id=setInterval(()=>dispatch({type:'tick'}), 2200); return ()=>clearInterval(id) }, [])
  const { supported, listening, start, stop } = useSpeechRecognition({ onFinal:(t)=> dispatch({ type:'speak', text:t }) })
  const send=()=>{ dispatch({ type:'speak', text }); setText('') }
  return (<div className="m-page">
    <header className="m-top"><div className="title">🐉 Dragon</div><button className="ghost" onClick={()=>dispatch({type:'reset'})}>Réinit.</button></header>
    <main className="m-main">
      <section className="m-hero">
        <div className="hero"><div className="halo" /><DragonSprite stage={state.stage} align={state.align} element={state.element} /></div>
        <div className="chips"><span className="chip">{({egg:'Œuf',hatchling:'Bébé',juvenile:'Jeune',adult:'Adulte'})[state.stage]}</span><span className="chip alt">{({gentle:'Gentil',neutral:'Neutre',evil:'Méchant'})[state.align]}</span><span className="chip">XP {state.xp}</span></div>
      </section>
      <section ref={logRef} className="m-log">{state.log.map((m,i)=> <div key={i} className={'m-msg '+m.who}>{m.text}</div>)}</section>
      <section className="m-bottom">
        <div className="m-actions"><button onClick={()=>dispatch({type:'care', key:'feed'})}>🍖</button><button onClick={()=>dispatch({type:'care', key:'wash'})}>🧼</button><button onClick={()=>dispatch({type:'care', key:'play'})}>🎾</button><button onClick={()=>dispatch({type:'care', key:'sleep'})}>🛌</button></div>
        <div className="m-composer"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send() }} placeholder="Parle à ton dragon…" aria-label="Parle à ton dragon"/><button className="primary" onClick={send}>Parler</button>{supported && <button className={'mic'+(listening?' on':'')} onClick={()=> listening? stop() : start()} title="Dictée vocale">🎙️</button>}</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}><div className="statbar"><div className="statfill" style={{ width: (state.hunger)+'%' }}/></div><div className="statbar"><div className="statfill" style={{ width: (state.fun)+'%' }}/></div><div className="statbar"><div className="statfill" style={{ width: (state.hygiene)+'%' }}/></div><div className="statbar"><div className="statfill" style={{ width: (state.rest)+'%' }}/></div></div>
      </section>
    </main>
  </div>)
}
