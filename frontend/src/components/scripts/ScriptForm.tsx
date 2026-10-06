import React, { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { CallScript, ScriptInput } from "@/hooks/useScripts";

interface ObjectionRow {
  objection: string;
  response: string;
  category: string;
}

interface ScriptFormProps {
  initialData?: CallScript;
  onClose: () => void;
  onSubmit: (data: ScriptInput) => Promise<void>;
}

function toRows(value: CallScript["objection_responses"]): ObjectionRow[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).map(([objection, item]) => {
    const data = item as { response?: unknown; category?: unknown };
    return {
      objection,
      response: typeof data.response === "string" ? data.response : "",
      category: typeof data.category === "string" ? data.category : "",
    };
  });
}

export function ScriptForm({ initialData, onClose, onSubmit }: ScriptFormProps) {
  const { data: campaigns = [] } = useCampaigns();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [campaignId, setCampaignId] = useState(initialData?.campaign_id ?? "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [rows, setRows] = useState<ObjectionRow[]>(toRows(initialData?.objection_responses ?? null));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("A script title is required.");
      return;
    }

    const objections: Record<string, { response: string; category: string }> = {};
    for (const row of rows) {
      if (!row.objection.trim()) continue;
      if (!row.response.trim()) {
        setError("Every objection must have a response.");
        return;
      }
      objections[row.objection.trim()] = {
        response: row.response.trim(),
        category: row.category.trim() || "general",
      };
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        category: category.trim(),
        content: content.trim(),
        campaign_id: campaignId || null,
        is_active: isActive,
        objection_responses: Object.keys(objections).length ? objections : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save script.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{initialData ? "Editar Script" : "Novo Script"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Script title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white">
              <option value="">No campaign</option>
              {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
            </select>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Call script" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none" />
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-700">Objections and responses</h3><button type="button" onClick={() => setRows((prev) => [...prev, { objection: "", response: "", category: "" }])} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button></div>
            {rows.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input value={row.objection} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, objection: e.target.value } : item))} placeholder="Objection" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input value={row.response} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, response: e.target.value } : item))} placeholder="Response" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <button type="button" onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button><button disabled={saving} type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-lg">{saving ? "Salvando..." : "Salvar Script"}</button></div>
        </form>
      </div>
    </div>
  );
}
