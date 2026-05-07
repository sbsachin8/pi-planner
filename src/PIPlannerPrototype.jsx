import { useState, useMemo } from "react";
import {
  Bell, Search, Sparkles, ChevronRight, ChevronLeft, Filter, MessageSquare,
  ThumbsUp, ThumbsDown, Mic, MicOff, Send, Lock, FileText, Clock, MapPin,
  Eye, BarChart3, CheckCircle2, AlertTriangle, Globe, ShieldCheck, Mail,
  Languages, X, Info, ArrowRight, Play, Plus, MoreVertical, Wifi, BatteryFull,
  Home, Calendar, Users, Grid3x3, Star, Inbox, Briefcase, FolderOpen,
  Download,
  Layers, ListChecks, Activity, ChevronDown, Phone, Video
} from "lucide-react";
import { jsPDF } from "jspdf";

/* iPad / LSC tokens calibrated to training-deck screenshots */
const T = {
  brand: "#0176d3", brandDark: "#014486", brandSoft: "#eaf5fe",
  pageBg: "#f3f3f3", surface: "#ffffff", surfaceAlt: "#fafaf9",
  border: "#dddbda", borderLight: "#ecebea",
  text: "#181818", textMute: "#3e3e3c", textWeak: "#706e6b",
  success: "#2e844a", successBg: "#cdefc4",
  warning: "#fe9339", warningBg: "#feefc4",
  error: "#ba0517", errorBg: "#feded8",
};

const REGIONS = {
  CORE:  { code: "CORE",  label: "Common Core",  flag: "🌐", note: "Baseline experience inherited by all regions." },
  NA:    { code: "NA",    label: "North America", flag: "🇺🇸", note: "Approved-link allowlist, full audit metadata, voice-recording policy gates." },
  EMEA:  { code: "EMEA",  label: "EMEA",          flag: "🇪🇺", note: "Translation awareness; HCP comments displayed alongside reactions." },
  APAC:  { code: "APAC",  label: "APAC",          flag: "🌏", note: "Channel-tagged content, navigation rules, no rep-customized presentations." },
  LATAM: { code: "LATAM", label: "LATAM",         flag: "🌎", note: "Locked email templates with editable personalization zones." },
};

/* STEPS — now mapped to the native LSC surface where the action actually happens */
const STEPS = [
  { id: 1, phase: "Before Visit", title: "Content Notifications",
    icon: Bell, surface: "Notifications Panel",
    surfaceNote: "Bell icon in top-right of LSC nav (OOTB notification framework)",
    summary: "New/updated approved content surfaces in the native notification panel — not in Intelligent Content." },
  { id: 2, phase: "Before Visit", title: "Pre-Call Planning",
    icon: Briefcase, surface: "Account Record · Pre-Call Tab",
    surfaceNote: "Account/HCP record page · Pre-Call dashboard tab",
    summary: "Recommended Presentation (OOTB via PATI JSON) + AI suggestions appear on the Account record." },
  { id: 3, phase: "Before Visit", title: "Content Library & Search",
    icon: FolderOpen, surface: "Intelligent Content Tab",
    surfaceNote: "App tab · Intelligent Content (the only step truly inside this tab)",
    summary: "Content library, smart search, custom presentation builder (where permitted)." },
  { id: 4, phase: "During Visit", title: "Content Presentation",
    icon: Play, surface: "Visit Page · Content Sidebar",
    surfaceNote: "Visit Engagement page · Presentation Forum (Content menu)",
    summary: "Player launches from the Visit's Content sidebar, not from Intelligent Content directly." },
  { id: 5, phase: "During Visit", title: "In-Visit HCP Feedback",
    icon: ThumbsUp, surface: "Player Feedback Panel + Visit Sidebar",
    surfaceNote: "Player feedback panel (OOTB position-configurable) + Notes on Visit",
    summary: "Reactions captured in the player feedback panel; free-text/voice on the Visit page." },
  { id: 6, phase: "After Visit",  title: "Visit Wrap-Up & Tracking",
    icon: BarChart3, surface: "Visit Page · Presented Content + Activity Timeline",
    surfaceNote: "Visit record page (OOTB) · Activity Timeline on Account",
    summary: "Visit page auto-populates Presented Content; Activity Timeline updates on the HCP." },
  { id: 7, phase: "After Visit",  title: "Field Email Follow-Up",
    icon: Mail, surface: "Field Email · From Account Record",
    surfaceNote: "Send Email button on Account · OOTB Field Email module",
    summary: "Approved templates with Fragments and locked sections — launched from the HCP record." },
];

const COMMERCIAL_PRECALL_STEPS = [
  { id: 201, phase: "Before Visit", title: "Next Best Customers",
    icon: Users, surface: "Connext · NBC Dashboard",
    surfaceNote: "Home page · AI-ranked HCP card list with channel preference and consent status",
    summary: "AI-ranked HCP targeting with channel preference, consent status per channel, territory metrics, and segmentation tools." },
  { id: 202, phase: "Before Visit", title: "Calendar & Planner",
    icon: Calendar, surface: "Connext · Calendar View",
    surfaceNote: "Calendar page · Day/Week/Quarter views with Outlook sync and AI follow-up reminders",
    summary: "Unified visit calendar with Outlook sync, AI-scheduled follow-ups, optimal contact windows, and manager visibility." },
  { id: 203, phase: "After Visit",  title: "Visit Submission",
    icon: ListChecks, surface: "Connext · Visit Submission Queue",
    surfaceNote: "Visit record · Documentation queue with AI-flagged pending submissions",
    summary: "Pending visit documentation queue with AI-prioritised incomplete records and compliance deadline alerts." },
];

/* Commercial Pre-Call Variations — APAC-specific, sourced directly from call planning data.xlsx */
const CP_VARIATIONS = {
  201: { // Next Best Customers
    APAC: {
      tag: "Channel-Aware NBC + Consent & PV Gating",
      surface: "Connext · NBC Dashboard",
      story: "APAC NBC dashboard shows channel preference chips (F2F/Email/Phone/Virtual), consent status per channel, and PV-mandated visit flags on each HCP card.",
      effect: "Channel chips greyed when consent absent. AI rank includes geographic cluster, visit-day capacity, and pharmacovigilance requirements.",
      stories: [
        { id: "STORY-00001", type: "Config",              core: "Yes", text: "View each HCP's preferred engagement channel (F2F, email, phone, virtual) on the NBC list." },
        { id: "STORY-00004", type: "Config",              core: "Yes", text: "HCP card shows channel preference and recent channel-level engagement at a glance." },
        { id: "STORY-00010", type: "Config",              core: "Yes", text: "View consent status per channel for each HCP so I never reach out through an unconsented channel." },
        { id: "STORY-00013", type: "Custom AI",           core: "Yes", text: "AI generates a ranked HCP visit list accounting for priority tier, geographic proximity, and facility co-location." },
        { id: "STORY-00015", type: "Custom AI",           core: "Yes", text: "View best day and time to contact each HCP per channel based on historical engagement patterns." },
        { id: "STORY-00025", type: "Config",              core: "Yes", text: "See specific access conditions for each HCP's visitability status (RxVantage booking, no-rep days, institutional policies)." },
        { id: "STORY-00028", type: "Custom AI",           core: "Yes", text: "AI recommends the most appropriate compliant alternative channel for HCPs who are inaccessible in person." },
        { id: "STORY-00029", type: "Integration",         core: "No",  text: "Be aware of when a patient will next visit the HCP so I can plan to visit before that appointment." },
        { id: "STORY-00030", type: "Config",              core: "No",  text: "Pharmacovigilance-mandated visits are included in the proposed schedule so compliance visits are never missed." },
        { id: "STORY-00031", type: "Config",              core: "No",  text: "Track and capture Service Calls (sample drops, leave-behinds) where no direct HCP interaction occurs." },
      ],
    },
  },
  202: { // Calendar & Planner
    APAC: {
      tag: "RxVantage Integration + Adaptive Geographic Scheduling",
      surface: "Connext · Calendar View",
      story: "APAC calendar layers RxVantage physician availability over Connext visits, groups suggestions by geographic cluster, and learns optimal contact windows per HCP.",
      effect: "Physician schedule overlay shown in calendar cells. AI scheduling respects APAC cluster grouping and per-period day-capacity constraints.",
      stories: [
        { id: "STORY-00039", type: "Integration",         core: "No",  text: "Integration with RxVantage to layer physician schedules on the Connext calendar without switching to an external system." },
        { id: "STORY-00016", type: "Custom AI",           core: "Yes", text: "System learns and suggests optimal contact windows per HCP per channel based on historical engagement patterns." },
        { id: "STORY-00023", type: "Config",              core: "No",  text: "Recommendations respect the number of visit days available in a given period, aligned with actual rep capacity." },
        { id: "STORY-00024", type: "Custom Optimization", core: "No",  text: "Recommendations group HCPs by geographic cluster to reflect realistic travel patterns rather than point-to-point routes." },
        { id: "STORY-00041", type: "Config",              core: "Yes", text: "Clone a past visit record to pre-populate a new visit with the same HCP, location, and objectives." },
      ],
    },
  },
};

