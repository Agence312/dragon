import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ELEMENT_LABEL } from '../game/data.js'

const stageEmoji = (stage)=> stage==='egg'?'🥚': stage==='hatchling'?'🐣': stage==='juvenile'?'🐲':'🐉'

export default function Dragon({ stage, align, element, action }){
  const glow = align==='gentle' ? 'rgba(34,197,94,.35)' : align==='evil' ? 'rgba(244,63,94,.35)' : 'rgba(99,102,241,.25)'
  const color = align==='gentle' ? '#86efac' : align==='evil' ? '#fca5a5' : '#93c5fd'

  const baseAnim = action==='sleep' ? { y:[0, -4, 0], scale:[1, .98, 1] } :
                   action==='play' ? { rotate:[0, -4, 4, 0], scale:[1,1.04,1] } :
                   action==='feed' ? { y:[0,-12,4,0] } :
                   { y:[0,-6,0], scale:[1,1.01,1] }

  return (
    <div className="avatar">
      <div className="pulse" style={{ boxShadow:`inset 0 0 120px ${glow}` }} />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={stage+align+element}
          className="float"
          initial={{ scale:.8, opacity:0, rotate:-8 }}
          animate={{ scale:1, opacity:1, rotate:0 }}
          transition={{ type:'spring', stiffness:120, damping:12 }}
          style={{ position:'relative' }}
        >
          <motion.div
            className={action==='feed'?'bounce':''}
            animate={baseAnim}
            transition={{ duration: action==='feed'? .8 : 2.6, repeat: Infinity, ease:'easeInOut' }}
            style={{ fontSize: stage==='adult'? '120px':'100px', textShadow:`0 10px 20px rgba(0,0,0,.35)` }}
            aria-label="dragon"
            title={`Alignement: ${align} • Élément: ${ELEMENT_LABEL[element]}`}
          >
            {stageEmoji(stage)}
          </motion.div>
          {action==='sleep' && <div className="sleepZ">Z z z</div>}
          {(action==='hatch' || action==='evolve') && Array.from({length:16}).map((_,i)=> (
            <span key={i} className="spark" style={{ left:(20+Math.random()*60)+'%', bottom: (10+Math.random()*40)+'%', animationDelay:(Math.random()*1.2)+'s', background: color }} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
