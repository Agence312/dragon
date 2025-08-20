import React, { useMemo, useState } from 'react'
import StatBar from './StatBar.jsx'
import Dragon from './Dragon.jsx'
import { MOVES, randomEnemy, ELEMENT_LABEL } from '../game/data.js'

function calcDamage(move, mood){ return Math.round(move.power + (mood-50)/20) } // mood buffs

export default function BattleView({ state, onEnd, onGain }){
  const [enemy] = useState(()=> randomEnemy())
  const [playerHP, setPlayerHP] = useState(60)
  const [enemyHP, setEnemyHP] = useState(enemy.hp)
  const [log, setLog] = useState([{who:'system', text:`Un duel d'entraînement commence contre ${enemy.name} (${ELEMENT_LABEL[enemy.element]}).` }])
  const [myTurn, setMyTurn] = useState(true)
  const [busy, setBusy] = useState(false)

  function addLog(who,text){ setLog(l => [...l, { who, text }]) }

  async function playMove(m){
    if (busy || !myTurn) return
    setBusy(true)
    const dmg = calcDamage(m, state.mood)
    addLog('you', `${m.name}!`)
    await new Promise(r=>setTimeout(r, 350))
    setEnemyHP(h => Math.max(0, h - dmg))
    addLog('dragon', `Inflige ${dmg} pts.`)
    await new Promise(r=>setTimeout(r, 400))

    // win?
    if (enemyHP - dmg <= 0){
      addLog('system', `Victoire ! +6 XP, +2 Affection`)
      onGain({ xp:6, affection:2, fun:8 })
      setBusy(false); setMyTurn(false)
      await new Promise(r=>setTimeout(r, 700))
      onEnd()
      return
    }

    // Enemy turn
    setMyTurn(false)
    const em = MOVES[enemy.element][0]
    const edmg = calcDamage(em, 55) // enemy mood neutral+
    addLog('enemy', `${em.name}!`)
    await new Promise(r=>setTimeout(r, 350))
    setPlayerHP(h => Math.max(0, h - edmg))
    addLog('system', `Tu reçois ${edmg} pts.`)

    if (playerHP - edmg <= 0){
      addLog('system', `Défaite… +2 XP, +1 Affection`)
      onGain({ xp:2, affection:1, rest:-5 })
      setBusy(false); await new Promise(r=>setTimeout(r, 700)); onEnd(); return
    }

    setBusy(false); setMyTurn(true)
  }

  return (
    <div className="panel">
      <div className="enemy">
        <div><div className="name">{enemy.name}</div><div className="hpbar"><div className="hp" style={{ width: (enemyHP/enemy.max*100)+'%' }}></div></div>
        </div>
        <div>{ELEMENT_LABEL[enemy.element]}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginTop:8 }}>
        <Dragon stage={state.stage} align={state.align} element={state.element} action={busy ? 'play' : 'idle'} />
        <div className="panel">
          <div style={{ marginBottom:8 }}><strong>PV</strong></div>
          <div className="hpbar"><div className="hp" style={{ width: (playerHP/60*100)+'%' }}/></div>
          <div style={{ marginTop:10 }} className="moves">
            {state.moves.map(m => (
              <button key={m.id} className="move" disabled={!myTurn || busy} onClick={()=>playMove(m)}>{m.name}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="log" style={{ marginTop:12 }}>
        {log.map((m,i)=> <div key={i} className={'msg '+m.who}>{m.text}</div>)}
      </div>
      <div style={{ marginTop:8, display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onEnd}>Fuir</button>
      </div>
    </div>
  )
}
