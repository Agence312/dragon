import { useEffect, useRef, useState } from 'react'
export default function useSpeechRecognition({ onFinal, lang='fr-FR' }){
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
      for (let i=0;i<e.results.length;i++){ const res = e.results[i]; if (res.isFinal) final += res[0].transcript }
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
