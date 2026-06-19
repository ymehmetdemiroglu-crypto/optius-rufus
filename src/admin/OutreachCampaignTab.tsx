import { useState, useEffect } from 'react';
import { trpc } from '../shared/providers/trpc';
import { Send, RefreshCw, CheckCircle, Mail, AlertTriangle, Edit3, Save } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface OutreachCampaignTabProps {
  prospectId: number;
  onStatusUpdated?: () => void;
}

export default function OutreachCampaignTab({ prospectId, onStatusUpdated }: OutreachCampaignTabProps) {
  const [activeTouch, setActiveTouch] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [editing, setEditing] = useState(false);

  // Email form state
  const [subject, setSubject] = useState("");
  const [body1, setBody1] = useState("");
  const [body2, setBody2] = useState("");
  const [body3, setBody3] = useState("");
  const [body4, setBody4] = useState("");
  const [body5, setBody5] = useState("");

  const [selectedSequenceId, setSelectedSequenceId] = useState("");

  // tRPC utils
  const utils = trpc.useUtils();

  // Fetch prospect detail and available sequences
  const { data: detailData, isLoading: loadingProspect, refetch: refetchProspect } = trpc.prospects.getById.useQuery({ id: prospectId });
  const { data: defaultSeqData } = trpc.prospects.getDefaultSequenceId.useQuery({ id: prospectId });
  const { data: sequences = [], isLoading: loadingSequences } = trpc.apollo.getSequences.useQuery({});

  // Mutations
  const saveEmails = trpc.prospects.saveOutreachEmails.useMutation({
    onSuccess: () => {
      setEditing(false);
      refetchProspect();
      alert("Outreach templates saved successfully!");
    },
    onError: (err) => {
      alert("Failed to save templates: " + err.message);
    }
  });

  const enrollCampaign = trpc.prospects.approveAndEnroll.useMutation({
    onSuccess: () => {
      refetchProspect();
      if (onStatusUpdated) onStatusUpdated();
      alert("Prospect successfully synced and enrolled in Apollo outreach campaign!");
    },
    onError: (err) => {
      alert("Enrollment failed: " + err.message);
    }
  });

  const regenerateCopy = trpc.prospects.regenerateOutreach.useMutation({
    onSuccess: (data) => {
      setSubject(data.subject);
      setBody1(data.body1);
      setBody2(data.body2);
      setBody3(data.body3);
      setBody4(data.body4);
      setBody5(data.body5);
      alert("AI cold outreach emails regenerated!");
    },
    onError: (err) => {
      alert("Regeneration failed: " + err.message);
    }
  });

  // Populate local form state from fetched prospect data
  useEffect(() => {
    if (detailData?.prospect) {
      const p = detailData.prospect;
      const emails = p.outreachEmails;
      setSubject(emails?.subject || "");
      setBody1(emails?.body1 || "");
      setBody2(emails?.body2 || "");
      setBody3(emails?.body3 || "");
      setBody4(emails?.body4 || "");
      setBody5(emails?.body5 || "");
    }
  }, [detailData]);

  // Handle sequence selection initialization
  useEffect(() => {
    if (defaultSeqData?.sequenceId) {
      setSelectedSequenceId(defaultSeqData.sequenceId);
    }
  }, [defaultSeqData]);

  const handleSave = () => {
    saveEmails.mutate({
      id: prospectId,
      emails: { subject, body1, body2, body3, body4, body5 }
    });
  };

  const handleEnroll = () => {
    if (!selectedSequenceId) {
      alert("Please select a sequence to enroll this prospect in.");
      return;
    }
    const confirmText = `Are you sure you want to approve this copy and enroll this contact? This will sync all personalization fields to Apollo and queue the emails.`;
    if (confirm(confirmText)) {
      enrollCampaign.mutate({ id: prospectId, sequenceId: selectedSequenceId });
    }
  };

  const handleRegenerate = () => {
    if (confirm("Are you sure you want to regenerate outreach drafts with AI? This will overwrite unsaved changes.")) {
      regenerateCopy.mutate({ id: prospectId });
    }
  };

  if (loadingProspect || loadingSequences) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <RefreshCw size={24} className="animate-spin text-brand-gold mb-2" />
        <span className="font-mono text-xs uppercase">Loading outreach suite...</span>
      </div>
    );
  }

  const prospect = detailData?.prospect;
  if (!prospect) return null;

  const status = prospect.status;
  const isEnrolled = status === 'emailed';
  const hasDrafts = !!prospect.outreachEmails;

  const currentBody = {
    1: body1,
    2: body2,
    3: body3,
    4: body4,
    5: body5
  }[activeTouch];

  const setCurrentBody = {
    1: setBody1,
    2: setBody2,
    3: setBody3,
    4: setBody4,
    5: setBody5
  }[activeTouch];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="bg-white space-y-4">
        <div className="flex justify-between items-center border-b border-brand-dark/10 pb-3">
          <div>
            <h3 className="font-display font-black text-lg uppercase tracking-wider">
              Apollo Email Outreach Campaign
            </h3>
            <p className="font-mono text-[10px] text-gray-500 uppercase mt-0.5">
              Contact Status: <span className="font-bold text-brand-dark">{status.toUpperCase()}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {!isEnrolled && (
              <Button
                variant="secondary"
                onClick={handleRegenerate}
                className="py-1.5 px-3 text-xs uppercase"
                disabled={regenerateCopy.isPending}
              >
                {regenerateCopy.isPending ? "Regenerating..." : "AI Re-Draft"}
              </Button>
            )}
            {editing ? (
              <Button
                variant="primary"
                onClick={handleSave}
                className="py-1.5 px-3 text-xs uppercase flex items-center gap-1.5"
                disabled={saveEmails.isPending}
              >
                <Save size={12} /> Save Draft
              </Button>
            ) : (
              !isEnrolled && (
                <Button
                  variant="secondary"
                  onClick={() => setEditing(true)}
                  className="py-1.5 px-3 text-xs uppercase flex items-center gap-1.5"
                >
                  <Edit3 size={12} /> Edit Template
                </Button>
              )
            )}
          </div>
        </div>

        {/* Status Messages */}
        {isEnrolled ? (
          <div className="bg-green-50 border-[2px] border-green-600 p-4 flex gap-3 text-green-800">
            <CheckCircle size={20} className="shrink-0 mt-0.5 text-green-600" />
            <div className="font-mono text-xs">
              <h5 className="font-bold uppercase">Outreach Active</h5>
              <p className="text-[10px] mt-1 leading-normal text-green-700">
                This prospect is active. Personalization tokens have been synced, and they are enrolled in campaign ID <code className="bg-green-100 px-1 py-0.5">{prospect.apolloSequenceId}</code>.
              </p>
            </div>
          </div>
        ) : !hasDrafts ? (
          <div className="bg-brand-gold/5 border-[2px] border-brand-gold p-4 flex gap-3 text-brand-dark">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-brand-gold" />
            <div className="font-mono text-xs">
              <h5 className="font-bold uppercase">Draft Missing</h5>
              <p className="text-[10px] mt-1 leading-normal text-gray-600">
                The AI copywriter has not drafted outreach emails for this prospect yet. Click "AI Re-Draft" to generate a custom sequence now.
              </p>
            </div>
          </div>
        ) : null}

        {/* Campaign Control Panel */}
        {!isEnrolled && hasDrafts && (
          <div className="border-[2px] border-brand-dark bg-brand-gold/5 p-4 space-y-4">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider">
              Launch Campaign Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8 space-y-1">
                <label className="font-mono text-[9px] uppercase font-bold text-gray-500 block">Outreach Sequence ID Mapping</label>
                <select
                  value={selectedSequenceId}
                  onChange={(e) => setSelectedSequenceId(e.target.value)}
                  className="brutalist-input h-10 text-xs bg-white cursor-pointer w-full"
                >
                  <option value="">-- Choose Apollo Campaign ID --</option>
                  {sequences.map((seq) => (
                    <option key={seq.id} value={seq.id}>
                      {seq.name} ({seq.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <Button
                  variant="primary"
                  onClick={handleEnroll}
                  className="w-full h-10 text-xs uppercase font-bold flex items-center justify-center gap-1.5"
                  disabled={enrollCampaign.isPending}
                >
                  {enrollCampaign.isPending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Enrolling...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Approve & Enroll
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Editor & Previewer */}
      {hasDrafts && (
        <div className="grid grid-cols-12 gap-6">
          {/* Email Touch Select Navigation */}
          <div className="col-span-12 md:col-span-3 space-y-2">
            <span className="font-mono text-[9px] uppercase font-bold text-gray-500 block">Touch Sequence</span>
            <div className="flex flex-col gap-2">
              {([1, 2, 3, 4, 5] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTouch(t)}
                  className={`p-3 text-left border-[2px] font-mono transition-all text-xs flex justify-between items-center ${
                    activeTouch === t
                      ? 'bg-brand-dark border-brand-dark text-white font-bold shadow-brutal-sm'
                      : 'bg-white border-brand-dark hover:bg-gray-50'
                  }`}
                >
                  <span>Touch {t} {t === 1 ? '(Thread Head)' : '(Reply)'}</span>
                  <Mail size={12} className={activeTouch === t ? "text-brand-gold" : "text-gray-400"} />
                </button>
              ))}
            </div>
          </div>

          {/* Subject & Body Preview/Editor Card */}
          <div className="col-span-12 md:col-span-9 space-y-4">
            {/* Subject Line */}
            <div className="brutalist-card bg-white space-y-2">
              <label className="font-mono text-[9px] uppercase font-bold text-gray-500 block">Thread Subject (Touch 1 Only)</label>
              {editing ? (
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="brutalist-input w-full font-mono text-xs py-2 px-3 focus:outline-none"
                  placeholder="email subject line..."
                />
              ) : (
                <div className="border-[2px] border-brand-dark bg-brand-bg px-3 py-2 font-mono text-xs font-bold text-brand-dark">
                  {subject || <span className="text-gray-400 italic">No subject line drafted</span>}
                </div>
              )}
            </div>

            {/* Email Body */}
            <div className="brutalist-card bg-white space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[9px] uppercase font-bold text-gray-500">
                  Email Message Body
                </label>
                <span className="font-mono text-[9px] text-gray-400 uppercase">
                  Word Count: {currentBody.split(/\s+/).filter(Boolean).length}
                </span>
              </div>
              {editing ? (
                <textarea
                  value={currentBody}
                  onChange={(e) => setCurrentBody(e.target.value)}
                  className="brutalist-input w-full font-mono text-xs p-3 focus:outline-none min-h-[200px]"
                  placeholder="write your cold email template body..."
                />
              ) : (
                <div className="border-[2px] border-brand-dark bg-brand-bg/5 p-4 font-mono text-xs text-brand-dark whitespace-pre-wrap leading-relaxed min-h-[200px]">
                  {currentBody || <span className="text-gray-400 italic">No copy drafted for this touch</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
