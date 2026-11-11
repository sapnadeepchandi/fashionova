// Studio illustrations used for sample products without photography
export function shade(hex, p){
  let n=parseInt(hex.slice(1),16), r=n>>16, g=(n>>8)&255, b=n&255;
  const t=p<0?0:255, k=Math.abs(p)/100;
  r=Math.round((t-r)*k+r); g=Math.round((t-g)*k+g); b=Math.round((t-b)*k+b);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
let _u=0;
export function shoeSVG(type, hex, view){
  const id='g'+(++_u), l=shade(hex,22), d=shade(hex,-22), dd=shade(hex,-40), st=shade(hex,-30);
  const flip = view==='mirror' ? ' transform="translate(400 0) scale(-1 1)"' : '';
  const zoom = view==='detail' ? ' transform="translate(-170 -150) scale(1.85)"' : '';
  const bg = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l}"/><stop offset=".55" stop-color="${hex}"/><stop offset="1" stop-color="${d}"/></linearGradient>
  <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F1E8"/><stop offset="1" stop-color="#EADFD0"/></linearGradient>
  <radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3A2A22" stop-opacity=".28"/><stop offset="1" stop-color="#3A2A22" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9D3A2"/><stop offset=".5" stop-color="#B8955A"/><stop offset="1" stop-color="#8E6E3A"/></linearGradient></defs>
  <rect x="-1200" y="-1200" width="2800" height="2800" fill="#F3EBE0"/><path d="M-1200 290 H1600 V1600 H-1200Z" fill="#E7DCCD" opacity=".7"/>`;
  let s='';
  if(type==='ballet'){
    s=`<ellipse cx="208" cy="262" rx="168" ry="14" fill="url(#${id}s)"/>
    <path d="M58 248 Q56 258 72 260 L322 260 Q358 258 362 246 L64 242Z" fill="#2E211B"/>
    <path d="M60 246 C52 218 58 186 80 174 C98 166 108 182 126 192 C156 208 188 212 218 208 C268 202 322 206 348 224 C362 232 366 242 360 248 Z" fill="url(#${id})" stroke="${st}" stroke-width="1"/>
    <path d="M80 176 C100 174 110 190 128 198 C158 212 190 214 218 209 C190 205 154 196 130 184 C112 176 98 170 80 176Z" fill="#E8D7C2"/>
    <path d="M84 186 C110 196 150 214 214 215 C270 212 320 216 350 234" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="3 4" opacity=".7"/>
    <g transform="translate(214 208)"><path d="M0 0 C-14 -12 -26 -6 -24 4 C-22 12 -10 10 0 3Z" fill="${d}"/><path d="M0 0 C14 -12 26 -6 24 4 C22 12 10 10 0 3Z" fill="${d}"/><ellipse cx="0" cy="2" rx="5" ry="5" fill="${dd}"/></g>
    <path d="M120 236 C200 240 290 236 344 240" stroke="#fff" stroke-opacity=".22" stroke-width="3" fill="none"/>`;
  } else if(type==='loafer'){
    s=`<ellipse cx="208" cy="262" rx="170" ry="14" fill="url(#${id}s)"/>
    <path d="M58 244 L60 262 L112 262 L110 244Z" fill="#2E211B"/>
    <path d="M58 246 Q60 258 112 258 L330 258 Q360 256 364 244 L60 240Z" fill="#2E211B"/>
    <path d="M60 246 C50 210 56 170 80 160 C100 156 120 168 150 172 C182 176 196 168 214 160 C236 152 262 166 290 184 C318 200 352 214 362 236 C364 244 360 248 356 248Z" fill="url(#${id})" stroke="${st}" stroke-width="1"/>
    <path d="M82 162 C104 162 126 172 150 176 C176 180 192 174 206 166 C186 170 166 170 148 166 C122 162 102 154 82 162Z" fill="#E8D7C2"/>
    <path d="M206 168 C232 158 262 172 288 190 C312 206 334 214 352 226" fill="none" stroke="${dd}" stroke-width="1.2" opacity=".55"/>
    <path d="M210 172 C236 164 262 178 286 194 C310 208 332 218 348 230" fill="none" stroke="${l}" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>
    <rect x="198" y="164" width="44" height="10" rx="5" fill="url(#${id}gd)" transform="rotate(-6 220 169)"/>
    <circle cx="198" cy="171" r="5" fill="none" stroke="url(#${id}gd)" stroke-width="3"/><circle cx="244" cy="166" r="5" fill="none" stroke="url(#${id}gd)" stroke-width="3"/>
    <path d="M110 232 C200 236 290 236 346 236" stroke="#fff" stroke-opacity=".2" stroke-width="3" fill="none"/>`;
  } else { // sneaker
    s=`<ellipse cx="208" cy="268" rx="172" ry="15" fill="url(#${id}s)"/>
    <path d="M52 230 C50 250 60 262 84 262 L328 262 C356 262 370 252 368 236 L52 226Z" fill="#F8F4EE" stroke="#D8C9B5" stroke-width="1.2"/>
    <path d="M54 246 L368 246" stroke="#D8C9B5" stroke-width="1"/>
    <path d="M60 254 L362 254" stroke="url(#${id}gd)" stroke-width="2"/>
    <path d="M56 232 C46 196 54 146 78 132 C94 124 110 134 124 140 C140 148 156 146 168 138 L174 118 C182 112 196 114 200 122 L204 140 C224 156 250 170 280 186 C318 204 356 214 366 232 L366 236 L56 236Z" fill="url(#${id})" stroke="${st}" stroke-width="1.1"/>
    <path d="M78 134 C94 128 110 138 124 144 C140 152 156 150 168 142 C150 146 134 140 120 132 C104 124 90 124 78 134Z" fill="#E8D7C2"/>
    <path d="M200 144 C226 160 252 176 282 192 L360 222" fill="none" stroke="${dd}" stroke-width="1" opacity=".45"/>
    <path d="M100 214 C150 196 210 196 272 214" fill="none" stroke="${dd}" stroke-width="1" opacity=".35"/>
    ${[0,1,2,3].map(i=>`<path d="M${186+i*16} ${146+i*9} l14 -8" stroke="#F8F4EE" stroke-width="3.2" stroke-linecap="round"/><circle cx="${184+i*16}" cy="${149+i*9}" r="2" fill="${dd}"/>`).join('')}
    <path d="M58 168 C54 190 56 214 60 230 L84 230 C80 210 78 186 82 164Z" fill="url(#${id}gd)" opacity=".95"/>
    <circle cx="246" cy="214" r="2" fill="${dd}" opacity=".5"/><circle cx="256" cy="216" r="2" fill="${dd}" opacity=".5"/><circle cx="266" cy="218" r="2" fill="${dd}" opacity=".5"/>`;
  }
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${type} illustration" preserveAspectRatio="xMidYMid meet" overflow="visible" style="overflow:visible">${bg}<g${zoom}><g${flip}>${s}</g></g></svg>`;
}


