import { useState, useRef, useEffect } from "react";
import SignaturePad from "signature_pad";

const CONDITIONS = [
  "Hair Loss","Anemia","Cold sores / fever blisters","Sensitivity to cosmetics",
  "Prolonged bleeding","Diabetes","Trichotillomania","Joint Replacements",
  "Healing problems","Epilepsy","Eczema","Low Blood Pressure","High Blood Pressure",
  "HIV","Hemophilia","Thyroid disturbances","Cancer","Hepatitis",
  "Fainting / dizziness","Circulatory Problems","Hypertrophic / keloid scars",
  "Liver Disease","Alopecia","Tumors / growths / cysts",
];
const ALLERGIES = [
  "Latex","Vaseline","Food","Paints","Metals","Lidocaine","Lanolin",
  "Crayons","Medication","Glycerin","Hair Dyes","Fragrance","Aspirin",
];

const s = {
  wrap: { fontFamily:"'DM Sans',sans-serif", color:"#2c2220", background:"#faf8f6", paddingBottom:80 },
  hdr: { background:"#fff", borderBottom:"1px solid #f0e8e4", padding:"20px 20px 16px", position:"sticky", top:0, zIndex:10 },
  hdrTop: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  back: { background:"none", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#b85c72", cursor:"pointer" },
  title: { fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:400, color:"#2c2220" },
  progWrap: { height:3, background:"#f0e8e4", borderRadius:2 },
  progBar: (pct) => ({ height:"100%", background:"#b85c72", borderRadius:2, width:`${pct}%` }),
  sec: { background:"#fff", margin:"12px 16px 0", borderRadius:14, border:"1px solid #f0e8e4", overflow:"hidden" },
  secHdr: { padding:"14px 16px 10px", borderBottom:"1px solid #f7f0ee" },
  secEye: { fontSize:9, letterSpacing:".16em", textTransform:"uppercase", color:"#b85c72", marginBottom:2 },
  secTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:400 },
  body: { padding:"14px 16px" },
  row: { marginBottom:14 },
  label: { fontSize:11, fontWeight:500, color:"#7a5a5a", letterSpacing:".04em", marginBottom:5, display:"block" },
  input: { width:"100%", padding:"10px 12px", background:"#faf8f6", border:"1px solid #ede5e2", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#2c2220", outline:"none", boxSizing:"border-box" },
  textarea: { width:"100%", padding:"10px 12px", background:"#faf8f6", border:"1px solid #ede5e2", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#2c2220", outline:"none", resize:"none", minHeight:80, boxSizing:"border-box" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  divider: { height:1, background:"#f7f0ee", margin:"14px 0" },
  subLabel: { fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"#c09898", marginBottom:10 },
  qText: { fontSize:13, color:"#2c2220", lineHeight:1.5, marginBottom:10 },
  ynRow: { display:"flex", gap:8 },
  ynBtn: (active) => ({ flex:1, padding:10, borderRadius:10, border:`1.5px solid ${active?"#b85c72":"#ede5e2"}`, background:active?"#fdf5f7":"#faf8f6", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:active?"#b85c72":"#7a5a5a", cursor:"pointer" }),
  cbGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:2 },
  cbItem: (checked) => ({ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:checked?"#fdf5f7":"#faf8f6", border:`1px solid ${checked?"#d48a9d":"#ede5e2"}`, borderRadius:8, cursor:"pointer" }),
  cbBox: (checked) => ({ width:18, height:18, borderRadius:4, border:`1.5px solid ${checked?"#b85c72":"#ddd"}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:checked?"#b85c72":"transparent", color:checked?"#fff":"transparent", fontSize:11 }),
  cbLabel: { fontSize:12, color:"#2c2220", lineHeight:1.3 },
  ack: (checked) => ({ display:"flex", gap:10, alignItems:"flex-start", padding:12, background:"#fdf5f7", borderRadius:10, border:"1px solid #f0d8de", cursor:"pointer", marginBottom:12, opacity:checked!==undefined?1:1 }),
  ackBox: (checked) => ({ width:20, height:20, borderRadius:5, border:`1.5px solid ${checked?"#b85c72":"#ddd"}`, flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center", background:checked?"#b85c72":"transparent", color:checked?"#fff":"transparent", fontSize:12 }),
  ackText: { fontSize:12, color:"#5a3a3a", lineHeight:1.5 },
  sigPad: { border:"1px solid #ede5e2", borderRadius:9, background:"#fff", width:"100%", height:100, cursor:"crosshair", touchAction:"none", display:"block" },
  sigClear: { background:"none", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#b85c72", cursor:"pointer", marginTop:4, padding:0 },
  submit: { display:"block", width:"calc(100% - 32px)", margin:"20px 16px 0", padding:15, background:"#b85c72", color:"#fff", border:"none", borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500, cursor:"pointer", textAlign:"center" },
  warn: { marginTop:8, padding:"10px 12px", background:"#fff8f0", border:"1px solid #f0d8be", borderRadius:8, fontSize:12, color:"#8a5020", lineHeight:1.5 },
};

function YesNo({ value, onChange, id, showExtra, extra }) {
  return (
    <>
      <div style={s.ynRow}>
        <button style={s.ynBtn(value===true)} onClick={() => onChange(true)}>Yes</button>
        <button style={s.ynBtn(value===false)} onClick={() => onChange(false)}>No</button>
      </div>
      {value===true && showExtra && <div style={{ marginTop:8 }}>{extra}</div>}
    </>
  );
}

function CheckboxGrid({ items, checked, onChange }) {
  return (
    <div style={s.cbGrid}>
      {items.map(item => (
        <div key={item} style={s.cbItem(checked.includes(item))} onClick={() => {
          onChange(checked.includes(item) ? checked.filter(c=>c!==item) : [...checked, item]);
        }}>
          <div style={s.cbBox(checked.includes(item))}>✓</div>
          <div style={s.cbLabel}>{item}</div>
        </div>
      ))}
    </div>
  );
}

export default function Form1_PMUIntake({ booking, onNext, onBack }) {
  const today = new Date().toISOString().split("T")[0];
  const todayDisplay = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const canvasRef = useRef(null);
  const sigPadRef = useRef(null);

  const [fields, setFields] = useState({
    name:"", date:today, dob:"", age:"", address:"", city:"", postalCode:"",
    email:"", phone:"", emergencyContact:"",
    hadPMUBefore:null, lastProcedureDate:"",
    improvements:"",
    hasMoles:null, molesDetail:"",
    hasPiercing:null, piercingDetail:"",
    hasLashExtensions:null, lashDetail:"",
    conditions:[], conditionsOther:"",
    takesMedications:null, medicationsDetail:"",
    hadInjections:null, injectionsDetail:"",
    hadSurgery:null, surgeryDetail:"",
    hadColdSore:null,
    allergies:[], allergiesOther:"",
    scarsEasily:null, scarsDetail:"",
    bleedsEasily:null, bleedsDetail:"",
    concerns:"", expectations:"",
    takesBirthControl:null, birthControlDetail:"",
    isPregnant:null,
    hormoneTherapy:null, hormoneDetail:"",
    acknowledged:false, printedName:"",
  });

  const set = (key, val) => setFields(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (canvasRef.current) {
      sigPadRef.current = new SignaturePad(canvasRef.current, { penColor:"#2c2220" });
    }
  }, []);

  function handleSubmit() {
    if (!fields.acknowledged) return alert("Please read and acknowledge the statement.");
    if (!fields.printedName) return alert("Please enter your printed name.");
    if (sigPadRef.current?.isEmpty()) return alert("Please sign before submitting.");
    const signature = sigPadRef.current.toDataURL("image/png");
    onNext({ formType:"pmu_intake", fields, signature, submittedAt: new Date().toISOString() });
  }

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={s.hdrTop}>
          <button style={s.back} onClick={onBack}>← Back</button>
          <span style={s.title}>PMU Intake Form</span>
          <span style={{ fontSize:12, color:"#a08080" }}>1 of 3</span>
        </div>
        <div style={s.progWrap}><div style={s.progBar(33)} /></div>
      </div>

      {/* Section 1 — Client Info */}
      <div style={s.sec}>
        <div style={s.secHdr}>
          <div style={s.secEye}>Section 1</div>
          <div style={s.secTitle}>Client Information</div>
        </div>
        <div style={s.body}>
          <div style={s.grid2}>
            <div style={s.row}><label style={s.label}>Full Name</label><input style={s.input} value={fields.name} onChange={e=>set("name",e.target.value)} placeholder="Jane Smith" /></div>
            <div style={s.row}><label style={s.label}>Date</label><input style={{...s.input,color:"#a08080"}} value={todayDisplay} readOnly /></div>
          </div>
          <div style={s.grid2}>
            <div style={s.row}><label style={s.label}>Date of Birth</label><input style={s.input} type="date" value={fields.dob} onChange={e=>set("dob",e.target.value)} /></div>
            <div style={s.row}><label style={s.label}>Age</label><input style={s.input} type="number" value={fields.age} onChange={e=>set("age",e.target.value)} placeholder="28" /></div>
          </div>
          <div style={s.row}><label style={s.label}>Address</label><input style={s.input} value={fields.address} onChange={e=>set("address",e.target.value)} placeholder="123 Main St" /></div>
          <div style={s.grid2}>
            <div style={s.row}><label style={s.label}>City</label><input style={s.input} value={fields.city} onChange={e=>set("city",e.target.value)} placeholder="Fayetteville" /></div>
            <div style={s.row}><label style={s.label}>Postal Code</label><input style={s.input} value={fields.postalCode} onChange={e=>set("postalCode",e.target.value)} placeholder="45118" /></div>
          </div>
          <div style={s.row}><label style={s.label}>Email Address</label><input style={s.input} type="email" value={fields.email} onChange={e=>set("email",e.target.value)} placeholder="you@email.com" /></div>
          <div style={s.grid2}>
            <div style={s.row}><label style={s.label}>Phone</label><input style={s.input} type="tel" value={fields.phone} onChange={e=>set("phone",e.target.value)} placeholder="(555) 000-0000" /></div>
            <div style={{ marginBottom:0 }}><label style={s.label}>Emergency Contact</label><input style={s.input} value={fields.emergencyContact} onChange={e=>set("emergencyContact",e.target.value)} placeholder="Name & number" /></div>
          </div>
        </div>
      </div>

      {/* Section 2 — Service Questions */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}>
          <div style={s.secEye}>Section 2</div>
          <div style={s.secTitle}>Service Questions</div>
        </div>
        <div style={s.body}>
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Have you ever had a cosmetic tattoo or permanent makeup procedure before? If yes, when was your last procedure?</div>
            <YesNo value={fields.hadPMUBefore} onChange={v=>set("hadPMUBefore",v)} showExtra extra={<input style={s.input} value={fields.lastProcedureDate} onChange={e=>set("lastProcedureDate",e.target.value)} placeholder="When was your last procedure?" />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>What would you like to improve/change about the area? Consider shape, color, density, thickness...</div>
            <textarea style={s.textarea} value={fields.improvements} onChange={e=>set("improvements",e.target.value)} placeholder="Describe your goals..." />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Do you have moles/raised areas in or around the treatment area?</div>
            <YesNo value={fields.hasMoles} onChange={v=>set("hasMoles",v)} showExtra extra={<input style={s.input} value={fields.molesDetail} onChange={e=>set("molesDetail",e.target.value)} placeholder="Please describe..." />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Do you have or have you had a piercing in the treatment area?</div>
            <YesNo value={fields.hasPiercing} onChange={v=>set("hasPiercing",v)} showExtra extra={<input style={s.input} value={fields.piercingDetail} onChange={e=>set("piercingDetail",e.target.value)} placeholder="Please describe..." />} />
          </div>
          <div style={s.divider} />
          <div>
            <div style={s.qText}>Are you currently wearing lash extensions of any kind?</div>
            <YesNo value={fields.hasLashExtensions} onChange={v=>set("hasLashExtensions",v)} showExtra extra={<input style={s.input} value={fields.lashDetail} onChange={e=>set("lashDetail",e.target.value)} placeholder="Please describe..." />} />
          </div>
        </div>
      </div>

      {/* Section 3 — Medical History */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}>
          <div style={s.secEye}>Section 3</div>
          <div style={s.secTitle}>Medical History</div>
        </div>
        <div style={s.body}>
          <div style={s.subLabel}>Please check any conditions you currently have</div>
          <CheckboxGrid items={CONDITIONS} checked={fields.conditions} onChange={v=>set("conditions",v)} />
          <div style={{ marginTop:6 }}><input style={s.input} value={fields.conditionsOther} onChange={e=>set("conditionsOther",e.target.value)} placeholder="Other condition..." /></div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Are you taking any medications, vitamins, including over-the-counter or prescription drugs?</div>
            <YesNo value={fields.takesMedications} onChange={v=>set("takesMedications",v)} showExtra extra={<input style={s.input} value={fields.medicationsDetail} onChange={e=>set("medicationsDetail",e.target.value)} placeholder="List medications..." />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Have you experienced Botox, Restylane or Collagen injections?</div>
            <YesNo value={fields.hadInjections} onChange={v=>set("hadInjections",v)} showExtra extra={<input style={s.input} value={fields.injectionsDetail} onChange={e=>set("injectionsDetail",e.target.value)} placeholder="When and what type?" />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Within the last nine months, have you undergone any surgery or plastic surgery?</div>
            <YesNo value={fields.hadSurgery} onChange={v=>set("hadSurgery",v)} showExtra extra={<input style={s.input} value={fields.surgeryDetail} onChange={e=>set("surgeryDetail",e.target.value)} placeholder="Please describe..." />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Have you ever had a cold sore/fever blister?</div>
            <YesNo value={fields.hadColdSore} onChange={v=>set("hadColdSore",v)} showExtra extra={<div style={s.warn}>⚠ Please contact your physician for a preventative prescription capsule to prevent a cold sore/fever blister before your appointment.</div>} />
          </div>
          <div style={s.divider} />
          <div>
            <div style={s.qText}>Have you ever had an allergic reaction to any of the following?</div>
            <CheckboxGrid items={ALLERGIES} checked={fields.allergies} onChange={v=>set("allergies",v)} />
            <div style={{ marginTop:6 }}><input style={s.input} value={fields.allergiesOther} onChange={e=>set("allergiesOther",e.target.value)} placeholder="Other allergies..." /></div>
          </div>
        </div>
      </div>

      {/* Section 4 — Additional & Female */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}>
          <div style={s.secEye}>Section 4</div>
          <div style={s.secTitle}>Additional Questions</div>
        </div>
        <div style={s.body}>
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Do you scar easily?</div>
            <YesNo value={fields.scarsEasily} onChange={v=>set("scarsEasily",v)} showExtra extra={<input style={s.input} value={fields.scarsDetail} onChange={e=>set("scarsDetail",e.target.value)} placeholder="Please describe..." />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Do you bruise/bleed easily?</div>
            <YesNo value={fields.bleedsEasily} onChange={v=>set("bleedsEasily",v)} showExtra extra={<input style={s.input} value={fields.bleedsDetail} onChange={e=>set("bleedsDetail",e.target.value)} placeholder="Please describe..." />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Do you have any specific concerns or questions about the procedure?</div>
            <textarea style={s.textarea} value={fields.concerns} onChange={e=>set("concerns",e.target.value)} placeholder="Share any concerns..." />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>What are your expectations and goals for the treatment?</div>
            <textarea style={s.textarea} value={fields.expectations} onChange={e=>set("expectations",e.target.value)} placeholder="Describe your expectations..." />
          </div>
          <div style={s.divider} />
          <div style={s.subLabel}>Female Clients</div>
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Are you taking birth control?</div>
            <YesNo value={fields.takesBirthControl} onChange={v=>set("takesBirthControl",v)} showExtra extra={<input style={s.input} value={fields.birthControlDetail} onChange={e=>set("birthControlDetail",e.target.value)} placeholder="Type and duration..." />} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom:16 }}>
            <div style={s.qText}>Are you pregnant or trying to become pregnant?</div>
            <YesNo value={fields.isPregnant} onChange={v=>set("isPregnant",v)} showExtra extra={<div style={s.warn}>⚠ Please consult with your physician before proceeding with this treatment.</div>} />
          </div>
          <div style={s.divider} />
          <div>
            <div style={s.qText}>Are you undergoing any hormone replacement therapy?</div>
            <YesNo value={fields.hormoneTherapy} onChange={v=>set("hormoneTherapy",v)} showExtra extra={<input style={s.input} value={fields.hormoneDetail} onChange={e=>set("hormoneDetail",e.target.value)} placeholder="Please describe..." />} />
          </div>
        </div>
      </div>

      {/* Section 5 — Acknowledgment */}
      <div style={{...s.sec, marginTop:10}}>
        <div style={s.secHdr}>
          <div style={s.secEye}>Section 5</div>
          <div style={s.secTitle}>Acknowledgment & Signature</div>
        </div>
        <div style={s.body}>
          <div style={s.ack(fields.acknowledged)} onClick={()=>set("acknowledged",!fields.acknowledged)}>
            <div style={s.ackBox(fields.acknowledged)}>✓</div>
            <div style={s.ackText}>I understand, have read and completed this questionnaire truthfully. I agree that this constitutes full disclosure, and that it supersedes any previous verbal or written disclosures. I understand that withholding information or providing misinformation may result in contraindications and/or irritation to the skin from treatments received. The treatments I receive here are voluntary and I release this skin care professional from liability and assume full responsibility thereof.</div>
          </div>
          <div style={s.divider} />
          <div style={s.row}><label style={s.label}>Printed Name</label><input style={s.input} value={fields.printedName} onChange={e=>set("printedName",e.target.value)} placeholder="Type your full name" /></div>
          <div style={s.row}>
            <label style={s.label}>Signature <span style={{ fontSize:10, color:"#a08080" }}>— sign with finger or mouse</span></label>
            <canvas ref={canvasRef} style={s.sigPad} width={600} height={100} />
            <button style={s.sigClear} onClick={()=>sigPadRef.current?.clear()}>Clear signature</button>
          </div>
          <div style={{ marginBottom:0 }}><label style={s.label}>Date</label><input style={{...s.input,color:"#a08080"}} value={todayDisplay} readOnly /></div>
        </div>
      </div>

      <button style={s.submit} onClick={handleSubmit}>Submit Form & Continue →</button>
    </div>
  );
}
