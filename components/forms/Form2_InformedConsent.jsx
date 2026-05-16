import { useState, useRef, useEffect } from "react";
import SignaturePad from "signature_pad";

const s = {
  wrap: { fontFamily:"'DM Sans',sans-serif", color:"#2c2220", background:"#faf8f6", paddingBottom:80 },
  hdr: { background:"#fff", borderBottom:"1px solid #f0e8e4", padding:"20px 20px 16px", position:"sticky", top:0, zIndex:10 },
  hdrTop: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  back: { background:"none", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#b85c72", cursor:"pointer" },
  title: { fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:400 },
  progWrap: { height:3, background:"#f0e8e4", borderRadius:2 },
  progBar: { height:"100%", background:"#b85c72", borderRadius:2, width:"66%" },
  sec: { background:"#fff", margin:"12px 16px 0", borderRadius:14, border:"1px solid #f0e8e4", overflow:"hidden" },
  secHdr: { padding:"14px 16px 10px", borderBottom:"1px solid #f7f0ee" },
  secEye: { fontSize:9, letterSpacing:".16em", textTransform:"uppercase", color:"#b85c72", marginBottom:2 },
  secTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:400 },
  body: { padding:"14px 16px" },
  scrollHint: { fontSize:11, color:"#b85c72", textAlign:"center", padding:"6px 0 10px", display:"flex", alignItems:"center", justifyContent:"center", gap:5 },
  consentBlock: { background:"#faf8f6", border:"1px solid #ede5e2", borderRadius:10, padding:14, maxHeight:220, overflowY:"auto", marginBottom:12 },
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
  patchRow: { display:"flex", gap:8, marginTop:8 },
  patchBtn: (active) => ({ flex:1, padding:10, borderRadius:10, border:`1.5px solid ${active?"#b85c72":"#ede5e2"}`, background:active?"#fdf5f7":"#faf8f6", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, color:active?"#b85c72":"#7a5a5a", cursor:"pointer", lineHeight:1.3 }),
  submit: { display:"block", width:"calc(100% - 32px)", margin:"20px 16px 0", padding:15, background:"#b85c72", color:"#fff", border:"none", borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500, cursor:"pointer", textAlign:"center" },
};

const CONSENT1 = `I am over the age of 18, am not under the influence of drugs or alcohol, am not pregnant or nursing and desire to receive the indicated semi-permanent pigmentation procedure. The general nature of cosmetic micro-pigmentation, as well as the specific procedure to be performed, has been explained to me.

If an unforeseen condition arises in the course of the procedure, I authorize my therapist to use his/her professional judgment to decide what he/she feels is necessary under the given circumstances. I accept the responsibility for determining the color, shape and position of the Permanent Makeup procedure as agreed during consultation. I fully understand and accept that non-toxic pigments are used during the procedure and that the result achieved may fade over a period of 1-3 years. Even once the color fades, pigment itself may stay in the skin indefinitely.

I have been informed that the highest standards of hygiene are met and that sterile, disposable needles and pigment containers are used for each individual client, procedure and visit.

I understand and accept that each procedure is a process requiring multiple applications of pigment to achieve desired results and that 100% success cannot be guaranteed during the first procedure. I understand that I may have to return for a repeat procedure.

The result of the procedure can be affected by the following: medication, skin characteristics (dry, oily, sun-damaged thick or thin skin type), personal pH balance of your skin, alcohol intake and smoking, post procedure after care.

Upon completion of the procedure there might be swelling and redness of the skin, which will subside within 1-4 days. In some cases, bruising may occur. You may resume normal activities following the procedure, however, using cosmetics, excessive perspiration and exposure to the sun should be limited until the skin has fully healed.

I have been advised that the true color will be seen 6 weeks after each procedure, and that the pigment may vary according to skin tones, skin type, age and skin condition. I understand that some skin types accept pigment more readily and no guarantee on exact color can be given.

To my knowledge, I do not have any physical, mental or medical impairment or disability that might affect my well being as a direct or indirect result of my decision to have the procedure done at this time.

I agree to follow all pre-procedure and post-procedure instructions as provided and explained to me by the technician. Failure to do so may jeopardize my chances for a successful procedure.

I CERTIFY THAT I HAVE READ AND FULLY UNDERSTAND THE ABOVE PARAGRAPHS, THAT I HAVE HAD SUFFICIENT OPPORTUNITY FOR DISCUSSION AND TO ASK QUESTIONS, AND THAT I HEREBY CONSENT TO THE PROCEDURE DESCRIBED ABOVE.`;

