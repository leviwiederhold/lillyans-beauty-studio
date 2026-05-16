import { useState, useRef, useEffect } from "react";
import SignaturePad from "signature_pad";

const MED_CONDITIONS = [
  "Acne","Arthritis","Depression","Diabetes","Eczema","Epilepsy",
  "Fever Blisters","Heart Condition","HIV","Hepatitis","High Blood Pressure",
  "Insomnia","Hyper Pigmentation","Low Blood Pressure","Lupus","Sinus Infection",
  "Surgery","Pregnant","Psoriasis","Rashes","Seborrhea","Shingles",
  "Skin Cancer","Hyper/Hypo Thyroid","Warts","Other",
];
const PRODUCTS = [
  "Body Lotion","Body Soap","Body Scrub","Cleansing Cream","Day Cream",
  "Eye Makeup Remover","Eye Cream","Exfoliants","Facial Soap","Facial Scrub",
  "Hand Cream","Neck Cream","Night Cream","Skin Toner/Astringent","Other",
];
const TODAY_CONDITIONS = [
  "Headache","Stress","Insomnia","Muscle Cramps",
  "Anxiety","Inflammation","Fatigue","Forgetfulness",
];
const SKIN_CONCERNS = [
  "Acne/Breakouts","Broken Capillaries","Blackheads/Whiteheads","Dark Spots",
  "Clogged Pores","Excessive Oil/Shine","Dryness","Rosacea","Redness",
  "Sun Damage","Scarring","Unwanted Hair","Uneven Skin Tone","Wrinkles/Fine Lines","Other",
];

