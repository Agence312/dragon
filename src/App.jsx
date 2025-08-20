import React, { useReducer, useState, useEffect, useRef } from 'react'
import DragonSprite from './components/DragonSprite.jsx'
import useSpeechRecognition from './hooks/useSpeechRecognition.js'

const STAGES={egg:'egg', hatch:'hatchling', juv:'juvenile', adult:'adult'}
const initial={stage:STAGES.egg,xp:0,log:[{who:'system',text:'Un œuf mystérieux. Parle-lui ou tape dessus pour l\'aider à éclore.'}]}

function reducer(state,action){
  switch(action.type){
    case 'speak':
      const text=action.text
      let log=[...state.log,{who:'you',text}]
      let xp=state.xp+1
      let stage=state.stage
      if(stage===STAGES.egg && (/bonjour|salut|coucou|eclore|reveil|reveille/i.test(text) || xp>=5)){
        stage=STAGES.hatch
        log.push({who:'dragon',text:'🐣 *Craaack* … Bonjour.'})
      }
      if(stage===STAGES.hatch && xp>=20){ stage=STAGES.juv; log.push({who:'system',text:'Ton dragon grandit !'}) }
      if(stage===STAGES.juv && xp>=50){ stage=STAGES.adult; log.push({who:'system',text:'Ton dragon est adulte !'}) }
      log.push({who:'dragon',text:'...'}) // placeholder reply
      return {...state,xp,stage,log}
    case 'eggTap':
      if(state.stage===STAGES.egg){
        return {...state,stage:STAGES.hatch,log:[...state.log,{who:'dragon',text:'🐣 *Craaack* … Bonjour.'}]}
      }
      return state
    default:return state
  }
}

export default function App(){
  const [state,dispatch]=useReducer(reducer,initial)
  const [text,setText]=useState('')
  const logRef=useRef(null)
  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight },[state.log])
  const {supported,listening,start,stop}=useSpeechRecognition({onFinal:(t)=>dispatch({type:'speak',text:t})})
  const send=()=>{dispatch({type:'speak',text});setText('')}
  return <div className="m-page">
    <header className="m-top"><div>🐉 Dragon</div><button onClick={()=>window.location.reload()}>Reset</button></header>
    <main className="m-main">
      <div className="hero" onClick={()=>dispatch({type:'eggTap'})}><DragonSprite stage={state.stage}/></div>
      <div className="m-log" ref={logRef}>{state.log.map((m,i)=><div key={i} className={'m-msg '+m.who}>{m.text}</div>)}</div>
      <div className="m-bottom">
        <div className="m-composer">
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}}/>
          <button className="primary" onClick={send}>Parler</button>
          {supported && <button onClick={()=>listening?stop():start()}>🎙️</button>}
        </div>
      </div>
    </main>
  </div>
}