const CONSENT2 = `I have been informed of the nature, risks, and possible complications and consequences of permanent skin pigmentation. I understand the permanent skin pigmentation procedure carries with it known and unknown complications and consequences associated with this type of cosmetic procedure, including but not limited to: infection, scarring, inconsistent color, and spreading, fanning or fading of pigments. I understand the actual color of the pigment may be modified slightly, due to the tone and color of my skin.

I fully understand this is a tattoo process and therefore not an exact science but an art. I request the semi-permanent skin pigmentation procedure(s) and accept the permanence of this procedure as well as the possible complications and consequences of the said procedure.

There is a possibility of an allergic reaction to numbing agent and/or pigments. A patch test is offered however it does not ensure a client will not have an allergic reaction. If waived, I release the technician from liability if I develop an allergic reaction to the pigment.

I understand that if I have any skin treatments, injectables, laser hair removal, plastic surgery or other skin altering procedures, it may result in adverse changes to my permanent makeup procedure. I acknowledge some of these potential adverse changes may not be correctable.

I certify that I have read and initialed the above paragraphs and have had explained to my understanding the consent and procedure permit. I accept full responsibility for the decision to have this cosmetic semi-permanent pigmentation work done.

I HEREBY CONSENT TO AND AUTHORIZE MY COSMETIC PROFESSIONAL TO PERFORM THE FOLLOWING PROCEDURE.

I CERTIFY THAT I HAVE READ AND FULLY UNDERSTAND THE ABOVE PARAGRAPHS, THAT I HAVE HAD SUFFICIENT OPPORTUNITY FOR DISCUSSION AND TO ASK QUESTIONS, AND THAT I HEREBY CONSENT TO THE PROCEDURE DESCRIBED ABOVE.`;

function ConsentBlock({ id, text, onScrolled }) {
  function handleScroll(e) {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) onScrolled();
  }
  return (
    <div style={s.consentBlock} onScroll={handleScroll}>
      <div style={s.consentText}>
        {text.split("\n\n").map((p,i) => <p key={i} style={{ marginBottom:10 }}>{p}</p>)}
      </div>
    </div>
  );
}

