import React from 'react'
export default function DragonSprite({ stage }){
  return <div style={{fontSize:'80px'}}>{stage==='egg'?'🥚': stage==='hatchling'?'🐣': stage==='juvenile'?'🐲': '🐉'}</div>
}