/* VARIATIONS — same logic, surfaces re-aligned */
const VARIATIONS = {
  3: {
    APAC:  { tag: "Restricted Customization", surface: "Intelligent Content Tab",
      story: "As a Sales Rep in APAC, I want to be restricted from customizing/creating my own presentations.",
      effect: "‘Create Custom Presentation’ button hidden in Content Library." },
    EMEA:  { tag: "Admin-Defined Categories", surface: "Intelligent Content Tab",
      story: "Categories should be defined by admin; reps can flexibly search and plan but not create personal categories.",
      effect: "Personal category creation is disabled; admin taxonomy enforced." },
  },
  4: {
    APAC: { tag: "Channel-Tagged Content + Locked Navigation", surface: "Visit Page · Player",
      story: "Content tagged with channels (WhatsApp, WeChat); navigation can only jump to deck cover pages.",
      effect: "Channel chips shown in player; slide-jumping limited to cover pages." },
    EMEA: { tag: "In-Slide Reactions Display", surface: "Visit Page · Player",
      story: "HCP comments displayed alongside key-message reactions on the relevant e-detail slide.",
      effect: "Comment overlay rendered on slide canvas during presentation." },
  },
  5: {
    APAC: { tag: "Consent-Gated Quick Reactions", surface: "Player Feedback Panel",
      story: "Toggle Thumbs-Up/Down capture on/off per HCP consent.",
      effect: "Reactions disabled in feedback panel until HCP consent toggle is on." },
    NA:   { tag: "Voice Recording Policy Gate", surface: "Visit Page · Notes",
      story: "Voice-recording capability available only when permitted by local policy.",
      effect: "Mic disabled on Visit page — flagged ‘Not permitted’." },
  },
  1: {
    LATAM: { tag: "Translation Awareness", surface: "Notifications Panel",
      story: "Reps must be notified on updated content translations.",
      effect: "Notification cards include ES/PT-BR translation status badges." },
  },
  7: {
    NA:    { tag: "Approved-Link Allowlist + Audit Metadata", surface: "Field Email",
      story: "Email may only include links to approved sites/ads; system stores full send metadata.",
      effect: "Link insertion validated against allowlist; audit panel rendered." },
    LATAM: { tag: "Locked Template + Personalization Zones", surface: "Field Email",
      story: "Locked sections + editable greeting/intro/closing; HCP name and discussed topic pre-populated.",
      effect: "Body shows lock icons; only greeting/closing fields are editable." },
    APAC:  { tag: "Self-Service Asset Creation (Approved Blocks)", surface: "Field Email",
      story: "Reps assemble follow-up assets from approved building blocks.",
      effect: "Block library replaces freeform editor; out-of-bounds drag rejected." },
  },
};

const EXPERIENCE_CONFIG = {
  detailing: {
    label: "e-Detailing",
    title: "e-Detailing on iPad",
    subtitle: "Each step rendered in its native LSC surface",
    defaultStepId: 2,
    steps: STEPS,
    variations: VARIATIONS,
  },
  commercialPreCall: {
    label: "Commercial Pre-Call",
    title: "Commercial Pre-Call Planning",
    subtitle: "Next Best Customers · Calendar & Planner · Visit Submission — sourced from call planning data",
    defaultStepId: 201,
    steps: COMMERCIAL_PRECALL_STEPS,
    variations: CP_VARIATIONS,
  },
};

const variationKey = (experienceKey, regionCode, step) => `${experienceKey}::${regionCode}::${step}`;
const parseVariationKey = (key) => {
  const [experienceKey, regionCode, stepRaw] = key.split("::");
  return { experienceKey, regionCode, stepId: Number(stepRaw) };
};

/* Primitives */
const PillTab = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{
    padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer",
    background: active ? T.brand : "transparent",
    color: active ? "#fff" : T.text,
    fontSize: 13, fontWeight: active ? 600 : 500, fontFamily: "inherit", whiteSpace: "nowrap",
  }}>{children}</button>
);

const Btn = ({ variant = "outline", icon: Icon, children, onClick, disabled, full, style }) => {
  const styles = {
    primary: { bg: T.brand, fg: "#fff", bd: T.brand },
    outline: { bg: "#fff", fg: T.brand, bd: T.brand },
    neutral: { bg: "#fff", fg: T.text, bd: T.border },
    success: { bg: T.success, fg: "#fff", bd: T.success },
    danger:  { bg: T.error, fg: "#fff", bd: T.error },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: 36, padding: "0 16px", borderRadius: 18,
      background: disabled ? "#f3f3f3" : styles.bg,
      color: disabled ? T.textWeak : styles.fg,
      border: `1px solid ${disabled ? T.border : styles.bd}`,
      fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      fontFamily: "inherit", width: full ? "100%" : "auto", ...style,
    }}>{Icon && <Icon size={14} strokeWidth={2}/>}{children}</button>
  );
};

const Pill = ({ tone = "neutral", children, icon: Icon }) => {
  const tones = {
    neutral: { bg: "#ecebea", fg: T.text },
    info:    { bg: T.brandSoft, fg: T.brandDark },
    success: { bg: T.successBg, fg: "#194e26" },
    warning: { bg: T.warningBg, fg: "#5a3206" },
    error:   { bg: T.errorBg,   fg: "#5d0610" },
    brand:   { bg: T.brand,     fg: "#fff" },
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: 12, fontSize: 11, fontWeight: 600, background: tones.bg, color: tones.fg,
      lineHeight: "16px", whiteSpace: "nowrap",
    }}>{Icon && <Icon size={11}/>}{children}</span>
  );
};

const ContentCard = ({ children, padding = 0 }) => (
  <div style={{
    background: "#fff", borderRadius: 8, border: `1px solid ${T.border}`,
    margin: "0 16px 12px", overflow: "hidden", padding,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  }}>{children}</div>
);

/* iPad chrome — global app nav with tab indicator showing where we are */
const StatusBar = () => (
  <div style={{ height: 28, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ background: T.brandSoft, color: T.brandDark, padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>09:42</span>
      <span style={{ color: T.textMute, fontWeight: 500 }}>Mon Apr 30</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.textMute }}>
      <Wifi size={13} strokeWidth={2.5}/><span style={{ fontSize: 11, fontWeight: 600 }}>92%</span><BatteryFull size={16} strokeWidth={2}/>
    </div>
  </div>
);