const s = {
  wrap: { fontFamily:"'DM Sans',sans-serif", color:"#2c2220", background:"#faf8f6", paddingBottom:80 },
  hdr: { background:"#fff", borderBottom:"1px solid #f0e8e4", padding:"20px 20px 16px", position:"sticky", top:0, zIndex:10 },
  hdrTop: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  back: { background:"none", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#b85c72", cursor:"pointer" },
  title: { fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:400 },
  progWrap: { height:3, background:"#f0e8e4", borderRadius:2 },
  progBar: { height:"100%", background:"#b85c72", borderRadius:2, width:"50%" },
  sec: { background:"#fff", margin:"12px 16px 0", borderRadius:14, border:"1px solid #f0e8e4", overflow:"hidden" },
  secHdr: { padding:"14px 16px 10px", borderBottom:"1px solid #f7f0ee" },
  secEye: { fontSize:9, letterSpacing:".16em", textTransform:"uppercase", color:"#b85c72", marginBottom:2 },
  secTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:400 },
  body: { padding:"14px 16px" },
  row: { marginBottom:14 },
  label: { fontSize:11, fontWeight:500, color:"#7a5a5a", letterSpacing:".04em", marginBottom:5, display:"block" },
  input: { width:"100%", padding:"10px 12px", background:"#faf8f6", border:"1px solid #ede5e2", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#2c2220", outline:"none", boxSizing:"border-box" },
  textarea: { width:"100%", padding:"10px 12px", background:"#faf8f6", border:"1px solid #ede5e2", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#2c2220", outline:"none", resize:"none", minHeight:70, boxSizing:"border-box" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  grid3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 },
  divider: { height:1, background:"#f7f0ee", margin:"14px 0" },
  subLabel: { fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"#c09898", marginBottom:10 },
  qText: { fontSize:13, color:"#2c2220", lineHeight:1.5, marginBottom:10 },
  ynRow: { display:"flex", gap:8 },
  ynBtn: (active) => ({ flex:1, padding:10, borderRadius:10, border:`1.5px solid ${active?"#b85c72":"#ede5e2"}`, background:active?"#fdf5f7":"#faf8f6", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:active?"#b85c72":"#7a5a5a", cursor:"pointer" }),
  cbGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:2 },
  cbItem: (checked) => ({ display:"flex", alignItems:"center", gap:7, padding:"8px 10px", background:checked?"#fdf5f7":"#faf8f6", border:`1px solid ${checked?"#d48a9d":"#ede5e2"}`, borderRadius:8, cursor:"pointer" }),
  cbBox: (checked) => ({ width:16, height:16, borderRadius:4, border:`1.5px solid ${checked?"#b85c72":"#ddd"}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:checked?"#b85c72":"transparent", color:checked?"#fff":"transparent", fontSize:10 }),
  cbLabel: { fontSize:11.5, color:"#2c2220", lineHeight:1.3 },
  skinRow: { display:"flex", gap:8, flexWrap:"wrap" },
  skinBtn: (active) => ({ padding:"9px 16px", borderRadius:100, border:`1.5px solid ${active?"#b85c72":"#ede5e2"}`, background:active?"#fdf5f7":"#faf8f6", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, color:active?"#b85c72":"#7a5a5a", cursor:"pointer" }),
  ack: (checked) => ({ display:"flex", gap:10, alignItems:"flex-start", padding:12, background:"#fdf5f7", borderRadius:10, border:"1px solid #f0d8de", cursor:"pointer", marginBottom:12 }),
  ackBox: (checked) => ({ width:20, height:20, borderRadius:5, border:`1.5px solid ${checked?"#b85c72":"#ddd"}`, flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center", background:checked?"#b85c72":"transparent", color:checked?"#fff":"transparent", fontSize:12 }),
  ackText: { fontSize:12, color:"#5a3a3a", lineHeight:1.5 },
  sigPad: { border:"1px solid #ede5e2", borderRadius:9, background:"#fff", width:"100%", height:100, cursor:"crosshair", touchAction:"none", display:"block" },
  sigClear: { background:"none", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#b85c72", cursor:"pointer", marginTop:4, padding:0 },
  submit: { display:"block", width:"calc(100% - 32px)", margin:"20px 16px 0", padding:15, background:"#b85c72", color:"#fff", border:"none", borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500, cursor:"pointer", textAlign:"center" },
};

function YesNo({ value, onChange, showExtra, extra }) {
  return (
    <>
      <div style={s.ynRow}>
        <button style={s.ynBtn(value===true)} onClick={()=>onChange(true)}>Yes</button>
        <button style={s.ynBtn(value===false)} onClick={()=>onChange(false)}>No</button>
      </div>
      {value===true && showExtra && <div style={{ marginTop:8 }}>{extra}</div>}
    </>
  );
}

function CheckboxGrid({ items, checked, onChange }) {
  return (
    <div style={s.cbGrid}>
      {items.map(item => (
        <div key={item} style={s.cbItem(checked.includes(item))} onClick={()=>onChange(checked.includes(item)?checked.filter(c=>c!==item):[...checked,item])}>
          <div style={s.cbBox(checked.includes(item))}>✓</div>
          <div style={s.cbLabel}>{item}</div>
        </div>
      ))}
    </div>
  );
}

export default function Form4_ConfidentialIntake({ booking, onNext, onBack }) {
  const todayDisplay = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const canvasRef = useRef(null);
  const sigRef = useRef(null);

  const [fields, setFields] = useState({
    name:"", dob:"", address:"", city:"", state:"", zip:"",
    phone:"", email:"", occupation:"", emergencyName:"", emergencyPhone:"",
    wantsEmailList:null, heardAbout:"",
    medConditions:[], medOther:"",
    takesMeds:null, medsDetail:"",
    hadFacialServices:null, facialServicesDetail:"",
    hasAllergies:null, allergiesDetail:"",
    products:[], productsOther:"",
    skinType:null,
    todayConditions:[],
    skinConcerns:[], concernsOther:"",
    hadDermatologist:null, dermatologistDetail:"",
    usedRetinA:null, retinADetail:"",
    hadInjections:null, injectionsDetail:"",
    acknowledged:false, printedName:"",
  });

  const set = (key, val) => setFields(f=>({...f,[key]:val}));

  useEffect(()=>{
    if(canvasRef.current) sigRef.current = new SignaturePad(canvasRef.current,{penColor:"#2c2220"});
  },[]);

  function handleSubmit() {
    if(!fields.acknowledged) return alert("Please read and acknowledge the statement.");
    if(!fields.printedName) return alert("Please enter your printed name.");
    if(sigRef.current?.isEmpty()) return alert("Please sign before submitting.");
    onNext({
      formType:"confidential_intake",
      fields,
      signature: sigRef.current.toDataURL("image/png"),
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={s.hdrTop}>
          <button style={s.back} onClick={onBack}>← Back</button>
          <span style={s.title}>Confidential Client Intake</span>
          <span style={{ fontSize:12, color:"#a08080" }}>1 of 2</span>
        </div>
        <div style={s.progWrap}><div style={s.progBar} /></div>
      </div>

      {/* Section 1 — General Info */}
      <div style={s.sec}>
        <div style={s.secHdr}><div style={s.secEye}>Section 1</div><div style={s.secTitle}>General Information</div></div>
        <div style={s.body}>
          <div style={s.grid2}>
            <div style={s.row}><label style={s.label}>Full Name</label><input style={s.input} value={fields.name} onChange={e=>set("name",e.target.value)} placeholder="Jane Smith" /></div>
            <div style={s.row}><label style={s.label}>Date of Birth</label><input style={s.input} type="date" value={fields.dob} onChange={e=>set("dob",e.target.value)} /></div>
          </div>
          <div style={s.row}><label style={s.label}>Address</label><input style={s.input} value={fields.address} onChange={e=>set("address",e.target.value)} placeholder="123 Main St" /></div>
          <div style={s.grid3}>
            <div style={s.row}><label style={s.label}>City</label><input style={s.input} value={fields.city} onChange={e=>set("city",e.target.value)} placeholder="City" /></div>
            <div style={s.row}><label style={s.label}>State</label><input style={s.input} value={fields.state} onChange={e=>set("state",e.target.value)} placeholder="OH" /></div>
            <div style={s.row}><label style={s.label}>Zip</label><input style={s.input} value={fields.zip} onChange={e=>set("zip",e.target.value)} placeholder="45118" /></div>
          </div>
          <div style={s.grid2}>
            <div style={s.row}><label style={s.label}>Phone</label><input style={s.input} type="tel" value={fields.phone} onChange={e=>set("phone",e.target.value)} placeholder="(555) 000-0000" /></div>
            <div style={s.row}><label style={s.label}>Email</label><input style={s.input} type="email" value={fields.email} onChange={e=>set("email",e.target.value)} placeholder="you@email.com" /></div>
          </div>
          <div style={s.row}><label style={s.label}>Occupation</label><input style={s.input} value={fields.occupation} onChange={e=>set("occupation",e.target.value)} placeholder="Your occupation" /></div>
          <div style={s.grid2}>
            <div style={s.row}><label style={s.label}>Emergency Contact</label><input style={s.input} value={fields.emergencyName} onChange={e=>set("emergencyName",e.target.value)} placeholder="Name" /></div>
            <div style={s.row}><label style={s.label}>Their Phone</label><input style={s.input} value={fields.emergencyPhone} onChange={e=>set("emergencyPhone",e.target.value)} placeholder="(555) 000-0000" /></div>
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Would you like to be added to our email list for specials and discounts?</div>
            <YesNo value={fields.wantsEmailList} onChange={v=>set("wantsEmailList",v)} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:0 }}><label style={s.label}>How did you hear about us?</label><input style={s.input} value={fields.heardAbout} onChange={e=>set("heardAbout",e.target.value)} placeholder="Instagram, friend referral, Google..." /></div>
        </div>
      </div>

      {/* Section 2 — Medical History */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}><div style={s.secEye}>Section 2</div><div style={s.secTitle}>Medical History</div></div>
        <div style={s.body}>
          <div style={s.subLabel}>Check all that apply</div>
          <CheckboxGrid items={MED_CONDITIONS} checked={fields.medConditions} onChange={v=>set("medConditions",v)} />
          <div style={{ marginTop:6 }}><input style={s.input} value={fields.medOther} onChange={e=>set("medOther",e.target.value)} placeholder="Other condition..." /></div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Are you currently taking any medications?</div>
            <YesNo value={fields.takesMeds} onChange={v=>set("takesMeds",v)} showExtra extra={<textarea style={s.textarea} value={fields.medsDetail} onChange={e=>set("medsDetail",e.target.value)} placeholder="Please list your medications..." />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Have you had any facial or dermatology services in the past 30 days?</div>
            <YesNo value={fields.hadFacialServices} onChange={v=>set("hadFacialServices",v)} showExtra extra={<textarea style={s.textarea} value={fields.facialServicesDetail} onChange={e=>set("facialServicesDetail",e.target.value)} placeholder="Please explain..." />} />
          </div>
          <div style={s.divider} />
          <div>
            <div style={s.qText}>Do you have any allergies?</div>
            <YesNo value={fields.hasAllergies} onChange={v=>set("hasAllergies",v)} showExtra extra={<textarea style={s.textarea} value={fields.allergiesDetail} onChange={e=>set("allergiesDetail",e.target.value)} placeholder="Please list your allergies..." />} />
          </div>
        </div>
      </div>

      {/* Section 3 — Skin Care History */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}><div style={s.secEye}>Section 3</div><div style={s.secTitle}>Skin Care History</div></div>
        <div style={s.body}>
          <div style={s.subLabel}>Products you currently use — select all that apply</div>
          <CheckboxGrid items={PRODUCTS} checked={fields.products} onChange={v=>set("products",v)} />
          <div style={{ marginTop:6 }}><input style={s.input} value={fields.productsOther} onChange={e=>set("productsOther",e.target.value)} placeholder="Other products..." /></div>
          <div style={s.divider} />
          <div style={s.row}>
            <label style={{...s.label, marginBottom:10}}>What type of skin do you have?</label>
            <div style={s.skinRow}>
              {["Normal","Oily","Dry","Combination"].map(t=>(
                <button key={t} style={s.skinBtn(fields.skinType===t)} onClick={()=>set("skinType",t)}>{t}</button>
              ))}
            </div>
          </div>
          <div style={s.divider} />
          <div>
            <label style={{...s.label, marginBottom:10}}>Conditions you are experiencing today — select all that apply</label>
            <CheckboxGrid items={TODAY_CONDITIONS} checked={fields.todayConditions} onChange={v=>set("todayConditions",v)} />
          </div>
        </div>
      </div>

      {/* Section 4 — Skin Concerns */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}><div style={s.secEye}>Section 4</div><div style={s.secTitle}>Skin Concerns</div></div>
        <div style={s.body}>
          <div style={s.subLabel}>What concerns do you have about your skin? — select all that apply</div>
          <CheckboxGrid items={SKIN_CONCERNS} checked={fields.skinConcerns} onChange={v=>set("skinConcerns",v)} />
          <div style={{ marginTop:6 }}><input style={s.input} value={fields.concernsOther} onChange={e=>set("concernsOther",e.target.value)} placeholder="Other concerns..." /></div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Have you been under the care of a dermatologist within the past year?</div>
            <YesNo value={fields.hadDermatologist} onChange={v=>set("hadDermatologist",v)} showExtra extra={<textarea style={s.textarea} value={fields.dermatologistDetail} onChange={e=>set("dermatologistDetail",e.target.value)} placeholder="Please explain..." />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Have you used Retin-A, Renova, AHAs or Retinal/Vitamin A products in the last three months?</div>
            <YesNo value={fields.usedRetinA} onChange={v=>set("usedRetinA",v)} showExtra extra={<textarea style={s.textarea} value={fields.retinADetail} onChange={e=>set("retinADetail",e.target.value)} placeholder="Please explain..." />} />
          </div>
          <div style={s.divider} />
          <div>
            <div style={s.qText}>Have you received Botox, Restylane, or Collagen injections in the last 6 months?</div>
            <YesNo value={fields.hadInjections} onChange={v=>set("hadInjections",v)} showExtra extra={<textarea style={s.textarea} value={fields.injectionsDetail} onChange={e=>set("injectionsDetail",e.target.value)} placeholder="Please explain..." />} />
          </div>
        </div>
      </div>

      {/* Section 5 — Acknowledgment */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}><div style={s.secEye}>Section 5</div><div style={s.secTitle}>Acknowledgment & Signature</div></div>
        <div style={s.body}>
          <div style={s.ack(fields.acknowledged)} onClick={()=>set("acknowledged",!fields.acknowledged)}>
            <div style={s.ackBox(fields.acknowledged)}>✓</div>
            <div style={s.ackText}>I have completed this form to the best of my ability and knowledge. I agree to inform the technician of any changes in the above information. I agree that I do not have any condition(s) that would make the requested treatment unsuitable. I will inform the technician of any discomfort I may experience at any time during my treatment to allow them to adjust accordingly. I agree to waive all liability toward my technician and the salon for any injury or damages incurred due to any misrepresentation of my health.</div>
          </div>
          <div style={s.divider} />
          <div style={s.row}><label style={s.label}>Printed Name</label><input style={s.input} value={fields.printedName} onChange={e=>set("printedName",e.target.value)} placeholder="Type your full name" /></div>
          <div style={s.row}>
            <label style={s.label}>Signature <span style={{ fontSize:10, color:"#a08080" }}>— sign with finger or mouse</span></label>
            <canvas ref={canvasRef} style={s.sigPad} width={600} height={100} />
            <button style={s.sigClear} onClick={()=>sigRef.current?.clear()}>Clear signature</button>
          </div>
          <div style={{ marginBottom:0 }}><label style={s.label}>Date</label><input style={{...s.input,color:"#a08080"}} value={todayDisplay} readOnly /></div>
        </div>
      </div>

      <button style={s.submit} onClick={handleSubmit}>Submit Form & Continue →</button>
    </div>
  );
}
