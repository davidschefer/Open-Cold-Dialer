import React, { useMemo, useState } from "react";
import { BookOpen, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CallScriptViewer } from "@/components/scripts/CallScriptViewer";
import { ScriptForm } from "@/components/scripts/ScriptForm";
import { type CallScript, useCreateScript, useDeleteScript, useScripts, useUpdateScript } from "@/hooks/useScripts";

export function ScriptsPage() {
  const { data: scripts = [], isLoading } = useScripts();
  const createScript = useCreateScript();
  const updateScript = useUpdateScript();
  const deleteScript = useDeleteScript();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null);
  const [editingScript, setEditingScript] = useState<CallScript | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CallScript | null>(null);
  const [feedback, setFeedback] = useState("");

  const filtered = useMemo(() => scripts.filter((script) => {
    const query = searchQuery.toLowerCase();
    return !query || script.title.toLowerCase().includes(query) || (script.category ?? "").toLowerCase().includes(query);
  }), [scripts, searchQuery]);

  async function removeScript() {
    if (!deleteConfirm) return;
    try {
      await deleteScript.mutateAsync(deleteConfirm.id);
      setFeedback("Script deleted.");
      setDeleteConfirm(null);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Unable to delete script.");
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Scripts</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition"><Plus className="w-4 h-4" />Novo Script</button>
      </div>
      {feedback && <p className="text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">{feedback}</p>}
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search scripts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" /></div>
      {filtered.length === 0 ? <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No scripts found</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((script) => <div key={script.id} className="text-left bg-white rounded-xl p-5 border border-gray-200 hover:border-brand-300 hover:shadow-md transition">
          <button onClick={() => setSelectedScript(script)} className="text-left w-full"><div className="flex items-center gap-2 mb-2"><BookOpen className="w-5 h-5 text-brand-600" /><h3 className="font-semibold text-gray-900">{script.title}</h3></div><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800">{script.category ?? "General"}</span>{script.is_active && <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Active</span>}</button>
          <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100"><button onClick={() => setEditingScript(script)} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"><Edit3 className="w-3.5 h-3.5" />Edit</button><button onClick={() => setDeleteConfirm(script)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"><Trash2 className="w-3.5 h-3.5" />Delete</button></div>
        </div>)}
      </div>}
      {selectedScript && <CallScriptViewer script={selectedScript} onClose={() => setSelectedScript(null)} />}
      {showForm && <ScriptForm onClose={() => setShowForm(false)} onSubmit={async (data) => { await createScript.mutateAsync(data); setFeedback("Script created."); setShowForm(false); }} />}
      {editingScript && <ScriptForm initialData={editingScript} onClose={() => setEditingScript(null)} onSubmit={async (data) => { await updateScript.mutateAsync({ id: editingScript.id, ...data }); setFeedback("Script updated."); setEditingScript(null); }} />}
      <ConfirmDialog open={!!deleteConfirm} title="Delete Script" message="Delete this script? This action cannot be undone." variant="danger" confirmLabel="Delete" onConfirm={removeScript} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}
