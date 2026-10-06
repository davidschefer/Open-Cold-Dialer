import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useLeads";
import { useCreateLead, useDeleteLead, useImportLeads, useUpdateLead } from "@/hooks/useLeads";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LeadForm } from "@/components/leads/LeadForm";
import { CsvImport } from "@/components/leads/CsvImport";
import { Search, Plus, Filter, Mail, Phone, MoreHorizontal, Edit3, Upload } from "lucide-react";
import type { Database } from "@/types/database";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

type StatusFilter = string | "all";

export function LeadsPage() {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const importLeads = useImportLeads();

  const [showForm, setShowForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [feedback, setFeedback] = useState("");

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.toLowerCase().includes(q) ||
        (lead.company ?? "").toLowerCase().includes(q) ||
        (lead.phone ?? "").includes(q) ||
        (lead.email ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, searchQuery]);

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await deleteLead.mutateAsync(deleteConfirm.id);
      setFeedback("Lead deleted.");
      setDeleteConfirm(null);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Unable to delete lead.");
    }
  }

  async function handleStatusChange(leadId: string, newStatus: string) {
    try {
      await updateLead.mutateAsync({ id: leadId, status: newStatus as any });
      setFeedback("Lead status updated.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Unable to update lead status.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredLeads.length} of {leads?.length ?? 0} leads
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {feedback && <p className="text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">{feedback}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not Interested</option>
            <option value="callback">Callback</option>
            <option value="converted">Converted</option>
            <option value="do_not_contact">DNC</option>
          </select>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">
            {leads?.length === 0 ? "No leads yet" : "No leads match your filters"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Last Called</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:text-brand-600" onClick={() => navigate(`/leads/${lead.id}`)}>
                      {lead.first_name} {lead.last_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="not_interested">Not Interested</option>
                        <option value="callback">Callback</option>
                        <option value="converted">Converted</option>
                        <option value="do_not_contact">DNC</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {lead.last_called_at
                        ? new Date(lead.last_called_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          disabled={lead.dnc || lead.status === "do_not_contact"}
                          className="p-1.5 text-gray-400 hover:text-brand-600 disabled:text-gray-300 disabled:cursor-not-allowed rounded"
                          title={lead.dnc || lead.status === "do_not_contact" ? "Do Not Contact" : "Open dialer"}
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <a
                          href={`mailto:${lead.email}`}
                          className="p-1.5 text-gray-400 hover:text-brand-600 rounded"
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: lead.id, name: `${lead.first_name} ${lead.last_name}` })}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <LeadForm
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            try {
              await createLead.mutateAsync(data as any);
              setFeedback("Lead created.");
              setShowForm(false);
            } catch (err) {
              setFeedback(err instanceof Error ? err.message : "Unable to create lead.");
              throw err;
            }
          }}
        />
      )}

      {showCsvImport && (
        <CsvImport
          onClose={() => setShowCsvImport(false)}
          onImport={async (rows) => {
            const result = await importLeads.mutateAsync(rows);
            setFeedback(`Imported ${result.imported} of ${result.total} leads.`);
            return result;
          }}
        />
      )}

      {editingLead && (
        <LeadForm
          initialData={editingLead as any}
          onClose={() => setEditingLead(null)}
          onSubmit={async (data) => {
            try {
              await updateLead.mutateAsync({ id: editingLead.id, ...data } as any);
              setFeedback("Lead updated.");
              setEditingLead(null);
            } catch (err) {
              setFeedback(err instanceof Error ? err.message : "Unable to update lead.");
              throw err;
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Lead"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
