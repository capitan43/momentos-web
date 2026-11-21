import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Camera, Heart, ImagePlus, LoaderCircle, Sparkles, Upload, ChevronDown, ExternalLink } from 'lucide-react';
import './style.css';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type EventInfo = { id: string; name: string; slug: string; description?: string | null; event_date?: string | null; cover_url?: string | null; welcome_message?: string | null; gallery_public?: boolean; is_active?: boolean };
type Memory = { id: string; guest_name: string; message: string; photo_url: string | null; created_at: string };
const sampleEvent: EventInfo = { id: 'demo', name: 'Una celebración para recordar', slug: 'demo', description: 'Compartamos fotografías, cariño y recuerdos.', welcome_message: '¡Qué lindo que estés aquí! Deja una fotografía y un mensaje para que este momento quede guardado para siempre.', gallery_public: true, is_active: true };

function App() {
 const slug = location.pathname.startsWith('/e/') ? decodeURIComponent(location.pathname.split('/e/')[1].split('/')[0]) : new URLSearchParams(location.search).get('evento');
 const [event, setEvent] = useState<EventInfo | null>(null);
 const [memories, setMemories] = useState<Memory[]>([]);
 const [guestName, setGuestName] = useState(''); const [message, setMessage] = useState(''); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [sending, setSending] = useState(false); const [notice, setNotice] = useState(''); const [loading, setLoading] = useState(true); const [tab, setTab] = useState<'write'|'gallery'>('write');
 useEffect(() => { if (file) { const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); } else setPreview(''); }, [file]);
 useEffect(() => { loadEvent(); }, [slug]);
 async function loadEvent() {
   setLoading(true);
   if (!supabase || !slug) { setEvent(sampleEvent); setMemories([]); setLoading(false); return; }
   const { data: e, error } = await supabase.from('events').select('id,name,slug,description,event_date,cover_url,welcome_message,gallery_public,is_active').eq('slug', slug).eq('is_active', true).maybeSingle();
   if (error || !e) { setEvent(null); setNotice(error ? 'No se pudo consultar el evento. Revisa la configuración de Supabase.' : 'No encontramos este evento o está cerrado.'); setLoading(false); return; }
   setEvent(e);
   await loadMemories(e);
   setLoading(false);
 }
 async function loadMemories(e = event) {
   if (!supabase || !e?.id || e.id === 'demo' || !e.gallery_public) return;
   const { data } = await supabase.from('memories').select('id,guest_name,message,photo_url,created_at').eq('event_id', e.id).eq('status','approved').order('created_at',{ascending:false});
   setMemories((data || []) as Memory[]);
 }
 async function publish(e: React.FormEvent) {
   e.preventDefault(); setNotice('');
   if (!guestName.trim() || !message.trim()) { setNotice('Completa tu nombre y dedicatoria.'); return; }
   if (!supabase || !event || event.id === 'demo') { setNotice('Modo de vista previa: configura las credenciales y abre un evento real para guardar recuerdos.'); return; }
   if (!file) { setNotice('Agrega una fotografía para compartir tu recuerdo.'); return; }
   if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { setNotice('Usa una imagen JPG, PNG o WebP.'); return; }
   if (file.size > 10 * 1024 * 1024) { setNotice('La imagen debe pesar menos de 10 MB.'); return; }
   setSending(true);
   try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${event.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('momentos-fotos').upload(path, file, {contentType:file.type, upsert:false});
    if (uploadError) throw uploadError;
    const { data: publicData } = supabase.storage.from('momentos-fotos').getPublicUrl(path);
    const { error: insertError } = await supabase.from('memories').insert({ event_id:event.id, guest_name:guestName.trim().slice(0,100), message:message.trim().slice(0,700), photo_url:publicData.publicUrl, status:'pending' });
    if (insertError) throw insertError;
    setNotice('¡Recuerdo enviado! Quedará visible cuando el anfitrión lo apruebe.'); setGuestName(''); setMessage(''); setFile(null);
   } catch (err: any) { setNotice(err?.message || 'No pudimos enviar tu recuerdo. Intenta nuevamente.'); }
   finally { setSending(false); }
 }
 if (loading) return <main className="loading"><LoaderCircle className="spin"/><p>Preparando tu momento…</p></main>;
 if (!event) return <main className="empty"><div className="brand">MOMENTOS</div><h1>Este evento no está disponible</h1><p>{notice || 'Revisa el enlace e intenta nuevamente.'}</p></main>;
 const isDemo = !supabase || event.id === 'demo';
 return <main className="app">
  <header className="top"><div className="brand"><Sparkles size={17}/> MOMENTOS</div><span className="topnote">Cada momento merece ser recordado</span></header>
  <section className="hero">
   {event.cover_url && <img className="cover" src={event.cover_url} alt="Portada del evento"/>}
   <div className="hero-inner"><span className="eyebrow">UN LIBRO DE RECUERDOS DIGITAL</span><h1>{event.name}</h1>{event.event_date && <p className="date">{new Date(event.event_date+'T12:00:00').toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric'})}</p>}<p className="welcome">{event.welcome_message || event.description || 'Comparte una fotografía y una dedicatoria para guardar este momento.'}</p><div className="hero-heart"><Heart size={18} fill="currentColor"/> Recuerdos que se quedan</div></div>
  </section>
  {isDemo && <div className="demo-banner">Vista previa de MOMENTOS. Configura las variables de Supabase y entra con un enlace de evento real para guardar publicaciones.</div>}
  <nav className="tabs"><button className={tab==='write'?'active':''} onClick={()=>setTab('write')}><Camera size={17}/> Dejar un recuerdo</button><button className={tab==='gallery'?'active':''} onClick={()=>{setTab('gallery');loadMemories();}}><ImagePlus size={17}/> Galería <span className="count">{memories.length}</span></button></nav>
  {tab==='write' ? <section className="form-card"><div className="section-heading"><div className="icon-circle"><Heart size={20}/></div><div><h2>Tu recuerdo</h2><p>Una foto, unas palabras… y quedará para siempre.</p></div></div>
   <form onSubmit={publish}><label>Tu nombre<input value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="¿Quién deja este recuerdo?" maxLength={100}/></label><label>Fotografía <span className="label-note">JPG, PNG o WebP · Máx. 10 MB</span><div className="upload" onClick={()=>document.getElementById('photoInput')?.click()}>{preview?<img src={preview} alt="Vista previa de tu foto"/>:<><Upload size={25}/><strong>Toca para elegir una fotografía</strong><small>También puedes buscarla en tu galería</small></>}</div><input id="photoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>setFile(e.target.files?.[0] || null)}/>{file && <button type="button" className="remove" onClick={()=>setFile(null)}>Quitar foto</button>}</label><label>Tu dedicatoria<textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={700} placeholder="Escribe un mensaje bonito, un recuerdo o tus buenos deseos…" rows={5}/><small className="counter">{message.length}/700</small></label><button className="submit" disabled={sending}>{sending?<><LoaderCircle className="spin"/> Enviando…</>:<>Compartir mi recuerdo <Heart size={17}/></>}</button>{notice && <div className="notice">{notice}</div>}</form><p className="privacy"><Heart size={14}/> Tu recuerdo será revisado por el anfitrión antes de aparecer en la galería.</p></section>
  : <section className="gallery"><div className="gallery-title"><h2>Recuerdos compartidos</h2><p>Las fotografías y mensajes que ya son parte de esta historia.</p></div>{memories.length===0?<div className="empty-gallery"><ImagePlus size={30}/><h3>La galería está comenzando</h3><p>Los recuerdos aprobados aparecerán aquí.</p><button onClick={()=>setTab('write')}>Compartir el primero</button></div>:<div className="memory-grid">{memories.map(m=><article className="memory" key={m.id}>{m.photo_url&&<img src={m.photo_url} alt={`Fotografía de ${m.guest_name}`}/>}<div className="memory-text"><p>{m.message}</p><span>— {m.guest_name}</span></div></article>)}</div>}</section>}
  <footer><div className="brand"><Sparkles size={16}/> MOMENTOS</div><p>Porque los momentos más simples se convierten en los recuerdos más grandes.</p><span className="footer-mark">Hecho para guardar lo que importa <Heart size={12}/></span></footer>
 </main>
}
createRoot(document.getElementById('root')!).render(<App/>);