export default function Form2_InformedConsent({ booking, onNext, onBack }) {
  const todayDisplay = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const sig1Ref = useRef(null);
  const sig2Ref = useRef(null);

  const [consent1Scrolled, setConsent1Scrolled] = useState(false);
  const [consent2Scrolled, setConsent2Scrolled] = useState(false);
  const [ack1, setAck1] = useState(false);
  const [ack2, setAck2] = useState(false);
  const [patchChoice, setPatchChoice] = useState(null);
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");

  useEffect(() => {
    if (canvas1Ref.current) sig1Ref.current = new SignaturePad(canvas1Ref.current, { penColor:"#2c2220" });
    if (canvas2Ref.current) sig2Ref.current = new SignaturePad(canvas2Ref.current, { penColor:"#2c2220" });
    // If consent is short enough to not need scrolling, unlock immediately
    setTimeout(() => {
      setConsent1Scrolled(true);
      setConsent2Scrolled(true);
    }, 100);
  }, []);

  function handleSubmit() {
    if (!ack1 || !ack2) return alert("Please acknowledge both consent sections.");
    if (!patchChoice) return alert("Please initial your patch test choice.");
    if (!name1 || !name2) return alert("Please enter your printed name on both sections.");
    if (sig1Ref.current?.isEmpty() || sig2Ref.current?.isEmpty()) return alert("Please sign both consent sections.");
    onNext({
      formType: "informed_consent",
      fields: { ack1, ack2, patchChoice, name1, name2 },
      signature1: sig1Ref.current.toDataURL("image/png"),
      signature2: sig2Ref.current.toDataURL("image/png"),
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={s.hdrTop}>
          <button style={s.back} onClick={onBack}>← Back</button>
          <span style={s.title}>Informed Consent — PMU</span>
          <span style={{ fontSize:12, color:"#a08080" }}>2 of 3</span>
        </div>
        <div style={s.progWrap}><div style={s.progBar} /></div>
      </div>

      {/* Part 1 */}
      <div style={s.sec}>
        <div style={s.secHdr}>
          <div style={s.secEye}>Part 1</div>
          <div style={s.secTitle}>Informed Consent for Permanent Makeup</div>
        </div>
        <div style={s.body}>
          <div style={s.scrollHint}>↕ Scroll to read full consent before signing</div>
          <ConsentBlock text={CONSENT1} onScrolled={()=>setConsent1Scrolled(true)} />
          <div style={s.ack(ack1, !consent1Scrolled)} onClick={()=>consent1Scrolled && setAck1(!ack1)}>
            <div style={s.ackBox(ack1)}>✓</div>
            <div style={s.ackText}>I have read, understand, and agree to the Informed Consent for Permanent Makeup above.</div>
          </div>
          <div style={s.divider} />
          <div style={s.row}><label style={s.label}>Printed Name</label><input style={s.input} value={name1} onChange={e=>setName1(e.target.value)} placeholder="Type your full name" /></div>
          <div style={s.row}>
            <label style={s.label}>Signature <span style={{ fontSize:10, color:"#a08080" }}>— sign with finger or mouse</span></label>
            <canvas ref={canvas1Ref} style={s.sigPad} width={600} height={100} />
            <button style={s.sigClear} onClick={()=>sig1Ref.current?.clear()}>Clear signature</button>
          </div>
          <div style={{ marginBottom:0 }}><label style={s.label}>Date</label><input style={{...s.input,color:"#a08080"}} value={todayDisplay} readOnly /></div>
        </div>
      </div>

      {/* Part 2 */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}>
          <div style={s.secEye}>Part 2</div>
          <div style={s.secTitle}>Informed Consent Continued</div>
        </div>
        <div style={s.body}>
          <div style={s.scrollHint}>↕ Scroll to read full consent before signing</div>
          <ConsentBlock text={CONSENT2} onScrolled={()=>setConsent2Scrolled(true)} />

          <div style={s.row}>
            <label style={s.label}>Patch Test — initial one of the following <span style={{ color:"#b85c72" }}>*required</span></label>
            <div style={s.patchRow}>
              <button style={s.patchBtn(patchChoice==="consent")} onClick={()=>setPatchChoice("consent")}>I consent to the patch test</button>
              <button style={s.patchBtn(patchChoice==="waive")} onClick={()=>setPatchChoice("waive")}>I waive the patch test</button>
            </div>
          </div>

          <div style={s.divider} />
          <div style={s.ack(ack2, !consent2Scrolled)} onClick={()=>consent2Scrolled && setAck2(!ack2)}>
            <div style={s.ackBox(ack2)}>✓</div>
            <div style={s.ackText}>I have read, understand, and agree to the Informed Consent Continued above.</div>
          </div>
          <div style={s.divider} />
          <div style={s.row}><label style={s.label}>Printed Name</label><input style={s.input} value={name2} onChange={e=>setName2(e.target.value)} placeholder="Type your full name" /></div>
          <div style={s.row}>
            <label style={s.label}>Signature <span style={{ fontSize:10, color:"#a08080" }}>— sign with finger or mouse</span></label>
            <canvas ref={canvas2Ref} style={s.sigPad} width={600} height={100} />
            <button style={s.sigClear} onClick={()=>sig2Ref.current?.clear()}>Clear signature</button>
          </div>
          <div style={{ marginBottom:0 }}><label style={s.label}>Date</label><input style={{...s.input,color:"#a08080"}} value={todayDisplay} readOnly /></div>
        </div>
      </div>

      <button style={s.submit} onClick={handleSubmit}>Submit Consent & Continue →</button>
    </div>
  );
}
