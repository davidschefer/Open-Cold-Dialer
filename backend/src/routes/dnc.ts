import { Router } from "express";
import { v4 as uuid } from "uuid";
import db from "../db/database.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { normalizePhone } from "../utils/phone.js";

const router = Router();
router.use(authMiddleware);

router.get("/check", (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!phone) {
    res.status(400).json({ error: "A valid phone number is required" });
    return;
  }

  const entry = findByNormalizedPhone(phone);
  res.json({ phone, dnc: Boolean(entry), entry: entry ? mapDnc(entry) : null });
});

router.post("/", (req: AuthRequest, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) {
    res.status(400).json({ error: "A valid phone number is required" });
    return;
  }

  const existing = findByNormalizedPhone(phone);
  const reason = typeof req.body.reason === "string" ? req.body.reason : null;
  const source = typeof req.body.source === "string" ? req.body.source : null;
  let id = existing?.id ?? "";

  db.transaction(() => {
    if (existing) {
      id = existing.id;
      db.prepare("UPDATE dnc_list SET phone = ?, reason = ?, source = ? WHERE id = ?")
        .run(phone, reason, source, id);
    } else {
      id = uuid();
      db.prepare(
        "INSERT INTO dnc_list (id, phone, reason, source, created_by) VALUES (?, ?, ?, ?, ?)"
      ).run(id, phone, reason, source, req.userId ?? null);
    }

    const matchingLeads = (db.prepare("SELECT id, phone FROM leads").all() as Array<{ id: string; phone: string | null }>)
      .filter((lead) => normalizePhone(lead.phone) === phone);
    const markDnc = db.prepare(
      "UPDATE leads SET dnc = 1, status = 'do_not_contact', updated_at = ? WHERE id = ?"
    );
    const updatedAt = new Date().toISOString();
    for (const lead of matchingLeads) markDnc.run(updatedAt, lead.id);
  })();

  const entry = db.prepare("SELECT * FROM dnc_list WHERE id = ?").get(id) as DncRow;
  res.status(existing ? 200 : 201).json(mapDnc(entry));
});

router.delete("/:phone", (req, res) => {
  const phone = normalizePhone(req.params.phone);
  if (!phone) {
    res.status(400).json({ error: "A valid phone number is required" });
    return;
  }

  const entry = findByNormalizedPhone(phone);
  if (!entry) {
    res.status(404).json({ error: "DNC entry not found" });
    return;
  }

  db.transaction((dncEntry: DncRow, normalizedPhone: string) => {
    const matchingLeads = (db.prepare("SELECT id, phone FROM leads").all() as Array<{ id: string; phone: string | null }>)
      .filter((lead) => normalizePhone(lead.phone) === normalizedPhone);
    const updatedAt = new Date().toISOString();
    const clearDncForLead = db.prepare(
      "UPDATE leads SET dnc = 0, status = CASE WHEN status = 'do_not_contact' THEN 'new' ELSE status END, updated_at = ? WHERE id = ?"
    );

    db.prepare("DELETE FROM dnc_list WHERE id = ?").run(dncEntry.id);
    for (const lead of matchingLeads) {
      clearDncForLead.run(updatedAt, lead.id);
    }
  })(entry, phone);
  res.status(204).end();
});

interface DncRow {
  id: string;
  phone: string;
  reason: string | null;
  source: string | null;
  created_by: string | null;
  created_at: string;
}

function findByNormalizedPhone(phone: string): DncRow | undefined {
  const rows = db.prepare("SELECT * FROM dnc_list").all() as DncRow[];
  return rows.find((row) => normalizePhone(row.phone) === phone);
}

function mapDnc(row: DncRow) {
  return {
    id: row.id,
    phone: normalizePhone(row.phone) ?? row.phone,
    reason: row.reason,
    source: row.source,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

export default router;