const AppNav = ({ activeTab, notificationOpen, setNotificationOpen }) => {
  const tabs = [
    { id: "Home", label: "Home", icon: Home },
    { id: "Accounts", label: "Accounts", icon: Users },
    { id: "Calendar", label: "Calendar", icon: Calendar },
    { id: "Visits", label: "Visits", icon: Activity },
    { id: "IntelligentContent", label: "Intelligent Content", icon: Grid3x3 },
  ];
  return (
    <div style={{ padding: "8px 16px 12px", display: "flex", alignItems: "center", gap: 12 }}>
      <button style={{ width: 32, height: 32, borderRadius: 16, background: "transparent", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
        <ChevronLeft size={18} color={T.textMute}/>
      </button>
      <div style={{
        flex: 1, display: "flex", justifyContent: "center", gap: 4, alignItems: "center",
        background: "#fff", border: `1px solid ${T.border}`, borderRadius: 22, padding: 4, height: 36,
        maxWidth: 620, margin: "0 auto",
      }}>
        {tabs.map(t => {
          const isActive = t.id === activeTab;
          return (
            <div key={t.label} style={{
              padding: "4px 12px", borderRadius: 16,
              background: isActive ? T.brand : "transparent",
              color: isActive ? "#fff" : T.text,
              fontSize: 12, fontWeight: isActive ? 600 : 500,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <t.icon size={12}/>{t.label}
            </div>
          );
        })}
        <div style={{ width: 1, height: 18, background: T.borderLight, margin: "0 4px" }}/>
        <button style={{ width: 28, height: 28, borderRadius: 14, border: "none", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}>
          <Search size={14} color={T.textMute}/>
        </button>
      </div>
      <button onClick={() => setNotificationOpen(!notificationOpen)} style={{
        width: 32, height: 32, borderRadius: 16,
        background: notificationOpen ? T.brandSoft : "transparent",
        border: notificationOpen ? `1px solid ${T.brand}` : "none",
        cursor: "pointer", display: "grid", placeItems: "center", position: "relative",
      }}>
        <Bell size={18} color={notificationOpen ? T.brand : T.textMute}/>
        <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, background: T.error, border: "1.5px solid #fff" }}/>
      </button>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: "#fff", border: `1px solid ${T.border}`, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11, color: T.text }}>EC</div>
    </div>
  );
};

/* Surface ribbon — tells you which native LSC surface you're on */
const SurfaceRibbon = ({ step, region }) => (
  <div style={{ padding: "6px 24px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
    <Pill tone="info" icon={step.icon}>{step.surface}</Pill>
    <span style={{ fontSize: 11, color: T.textWeak }}>{step.surfaceNote}</span>
    <div style={{ flex: 1 }}/>
    <Pill tone="info" icon={Globe}>{REGIONS[region].flag} {REGIONS[region].label}</Pill>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   STEP RENDERERS — each renders the correct LSC surface
   ────────────────────────────────────────────────────────────── */

// STEP 1: NOTIFICATIONS PANEL — slides over the Home page
const Step1 = ({ region }) => {
  const showTranslation = region === "LATAM";
  const items = [
    { title: "Immunexis Q3 Detail Aid v2.1", brand: "Immunexis", type: "HTML5 Deck", status: "NEW", hcp: "Linked: Dr. R. Shell visit · tomorrow 10:30am", time: "2h ago" },
    { title: "Safety Information Update",    brand: "Immunexis", type: "PDF", status: "MANDATORY", hcp: "Required for all upcoming visits", time: "5h ago" },
    { title: "AE Reporting Reference",       brand: "Cross-brand", type: "PDF", status: "UPDATED", hcp: "Tagged to your territory", time: "Yesterday" },
    { title: "Patient Onboarding Guide",     brand: "Immunexis", type: "HTML5", status: "NEW", hcp: "Suggested for Dr. K. Liu", time: "Yesterday" },
  ];
  return (
    <>
      {/* Background: Home page placeholder */}
      <div style={{ padding: "0 16px 16px", opacity: 0.4, pointerEvents: "none" }}>
        <ContentCard>
          <div style={{ padding: 14, fontSize: 13, fontWeight: 700, borderBottom: `1px solid ${T.borderLight}` }}>Home · Weekly Visits</div>
          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
            {["Mon","Tue","Wed","Thu","Fri"].map(d => (
              <div key={d} style={{ padding: 10, background: T.surfaceAlt, borderRadius: 6, fontSize: 11, textAlign: "center" }}>{d}</div>
            ))}
          </div>
        </ContentCard>
        <ContentCard>
          <div style={{ padding: 14, fontSize: 13, fontWeight: 700 }}>Next Best Customer</div>
        </ContentCard>
      </div>
      {/* Notifications dropdown panel anchored to bell */}
      <div style={{
        position: "absolute", top: 78, right: 80, width: 380, maxHeight: 600,
        background: "#fff", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)",
        border: `1px solid ${T.border}`, overflow: "hidden", zIndex: 10,
      }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Bell size={14}/>Notifications</div>
          <span style={{ fontSize: 11, color: T.textWeak }}>4 new</span>
        </div>
        <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", gap: 4 }}>
          <PillTab active>All</PillTab>
          <PillTab>Content</PillTab>
          <PillTab>Visits</PillTab>
        </div>
        <div style={{ overflowY: "auto", maxHeight: 460 }}>
          {items.map((it, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "32px 1fr", gap: 10, padding: "12px 16px",
              borderBottom: i < items.length - 1 ? `1px solid ${T.borderLight}` : "none",
              cursor: "pointer",
            }}>
              <div style={{ width: 32, height: 32, background: T.brandSoft, borderRadius: 16, display: "grid", placeItems: "center" }}>
                <FileText size={15} color={T.brand}/>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                  <Pill tone={it.status === "MANDATORY" ? "warning" : it.status === "UPDATED" ? "info" : "success"}>{it.status}</Pill>
                  {showTranslation && <Pill tone="info" icon={Languages}>ES • PT-BR</Pill>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{it.title}</div>
                <div style={{ fontSize: 11, color: T.textMute }}>{it.brand} · {it.type}</div>
                <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>{it.hcp}</div>
                <div style={{ fontSize: 10, color: T.textWeak, marginTop: 4 }}>{it.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.borderLight}`, background: T.surfaceAlt, fontSize: 12, color: T.brand, fontWeight: 600, textAlign: "center", cursor: "pointer" }}>
          View all notifications →
        </div>
      </div>
    </>
  );
};

// STEP 2: ACCOUNT RECORD · Pre-Call tab — Recommended Presentation, NBA, NBC
const Step2 = ({ region }) => {
  const suggestions = [
    { title: "Immunexis First Deck", reason: "PATI-recommended for this HCP", confidence: 95, oot: true },
    { title: "MoA — Slide 3 (deep-link)", reason: "Dr. Shell engaged 14s last visit", confidence: 92, oot: false },
    { title: "Phase III Efficacy Data",  reason: "Brand priority for Q3",            confidence: 88, oot: false },
  ];
  return (
    <>
      {/* HCP record header */}
      <ContentCard>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: T.brandSoft, borderRadius: 22, display: "grid", placeItems: "center", fontWeight: 700, color: T.brand }}>RS</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.textWeak }}>Person Account · Healthcare Provider</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Dr. Rebecca Shell</div>
            <div style={{ fontSize: 11, color: T.textMute }}>Rheumatology · UCSF Health · Tier 1</div>
          </div>
          <Btn variant="outline" icon={Phone}>Call</Btn>
          <Btn variant="primary" icon={Video}>New Visit</Btn>
        </div>
        {/* Tabs row matching the screenshot */}
        <div style={{ padding: "0 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", gap: 6, overflowX: "auto" }}>
          {["Pre-Call","Dashboard","Engagement Metrics","Activity Timeline","Affiliations","Related","Details"].map(tab => (
            <div key={tab} style={{
              padding: "10px 12px", fontSize: 12, fontWeight: tab === "Pre-Call" ? 700 : 500,
              color: tab === "Pre-Call" ? T.brand : T.textMute,
              borderBottom: tab === "Pre-Call" ? `2px solid ${T.brand}` : "2px solid transparent",
              whiteSpace: "nowrap", cursor: "pointer",
            }}>{tab}</div>
          ))}
        </div>
      </ContentCard>

      {/* Recommended Presentation — OOTB feature (PATI JSON) */}
      <ContentCard>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Recommended Content for this HCP</div>
            <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>From Provider Account Territory Info · plus AI suggestions</div>
          </div>
          <Pill tone="brand" icon={Sparkles}>Agentforce</Pill>
        </div>
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ padding: 12, border: `1px solid ${T.borderLight}`, borderRadius: 8, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</span>
                  {s.oot && <Pill tone="success">OOTB · PATI</Pill>}
                  <Pill tone="info">{s.confidence}% match</Pill>
                </div>
                <div style={{ fontSize: 11, color: T.textMute }}>{s.reason}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="outline" icon={Eye}>Preview</Btn>
                <Btn variant="primary" icon={Play}>Plan</Btn>
              </div>
            </div>
          ))}
        </div>
      </ContentCard>

      {/* Next Best Action — OOTB component */}
      <ContentCard>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Next Best Action</div>
          <Pill tone="success">OOTB · NBA</Pill>
        </div>
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          <div style={{ padding: 12, border: `1px solid ${T.borderLight}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: T.successBg, borderRadius: 16, display: "grid", placeItems: "center" }}>
              <Calendar size={15} color={T.success}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Schedule a follow-up visit this week</div>
              <div style={{ fontSize: 11, color: T.textMute }}>Last visit: 21 days ago · Tier 1 cadence target: 14 days</div>
            </div>
            <Btn variant="primary" icon={CheckCircle2}>Accept</Btn>
            <Btn variant="neutral" icon={X}>Skip</Btn>
          </div>
        </div>
      </ContentCard>
    </>
  );
};

// STEP 3: INTELLIGENT CONTENT TAB — library + smart search (the only step inside this tab)
const Step3 = ({ region }) => {
  const blockCustom = region === "APAC";
  const adminCats   = region === "EMEA";
  return (
    <ContentCard>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Content Library</div>
          <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>Distributed to your territory · TM-SPC-SF North 20D02T11</div>
        </div>
        {blockCustom
          ? <Pill tone="warning" icon={Lock}>Locked by region</Pill>
          : <Btn variant="outline" icon={FileText}>Create Custom</Btn>}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} color={T.textWeak} style={{ position: "absolute", left: 12, top: 11 }}/>
            <input placeholder="Smart search content…" style={{
              width: "100%", height: 36, padding: "0 14px 0 36px", border: `1px solid ${T.border}`,
              borderRadius: 18, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
            }}/>
          </div>
          <Btn variant="neutral" icon={Filter}>Filters</Btn>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
          {adminCats ? "Categories (admin-defined only)" : "Categories"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {["Efficacy", "Safety", "Mechanism", "Patient Profile", "Dosing"].map(c => <Pill key={c}>{c}</Pill>)}
          {!adminCats && <Pill tone="info" icon={Star}>My Favorites</Pill>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { name: "Immunexis First Deck", pages: 12, badge: "ACTIVE", type: "HTML5" },
            { name: "Phase III Highlights", pages: 6, badge: "NEW", type: "HTML5" },
            { name: "Safety & MoA Reprint", pages: 8, badge: "MANDATORY", type: "PDF" },
          ].map((d, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.borderLight}` }}>
              <div style={{ aspectRatio: "16/10", background: `linear-gradient(135deg, ${T.brandSoft}, #cfe9fe)`, display: "grid", placeItems: "center", position: "relative" }}>
                <FileText size={26} color={T.brand}/>
                <span style={{ position: "absolute", top: 6, right: 6 }}>
                  <Pill tone={d.badge === "MANDATORY" ? "warning" : d.badge === "NEW" ? "success" : "info"}>{d.badge}</Pill>
                </span>
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: T.textMute }}>{d.type} · {d.pages} pages</div>
              </div>
            </div>
          ))}
        </div>
        {blockCustom && (
          <div style={{ marginTop: 14, padding: 12, background: T.warningBg, borderRadius: 8, fontSize: 12, color: "#5a3206", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Lock size={14}/><div><b>Custom presentations disabled.</b> APAC reps must use HQ-approved decks only.</div>
          </div>
        )}
        {adminCats && (
          <div style={{ marginTop: 14, padding: 12, background: T.brandSoft, borderRadius: 8, fontSize: 12, color: T.brandDark, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Info size={14}/><div><b>EMEA:</b> Categories are admin-curated. Smart search and planning remain available.</div>
          </div>
        )}
      </div>
    </ContentCard>
  );
};

// STEP 4: VISIT PAGE — sidebar menu (Content/Samples/etc.) + active player
const Step4 = ({ region }) => {
  const channelTags  = region === "APAC";
  const lockedNav    = region === "APAC";
  const inSlideReact = region === "EMEA";
  const sidebarItems = [
    { label: "Overview", icon: Briefcase },
    { label: "Content", icon: FolderOpen, active: true, count: 3 },
    { label: "Product Detail", icon: Layers },
    { label: "Samples", icon: Inbox, count: 1 },
    { label: "DTP", icon: Send },
    { label: "Marketing Items", icon: ListChecks },
    { label: "Attendees", icon: Users, count: 1 },
  ];
  return (
    <ContentCard>
      {/* Visit header */}
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: T.textWeak }}>Visit · In Progress</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Dr. Rebecca Shell · UCSF Health</div>
          <div style={{ fontSize: 11, color: T.textMute }}>Started 09:30 · Channel: In-Person · Visit ID V-2026-0430-018</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Pill tone="success" icon={Clock}>00:14:08</Pill>
          <Btn variant="outline" icon={ChevronRight}>End Visit</Btn>
        </div>
      </div>
      {/* Sidebar + content area */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr" }}>
        {/* Sidebar Menu — driven by Page Layout related lists */}
        <div style={{ background: T.surfaceAlt, padding: 8, borderRight: `1px solid ${T.borderLight}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", padding: "8px 8px 4px", letterSpacing: 0.5 }}>Visit Sidebar</div>
          {sidebarItems.map(item => (
            <button key={item.label} style={{
              width: "100%", padding: "10px 10px", border: "none", textAlign: "left", cursor: "pointer",
              background: item.active ? "#fff" : "transparent",
              borderRadius: 6, marginBottom: 2, fontFamily: "inherit",
              borderLeft: item.active ? `3px solid ${T.brand}` : "3px solid transparent",
              display: "flex", alignItems: "center", gap: 8,
              color: item.active ? T.brandDark : T.text,
            }}>
              <item.icon size={14} color={item.active ? T.brand : T.textMute}/>
              <span style={{ flex: 1, fontSize: 12, fontWeight: item.active ? 700 : 500 }}>{item.label}</span>
              {item.count && <Pill tone={item.active ? "info" : "neutral"}>{item.count}</Pill>}
            </button>
          ))}
        </div>
        {/* Content area: Presentation Forum (player active) */}
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <FolderOpen size={14} color={T.brand}/>Content · Presenting
            </div>
            <span style={{ fontSize: 11, color: T.textMute }}>Slide 3 of 12 · 00:14 on slide</span>
          </div>
          <div style={{ background: "linear-gradient(135deg,#eaf5fe,#cfe9fe)", borderRadius: 10, position: "relative", minHeight: 240, padding: 24, display: "grid", placeItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.brandDark, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>IMMUNEXIS · MECHANISM OF ACTION</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.brandDark, lineHeight: 1.2, marginBottom: 10 }}>Selective Cytokine Modulation</div>
              <div style={{ display: "inline-flex", gap: 12, padding: "6px 14px", background: "rgba(255,255,255,0.6)", borderRadius: 18, fontSize: 11, color: T.brandDark }}>
                <span><b>IL-17A</b> blockade</span>
                <span><b>72%</b> ACR50 @ wk16</span>
              </div>
            </div>
            {channelTags && (
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
                <Pill tone="brand">WeChat ✓</Pill>
                <Pill tone="brand">WhatsApp ✓</Pill>
              </div>
            )}
            {lockedNav && (
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <Pill tone="warning" icon={Lock}>APAC: Cover-page jumps only</Pill>
              </div>
            )}
            {inSlideReact && (
              <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, background: "rgba(255,255,255,0.97)", borderRadius: 8, padding: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.brand, marginBottom: 3 }}>HCP COMMENT · IN-SLIDE (EMEA)</div>
                <div style={{ fontSize: 12, fontStyle: "italic" }}>“How does this compare to JAK inhibitors in elderly patients?”</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <Btn variant="neutral" icon={ChevronLeft}>Previous</Btn>
            <span style={{ fontSize: 11, color: T.textMute }}>Mandatory slide 1 acknowledged ✓</span>
            <Btn variant="primary" icon={ChevronRight}>Next</Btn>
          </div>
        </div>
      </div>
    </ContentCard>
  );
};

// STEP 5: PLAYER FEEDBACK PANEL + Visit Notes
const Step5 = ({ region }) => {
  const consentGated = region === "APAC";
  const voiceBlocked = region === "NA";
  const [consent, setConsent] = useState(false);
  const reactionsOn = !consentGated || consent;
  return (
    <>
      <ContentCard>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Player Feedback Panel</div>
            <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>Position: Right sidecar · Configured per Presentation</div>
          </div>
          <Pill tone="success">OOTB</Pill>
        </div>
        <div style={{ padding: 14 }}>
          {consentGated && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: T.warningBg, borderRadius: 8, marginBottom: 12 }}>
              <ShieldCheck size={14} color={T.warning}/>
              <span style={{ fontSize: 12, color: "#5a3206", flex: 1 }}>APAC: HCP consent required to capture reactions.</span>
              <button onClick={() => setConsent(!consent)} style={{
                width: 38, height: 22, borderRadius: 11, border: "none",
                background: consent ? T.success : T.border, cursor: "pointer", position: "relative",
              }}>
                <div style={{ position: "absolute", width: 18, height: 18, borderRadius: 9, background: "#fff", top: 2, left: consent ? 18 : 2, transition: "left 150ms" }}/>
              </button>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <Btn variant="success" icon={ThumbsUp} disabled={!reactionsOn} style={{ height: 52, borderRadius: 26, fontSize: 14 }} full>Positive · 3</Btn>
            <Btn variant="danger" icon={ThumbsDown} disabled={!reactionsOn} style={{ height: 52, borderRadius: 26, fontSize: 14 }} full>Objection · 1</Btn>
          </div>
          <div style={{ fontSize: 11, padding: 10, border: `1px solid ${T.borderLight}`, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><b>Slide 4 · Phase III Data</b></span>
            <Pill tone="success">Positive · 00:21</Pill>
          </div>
        </div>
      </ContentCard>

      <ContentCard>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Visit Notes & Voice</div>
            <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>Captured on Visit record · Free-text & voice transcript</div>
          </div>
          <Pill tone={voiceBlocked ? "error" : "info"}>{voiceBlocked ? "Voice disabled" : "Voice ready"}</Pill>
        </div>
        <div style={{ padding: 14 }}>
          <textarea placeholder="Free-text notes from this conversation…" rows={3} style={{
            width: "100%", padding: 12, border: `1px solid ${T.border}`, borderRadius: 8,
            fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none",
          }}/>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
            <Btn variant={voiceBlocked ? "neutral" : "outline"} icon={voiceBlocked ? MicOff : Mic} disabled={voiceBlocked}>
              {voiceBlocked ? "Recording not permitted" : "Start voice capture"}
            </Btn>
            {voiceBlocked && <span style={{ fontSize: 11, color: T.error }}>Blocked by NA policy</span>}
          </div>
          <div style={{ marginTop: 12, padding: 10, background: T.brandSoft, borderRadius: 8, fontSize: 12, color: T.brandDark, display: "flex", gap: 10 }}>
            <Sparkles size={14}/><div><b>AI prompt:</b> Ask about prior biologic experience and prior-auth pathway.</div>
          </div>
        </div>
      </ContentCard>
    </>
  );
};

// STEP 6: VISIT WRAP-UP — Presented Content + Activity Timeline
const Step6 = () => (
  <>
    <ContentCard>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Visit · Presented Content</div>
          <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>V-2026-0430-018 · Auto-populated on visit submit</div>
        </div>
        <Pill tone="success" icon={CheckCircle2}>OOTB · Auto-populated</Pill>
      </div>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: T.surfaceAlt }}>
            {["Order", "Slide", "Page Name", "Time", "Sentiment"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: T.textMute, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { o:1, s:1, n:"Cover · Immunexis Q3", t:"00:06", m:"Neutral" },
            { o:2, s:3, n:"Mechanism of Action",  t:"00:22", m:"Positive" },
            { o:3, s:4, n:"Phase III Efficacy",   t:"00:31", m:"Positive" },
            { o:4, s:7, n:"Safety Profile",       t:"00:18", m:"Objection" },
          ].map(r => (
            <tr key={r.o} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
              <td style={{ padding: "10px 14px" }}>{r.o}</td>
              <td style={{ padding: "10px 14px" }}>#{r.s}</td>
              <td style={{ padding: "10px 14px", color: T.brand, fontWeight: 500 }}>{r.n}</td>
              <td style={{ padding: "10px 14px" }}>{r.t}</td>
              <td style={{ padding: "10px 14px" }}>
                <Pill tone={r.m === "Positive" ? "success" : r.m === "Objection" ? "error" : "neutral"}>{r.m}</Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContentCard>

    <ContentCard>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Account · Activity Timeline</div>
        <Pill tone="success">OOTB</Pill>
      </div>
      <div style={{ padding: 14 }}>
        {[
          { icon: Activity, label: "Visit completed · Dr. Shell · 12:04 duration", time: "Just now", color: T.success },
          { icon: FileText, label: "4 slides presented · IMX-MOA-S03, IMX-P3-S04, …", time: "Just now", color: T.brand },
          { icon: Sparkles, label: "AI summary generated and synced offline", time: "Just now", color: T.brand },
        ].map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${T.borderLight}` : "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: T.brandSoft, display: "grid", placeItems: "center" }}>
              <e.icon size={14} color={e.color}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>{e.label}</div>
              <div style={{ fontSize: 10, color: T.textWeak }}>{e.time}</div>
            </div>
          </div>
        ))}
      </div>
    </ContentCard>
  </>
);

// STEP 7: FIELD EMAIL — launched from Account record
const Step7 = ({ region }) => {
  const naAllowlist = region === "NA";
  const latamLocked = region === "LATAM";
  const apacBlocks  = region === "APAC";
  return (
    <>
      <ContentCard>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: T.textWeak }}>Field Email · launched from HCP record</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Compose: Immunexis Follow-Up</div>
            <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>Template aligned to territory · Fragments enabled</div>
          </div>
          <Pill tone="brand" icon={Sparkles}>AI-drafted</Pill>
        </div>
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 240px", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.textMute, display: "block", marginBottom: 4 }}>To</label>
            <div style={{ padding: 10, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 10, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
              Dr. Rebecca Shell · rshell@ucsfhealth.org {latamLocked && <Pill tone="info">pre-populated</Pill>}
            </div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.textMute, display: "block", marginBottom: 4 }}>Subject</label>
            <div style={{ padding: 10, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 10, fontSize: 12, background: latamLocked ? T.surfaceAlt : "#fff", display: "flex", alignItems: "center", gap: 6 }}>
              {latamLocked && <Lock size={11} color={T.textWeak}/>}Following up: Phase III data and JAK comparison
            </div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.textMute, display: "block", marginBottom: 4 }}>Body (template + fragments)</label>
            {apacBlocks ? (
              <div style={{ border: `2px dashed ${T.brand}`, borderRadius: 8, background: T.brandSoft, padding: 10, minHeight: 200 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.brandDark, textTransform: "uppercase", marginBottom: 8 }}>APAC: Approved blocks only</div>
                {["✓ Header · Hero","✓ Greeting · Dr. Shell","✓ Efficacy fragment · Phase III"].map(b => (
                  <div key={b} style={{ background: "#fff", border: `1px solid ${T.borderLight}`, borderRadius: 6, padding: 8, marginBottom: 6, fontSize: 11 }}>{b}</div>
                ))}
                <div style={{ marginTop: 8, padding: 8, background: T.errorBg, borderRadius: 6, fontSize: 10, color: "#5d0610", display: "flex", gap: 6, alignItems: "center" }}>
                  <AlertTriangle size={11}/>Free-form text blocks blocked by APAC policy.
                </div>
              </div>
            ) : (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, lineHeight: 1.55, overflow: "hidden" }}>
                <div style={{ padding: 10, background: "#fff", borderBottom: latamLocked ? `1px dashed ${T.borderLight}` : "none" }}>
                  {latamLocked && <div style={{ fontSize: 9, color: T.success, marginBottom: 3, fontWeight: 700 }}>✎ EDITABLE · GREETING</div>}
                  Dear Dr. Shell,
                </div>
                <div style={{ padding: 10, background: latamLocked ? T.surfaceAlt : "#fff", borderBottom: latamLocked ? `1px dashed ${T.borderLight}` : "none" }}>
                  {latamLocked && <div style={{ fontSize: 9, color: T.textWeak, marginBottom: 3, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Lock size={9}/>LOCKED · CORE FRAGMENT</div>}
                  Thank you for your time today. I am sharing the Phase III subgroup analysis and JAK comparison data, as discussed. These reflect the most recently approved Immunexis clinical positioning.
                </div>
                <div style={{ padding: 10, background: "#fff" }}>
                  {latamLocked && <div style={{ fontSize: 9, color: T.success, marginBottom: 3, fontWeight: 700 }}>✎ EDITABLE · CLOSING</div>}
                  Happy to set up time with our MSL if helpful. Warm regards, Evan Casto
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
              <Btn variant="primary" icon={Send}>Send</Btn>
              <span style={{ fontSize: 11, color: T.textWeak }}>2 attached fragments · 1 link</span>
            </div>
          </div>
          <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>Compliance check</div>
            {naAllowlist ? (
              <>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                  <CheckCircle2 size={13} color={T.success}/>
                  <span style={{ fontSize: 11 }}>All links validated against allowlist</span>
                </div>
                <div style={{ background: "#fff", border: `1px solid ${T.borderLight}`, borderRadius: 6, padding: 8, fontSize: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>Approved links</div>
                  <div>✓ immunexis-hcp.com/p3</div>
                  <div>✓ jnj.com/safety/imx</div>
                </div>
                <hr style={{ border: 0, borderTop: `1px solid ${T.borderLight}`, margin: "10px 0" }}/>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>Audit metadata</div>
                <div style={{ fontSize: 10, color: T.textMute, lineHeight: 1.6 }}>
                  Sent: Apr 30 14:22 PT<br/>Audit: AUD-2026-04-3091
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}><CheckCircle2 size={13} color={T.success}/><span style={{ fontSize: 11 }}>HCP consent on file</span></div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}><CheckCircle2 size={13} color={T.success}/><span style={{ fontSize: 11 }}>Approved template v4.2</span></div>
                {latamLocked && <div style={{ display: "flex", gap: 6, alignItems: "center" }}><CheckCircle2 size={13} color={T.success}/><span style={{ fontSize: 11 }}>Locked sections preserved</span></div>}
              </>
            )}
            <div style={{ marginTop: 10, padding: 8, background: "#fff", border: `1px solid ${T.borderLight}`, borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: T.textWeak, marginBottom: 3 }}>Activity Timeline will record:</div>
              <div style={{ fontSize: 11 }}>Send status · Open rate · Click-through</div>
            </div>
          </div>
        </div>
      </ContentCard>
    </>
  );
};

// STEP 201: NEXT BEST CUSTOMERS — AI-ranked HCP targeting list
const StepNBC = ({ region }) => {
  const isAPAC = region === "APAC";
  const hcps = [
    { initials: "RS", name: "Dr. Rebecca Shell",    specialty: "Rheumatology · UCSF Health",      tier: 1, rank: 1, score: 97, channels: ["F2F","Email"], consent: {F2F: true,  Email: true,  Phone: false}, lastVisit: "21d ago",  cadence: "Overdue",  pvFlag: false, serviceCall: false },
    { initials: "KL", name: "Dr. Kevin Liu",         specialty: "Oncology · Stanford Medical",       tier: 1, rank: 2, score: 91, channels: ["Email","Phone"], consent: {F2F: true,  Email: true,  Phone: true }, lastVisit: "8d ago",   cadence: "On track", pvFlag: true,  serviceCall: false },
    { initials: "MA", name: "Dr. Meera Agrawal",     specialty: "Immunology · UCSF Medical Ctr",    tier: 2, rank: 3, score: 85, channels: ["F2F","Virtual"], consent: {F2F: true,  Email: false, Phone: false}, lastVisit: "14d ago",  cadence: "On track", pvFlag: false, serviceCall: true  },
    { initials: "TR", name: "Dr. Thomas Reyes",      specialty: "Rheumatology · Kaiser Permanente", tier: 2, rank: 4, score: 78, channels: ["F2F"], consent: {F2F: true,  Email: false, Phone: false}, lastVisit: "32d ago",  cadence: "Overdue",  pvFlag: false, serviceCall: false },
    { initials: "SP", name: "Dr. Sunita Patel",      specialty: "Oncology · CPMC",                 tier: 3, rank: 5, score: 64, channels: ["Email","Phone"], consent: {F2F: false, Email: true,  Phone: true }, lastVisit: "5d ago",   cadence: "On track", pvFlag: false, serviceCall: false },
  ];
  const channelColors = { F2F: T.success, Email: T.brand, Phone: T.warning, Virtual: "#7f5af0" };
  return (
    <>
      <ContentCard padding={0}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Next Best Customers</div>
            <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>AI-ranked · Territory: TM-SPC-SF North 20D02T11 · 5 of 38 shown</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Pill tone="brand" icon={Sparkles}>Agentforce ranked</Pill>
            <Btn variant="neutral" icon={Filter}>Segment</Btn>
          </div>
        </div>
        <div style={{ padding: "8px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["All Tiers","Tier 1","Tier 2","Overdue Only","Consent: Email"].map((f,i) => (
            <button key={f} style={{ padding: "4px 12px", borderRadius: 12, border: `1px solid ${i === 0 ? T.brand : T.border}`, background: i === 0 ? T.brandSoft : "#fff", color: i === 0 ? T.brandDark : T.textMute, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{f}</button>
          ))}
        </div>
        <div style={{ display: "grid", gap: 0 }}>
          {hcps.map((hcp, idx) => (
            <div key={hcp.initials} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 12, padding: "12px 18px", borderBottom: idx < hcps.length - 1 ? `1px solid ${T.borderLight}` : "none", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: T.brandSoft, display: "grid", placeItems: "center", fontWeight: 700, color: T.brand, fontSize: 13 }}>{hcp.initials}</div>
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, background: hcp.rank <= 2 ? T.brand : T.border, color: "#fff", fontSize: 9, fontWeight: 700, display: "grid", placeItems: "center", border: "1.5px solid #fff" }}>#{hcp.rank}</span>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{hcp.name}</span>
                  <Pill tone="info">Tier {hcp.tier}</Pill>
                  <Pill tone={hcp.cadence === "Overdue" ? "warning" : "success"}>{hcp.cadence}</Pill>
                  {isAPAC && hcp.pvFlag && <Pill tone="error">PV Visit Required</Pill>}
                  {isAPAC && hcp.serviceCall && <Pill tone="neutral">Service Call</Pill>}
                </div>
                <div style={{ fontSize: 11, color: T.textMute, marginBottom: 4 }}>{hcp.specialty} · Last visit: {hcp.lastVisit}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["F2F","Email","Phone","Virtual"].map(ch => {
                    const preferred = hcp.channels.includes(ch);
                    const consented = isAPAC ? hcp.consent[ch] : preferred;
                    const blocked   = isAPAC && !hcp.consent[ch];
                    return (
                      <span key={ch} style={{
                        padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                        background: blocked ? "#ecebea" : preferred ? (channelColors[ch] + "22") : "transparent",
                        color: blocked ? T.textWeak : preferred ? channelColors[ch] : T.textWeak,
                        border: `1px solid ${blocked ? T.borderLight : preferred ? channelColors[ch] : T.borderLight}`,
                        textDecoration: blocked ? "line-through" : "none",
                      }}>{ch}{blocked ? " 🔒" : preferred ? " ★" : ""}</span>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: hcp.score >= 90 ? T.success : hcp.score >= 75 ? T.warning : T.textWeak }}>{hcp.score}<span style={{ fontSize: 10, fontWeight: 500, color: T.textWeak }}>/100</span></div>
                {isAPAC && (
                  <div style={{ fontSize: 10, color: T.brand, fontWeight: 600 }}>Best: {["Mon 9am","Tue 2pm","Wed 11am","Thu 10am","Fri 3pm"][idx]}</div>
                )}
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn variant="outline" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>Profile</Btn>
                  <Btn variant="primary" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>Plan Visit</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
        {isAPAC && (
          <div style={{ padding: "10px 18px", background: T.brandSoft, borderTop: `1px solid ${T.borderLight}`, display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: T.brandDark }}>
            <Sparkles size={13}/>
            <span><b>APAC AI scheduling:</b> Visit order optimised by geographic cluster. Consent locks shown on channel chips. 🔒 = no valid consent on record.</span>
          </div>
        )}
      </ContentCard>
    </>
  );
};

// STEP 202: CALENDAR & PLANNER — week view with Outlook sync
const StepCalendar = ({ region }) => {
  const isAPAC = region === "APAC";
  const days = ["Mon 28","Tue 29","Wed 30","Thu 1","Fri 2"];
  const visits = [
    { day: 0, time: "09:30", hcp: "Dr. R. Shell",  type: "F2F",     tier: 1, duration: "45m", color: T.brand    },
    { day: 0, time: "14:00", hcp: "Internal · Team sync", type: "Meeting", tier: null, duration: "60m", color: T.textMute },
    { day: 1, time: "10:00", hcp: "Dr. K. Liu",    type: "Email followup", tier: 1, duration: "—", color: T.success  },
    { day: 2, time: "09:00", hcp: "Dr. M. Agrawal",type: "F2F",     tier: 2, duration: "30m", color: T.brand    },
    { day: 2, time: "11:30", hcp: "Dr. T. Reyes",  type: "F2F",     tier: 2, duration: "30m", color: T.brand    },
    { day: 3, time: "13:00", hcp: "Dr. S. Patel",  type: "Phone",   tier: 3, duration: "20m", color: T.warning  },
    { day: 4, time: "10:00", hcp: "Open slot",     type: "",        tier: null, duration: "—", color: T.borderLight, empty: true },
  ];
  return (
    <>
      <ContentCard padding={0}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Calendar · Week of Apr 28</div>
            <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>5 visits planned · 1 email follow-up · Outlook synced</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Pill tone="success" icon={CheckCircle2}>Outlook synced</Pill>
            {isAPAC && <Pill tone="brand">RxVantage overlay</Pill>}
            <Btn variant="neutral" icon={Plus}>Add visit</Btn>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0 }}>
          {days.map((d, di) => (
            <div key={d} style={{ borderRight: di < 4 ? `1px solid ${T.borderLight}` : "none" }}>
              <div style={{ padding: "8px 10px", background: T.surfaceAlt, borderBottom: `1px solid ${T.borderLight}`, fontSize: 11, fontWeight: 700, textAlign: "center", color: T.textMute }}>{d}</div>
              <div style={{ padding: 6, minHeight: 260, display: "grid", gap: 6, alignContent: "start" }}>
                {visits.filter(v => v.day === di).map((v, vi) => (
                  <div key={vi} style={{ padding: "8px 10px", borderRadius: 6, background: v.empty ? T.surfaceAlt : (v.color + "18"), border: `1px solid ${v.empty ? T.borderLight : (v.color + "55")}`, cursor: v.empty ? "default" : "pointer" }}>
                    <div style={{ fontSize: 10, color: v.color, fontWeight: 700 }}>{v.time}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: v.empty ? T.textWeak : T.text }}>{v.hcp}</div>
                    {v.type && <div style={{ fontSize: 10, color: T.textMute, marginTop: 1 }}>{v.type}{v.tier ? ` · Tier ${v.tier}` : ""}{v.duration !== "—" ? ` · ${v.duration}` : ""}</div>}
                    {v.empty && <div style={{ fontSize: 10, color: T.brand, marginTop: 4 }}>{isAPAC ? "+ Suggest APAC HCP (geo cluster)" : "+ Suggest HCP"}</div>}
                    {isAPAC && !v.empty && v.type === "F2F" && (
                      <div style={{ marginTop: 4, fontSize: 9, color: T.brand, fontWeight: 600 }}>📍 RxVantage: Available {["09:00–11:00","10:30–12:00","09:00–12:00","14:00–15:30","10:00–11:30"][vi % 5]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {isAPAC && (
          <div style={{ padding: "10px 18px", background: T.brandSoft, borderTop: `1px solid ${T.borderLight}`, display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: T.brandDark }}>
            <Sparkles size={13}/>
            <span><b>APAC scheduling:</b> RxVantage availability overlaid on F2F visits. ML contact windows applied. Geographic clustering active — Mon/Wed visits grouped by North SF district.</span>
          </div>
        )}
      </ContentCard>
      <ContentCard padding={0}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>AI Follow-Up Reminders</div>
          <Pill tone="brand" icon={Sparkles}>3 due this week</Pill>
        </div>
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          {[
            { hcp: "Dr. K. Liu",   action: "Send approved efficacy email following Fri visit", due: "Today",  tone: "warning" },
            { hcp: "Dr. T. Reyes", action: "Schedule next Tier 2 visit — cadence 14d exceeded",  due: "Tomorrow", tone: "warning" },
            { hcp: "Dr. R. Shell", action: "Submit visit documentation for Apr 28 visit",         due: "Thu EOD",  tone: "info" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, border: `1px solid ${T.borderLight}`, borderRadius: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: T.brandSoft, display: "grid", placeItems: "center" }}>
                <Bell size={14} color={T.brand}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.hcp}</div>
                <div style={{ fontSize: 11, color: T.textMute }}>{r.action}</div>
              </div>
              <Pill tone={r.tone}>Due {r.due}</Pill>
              <Btn variant="primary" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>Act</Btn>
            </div>
          ))}
        </div>
      </ContentCard>
    </>
  );
};

// STEP 203: VISIT SUBMISSION QUEUE — pending documentation
const StepVisitSubmission = () => (
  <>
    <ContentCard padding={0}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Visit Submission Queue</div>
          <div style={{ fontSize: 11, color: T.textWeak, marginTop: 2 }}>3 visits pending documentation · 1 overdue</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Pill tone="warning">1 overdue</Pill>
          <Pill tone="brand" icon={Sparkles}>AI-prioritised</Pill>
        </div>
      </div>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: T.surfaceAlt }}>
            {["HCP", "Visit Date", "Channel", "Status", "AI Flag", "Actions"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: T.textMute, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { hcp: "Dr. Rebecca Shell",   date: "Apr 28", channel: "F2F",  status: "Overdue",  flag: "🔴 Deadline: today EOD",    flagTone: "error"   },
            { hcp: "Dr. Thomas Reyes",    date: "Apr 29", channel: "F2F",  status: "Pending",  flag: "🟡 Submit by Apr 30",       flagTone: "warning" },
            { hcp: "Dr. Meera Agrawal",   date: "Apr 30", channel: "Virtual", status: "Draft",  flag: "🟢 3 days remaining",      flagTone: "success" },
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
              <td style={{ padding: "12px 14px", fontWeight: 600 }}>{r.hcp}</td>
              <td style={{ padding: "12px 14px", color: T.textMute }}>{r.date}</td>
              <td style={{ padding: "12px 14px" }}><Pill>{r.channel}</Pill></td>
              <td style={{ padding: "12px 14px" }}><Pill tone={r.status === "Overdue" ? "error" : r.status === "Pending" ? "warning" : "info"}>{r.status}</Pill></td>
              <td style={{ padding: "12px 14px", fontSize: 11, color: T.textMute }}>{r.flag}</td>
              <td style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn variant="primary" style={{ height: 28, padding: "0 10px", fontSize: 11 }} icon={Send}>Submit</Btn>
                  <Btn variant="neutral" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>Edit</Btn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContentCard>
    <ContentCard>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>AI Submission Assistant</div>
        <Pill tone="brand" icon={Sparkles}>STORY-00021</Pill>
      </div>
      <div style={{ padding: 14, display: "grid", gap: 10 }}>
        <div style={{ padding: 12, background: T.errorBg, borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertTriangle size={14} color={T.error}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.error, marginBottom: 2 }}>Dr. Shell — Apr 28 visit documentation overdue today</div>
            <div style={{ fontSize: 11, color: T.textMute }}>AI recommends submitting this first. Pre-filled from visit data. Click Submit to review and confirm.</div>
          </div>
          <Btn variant="danger" style={{ flexShrink: 0 }} icon={Send}>Submit now</Btn>
        </div>
        <div style={{ padding: 12, background: T.brandSoft, borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Sparkles size={14} color={T.brand}/>
          <div style={{ fontSize: 11, color: T.brandDark, lineHeight: 1.5 }}>
            <b>AI insight:</b> Dr. Reyes Apr 29 visit can be cloned from your Apr 15 visit — same HCP, objectives, and location. Use Clone Visit to save time.
          </div>
          <Btn variant="outline" style={{ flexShrink: 0 }}>Clone Visit</Btn>
        </div>
      </div>
    </ContentCard>
  </>
);

/* ROOT */
export default function EDetailingPrototype() {
  const [experienceKey, setExperienceKey] = useState("detailing");
  const [region, setRegion] = useState("CORE");
  const [stepId, setStepId] = useState(2);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [variationSelections, setVariationSelections] = useState({});
  const [noteDraft, setNoteDraft] = useState("");
  const [exportMessage, setExportMessage] = useState("");

  const experience = EXPERIENCE_CONFIG[experienceKey];
  const activeSteps = experience.steps;
  const activeVariations = experience.variations;
  const activeStepIds = activeSteps.map(item => item.id);

  const step = activeSteps.find(s => s.id === stepId) || activeSteps[0];
  const variation = activeVariations[step.id]?.[region];
  const activeVariationKey = variation ? variationKey(experienceKey, region, step.id) : null;
  const activeSelection = activeVariationKey ? (variationSelections[activeVariationKey] || {}) : null;

  const setActiveVariationSelection = (patch) => {
    if (!activeVariationKey) return;
    setVariationSelections(prev => ({
      ...prev,
      [activeVariationKey]: {
        ...(prev[activeVariationKey] || {}),
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const addTaggedNote = (type) => {
    if (!activeVariationKey || !noteDraft.trim()) return;
    const nextNote = {
      type,
      text: noteDraft.trim(),
      createdAt: new Date().toISOString(),
    };

    setVariationSelections(prev => {
      const current = prev[activeVariationKey] || {};
      const currentNotes = current.notes || [];
      return {
        ...prev,
        [activeVariationKey]: {
          ...current,
          notes: [...currentNotes, nextNote],
          updatedAt: new Date().toISOString(),
        },
      };
    });
    setNoteDraft("");
  };

  const exportCurrentPIToPdf = () => {
    const selectedItems = Object.entries(variationSelections)
      .filter(([key, value]) => key.startsWith(`${experienceKey}::`) && value.piBucket === "current")
      .map(([key, value]) => {
        const { regionCode, stepId: selectedStepId } = parseVariationKey(key);
        const selectedStep = activeSteps.find(s => s.id === selectedStepId);
        const selectedVariation = activeVariations[selectedStepId]?.[regionCode];
        const selectedRegion = REGIONS[regionCode];
        if (!selectedStep || !selectedVariation || !selectedRegion) return null;
        return {
          step: selectedStep,
          variation: selectedVariation,
          region: selectedRegion,
          selection: value,
        };
      })
      .filter(Boolean);

    if (!selectedItems.length) {
      setExportMessage("No variations are moved to Current PI yet.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 44;

    doc.setFontSize(16);
    doc.text("PI Planner - Current PI Regional Variations", 40, y);
    y += 22;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
    y += 18;

    selectedItems.forEach((item, index) => {
      if (y > 760) {
        doc.addPage();
        y = 44;
      }

      doc.setFontSize(12);
      doc.text(`${index + 1}. ${item.step.id}. ${item.step.title} (${item.region.label})`, 40, y);
      y += 16;

      doc.setFontSize(10);
      doc.text(`Surface: ${item.step.surface}`, 52, y);
      y += 14;
      doc.text(`Variation: ${item.variation.tag}`, 52, y);
      y += 14;
      doc.text(`Decision: ${(item.selection.decision || "pending").toUpperCase()}`, 52, y);
      y += 14;
      doc.text(`PI Bucket: ${(item.selection.piBucket || "unassigned").toUpperCase()}`, 52, y);
      y += 14;

      const notes = item.selection.notes || [];
      if (notes.length) {
        doc.text("Notes:", 52, y);
        y += 14;
        notes.forEach(note => {
          const lines = doc.splitTextToSize(`- [${note.type.toUpperCase()}] ${note.text}`, 470);
          doc.text(lines, 64, y);
          y += (lines.length * 12) + 2;
        });
      }

      y += 10;
    });

    doc.save(`pi-planner-current-pi-${Date.now()}.pdf`);
    setExportMessage(`Exported ${selectedItems.length} variation(s) to PDF.`);
  };

  const activeRegionVariations = useMemo(
    () => activeSteps
      .map(s => {
        const stepVariation = activeVariations[s.id]?.[region];
        if (!stepVariation) return null;
        return {
          step: s,
          variation: stepVariation,
          selection: variationSelections[variationKey(experienceKey, region, s.id)] || {},
        };
      })
      .filter(Boolean),
    [activeSteps, activeVariations, experienceKey, region, variationSelections]
  );

  const activeRegionAcceptedCount = useMemo(
    () => Object.entries(variationSelections)
      .filter(([key, value]) => key.startsWith(`${experienceKey}::${region}::`) && value.decision === "approved")
      .length,
    [experienceKey, region, variationSelections]
  );

  const activeRegionCurrentPiCount = useMemo(
    () => Object.entries(variationSelections)
      .filter(([key, value]) => key.startsWith(`${experienceKey}::${region}::`) && value.piBucket === "current")
      .length,
    [experienceKey, region, variationSelections]
  );

  const activePhaseVariationCount = useMemo(
    () => activeRegionVariations.filter(item => item.step.phase === step.phase).length,
    [activeRegionVariations, step.phase]
  );

  // Map step → which app tab is highlighted
  const tabForStep = {
    1: "Home", 2: "Accounts", 3: "IntelligentContent",
    4: "Visits", 5: "Visits", 6: "Visits", 7: "Accounts",
    201: "Home", 202: "Calendar", 203: "Visits",
  }[step.id];

  // Auto-toggle notification panel for Step 1
  const showNotifPanel = step.id === 1 || notificationOpen;

  const stepScreen = useMemo(() => {
    const props = { region };
    return {
      1: <Step1 {...props}/>, 2: <Step2 {...props}/>, 3: <Step3 {...props}/>,
      4: <Step4 {...props}/>, 5: <Step5 {...props}/>, 6: <Step6 {...props}/>,
      7: <Step7 {...props}/>,
      201: <StepNBC {...props}/>, 202: <StepCalendar {...props}/>, 203: <StepVisitSubmission {...props}/>,
    }[step.id];
  }, [step.id, region]);

  const currentStepIndex = activeStepIds.indexOf(step.id);
  const previousStepId = currentStepIndex > 0 ? activeStepIds[currentStepIndex - 1] : null;
  const nextStepId = currentStepIndex >= 0 && currentStepIndex < activeStepIds.length - 1 ? activeStepIds[currentStepIndex + 1] : null;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "radial-gradient(ellipse at top, #2a2a2a 0%, #0a0a0a 100%)",
      color: T.text, padding: 16,
      fontFamily: '"Salesforce Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      fontSize: 13, display: "grid", gridTemplateColumns: "240px 1fr 300px", gap: 16,
    }}>
      {/* LEFT: Process steps with surface labels */}
      <aside style={{ background: "#fff", borderRadius: 12, alignSelf: "start", position: "sticky", top: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${T.borderLight}`, background: T.surfaceAlt }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", letterSpacing: 0.5 }}>Prototype</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{experience.title}</div>
          <div style={{ fontSize: 10, color: T.textWeak, marginTop: 4 }}>{experience.subtitle}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
            {Object.entries(EXPERIENCE_CONFIG).map(([key, config]) => (
              <Btn
                key={key}
                variant={experienceKey === key ? "primary" : "outline"}
                full
                onClick={() => {
                  setExperienceKey(key);
                  setStepId(config.defaultStepId);
                  setNoteDraft("");
                  setExportMessage("");
                }}
                style={{ height: 32, borderRadius: 16, fontSize: 11, padding: "0 10px" }}
              >
                {config.label}
              </Btn>
            ))}
          </div>
        </div>
        <div style={{ padding: 8 }}>
          {Array.from(new Set(activeSteps.map(item => item.phase))).map(phase => (
            <div key={phase}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 8px 4px" }}>{phase}</div>
              {activeSteps.filter(s => s.phase === phase).map(s => {
                const Icon = s.icon;
                const active = s.id === step.id;
                const hasVariation = !!activeVariations[s.id]?.[region];
                return (
                  <button key={s.id} onClick={() => setStepId(s.id)} style={{
                    width: "100%", padding: "8px 10px", border: "none", textAlign: "left", cursor: "pointer",
                    background: active ? T.brandSoft : "transparent",
                    borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "inherit",
                    color: active ? T.brandDark : T.text, marginBottom: 2,
                  }}>
                    <Icon size={14} color={active ? T.brand : T.textMute} style={{ marginTop: 2, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{s.id}. {s.title}</div>
                      <div style={{ fontSize: 9, color: T.textWeak, marginTop: 1 }}>{s.surface}</div>
                    </div>
                    {hasVariation && <span style={{ width: 6, height: 6, borderRadius: 3, background: T.warning, marginTop: 5, flexShrink: 0 }}/>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* CENTER: iPad device */}
      <main>
        <div style={{
          background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12, color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.6 }}>Region</span>
          <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(0,0,0,0.3)", borderRadius: 999 }}>
            {Object.values(REGIONS).map(r => (
              <button key={r.code} onClick={() => setRegion(r.code)} style={{
                padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: region === r.code ? "#fff" : "transparent",
                color: region === r.code ? T.brandDark : "#fff",
                fontSize: 12, fontWeight: region === r.code ? 700 : 500,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}><span>{r.flag}</span>{r.label}</button>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <Pill tone="info">{experience.label}</Pill>
          {variation && <Pill tone="warning" icon={AlertTriangle}>Regional override active</Pill>}
          {!variation && region !== "CORE" && <Pill tone="success" icon={CheckCircle2}>Matches Common Core</Pill>}
        </div>

        <div style={{
          background: "#1d1d1f", borderRadius: 32, padding: 14,
          boxShadow: "0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: 3, background: "#0a0a0a" }}/>
          <div style={{ background: T.pageBg, borderRadius: 22, overflow: "hidden", position: "relative", minHeight: 760 }}>
            <StatusBar/>
            <AppNav activeTab={tabForStep} notificationOpen={showNotifPanel} setNotificationOpen={setNotificationOpen}/>
            <SurfaceRibbon step={step} region={region}/>
            <div style={{ padding: "0 0 24px", position: "relative" }}>
              {stepScreen}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: "10px 16px", background: "rgba(255,255,255,0.06)",
          borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <button onClick={() => previousStepId && setStepId(previousStepId)} disabled={!previousStepId} style={{
            background: "transparent", color: !previousStepId ? "rgba(255,255,255,0.3)" : "#fff",
            border: "1px solid rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: 999,
            fontSize: 12, cursor: !previousStepId ? "not-allowed" : "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}><ChevronLeft size={14}/>Previous</button>
          <div style={{ display: "flex", gap: 6 }}>
            {activeSteps.map(s => (
              <div key={s.id} onClick={() => setStepId(s.id)} style={{
                width: s.id === step.id ? 28 : 8, height: 8, borderRadius: 4,
                background: s.id === step.id ? T.brand : activeStepIds.indexOf(s.id) < currentStepIndex ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                cursor: "pointer", transition: "width 200ms",
              }}/>
            ))}
          </div>
          <button onClick={() => nextStepId && setStepId(nextStepId)} disabled={!nextStepId} style={{
            background: T.brand, color: !nextStepId ? "rgba(255,255,255,0.5)" : "#fff",
            border: "none", padding: "8px 16px", borderRadius: 999,
            fontSize: 12, cursor: !nextStepId ? "not-allowed" : "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600,
            opacity: !nextStepId ? 0.5 : 1,
          }}>Next step<ArrowRight size={14}/></button>
        </div>
      </main>

      {/* RIGHT: Variation Inspector (with surface info) */}
      <aside style={{ background: "#fff", borderRadius: 12, alignSelf: "start", position: "sticky", top: 16, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.borderLight}`, background: T.surfaceAlt, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", letterSpacing: 0.5 }}>Compare</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>Variation Inspector</div>
          </div>
          <Pill tone={variation ? "warning" : "success"}>{variation ? "Override on this step" : "No override on this step"}</Pill>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>Native LSC Surface</div>
          <div style={{ padding: 8, background: T.brandSoft, borderRadius: 6, fontSize: 11, color: T.brandDark, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <step.icon size={12}/>{step.surface}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>Active region</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{REGIONS[region].flag}</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{REGIONS[region].label}</span>
          </div>
          <div style={{ fontSize: 11, color: T.textMute, lineHeight: 1.5, marginBottom: 12 }}>{REGIONS[region].note}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            <Pill tone="info">{activeRegionVariations.length} regional variation(s)</Pill>
            <Pill tone="warning">{activePhaseVariationCount} in {step.phase}</Pill>
            <Pill tone="success">{activeRegionAcceptedCount} accepted</Pill>
            <Pill tone="brand">{activeRegionCurrentPiCount} in Current PI</Pill>
          </div>
          <hr style={{ border: 0, borderTop: `1px solid ${T.borderLight}`, margin: "8px 0 12px" }}/>

          {variation ? (
            <>
              <Pill tone="warning" icon={AlertTriangle}>Override on this step</Pill>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, marginBottom: 6 }}>{variation.tag}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 }}>User Story</div>
              <div style={{ fontSize: 11, color: T.text, fontStyle: "italic", padding: 8, background: T.brandSoft, borderRadius: 6, borderLeft: `3px solid ${T.brand}`, marginBottom: 10, lineHeight: 1.5 }}>
                “{variation.story}”
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 }}>UI Effect</div>
              <div style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{variation.effect}</div>

              {variation.stories && variation.stories.length > 0 && (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", margin: "12px 0 6px", letterSpacing: 0.5 }}>Stories in this Variation ({variation.stories.length})</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {variation.stories.map(s => {
                      const typeTones = { Config: "info", "Custom AI": "brand", Integration: "warning", "Custom Optimization": "warning" };
                      return (
                        <div key={s.id} style={{ padding: "8px 10px", border: `1px solid ${T.borderLight}`, borderRadius: 6, background: "#fff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: T.textMute }}>{s.id}</span>
                            <Pill tone={typeTones[s.type] || "neutral"}>{s.type}</Pill>
                            <Pill tone={s.core === "Yes" ? "success" : "neutral"}>{s.core === "Yes" ? "Core" : "Optional"}</Pill>
                          </div>
                          <div style={{ fontSize: 11, color: T.text, lineHeight: 1.45 }}>{s.text}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <hr style={{ border: 0, borderTop: `1px solid ${T.borderLight}`, margin: "12px 0 10px" }}/>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>PI Planning Decision</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <Btn
                  variant={activeSelection?.decision === "approved" ? "success" : "outline"}
                  icon={CheckCircle2}
                  full
                  onClick={() => setActiveVariationSelection({ decision: "approved" })}
                >
                  Approve
                </Btn>
                <Btn
                  variant={activeSelection?.decision === "rejected" ? "danger" : "neutral"}
                  icon={X}
                  full
                  onClick={() => setActiveVariationSelection({ decision: "rejected" })}
                >
                  Reject
                </Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Btn
                  variant={activeSelection?.piBucket === "current" ? "primary" : "outline"}
                  icon={ArrowRight}
                  full
                  onClick={() => setActiveVariationSelection({ piBucket: "current" })}
                >
                  Move to Current PI
                </Btn>
                <Btn
                  variant={activeSelection?.piBucket === "next" ? "primary" : "outline"}
                  icon={ChevronRight}
                  full
                  onClick={() => setActiveVariationSelection({ piBucket: "next" })}
                >
                  Move to Next PI
                </Btn>
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {activeSelection?.decision && (
                  <Pill tone={activeSelection.decision === "approved" ? "success" : "error"}>
                    {activeSelection.decision === "approved" ? "Approved" : "Rejected"}
                  </Pill>
                )}
                {activeSelection?.piBucket && (
                  <Pill tone="info">{activeSelection.piBucket === "current" ? "Current PI" : "Next PI"}</Pill>
                )}
              </div>

              <hr style={{ border: 0, borderTop: `1px solid ${T.borderLight}`, margin: "12px 0 10px" }}/>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>Clarifications & Follow-ups</div>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a question or comment for this regional variation..."
                rows={2}
                style={{
                  width: "100%", padding: 8, border: `1px solid ${T.border}`,
                  borderRadius: 6, fontSize: 11, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                <Btn variant="outline" icon={MessageSquare} full onClick={() => addTaggedNote("question")}>Tag Question</Btn>
                <Btn variant="neutral" icon={MessageSquare} full onClick={() => addTaggedNote("comment")}>Tag Comment</Btn>
              </div>
              {!!activeSelection?.notes?.length && (
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  {activeSelection.notes.map((note, idx) => (
                    <div key={`${note.createdAt}-${idx}`} style={{ padding: 8, border: `1px solid ${T.borderLight}`, borderRadius: 6, background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                        <Pill tone={note.type === "question" ? "warning" : "info"}>{note.type}</Pill>
                        <span style={{ fontSize: 10, color: T.textWeak }}>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 11, lineHeight: 1.4 }}>{note.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <Pill tone="success" icon={CheckCircle2}>{region === "CORE" ? "Common Core baseline" : "No override on this step"}</Pill>
              <div style={{ fontSize: 11, color: T.textMute, lineHeight: 1.5, marginTop: 10 }}>
                {experienceKey === "commercialPreCall"
                  ? "Commercial Pre-Call is integrated into the same shell. The current screen intentionally reuses the existing pre-call mockup data and can be swapped to real planning data later."
                  : region === "CORE"
                  ? "Toggle a region above to inspect deviations."
                  : `${REGIONS[region].label} adopts the Common Core experience as-is. Look for amber dots in the left nav for variations.`}
              </div>
            </>
          )}

          <hr style={{ border: 0, borderTop: `1px solid ${T.borderLight}`, margin: "14px 0 10px" }}/>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>Variations across steps</div>
          <div style={{ display: "grid", gap: 3 }}>
            {activeSteps.map(s => {
              const has = !!activeVariations[s.id]?.[region];
              const stepSelection = variationSelections[variationKey(experienceKey, region, s.id)] || {};
              return (
                <button key={s.id} onClick={() => setStepId(s.id)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", border: "none",
                  background: step.id === s.id ? T.brandSoft : "transparent", cursor: "pointer", borderRadius: 5,
                  textAlign: "left", fontFamily: "inherit",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: has ? T.warning : T.borderLight, flexShrink: 0 }}/>
                  <span style={{ fontSize: 10, color: has ? T.text : T.textWeak, flex: 1 }}>{s.id}. {s.title}</span>
                  {has && <Pill tone="warning">override</Pill>}
                  {has && stepSelection.decision === "approved" && <Pill tone="success">approved</Pill>}
                  {has && stepSelection.decision === "rejected" && <Pill tone="error">rejected</Pill>}
                  {has && stepSelection.piBucket === "current" && <Pill tone="brand">current PI</Pill>}
                  {has && stepSelection.piBucket === "next" && <Pill tone="info">next PI</Pill>}
                </button>
              );
            })}
          </div>

          <hr style={{ border: 0, borderTop: `1px solid ${T.borderLight}`, margin: "14px 0 10px" }}/>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textWeak, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>Export</div>
          <Btn variant="primary" icon={Download} full onClick={exportCurrentPIToPdf}>Export Current PI Epics (PDF)</Btn>
          {!!exportMessage && (
            <div style={{ marginTop: 8, fontSize: 10, color: T.textMute, lineHeight: 1.4 }}>{exportMessage}</div>
          )}

          <hr style={{ border: 0, borderTop: `1px solid ${T.borderLight}`, margin: "14px 0 10px" }}/>
          <div style={{ fontSize: 9, color: T.textWeak, lineHeight: 1.5 }}>
            <Info size={9} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }}/>
            Each step rendered in the actual LSC surface where it occurs (Notifications panel, Account record, Visit page, Field Email, etc.). Stories sourced from Common Core Log.
          </div>
        </div>
      </aside>
    </div>
  );
}
