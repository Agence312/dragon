import React, { useEffect, useMemo, useRef, useState } from 'react'

const clamp = (n, a=0, b=100) => Math.max(a, Math.min(b, n))
const fmt = (n) => Math.round(n)

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : (typeof initialValue === 'function' ? initialValue() : initialValue)
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue
    }
  })
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])
  return [value, setValue]
}

const FAMILIES = [
  { key:'flameche', name:'Flamèche', element:'Feu', color:'#ef4444', emoji:'🔥', talent:"Brûlure crit.", fav:'rythme' },
  { key:'brumaille', name:'Brumaille', element:'Eau', color:'#38bdf8', emoji:'💧', talent:'Soin de brume', fav:'puzzle' },
  { key:'bourrasque', name:'Bourrasque', element:'Air', color:'#a5b4fc', emoji:'🌬️', talent:'Esquive+', fav:'reflexe' },
  { key:'racine', name:'Racine', element:'Terre', color:'#22c55e', emoji:'🌿', talent:'Armure nat.', fav:'jardin' },
  { key:'voltaik', name:'Voltaik', element:'Foudre', color:'#f59e0b', emoji:'⚡', talent:'Surtension', fav:'rythme' },
  { key:'givrex', name:'Givrex', element:'Glace', color:'#67e8f9', emoji:'❄️', talent:'Gel lent', fav:'puzzle' },
  { key:'sylphe', name:'Sylphe', element:'Nature', color:'#4ade80', emoji:'🍃', talent:'Vigueur', fav:'jardin' },
  { key:'ombry', name:'Ombry', element:'Ténèbres', color:'#64748b', emoji:'🕶️', talent:'Voile', fav:'infiltration' },
  { key:'aureon', name:'Auréon', element:'Lumière', color:'#fde047', emoji:'✨', talent:'Bénédiction', fav:'memoire' },
  { key:'metallum', name:'Métallum', element:'Métal', color:'#93c5fd', emoji:'🛡️', talent:'Carapace', fav:'logique' },
  { key:'rochefer', name:'Rochefer', element:'Roche', color:'#cbd5e1', emoji:'🪨', talent:'Immovable', fav:'timing' },
  { key:'nebulo', name:'Nébulo', element:'Éther', color:'#a78bfa', emoji:'🪄', talent:'Téléport', fav:'devinette' },
  { key:'toxicor', name:'Toxicor', element:'Poison', color:'#22d3ee', emoji:'☠️', talent:'Poison', fav:'risque' },
  { key:'abyssal', name:'Abyssal', element:'Abysses', color:'#0ea5e9', emoji:'🌊', talent:'Siphon', fav:'endurance' },
  { key:'tempus', name:'Tempus', element:'Temps', color:'#f472b6', emoji:'⏳', talent:'Rewind', fav:'streak' },
  { key:'chromax', name:'Chromax', element:'Arc-en-ciel', color:'#f97316', emoji:'🌈', talent:'Adaptation', fav:'combo' },
  { key:'pyroclast', name:'Pyroclast', element:'Magma', color:'#ef4444', emoji:'🌋', talent:'Cœur de lave', fav:'survie' },
  { key:'sablonne', name:'Sablonne', element:'Sable', color:'#fcd34d', emoji:'🏜️', talent:'Voile de sable', fav:'labyrinthe' },
  { key:'orageon', name:'Orageon', element:'Orage', color:'#fbbf24', emoji:'⛈️', talent:'Tonnerre', fav:'qte' },
  { key:'onyxis', name:'Onyxis', element:'Cristal', color:'#34d399', emoji:'💎', talent:'Prisme', fav:'placement' },
]

const STAGES = ['OEUF','BEBE','PETIT','GRAND']

const DEFAULT_DRAGON = () => ({
  id: 'drag_'+Math.random().toString(36).slice(2,7),
  name: '',
  familyKey: FAMILIES[Math.floor(Math.random()*FAMILIES.length)].key,
  stage: 'OEUF',
  xp: 0,
  needs: { hunger: 50, energy: 60, hygiene: 60, mood: 60 },
  bond: { affection: 30, discipline: 20, trust: 20 },
  flags: { voiceInteractions: 0, minigameWins: 0 },
  createdAt: Date.now(),
  lastTick: Date.now(),
})

const EMOJIS = { OEUF:'🥚', BEBE:'🐣', PETIT:'🐲', GRAND:'🐉' }

function useSpeech(onText) {
  const recRef = useRef(null)
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      setSupported(true)
      const rec = new SR()
      rec.lang = 'fr-FR'
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.onresult = (e) => {
        const t = e.results[0][0].transcript
        onText(t)
      }
      rec.onend = () => setListening(false)
      rec.onerror = () => setListening(false)
      recRef.current = rec
    }
  }, [])
  const start = () => { if (recRef.current && !listening) { setListening(true); recRef.current.start() } }
  return { supported, listening, start }
}

