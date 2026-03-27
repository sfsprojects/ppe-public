import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Html5Qrcode } from "html5-qrcode";

const supabase = createClient(
  "https://bjelaqrnetmuuvnpsble.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWxhcXJuZXRtdXV2bnBzYmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTM2MjYsImV4cCI6MjA5MDEyOTYyNn0._nEPU_eE9-NXwrziPNFQazLZQprW1XupJzWtMzvFq5c"
);

const normalizePlate = p => p.toUpperCase().replace(/[\s\-\.]/g, "");

const FONT = "Consolas, 'Courier New', monospace";
const S = {
  app:     { fontFamily:FONT, background:"#f0ede8", minHeight:"100vh", color:"#1a1a2e" },
  header:  { background:"#1a1a2e", padding:"12px 22px", display:"flex", alignItems:"center", gap:10 },
  logoIcon:{ width:28, height:28, background:"#c8102e", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:12, fontFamily:FONT },
  logoText:{ color:"white", fontWeight:700, fontSize:13, fontFamily:FONT },
  logoSub: { color:"#6b7a99", fontSize:10, display:"block", fontFamily:FONT },
  page:    { minHeight:"calc(100vh - 52px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 20px" },
  pageTop: { minHeight:"calc(100vh - 52px)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"28px 20px" },
  card:    { background:"white", borderRadius:8, padding:"32px 28px", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", border:"1px solid #e0dcd5", width:"100%", maxWidth:440 },
  label:   { display:"block", fontSize:10, fontWeight:700, color:"#6b7a99", textTransform:"uppercase", letterSpacing:0.9, marginBottom:7, fontFamily:FONT },
  input:   { width:"100%", padding:"12px 14px", border:"2px solid #e0dcd5", borderRadius:6, fontSize:14, color:"#1a1a2e", background:"#faf9f7", outline:"none", boxSizing:"border-box", fontFamily:FONT },
  textarea:{ width:"100%", padding:"12px 14px", border:"2px solid #e0dcd5", borderRadius:6, fontSize:13, color:"#1a1a2e", background:"#faf9f7", outline:"none", boxSizing:"border-box", resize:"vertical", minHeight:90, fontFamily:FONT },
  btnPrimary:{ width:"100%", background:"#1a1a2e", color:"white", border:"none", borderRadius:6, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT, marginTop:6 },
  btnOutline:{ width:"100%", background:"transparent", color:"#1a1a2e", border:"2px solid #d0cbc4", borderRadius:6, padding:"11px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT, marginTop:8 },
  btnDark:   { width:"100%", background:"#1a1a2e", color:"white", border:"none", borderRadius:6, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT },
  error:   { marginTop:10, padding:"10px 13px", background:"#fff0f2", borderRadius:6, color:"#c8102e", fontSize:12, border:"1px solid #ffd0d7", fontFamily:FONT },
  infoRow: { display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #f0ede8", gap:12 },
  iKey:    { fontSize:10, color:"#6b7a99", fontWeight:700, textTransform:"uppercase", letterSpacing:0.7, whiteSpace:"nowrap", paddingTop:1, fontFamily:FONT },
  iVal:    { fontSize:12, fontWeight:700, textAlign:"right", fontFamily:FONT },
};

function Header() {
  return (
    <div style={S.header}>
      <div style={S.logoIcon}>P</div>
      <div>
        <div style={S.logoText}>Infraction de stationnement</div>
        <span style={S.logoSub}>Consultation en ligne</span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={S.infoRow}>
      <span style={S.iKey}>{label}</span>
      <span style={S.iVal}>{value}</span>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom:14 }}><label style={S.label}>{label}</label>{children}</div>;
}

/* ── Step 1: Code entry with QR scan ── */
function StepCode({ onFound }) {
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = React.useRef(null);

  // Read ?code= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code");
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      submit(urlCode.toUpperCase());
    }
  }, []);

  const stopScanner = () => {
    if (scannerRef.current) { scannerRef.current.stop().catch(()=>{}); scannerRef.current=null; }
    setScanning(false);
  };

  const startScanner = async () => {
    setError(""); setScanning(true);
    await new Promise(r=>setTimeout(r,150));
    try {
      const s = new Html5Qrcode("qr-reader-public");
      scannerRef.current = s;
      await s.start({ facingMode:"environment" }, { fps:10, qrbox:{width:220,height:220} },
        async (decoded) => {
          stopScanner();
          // Handle both plain code and full URL with ?code=
          let clean = decoded.trim().toUpperCase();
          const urlMatch = clean.match(/[?&]CODE=([A-Z0-9]{8})/);
          if (urlMatch) clean = urlMatch[1];
          setCode(clean);
          await submit(clean);
        }, ()=>{});
    } catch { setScanning(false); setError("Impossible d'accéder à la caméra. Saisissez le code manuellement."); }
  };

  React.useEffect(()=>()=>stopScanner(),[]);

  const submit = async (val) => {
    const clean = (val||code).trim().toUpperCase();
    if (!clean) { setError("Veuillez saisir le code de l'avis."); return; }
    setLoading(true);
    const { data, error:err } = await supabase
      .from("infractions").select("*, messages(*)").eq("id",clean).single();
    setLoading(false);
    if (err||!data) { setError("Aucun avis trouvé pour ce code. Vérifiez la saisie."); return; }
    setError(""); onFound(data);
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign:"center", marginBottom:26 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📄</div>
          <h1 style={{ fontSize:19, fontWeight:700, margin:"0 0 8px", fontFamily:FONT }}>Consulter un avis d'infraction</h1>
          <p style={{ color:"#6b7a99", fontSize:12, margin:0, lineHeight:1.6, fontFamily:FONT }}>
            Scannez le QR code ou saisissez le code à 8 caractères figurant sur l'avis.
          </p>
        </div>

        {/* Scanner */}
        {!scanning ? (
          <button onClick={startScanner} style={{ ...S.btnDark, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13 }}>
            📷 Scanner le QR code
          </button>
        ) : (
          <div style={{ marginBottom:16 }}>
            <div id="qr-reader-public" style={{ width:"100%", borderRadius:8, overflow:"hidden", border:"2px solid #1a1a2e" }} />
            <button onClick={stopScanner} style={{ ...S.btnOutline, marginTop:10, fontSize:12 }}>Annuler le scan</button>
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px", color:"#aaa", fontSize:11, fontFamily:FONT }}>
          <div style={{ flex:1, height:1, background:"#e0dcd5" }} />ou saisir manuellement<div style={{ flex:1, height:1, background:"#e0dcd5" }} />
        </div>

        <Field label="Code de l'avis">
          <input
            style={{ ...S.input, fontSize:22, letterSpacing:6, textAlign:"center", textTransform:"uppercase", fontWeight:700 }}
            value={code}
            onChange={e=>{ setCode(e.target.value.replace(/\s/g,"").toUpperCase()); setError(""); }}
            placeholder="XXXXXXXX"
            maxLength={8}
            onKeyDown={e=>e.key==="Enter"&&submit()}
          />
        </Field>
        {error && <div style={S.error}>{error}</div>}
        <button onClick={()=>submit()} disabled={loading||scanning}
          style={{ ...S.btnPrimary, opacity:(loading||scanning)?0.6:1 }}>
          {loading ? "Recherche…" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}

/* ── Step 2: Plate verification ── */
function StepPlate({ infraction, onConfirm }) {
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (!plate.trim()) { setError("Veuillez saisir votre numéro de plaque."); return; }
    if (normalizePlate(plate)===normalizePlate(infraction.plate||"")) { setError(""); onConfirm(); }
    else setError("Ce numéro de plaque ne correspond pas à cet avis. Vérifiez votre saisie.");
  };
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign:"center", marginBottom:26 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🔒</div>
          <h1 style={{ fontSize:19, fontWeight:700, margin:"0 0 8px", fontFamily:FONT }}>Vérification</h1>
          <p style={{ color:"#6b7a99", fontSize:12, margin:0, lineHeight:1.6, fontFamily:FONT }}>
            Pour accéder aux détails, confirmez le numéro de plaque de votre véhicule.
          </p>
        </div>
        <Field label="Numéro de plaque">
          <input
            style={{ ...S.input, fontSize:18, letterSpacing:3, textAlign:"center", textTransform:"uppercase", fontWeight:700 }}
            value={plate}
            onChange={e=>{ setPlate(e.target.value.toUpperCase()); setError(""); }}
            placeholder="GE 123456"
            onKeyDown={e=>e.key==="Enter"&&submit()}
            autoFocus
          />
        </Field>
        <p style={{ color:"#aaa", fontSize:11, marginTop:-6, marginBottom:10, textAlign:"center", fontFamily:FONT }}>
          Les espaces sont acceptés — GE 123456 ou GE123456
        </p>
        {error && <div style={S.error}>{error}</div>}
        <button onClick={submit} style={S.btnPrimary}>Accéder à mon avis →</button>
      </div>
    </div>
  );
}

/* ── Step 3A: Blank code ── */
function StepBlank({ onReset }) {
  return (
    <div style={S.page}>
      <div style={{ ...S.card, textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
        <h2 style={{ fontSize:17, fontWeight:700, marginBottom:10, fontFamily:FONT }}>Dossier non encore enregistré</h2>
        <p style={{ color:"#6b7a99", fontSize:12, lineHeight:1.7, marginBottom:22, fontFamily:FONT }}>
          Ce code n'est pas encore associé à une infraction. Si vous avez reçu ce document récemment, votre dossier est peut-être en cours d'enregistrement.
        </p>
        <p style={{ color:"#6b7a99", fontSize:12, lineHeight:1.7, marginBottom:28, fontFamily:FONT }}>
          Pour toute question, utilisez le formulaire de contact disponible ci-dessous en indiquant le code figurant sur votre avis.
        </p>
        <button onClick={onReset} style={{ ...S.btnPrimary, marginTop:0 }}>← Retour</button>
      </div>
    </div>
  );
}

/* ── Step 3B: Result ── */
function StepResult({ infraction, onReset }) {
  const [showContact, setShowContact] = useState(false);
  const [form, setForm]               = useState({ lastName:"", firstName:"", email:"", phone:"", message:"" });
  const [sent, setSent]               = useState(false);
  const [formError, setFormError]     = useState("");
  const [sending, setSending]         = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const isCancelled = infraction.status === "cancelled";
  const photos      = infraction.photos || [];

  useEffect(() => {
    if (infraction.status === "active") {
      supabase.from("infractions")
        .update({ status:"viewed", viewed_at:new Date().toISOString() })
        .eq("id", infraction.id);
    }
  }, []);

  const submitContact = async () => {
    if (!form.lastName.trim()||!form.firstName.trim()||!form.email.trim()||!form.phone.trim()||!form.message.trim()) {
      setFormError("Tous les champs sont obligatoires."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError("Adresse e-mail invalide."); return; }
    setSending(true);
    await supabase.from("messages").insert({
      infraction_id:     infraction.id,
      sender_last_name:  form.lastName.trim(),
      sender_first_name: form.firstName.trim(),
      sender_email:      form.email.trim(),
      sender_phone:      form.phone.trim(),
      plate:             infraction.plate,
      message:           form.message.trim(),
      read:              false,
    });
    setSending(false); setSent(true); setFormError("");
  };

  return (
    <div style={S.pageTop}>
      <div style={{ width:"100%", maxWidth:500 }}>
        {/* Header */}
        <div style={{ background:"#1a1a2e", color:"white", borderRadius:"8px 8px 0 0", padding:"16px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:isCancelled?"#9ca3af":"#c8102e", marginBottom:4, fontFamily:FONT }}>
              {isCancelled ? "Dossier classé" : "Avis de stationnement"}
            </div>
            <div style={{ fontWeight:700, fontSize:16, fontFamily:FONT }}>{isCancelled ? "Infraction annulée" : "Détails de l'infraction"}</div>
          </div>
          <div style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, textTransform:"uppercase", fontFamily:FONT,
            background:isCancelled?"#f3f4f6":"#fff0f2", color:isCancelled?"#6b7280":"#c8102e",
            border:`1px solid ${isCancelled?"#e5e7eb":"#ffd0d7"}` }}>
            {isCancelled ? "Annulé" : "Actif"}
          </div>
        </div>

        {/* Content */}
        {isCancelled ? (
          <div style={{ background:"white", border:"1px solid #e0dcd5", borderTop:"none", padding:"20px 22px" }}>
            <p style={{ fontSize:13, color:"#444", lineHeight:1.7, margin:0, fontFamily:FONT }}>
              L'infraction initialement enregistrée pour votre véhicule (<strong>{infraction.plate}</strong>) a été annulée. Aucune suite ne sera donnée à ce dossier.
            </p>
          </div>
        ) : (
          <div style={{ background:"white", border:"1px solid #e0dcd5", borderTop:"none" }}>
            <div style={{ padding:"4px 22px 0" }}>
              <InfoRow label="Plaque"     value={infraction.plate} />
              <InfoRow label="Infraction" value={infraction.violation} />
              <InfoRow label="Date"       value={`${infraction.date} à ${infraction.time}`} />
              <InfoRow label="Lieu"       value={infraction.location} />
              <InfoRow label="Référence"  value={infraction.id} />
            </div>
            {infraction.description && (
              <div style={{ margin:"0 22px 16px", padding:"10px 12px", background:"#faf9f7", borderRadius:6, borderLeft:"2px solid #d0cbc4" }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6, color:"#6b7a99", marginBottom:5, fontFamily:FONT }}>Observations</div>
                <div style={{ fontSize:12, color:"#444", lineHeight:1.6, fontFamily:FONT }}>{infraction.description}</div>
              </div>
            )}
            {photos.length > 0 && (
              <div style={{ padding:"0 22px 16px" }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6, color:"#6b7a99", marginBottom:8, fontFamily:FONT }}>Photos ({photos.length})</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {photos.map((src,i)=><a key={i} href={src} target="_blank" rel="noreferrer"><img src={src} style={{ width:"100%", height:120, objectFit:"cover", borderRadius:6, cursor:"pointer" }} /></a>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Récidive notice */}
        {!isCancelled && (
          <div style={{ background:"#faf9f7", border:"1px solid #e0dcd5", borderTop:"none", padding:"12px 22px" }}>
            <p style={{ fontSize:11, color:"#6b7a99", margin:0, lineHeight:1.6, fontFamily:FONT }}>Toute récidive fera l'objet d'un suivi renforcé.</p>
          </div>
        )}

        {/* Contact */}
        {!sent && (
          <div style={{ background:"#f0ede8", border:"1px solid #e0dcd5", borderTop:"none", borderRadius:"0 0 8px 8px", padding:"14px 22px" }}>
            {!showContact ? (
              <button onClick={()=>setShowContact(true)} style={{ ...S.btnOutline, marginTop:0, background:"white" }}>✉ Contacter</button>
            ) : (
              <div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:"#6b7a99", marginBottom:14, fontFamily:FONT }}>Formulaire de contact</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <Field label="Nom *"><input style={S.input} value={form.lastName} onChange={e=>{set("lastName",e.target.value);setFormError("");}} placeholder="Dupont" /></Field>
                  <Field label="Prénom *"><input style={S.input} value={form.firstName} onChange={e=>{set("firstName",e.target.value);setFormError("");}} placeholder="Jean" /></Field>
                </div>
                <Field label="E-mail *"><input style={S.input} type="email" value={form.email} onChange={e=>{set("email",e.target.value);setFormError("");}} placeholder="jean@example.com" /></Field>
                <Field label="Téléphone *"><input style={S.input} type="tel" value={form.phone} onChange={e=>{set("phone",e.target.value);setFormError("");}} placeholder="079 123 45 67" /></Field>
                <Field label="Plaque"><input style={{ ...S.input, background:"#f0ede8", color:"#888", cursor:"not-allowed" }} value={infraction.plate||""} readOnly /></Field>
                <Field label="Message *"><textarea style={S.textarea} value={form.message} onChange={e=>{set("message",e.target.value);setFormError("");}} placeholder="Décrivez votre situation…" /></Field>
                {formError && <div style={S.error}>{formError}</div>}
                <div style={{ display:"flex", gap:10, marginTop:6 }}>
                  <button onClick={()=>setShowContact(false)} style={{ ...S.btnOutline, marginTop:0, flex:1 }}>Annuler</button>
                  <button onClick={submitContact} disabled={sending} style={{ ...S.btnPrimary, marginTop:0, flex:2, opacity:sending?0.6:1 }}>{sending?"Envoi…":"Envoyer le message"}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {sent && (
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderTop:"none", borderRadius:"0 0 8px 8px", padding:"16px 22px", textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>✓</div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6, fontFamily:FONT }}>Message transmis</div>
            <div style={{ fontSize:12, color:"#6b7a99", fontFamily:FONT }}>Votre message a bien été transmis.</div>
          </div>
        )}

        <button onClick={onReset} style={{ ...S.btnOutline, marginTop:14, background:"white", border:"1.5px solid #d0cbc4" }}>← Consulter un autre avis</button>
      </div>
    </div>
  );
}

/* ── App Root ── */
export default function PublicApp() {
  const [step, setStep]             = useState("code");
  const [infraction, setInfraction] = useState(null);
  const reset = () => { setStep("code"); setInfraction(null); };const reset = () => {
  window.history.replaceState({}, "", window.location.pathname);
  setStep("code");
  setInfraction(null);
};

  const handleFound = (data) => {
    setInfraction(data);
    setStep(data.status==="blank" ? "blank" : "plate");
  };

  return (
    <div style={S.app}>
      <Header />
      {step==="code"   && <StepCode  onFound={handleFound} />}
      {step==="plate"  && infraction && <StepPlate infraction={infraction} onConfirm={()=>setStep("result")} />}
      {step==="blank"  && <StepBlank onReset={reset} />}
      {step==="result" && infraction && <StepResult infraction={infraction} onReset={reset} />}
    </div>
  );
}
