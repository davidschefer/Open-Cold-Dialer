import React, { useState } from "react";
import { X, BookOpen, AlertTriangle } from "lucide-react";
import type { CallScript } from "@/hooks/useScripts";

interface CallScriptViewerProps {
  script: CallScript;
  onClose: () => void;
}

export function CallScriptViewer({ script, onClose }: CallScriptViewerProps) {
  const [activeObjection, setActiveObjection] = useState<string | null>(null);
  const objections = Object.entries(script.objection_responses ?? {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-brand-600" /><h2 className="text-lg font-semibold text-gray-900">{script.title}</h2></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800">{script.category ?? "General"}</span>
          <div className="bg-gray-50 rounded-lg p-4"><p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{script.content || "No script content."}</p></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Common Objections & Responses</h3>
            {objections.length === 0 ? <p className="text-sm text-gray-500">No objections configured.</p> : <div className="space-y-2">
              {objections.map(([objection, value]) => {
                const data = value as { response?: string; category?: string };
                return <div key={objection}>
                  <button onClick={() => setActiveObjection(activeObjection === objection ? null : objection)} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition text-sm"><span className="font-medium text-gray-900">&quot;{objection}&quot;</span>{data.category && <span className="text-xs text-gray-400 ml-2">{data.category}</span>}</button>
                  {activeObjection === objection && <div className="mt-2 p-3 bg-brand-50 rounded-lg border border-brand-200 text-sm text-brand-900">{data.response}</div>}
                </div>;
              })}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
