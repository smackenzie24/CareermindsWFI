import { useState } from 'react';
import { Download, Mail, Check, X } from 'lucide-react';

interface Props {
  title: string;
  buildContent: () => string;
}

function EmailModal({ title, buildContent, onClose }: { title: string; buildContent: () => string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function send() {
    if (!email.trim()) return;
    const subject = encodeURIComponent(`Progression: ${title}`);
    const body = encodeURIComponent(buildContent());
    window.open(`mailto:${email.trim()}?subject=${subject}&body=${body}`);
    setSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
              <Mail size={13} className="text-gray-500" />
            </div>
            <span className="text-sm font-bold text-gray-900">Email this report</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Check size={20} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Your email client has opened</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The report is pre-filled in a new email to{' '}
                <span className="font-medium text-gray-600">{email}</span>. Review and send from your email client.
              </p>
              <button
                onClick={onClose}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Report</p>
                <p className="text-xs font-medium text-gray-700 leading-snug">{title}</p>
              </div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="you@company.com"
                autoFocus
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
              />
              <p className="text-[10px] text-gray-400 mt-2">
                This opens your email client with the report pre-filled. Nothing is sent through Progression servers.
              </p>
              <button
                onClick={send}
                disabled={!email.trim()}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-all"
              >
                <Mail size={13} />
                Open email client
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExportButtons({ title, buildContent }: Props) {
  const [downloaded, setDownloaded] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  function handleDownload() {
    const text = buildContent();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const filename = `progression-${slug}.txt`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleDownload}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
            downloaded
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          {downloaded ? <Check size={12} /> : <Download size={12} />}
          {downloaded ? 'Downloaded' : 'Download'}
        </button>
        <button
          onClick={() => setEmailOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
        >
          <Mail size={12} />
          Email me
        </button>
      </div>

      {emailOpen && (
        <EmailModal
          title={title}
          buildContent={buildContent}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </>
  );
}
