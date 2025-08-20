export const ELEMENTS = ['feu','eau','vent','terre','lumiere','ombre']

export const ELEMENT_LABEL = {
  feu:'Feu', eau:'Eau', vent:'Vent', terre:'Terre', lumiere:'Lumière', ombre:'Ombre'
}

export const MOVES = {
  feu: [
    { id:'etincelle', name:'Étincelle', power:8, cost:2 },
    { id:'flamboiement', name:'Flamboiement', power:12, cost:3 },
  ],
  eau: [
    { id:'onde', name:'Onde', power:8, cost:2 },
    { id:'geyser', name:'Geyser', power:12, cost:3 },
  ],
  vent: [
    { id:'bourrasque', name:'Bourrasque', power:8, cost:2 },
    { id:'cyclone', name:'Cyclone', power:12, cost:3 },
  ],
  terre: [
    { id:'roc', name:'Roc', power:8, cost:2 },
    { id:'seisme', name:'Séisme doux', power:12, cost:3 },
  ],
  lumiere: [
    { id:'halo', name:'Halo', power:9, cost:2 },
    { id:'aube', name:"Aube radieuse", power:13, cost:3 },
  ],
  ombre: [
    { id:'voile', name:'Voile sombre', power:9, cost:2 },
    { id:'nuit', name:'Nuit feutrée', power:13, cost:3 },
  ]
}

export function defaultMoves(element){ return MOVES[element].slice(0,2) }

export function randomEnemy(){ 
  const pool = ['Blob Gelée','Chardon Amical','Brise Capricieuse','Taupinou','Lueur Curieuse']
  const elts = ELEMENTS
  const name = pool[Math.floor(Math.random()*pool.length)]
  const element = elts[Math.floor(Math.random()*elts.length)]
  return { name, element, hp: 40 + Math.floor(Math.random()*20), max: 60 }
}
