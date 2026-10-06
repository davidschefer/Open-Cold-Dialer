import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { formatBrazilianPhone, formatPhoneForStorage, splitPhoneForInput } from "@/lib/phone";

interface LeadFormData {
  first_name: string;
  last_name: string;
  company: string;
  phone_country: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  source: string;
  status: string;
  campaign_id: string;
}

interface LeadFormProps {
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  initialData?: Partial<LeadFormData>;
}

export function LeadForm({ onClose, onSubmit, initialData }: LeadFormProps) {
  const { data: campaigns = [] } = useCampaigns();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    company: initialData?.company ?? "",
    phone_country: splitPhoneForInput(initialData?.phone).country,
    phone: splitPhoneForInput(initialData?.phone).number,
    email: initialData?.email ?? "",
    website: initialData?.website ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    zip: initialData?.zip ?? "",
    source: initialData?.source ?? "",
    status: initialData?.status ?? "new",
    campaign_id: initialData?.campaign_id ?? "",
  });

  useEffect(() => {
    const phone = splitPhoneForInput(initialData?.phone);
    setFormData((prev) => ({ ...prev, phone_country: phone.country, phone: phone.number }));
  }, [initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cleaned: LeadFormData = { ...formData };
    if (!cleaned.campaign_id) cleaned.campaign_id = null as any;
    const fullPhone = formatPhoneForStorage(cleaned.phone_country, cleaned.phone);
    setSaving(true);
    try {
      await onSubmit({ ...cleaned, phone: fullPhone, phone_country: undefined as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData?.first_name ? "Editar Lead" : "Novo Lead"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, first_name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, last_name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campanha</label>
            <select
              value={formData.campaign_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, campaign_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
            >
              <option value="">Sem campanha</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, company: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <div className="flex">
                <select
                  value={formData.phone_country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone_country: e.target.value }))}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-l-lg text-sm bg-gray-50 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                >
                  <option value="+55">+55 (Brasil)</option>
                  <option value="+1">+1 (EUA)</option>
                </select>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  onBlur={() => setFormData((prev) => prev.phone_country === "+55" ? { ...prev, phone: formatBrazilianPhone(prev.phone) } : prev)}
                  placeholder="(51) 99999-9999"
                  className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, state: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, zip: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, source: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="ex.: site, indicação"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              {formData.status === "do_not_contact" ? (
                <p className="px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">Não contatar — use a ação DNC para remover o bloqueio.</p>
              ) : <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              >
                <option value="new">Novo</option>
                <option value="contacted">Contatado</option>
                <option value="interested">Interessado</option>
                <option value="not_interested">Não interessado</option>
                <option value="callback">Retornar ligação</option>
                <option value="converted">Convertido</option>
              </select>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition"
            >
              {saving ? "Salvando..." : "Salvar Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
