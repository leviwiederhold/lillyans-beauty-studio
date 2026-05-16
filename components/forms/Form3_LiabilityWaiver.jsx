import { useState, useRef, useEffect } from "react";
import SignaturePad from "signature_pad";

const s = {
  wrap: { fontFamily:"'DM Sans',sans-serif", color:"#2c2220", background:"#faf8f6", paddingBottom:80 },
  hdr: { background:"#fff", borderBottom:"1px solid #f0e8e4", padding:"20px 20px 16px", position:"sticky", top:0, zIndex:10 },
  hdrTop: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  back: { background:"none", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#b85c72", cursor:"pointer" },
  title: { fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:400 },
  progWrap: { height:3, background:"#f0e8e4", borderRadius:2 },
  progBar: { height:"100%", background:"#b85c72", borderRadius:2, width:"100%" },
  sec: { background:"#fff", margin:"12px 16px 0", borderRadius:14, border:"1px solid #f0e8e4", overflow:"hidden" },
  secHdr: { padding:"14px 16px 10px", borderBottom:"1px solid #f7f0ee" },
  secEye: { fontSize:9, letterSpacing:".16em", textTransform:"uppercase", color:"#b85c72", marginBottom:2 },
  secTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:400 },
  body: { padding:"14px 16px" },
  svcBanner: { background:"#fdf5f7", border:"1px solid #f0d8de", borderRadius:10, padding:"12px 14px", marginBottom:14 },
  svcLabel: { fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"#b85c72", marginBottom:3 },
  svcName: { fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:"#2c2220" },
  scrollHint: { fontSize:11, color:"#b85c72", textAlign:"center", padding:"6px 0 10px", display:"flex", alignItems:"center", justifyContent:"center", gap:5 },
  consentBlock: { background:"#faf8f6", border:"1px solid #ede5e2", borderRadius:10, padding:14, maxHeight:260, overflowY:"auto", marginBottom:12 },
  consentText: { fontSize:12.5, color:"#4a3030", lineHeight:1.75 },
  divider: { height:1, background:"#f7f0ee", margin:"14px 0" },
  row: { marginBottom:14 },
  label: { fontSize:11, fontWeight:500, color:"#7a5a5a", letterSpacing:".04em", marginBottom:5, display:"block" },
  input: { width:"100%", padding:"10px 12px", background:"#faf8f6", border:"1px solid #ede5e2", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#2c2220", outline:"none", boxSizing:"border-box" },
  ack: (checked, locked) => ({ display:"flex", gap:10, alignItems:"flex-start", padding:12, background:"#fdf5f7", borderRadius:10, border:"1px solid #f0d8de", cursor:locked?"not-allowed":"pointer", marginBottom:12, opacity:locked?0.5:1 }),
  ackBox: (checked) => ({ width:20, height:20, borderRadius:5, border:`1.5px solid ${checked?"#b85c72":"#ddd"}`, flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center", background:checked?"#b85c72":"transparent", color:checked?"#fff":"transparent", fontSize:12 }),
  ackText: { fontSize:12, color:"#5a3a3a", lineHeight:1.5 },
  sigPad: { border:"1px solid #ede5e2", borderRadius:9, background:"#fff", width:"100%", height:100, cursor:"crosshair", touchAction:"none", display:"block" },
  sigClear: { background:"none", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#b85c72", cursor:"pointer", marginTop:4, padding:0 },
  submit: { display:"block", width:"calc(100% - 32px)", margin:"20px 16px 0", padding:15, background:"#b85c72", color:"#fff", border:"none", borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500, cursor:"pointer", textAlign:"center" },
};

const WAIVER_TEXT = `I have voluntarily elected to undergo this treatment/procedure after the nature and purpose of this treatment have been explained to me.

I understand and acknowledge that there are risks involved with the treatment I will be receiving. Although it is impossible to list every potential risk and complication, I have been informed of possible benefits, risks, and complications, and I have had the opportunity to ask questions regarding these risks and other possible complications.

I also recognize there are no guaranteed results and that independent results are dependent upon age, skin condition, and lifestyle, and that there is a possibility I may require further treatments of the treated areas to obtain the expected results at an additional cost.

I have read and understood the post-treatment home care instructions. I understand how important it is to follow all instructions given to me for post-treatment care. In the event that I may have additional questions or concerns regarding my treatment or suggested home product/post-treatment care, I will consult the esthetician immediately.

I have also, to the best of my knowledge, given an accurate account of my medical history, including all known allergies or prescription drugs or products I am currently ingesting or using topically.

I have read and fully understand this agreement and all information detailed above. I understand the procedure and accept the risks. I agree I will assume the risk and full responsibility for any and all injuries, losses, side effects, or damages that might occur to me while I am undergoing this procedure. I do not hold the esthetician responsible for any of my conditions that were present, but not disclosed at the time of this skincare procedure, which may be affected by the treatment performed today.`;

export default function Form3_LiabilityWaiver({ booking, onNext, onBack, formNumber, formTotal }) {
  const todayDisplay = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const canvasRef = useRef(null);
  const sigRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [printedName, setPrintedName] = useState("");

  useEffect(() => {
    if (canvasRef.current) sigRef.current = new SignaturePad(canvasRef.current, { penColor:"#2c2220" });
    setTimeout(() => setScrolled(true), 100);
  }, []);

  function handleScroll(e) {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
  }

  function handleSubmit() {
    if (!acknowledged) return alert("Please read and acknowledge the waiver.");
    if (!printedName) return alert("Please enter your printed name.");
    if (sigRef.current?.isEmpty()) return alert("Please sign before submitting.");
    onNext({
      formType: "liability_waiver",
      fields: { acknowledged, printedName, serviceName: booking?.name },
      signature: sigRef.current.toDataURL("image/png"),
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={s.hdrTop}>
          <button style={s.back} onClick={onBack}>← Back</button>
          <span style={s.title}>Consent & Liability Waiver</span>
          <span style={{ fontSize:12, color:"#a08080" }}>{formNumber} of {formTotal}</span>
        </div>
        <div style={s.progWrap}><div style={s.progBar} /></div>
      </div>

      <div style={s.sec}>
        <div style={s.secHdr}>
          <div style={s.secEye}>Service</div>
          <div style={s.secTitle}>Client Consent Form & Liability Waiver</div>
        </div>
        <div style={s.body}>
          <div style={s.svcBanner}>
            <div style={s.svcLabel}>Procedure being performed</div>
            <div style={s.svcName}>{booking?.name} — {booking?.price} · {booking?.duration}</div>
          </div>

          <div style={s.scrollHint}>↕ Scroll to read the full waiver before signing</div>

          <div style={s.consentBlock} onScroll={handleScroll}>
            <div style={s.consentText}>
              <p style={{ marginBottom:10, fontStyle:"italic", color:"#b85c72", padding:"8px 0", borderTop:"1px dashed #ddd", borderBottom:"1px dashed #ddd" }}>
                I hereby consent to and authorize the performance of: {booking?.name}
              </p>
              {WAIVER_TEXT.split("\n\n").map((p,i) => <p key={i} style={{ marginBottom:10 }}>{p}</p>)}
            </div>
          </div>

          <div style={s.ack(acknowledged, !scrolled)} onClick={()=>scrolled && setAcknowledged(!acknowledged)}>
            <div style={s.ackBox(acknowledged)}>✓</div>
            <div style={s.ackText}>I have read, understand, and agree to the Client Consent Form & Liability Waiver above. I accept full responsibility as described.</div>
          </div>

          <div style={s.divider} />
          <div style={s.row}><label style={s.label}>Printed Name</label><input style={s.input} value={printedName} onChange={e=>setPrintedName(e.target.value)} placeholder="Type your full name" /></div>
          <div style={s.row}>
            <label style={s.label}>Signature <span style={{ fontSize:10, color:"#a08080" }}>— sign with finger or mouse</span></label>
            <canvas ref={canvasRef} style={s.sigPad} width={600} height={100} />
            <button style={s.sigClear} onClick={()=>sigRef.current?.clear()}>Clear signature</button>
          </div>
          <div style={{ marginBottom:0 }}><label style={s.label}>Date</label><input style={{...s.input,color:"#a08080"}} value={todayDisplay} readOnly /></div>
        </div>
      </div>

      <button style={s.submit} onClick={handleSubmit}>Submit & Complete Intake →</button>
    </div>
  );
}