function detectIntent(input) {
  const t = input.toLowerCase()
  const has = (...ws)=> ws.some(w=>t.includes(w))
  if (has('bonjour','salut','hello','coucou')) return { type:'greet' }
  if (has('bravo','bien joué','félicitations','fièr','super')) return { type:'praise' }
  if (has('calme','doucement','chut')) return { type:'calm' }
  if (has('gronde','pas bien','méchant')) return { type:'scold' }
  if (has('mange','nourri','nourrir','repas','croquette')) return { type:'feed' }
  if (has('bain','laver','propre','savon')) return { type:'wash' }
  if (has('dodo','dormir','sieste','repos')) return { type:'sleep' }
  if (has('joue','jouer','jeu','minijeu')) return { type:'play' }
  if (has('histoire','conte','raconte')) return { type:'story' }
  if (has('entraîne','entrainement','train')) return { type:'train' }
  if (has('évolu','evolu')) return { type:'evolve' }
  return { type:'talk' }
}

function applyIntent(dragon, intent) {
  const d = { ...dragon, needs: { ...dragon.needs }, bond: { ...dragon.bond }, flags: { ...dragon.flags } }
  const add = (obj, k, v) => obj[k] = clamp(obj[k] + v)
  switch (intent.type) {
    case 'feed': add(d.needs,'hunger', +30); d.xp += 10; break
    case 'wash': add(d.needs,'hygiene', +35); d.xp += 10; break
    case 'sleep': add(d.needs,'energy', +40); d.xp += 5; break
    case 'play': add(d.needs,'mood', +20); d.bond.affection = clamp(d.bond.affection+10); d.xp += 15; break
    case 'story': d.bond.trust = clamp(d.bond.trust+10); add(d.needs,'energy', +5); d.xp += 8; break
    case 'train': d.bond.discipline = clamp(d.bond.discipline+8); d.xp += 12; break
    case 'praise': d.bond.affection = clamp(d.bond.affection+6); add(d.needs,'mood', +6); break
    case 'calm': add(d.needs,'mood', +5); d.bond.trust = clamp(d.bond.trust+4); break
    case 'scold': d.bond.discipline = clamp(d.bond.discipline+5); add(d.needs,'mood', -5); break
    case 'evolve': d.xp += 0; break
    case 'greet': default: add(d.needs,'mood', +2); d.xp += 2; break
  }
  if (intent.viaVoice) d.flags.voiceInteractions++
  return d
}

function decayDragon(d) {
  const now = Date.now()
  const dtMin = Math.max(0, (now - (d.lastTick || now)) / 60000)
  if (dtMin < 0.5) return d
  const k = Math.min(6, dtMin)
  const needs = { ...d.needs }
  needs.hunger = clamp(needs.hunger - 3 * k / 60)
  needs.energy = clamp(needs.energy - 2 * k / 60)
  needs.hygiene = clamp(needs.hygiene - 2 * k / 60)
  needs.mood   = clamp(needs.mood   - 1 * k / 60)
  return { ...d, needs, lastTick: now }
}

function canEvolve(d) {
  if (d.stage === 'OEUF') return d.xp >= 200 && d.flags.voiceInteractions >= 3
  if (d.stage === 'BEBE') return d.xp >= 600 && d.bond.affection >= 60 && d.flags.minigameWins >= 5
  if (d.stage === 'PETIT') return d.xp >= 1500 && d.bond.affection >= 80 && d.bond.discipline >= 50
  return false
}
function evolve(d) {
  const idx = STAGES.indexOf(d.stage)
  if (idx < 0 || idx >= STAGES.length-1) return d
  return { ...d, stage: STAGES[idx+1] }
}

const Bar = ({ label, value }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs mb-1 opacity-80"><span>{label}</span><span>{fmt(value)}%</span></div>
    <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
      <div className="h-full bg-emerald-400" style={{width: `${clamp(value)}%`}}></div>
    </div>
  </div>
)

function RhythmGame({ onEnd }) {
  const [beat, setBeat] = useState(0)
  const [score, setScore] = useState(0)
  useEffect(() => {
    let i = 0; const id = setInterval(()=>{ i++; setBeat(i); if (i>=12) { clearInterval(id); onEnd(score) }}, 700)
    return ()=>clearInterval(id)
  }, [])
  const tap = () => setScore(s=>s+1)
  return (
    <div className="card text-slate-900">
      <h3 className="text-lg font-semibold mb-2">Rythme</h3>
      <p className="mb-4">Tape en rythme pendant 12 temps.</p>
      <div className="flex items-center gap-2 mb-4">
        {Array.from({length:12}, (_,i)=> (
          <div key={i} className={`w-3 h-3 rounded-full ${i<beat? 'bg-emerald-500':'bg-slate-300'}`}></div>
        ))}
      </div>
      <button onClick={tap} className="btn bg-emerald-500 text-white">Tap !</button>
    </div>
  )
}

