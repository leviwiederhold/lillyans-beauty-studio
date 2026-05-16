"use client";

import { useState } from "react";
import { pdf, Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";

// ── Types ──────────────────────────────────────────────────────────────────────

type ClientForm = {
  id: string;
  user_id: string | null;
  booking_id: string | null;
  form_type: string;
  service_category: string | null;
  service_name: string | null;
  submitted_at: string;
  fields: Record<string, unknown> | null;
  signature: string | null;
  signature2: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const FORM_TYPE_LABELS: Record<string, string> = {
  pmu_intake:          "PMU Intake",
  informed_consent:    "Informed Consent",
  liability_waiver:    "Liability Waiver",
  confidential_intake: "Confidential Intake",
};

function prettyKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function prettyValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) return val.length ? val.join(", ") : "None";
  return String(val);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getClientName(form: ClientForm): string {
  const f = form.fields ?? {};
  return (f.name as string) || (f.printedName as string) || (f.name1 as string) || "Unknown Client";
}

// ── PDF Document ───────────────────────────────────────────────────────────────

const pdfStyles = StyleSheet.create({
  page:       { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#2c2220", backgroundColor: "#fff" },
  header:     { marginBottom: 20, borderBottom: "1pt solid #f0e8e4", paddingBottom: 12 },
  studio:     { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#b85c72", marginBottom: 4 },
  formTitle:  { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#2c2220", marginBottom: 4 },
  meta:       { fontSize: 9, color: "#a08080", marginBottom: 2 },
  section:    { marginBottom: 16 },
  row:        { flexDirection: "row", borderBottom: "0.5pt solid #f7f0ee", paddingVertical: 5, paddingHorizontal: 4 },
  rowAlt:     { flexDirection: "row", borderBottom: "0.5pt solid #f7f0ee", paddingVertical: 5, paddingHorizontal: 4, backgroundColor: "#faf8f6" },
  keyCell:    { width: "35%", fontSize: 9, color: "#7a5a5a", fontFamily: "Helvetica-Bold" },
  valCell:    { width: "65%", fontSize: 9, color: "#2c2220" },
  sigSection: { marginTop: 16, borderTop: "1pt solid #f0e8e4", paddingTop: 12 },
  sigLabel:   { fontSize: 9, color: "#7a5a5a", fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sigImg:     { width: 240, height: 60, borderRadius: 4, border: "0.5pt solid #ede5e2" },
  footer:     { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#c09898", textAlign: "center", borderTop: "0.5pt solid #f0e8e4", paddingTop: 8 },
});

function FormPDF({ form }: { form: ClientForm }) {
  const fields = form.fields ?? {};
  const entries = Object.entries(fields).filter(([k]) =>
    !["printedName", "name1", "name2", "acknowledged", "ack1", "ack2"].includes(k)
  );

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.studio}>Lillyan&apos;s Beauty Studio</Text>
          <Text style={pdfStyles.formTitle}>{FORM_TYPE_LABELS[form.form_type] ?? form.form_type}</Text>
          <Text style={pdfStyles.meta}>Service: {form.service_name ?? "—"} · {form.service_category ?? "—"}</Text>
          <Text style={pdfStyles.meta}>Submitted: {formatDate(form.submitted_at)}</Text>
          <Text style={pdfStyles.meta}>Client: {getClientName(form)}</Text>
        </View>

        {/* Field rows */}
        <View style={pdfStyles.section}>
          {entries.map(([key, val], i) => (
            <View key={key} style={i % 2 === 0 ? pdfStyles.row : pdfStyles.rowAlt}>
              <Text style={pdfStyles.keyCell}>{prettyKey(key)}</Text>
              <Text style={pdfStyles.valCell}>{prettyValue(val)}</Text>
            </View>
          ))}
        </View>

        {/* Signatures */}
        {(form.signature || form.signature2) && (
          <View style={pdfStyles.sigSection}>
            {form.signature && (
              <View style={{ marginBottom: 12 }}>
                <Text style={pdfStyles.sigLabel}>Signature</Text>
                <Image src={form.signature} style={pdfStyles.sigImg} />
              </View>
            )}
            {form.signature2 && (
              <View>
                <Text style={pdfStyles.sigLabel}>Signature 2</Text>
                <Image src={form.signature2} style={pdfStyles.sigImg} />
              </View>
            )}
          </View>
        )}

        <Text style={pdfStyles.footer}>
          Lillyan&apos;s Beauty Studio · Fayetteville, OH · Confidential Client Record
        </Text>
      </Page>
    </Document>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function FormModal({ form, onClose }: { form: ClientForm; onClose: () => void }) {
  const [marking, setMarking] = useState(false);
  const [reviewed, setReviewed] = useState(form.reviewed);
  const [exporting, setExporting] = useState(false);
  const fields = form.fields ?? {};
  const entries = Object.entries(fields);

  async function markReviewed() {
    setMarking(true);
    try {
      await fetch(`/api/forms/${form.id}`, { method: "PATCH" });
      setReviewed(true);
    } finally {
      setMarking(false);
    }
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const blob = await pdf(<FormPDF form={{ ...form, reviewed }} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `form-${form.form_type}-${form.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
      onClick={onClose}>
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(44,34,32,0.45)" }} />

      {/* Drawer */}
      <div
        style={{ position: "relative", width: "min(520px, 100vw)", height: "100vh", background: "#fff", overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0e8e4", position: "sticky", top: 0, background: "#fff", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#b85c72", marginBottom: 4 }}>
              {form.service_category ?? "Form"} · {FORM_TYPE_LABELS[form.form_type] ?? form.form_type}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#2c2220" }}>
              {getClientName(form)}
            </div>
            <div style={{ fontSize: 12, color: "#a08080", marginTop: 2 }}>
              {form.service_name} · {formatDate(form.submitted_at)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#a08080", cursor: "pointer", padding: "0 0 0 8px", lineHeight: 1 }}>×</button>
        </div>

        {/* Action bar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #f0e8e4", display: "flex", gap: 10 }}>
          <button
            onClick={markReviewed}
            disabled={marking || reviewed}
            style={{ padding: "8px 14px", background: reviewed ? "#f0faf0" : "#b85c72", color: reviewed ? "#2a7a2a" : "#fff", border: reviewed ? "1px solid #b0d8b0" : "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: reviewed ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            {reviewed ? "✓ Reviewed" : marking ? "Marking…" : "Mark as Reviewed"}
          </button>
          <button
            onClick={exportPDF}
            disabled={exporting}
            style={{ padding: "8px 14px", background: "#faf8f6", color: "#2c2220", border: "1px solid #f0e8e4", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            {exporting ? "Generating…" : "Export PDF"}
          </button>
        </div>

        {/* Field values */}
        <div style={{ flex: 1, padding: "20px 24px" }}>
          {entries.length === 0 && (
            <p style={{ fontSize: 13, color: "#a08080" }}>No field data recorded.</p>
          )}
          {entries.map(([key, val]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c09898", fontWeight: 500, marginBottom: 3 }}>
                {prettyKey(key)}
              </div>
              <div style={{ fontSize: 13, color: "#2c2220", lineHeight: 1.5 }}>
                {Array.isArray(val)
                  ? val.length === 0
                    ? <span style={{ color: "#a08080" }}>None selected</span>
                    : <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {(val as string[]).map((v) => (
                          <span key={v} style={{ background: "#fdf5f7", border: "1px solid #f0d8de", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#b85c72" }}>{v}</span>
                        ))}
                      </div>
                  : typeof val === "boolean"
                    ? <span style={{ color: val ? "#2a7a2a" : "#7a5a5a" }}>{val ? "Yes" : "No"}</span>
                    : val === null || val === undefined || val === ""
                      ? <span style={{ color: "#a08080" }}>—</span>
                      : String(val)
                }
              </div>
            </div>
          ))}

          {/* Signatures */}
          {(form.signature || form.signature2) && (
            <div style={{ marginTop: 24, borderTop: "1px solid #f0e8e4", paddingTop: 20 }}>
              {form.signature && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c09898", fontWeight: 500, marginBottom: 8 }}>Signature</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.signature} alt="Signature" style={{ maxWidth: "100%", border: "1px solid #ede5e2", borderRadius: 8, background: "#fff", display: "block" }} />
                </div>
              )}
              {form.signature2 && (
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c09898", fontWeight: 500, marginBottom: 8 }}>Signature 2</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.signature2} alt="Signature 2" style={{ maxWidth: "100%", border: "1px solid #ede5e2", borderRadius: 8, background: "#fff", display: "block" }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main table ─────────────────────────────────────────────────────────────────

export function ClientFormsTable({ forms }: { forms: ClientForm[] }) {
  const [selected, setSelected] = useState<ClientForm | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterReviewed, setFilterReviewed] = useState("");

  const categories = Array.from(new Set(forms.map((f) => f.service_category).filter(Boolean))) as string[];
  const formTypes  = Array.from(new Set(forms.map((f) => f.form_type)));

  const filtered = forms.filter((f) => {
    if (filterType && f.form_type !== filterType) return false;
    if (filterCat && f.service_category !== filterCat) return false;
    if (filterReviewed === "yes" && !f.reviewed) return false;
    if (filterReviewed === "no" && f.reviewed) return false;
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        <select
          className="field-input"
          style={{ maxWidth: 200 }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All form types</option>
          {formTypes.map((t) => <option key={t} value={t}>{FORM_TYPE_LABELS[t] ?? t}</option>)}
        </select>
        <select
          className="field-input"
          style={{ maxWidth: 200 }}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="field-input"
          style={{ maxWidth: 160 }}
          value={filterReviewed}
          onChange={(e) => setFilterReviewed(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="no">Needs review</option>
          <option value="yes">Reviewed</option>
        </select>
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--grey-mid)", alignSelf: "center" }}>
          {filtered.length} form{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Form Type</th>
                <th>Service</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--grey-mid)", padding: "2rem" }}>
                    No forms found.
                  </td>
                </tr>
              )}
              {filtered.map((form) => (
                <tr
                  key={form.id}
                  onClick={() => setSelected(form)}
                  style={{ cursor: "pointer" }}
                  className="data-table-row-hover"
                >
                  <td style={{ fontWeight: 500 }}>{getClientName(form)}</td>
                  <td>{FORM_TYPE_LABELS[form.form_type] ?? form.form_type}</td>
                  <td style={{ color: "var(--grey-mid)" }}>{form.service_name ?? "—"}</td>
                  <td style={{ color: "var(--grey-mid)" }}>{form.service_category ?? "—"}</td>
                  <td style={{ color: "var(--grey-mid)", whiteSpace: "nowrap" }}>{formatDate(form.submitted_at)}</td>
                  <td>
                    {form.reviewed
                      ? <span className="badge badge-green">Reviewed</span>
                      : <span className="badge badge-amber">Pending</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <FormModal form={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
