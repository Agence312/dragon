import React, { useEffect, useRef } from 'react'
export default function Log({ items }){
  const ref = useRef(null)
  useEffect(()=>{ if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [items.length])
  return (
    <div ref={ref} className="log">
      {items.map((m,i)=> <div key={i} className={'msg '+m.who}>{m.text}</div>)}
    </div>
  )
}