function ReflexGame({ onEnd }) {
  const [time, setTime] = useState(20)
  const [hits, setHits] = useState(0)
  const [pos, setPos] = useState({x:50,y:50})
  useEffect(()=>{
    const t = setInterval(()=> setTime(t=> t-1), 1000)
    const m = setInterval(()=> setPos({ x: 10+Math.random()*80, y: 10+Math.random()*60 }), 700)
    return ()=>{ clearInterval(t); clearInterval(m) }
  },[])
  useEffect(()=>{ if (time<=0) onEnd(hits) },[time])
  return (
    <div className="card relative text-slate-900 h-64">
      <h3 className="text-lg font-semibold mb-2">Réflexes</h3>
      <p className="mb-2">Touche la cible autant que possible (20s).</p>
      <div className="absolute inset-0">
        <button
          onClick={()=>setHits(h=>h+1)}
          className="absolute w-10 h-10 rounded-full bg-indigo-500"
          style={{left: pos.x+'%', top: pos.y+'%'}}
          aria-label="cible"
        />
      </div>
      <div className="absolute bottom-3 left-4 badge">Temps: {time}s</div>
      <div className="absolute bottom-3 right-4 badge">Score: {hits}</div>
    </div>
  )
}

export default function App(){
  const [dragon, setDragon] = useLocalStorage('dt_dragon', DEFAULT_DRAGON)
  const [log, setLog] = useLocalStorage('dt_log', [])
  const [input, setInput] = useState('')
  const [game, setGame] = useState(null) // 'rhythm' | 'reflex' | null

  useEffect(()=>{ setDragon(d=>decayDragon(d)) }, [])
  useEffect(()=>{ const id = setInterval(()=> setDragon(d=>decayDragon(d)), 60000); return ()=>clearInterval(id) },[])

  const fam = useMemo(()=> FAMILIES.find(f=>f.key===dragon.familyKey) || FAMILIES[0], [dragon.familyKey])
  const speech = useSpeech((text)=> handleText(text, true))

  const pushLog = (who, text) => setLog(l=>[...l.slice(-30), { id:Date.now()+Math.random(), who, text }])

  function handleText(text, viaVoice=false){
    const intent = detectIntent(text)
    intent.viaVoice = viaVoice
    const next = applyIntent(dragon, intent)
    let reply = ''
    switch (intent.type) {
      case 'feed': reply = 'Miam !'; break
      case 'wash': reply = 'Tout propre ✨'; break
      case 'sleep': reply = 'Zzz…'; break
      case 'play': reply = 'On joue ?'; break
      case 'story': reply = 'Raconte encore !'; break
      case 'train': reply = 'Je deviens plus fort !'; break
      case 'praise': reply = 'Merci !'; break
      case 'calm': reply = 'Je respire…'; break
      case 'scold': reply = 'Pardon…'; break
      case 'greet': reply = 'Salut !'; break
      default: reply = '💬'
    }
    setDragon(next)
    pushLog('you', text)
    pushLog('dragon', reply)
  }

  function tryEvolve(){
    if (canEvolve(dragon)) {
      const evo = evolve(dragon)
      setDragon(evo)
      pushLog('dragon', `✨ ${evo.stage === 'BEBE' ? 'Je suis né !' : 'J\'évolue !'} (${evo.stage})`)
    } else {
      pushLog('dragon', 'Pas encore prêt à évoluer…')
    }
  }

  function onMiniGameEnd(score){
    setGame(null)
    const delta = Math.min(30, Math.max(5, score))
    setDragon(d=> ({
      ...d,
      needs: { ...d.needs, mood: clamp(d.needs.mood + delta) },
      bond: { ...d.bond, affection: clamp(d.bond.affection + 10) },
      xp: d.xp + 20 + score,
      flags: { ...d.flags, minigameWins: d.flags.minigameWins + 1 }
    }))
    pushLog('dragon', `Mini-jeu terminé ! Score ${score}.`)
  }

  function resetAll(){
    setDragon(DEFAULT_DRAGON()); setLog([])
  }

  const stageEmoji = EMOJIS[dragon.stage] || '🐉'
  const ringStyle = { boxShadow: `0 0 0 6px ${fam.color}33, 0 0 0 12px ${fam.color}22` }

  return (
    <div className="mx-auto max-w-md h-full flex flex-col text-slate-100">
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 grid place-items-center text-xl rounded-full" style={{background:fam.color}}>{fam.emoji}</div>
          <div>
            <div className="text-sm opacity-80">DragonTama</div>
            <div className="text-lg font-semibold">{fam.name} <span className="opacity-70 text-sm">({dragon.stage})</span></div>
          </div>
        </div>
        <button className="btn bg-slate-800 text-slate-100" onClick={resetAll} title="Nouveau dragon">Nouvel œuf</button>
      </header>

      <main className="px-4 flex-1 flex flex-col gap-4">
        <div className="card bg-white/10 border-white/10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-28 h-28 grid place-items-center text-5xl rounded-full bg-white text-slate-900" style={ringStyle}>{stageEmoji}</div>
              <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-xs" style={{background:fam.color}}> {fam.element} </div>
            </div>
            <div className="flex-1">
              <div className="text-slate-200 text-sm mb-2">{dragon.name || 'Donne-moi un nom !'}</div>
              <div className="bg-slate-900/70 rounded-xl p-3 text-sm min-h-[48px]">{(log.filter(l=>l.who==='dragon').slice(-1)[0]?.text) || 'Bonjour !'}</div>
            </div>
          </div>
        </div>

        <div className="card bg-white/10 border-white/10">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Bar label="Faim" value={dragon.needs.hunger} />
            <Bar label="Énergie" value={dragon.needs.energy} />
            <Bar label="Hygiène" value={dragon.needs.hygiene} />
            <Bar label="Humeur" value={dragon.needs.mood} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="badge">Affection {fmt(dragon.bond.affection)}</div>
            <div className="badge">Discipline {fmt(dragon.bond.discipline)}</div>
            <div className="badge">Confiance {fmt(dragon.bond.trust)}</div>
          </div>
          <div className="mt-2 text-xs opacity-80">XP: {dragon.xp} | Victoires mini‑jeux: {dragon.flags.minigameWins}</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button className="btn bg-emerald-500" onClick={()=>handleText('nourrir')}>Nourrir</button>
          <button className="btn bg-sky-500" onClick={()=>handleText('laver')}>Laver</button>
          <button className="btn bg-indigo-500" onClick={()=>setGame('rhythm')}>Mini‑jeu Rythme</button>
          <button className="btn bg-violet-500" onClick={()=>setGame('reflex')}>Mini‑jeu Réflexes</button>
          <button className="btn bg-amber-500" onClick={()=>handleText('histoire')}>Histoire</button>
          <button className="btn bg-rose-500" onClick={()=>handleText('sieste')}>Sieste</button>
        </div>

        <div className="card bg-white/10 border-white/10">
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700"
                   placeholder="Parle à ton dragon…"
                   value={input}
                   onChange={(e)=>setInput(e.target.value)}
                   onKeyDown={(e)=>{ if(e.key==='Enter'&&input.trim()) { handleText(input.trim()); setInput('') } }} />
            <button className="btn bg-slate-800" onClick={()=>{ if(input.trim()){ handleText(input.trim()); setInput('') } }}>Envoyer</button>
            <VoiceButton speech={speech} />
          </div>
          <div className="mt-2 text-xs opacity-70">
            Astuce : essaie "Bonjour", "Nourrir", "Laver", "Jouer", "Histoire", "Dodo", "Entraînement", "Évolue"…
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn bg-fuchsia-500" onClick={tryEvolve}>✨ Évolution</button>
          <div className="text-xs opacity-80">Conditions : Œuf→Bébé (200 XP + 3 voix), Bébé→Petit (600 XP + Affection ≥60 + 5 mini‑jeux), Petit→Grand (1500 XP + Affection ≥80 + Discipline ≥50)</div>
        </div>

        <div className="card bg-white/10 border-white/10 max-h-48 overflow-auto">
          <div className="text-sm font-medium mb-2">Journal</div>
          <ul className="space-y-1 text-sm">
            {log.slice().reverse().map(m=> (
              <li key={m.id} className={m.who==='you'?'text-emerald-300':'text-slate-200'}>
                <span className="opacity-70">{m.who==='you'?'Toi':'Dragon'}:</span> {m.text}
              </li>
            ))}
          </ul>
        </div>
      </main>

      {game && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur grid place-items-center p-4">
          <div className="max-w-md w-full">
            <div className="flex justify-end mb-2"><button className="btn bg-slate-800" onClick={()=>setGame(null)}>Fermer</button></div>
            {game==='rhythm' && <RhythmGame onEnd={onMiniGameEnd} />}
            {game==='reflex' && <ReflexGame onEnd={onMiniGameEnd} />}
          </div>
        </div>
      )}

      <footer className="p-4 text-center text-xs opacity-60">Prototype © DragonTama • LocalStorage • PWA light</footer>
    </div>
  )
}

function VoiceButton({ speech }){
  return (
    <button className={`btn ${speech.supported?'bg-slate-800':'bg-slate-700/60 cursor-not-allowed'}`} onClick={()=>speech.supported && speech.start()} title="Maintenir pour parler">
      🎤 {speech.listening? 'Écoute…':'Parler'}
    </button>
  )
}
