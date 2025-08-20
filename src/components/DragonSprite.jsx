import React from 'react'
import { motion } from 'framer-motion'
const paletteByAlign = { gentle:['#86efac','#22c55e'], neutral:['#93c5fd','#3b82f6'], evil:['#fda4af','#f43f5e'] }
const paletteByElement = { feu:['#fb7185','#f97316'], eau:['#67e8f9','#06b6d4'], vent:['#a5b4fc','#60a5fa'], terre:['#a3e635','#84cc16'], lumiere:['#fde68a','#fbbf24'], ombre:['#c4b5fd','#8b5cf6'] }
function Egg(){ return (<svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="œuf">
  <defs><radialGradient id="eggG" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#e2e8f0"/><stop offset="100%" stopColor="#94a3b8"/></radialGradient></defs>
  <motion.ellipse cx="100" cy="110" rx="62" ry="84" fill="url(#eggG)" initial={{ rotate:0 }} animate={{ rotate:[0,-2,2,0] }} transition={{ repeat: Infinity, duration: 2.4, ease:'easeInOut' }}/>
  <motion.path d="M70 110 c10 -8 18 8 26 0 s18 -8 26 0" stroke="#334155" strokeWidth="2.5" fill="none"
    initial={{ pathLength: 0.4, pathOffset:.2 }} animate={{ pathLength:[.3,.6,.3], pathOffset:[.1,.2,.1] }} transition={{ repeat: Infinity, duration: 1.8, ease:'easeInOut' }}/>
</svg>) }
function DragonBody({ palette }){
  const [c1,c2] = palette
  return (<svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="dragon">
    <defs><linearGradient id="gB" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/></linearGradient></defs>
    <motion.ellipse cx="110" cy="120" rx="48" ry="36" fill="url(#gB)" initial={{ scale:1 }} animate={{ scale:[1,.98,1] }} transition={{ repeat: Infinity, duration: 2.6, ease:'easeInOut' }}/>
    <motion.circle cx="140" cy="98" r="16" fill="url(#gB)" initial={{ y:0 }} animate={{ y:[0,-2,0] }} transition={{ repeat: Infinity, duration: 2.6 }}/>
    <circle cx="145" cy="95" r="3" fill="#111827"/>
    <motion.path d="M80 110 C50 100, 50 80, 70 70 L88 88 Z" fill={c1} initial={{ rotate:-6, transformOrigin:'88px 88px' }} animate={{ rotate:[-10,-2,-10] }} transition={{ repeat: Infinity, duration: 1.3 }}/>
    <motion.path d="M140 110 C170 100, 170 80, 150 70 L132 88 Z" fill={c2} initial={{ rotate:6, transformOrigin:'132px 88px' }} animate={{ rotate:[10,2,10] }} transition={{ repeat: Infinity, duration: 1.3 }}/>
    <motion.path d="M70 128 C54 134, 50 146, 58 154 C66 162, 78 158, 86 150" fill="none" stroke={c2} strokeWidth="6" strokeLinecap="round" initial={{ pathLength:.8 }} animate={{ pathLength:[.8,.9,.8] }} transition={{ repeat: Infinity, duration: 2.2 }}/>
  </svg>)
}
export default function DragonSprite({ stage='egg', align='neutral', element='vent' }){
  const palette = (paletteByElement[element] || paletteByAlign[align] || ['#93c5fd','#3b82f6'])
  return (<div className="dragon">{stage==='egg' ? <Egg/> : <DragonBody palette={palette}/>}</div>)
}
