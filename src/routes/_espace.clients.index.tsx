import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, Plus, Upload } from "lucide-react";
import {
  Chip,
  EmptyState,
  Mono,
  PageHeader,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/app/bits";
import { Btn, Field, Modal, Textarea, inputClass, selectClass } from "@/components/app/dialogs";
import { TODAY, upsertClient, useDB } from "@/services/db";
import { useSession } from "@/services/auth";
import { downloadCSV } from "@/services/business";
import type { Client } from "@/types";

export const Route = createFileRoute("/_espace/clients/")({
  head: () => ({
    meta: [
      { title: "Clients — GLOBITRANS" },
      {
        name: "description",
        content: "Référentiel des clients GLOBITRANS, alias d'identification douanière et attribution des déclarants.",
      },
      { property: "og:title", content: "Clients — GLOBITRANS" },
      { property: "og:description", content: "Référentiel des clients et attribution des déclarants." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const db = useDB();
  const session = useSession();
  const [q, setQ] = useState("");
  const [declarantId, setDeclarantId] = useState("");
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.clients.filter((c) => {
      if (declarantId && c.declarantId !== declarantId) return false;
      if (!term) return true;
      return `${c.code} ${c.companyName} ${c.ice} ${c.aliases.join(" ")}`.toLowerCase().includes(term);
    });
  }, [db.clients, q, declarantId]);

  const monthCount = (id: string) =>
    db.mainLevees.filter((m) => m.clientId === id && m.releaseDate.slice(0, 7) === TODAY.slice(0, 7)).length;
  const pending = (id: string) =>
    db.mainLevees.filter((m) => m.clientId === id && !m.receivedByFinance).length;

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Référentiel des clients et attribution des déclarants."
        actions={
          <>
            {session?.role === "ADMIN" ? (
              <Btn onClick={() => setOpen(true)}>
                <Plus className="size-4" /> Nouveau client
              </Btn>
            ) : null}
            <Btn
              variant="outline"
              onClick={() => toast.info("Import simulé.", { description: "Le fichier de référentiel serait analysé ici." })}
            >
              <Upload className="size-4" /> Importer
            </Btn>
            <Btn
              variant="outline"
              onClick={() =>
                downloadCSV("globitrans-clients.csv", [
                  ["Code", "Raison sociale", "ICE", "Déclarant", "Statut"],
                  ...rows.map((c) => [
                    c.code,
                    c.companyName,
                    c.ice,
                    db.declarants.find((d) => d.id === c.declarantId)?.lastName ?? "",
                    c.active ? "Actif" : "Inactif",
                  ]),
                ])
              }
            >
              <Download className="size-4" /> Exporter
            </Btn>
          </>
        }
      />

      <div className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client, un ICE, un alias..."
            className={`${inputClass} w-[280px]`}
          />
          <select value={declarantId} onChange={(e) => setDeclarantId(e.target.value)} className={`${selectClass} w-[200px]`}>
            <option value="">Tous les déclarants</option>
            {db.declarants.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="Aucun client" description="Aucun client ne correspond à votre recherche." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Code client</Th>
                <Th>Raison sociale</Th>
                <Th>ICE</Th>
                <Th>Déclarant attitré</Th>
                <Th>Mains levées du mois</Th>
                <Th>En attente Finance</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Mono className="font-medium">{c.code}</Mono>
                  </Td>
                  <Td>
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: c.id }}
                      className="text-[13px] font-medium text-primary hover:underline"
                    >
                      {c.companyName}
                    </Link>
                    <p className="text-[11.5px] text-muted-foreground">{c.aliases.length} alias d'identification</p>
                  </Td>
                  <Td>
                    <Mono className="text-[12.5px]">{c.ice}</Mono>
                  </Td>
                  <Td className="text-[13px]">
                    {db.declarants.find((d) => d.id === c.declarantId)
                      ? `${db.declarants.find((d) => d.id === c.declarantId)!.firstName} ${db.declarants.find((d) => d.id === c.declarantId)!.lastName}`
                      : "Non affecté"}
                  </Td>
                  <Td className="mono">{monthCount(c.id)}</Td>
                  <Td className="mono">{pending(c.id)}</Td>
                  <Td>{c.active ? <Chip tone="success">Actif</Chip> : <Chip tone="neutral">Inactif</Chip>}</Td>
                  <Td className="text-right">
                    <Link to="/clients/$clientId" params={{ clientId: c.id }}>
                      <Btn variant="outline" size="sm">
                        Consulter
                      </Btn>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>

      <ClientModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ClientModal({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client;
}) {
  const db = useDB();
  const [code, setCode] = useState(client?.code ?? `CLI-${String(4057 + db.clients.length).padStart(4, "0")}`);
  const [companyName, setCompanyName] = useState(client?.companyName ?? "");
  const [ice, setIce] = useState(client?.ice ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "+212 5 22 XX XX XX");
  const [declarantId, setDeclarantId] = useState(client?.declarantId ?? db.declarants[0]?.id ?? "");
  const [aliases, setAliases] = useState((client?.aliases ?? []).join("\n"));
  const [active, setActive] = useState(client?.active ?? true);

  const submit = () => {
    if (!companyName.trim() || !code.trim()) {
      toast.error("Code client et raison sociale obligatoires.");
      return;
    }
    upsertClient({
      id: client?.id ?? code.trim(),
      code: code.trim(),
      companyName: companyName.trim(),
      ice: ice.trim(),
      email: email.trim(),
      phone: phone.trim(),
      declarantId,
      aliases: aliases
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean),
      active,
      createdAt: client?.createdAt ?? "",
      updatedAt: "",
    });
    toast.success(client ? "Client mis à jour." : "Client créé.", { description: companyName });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? "Modifier le client" : "Nouveau client"}
      description="Les alias servent au rapprochement automatique des raisons sociales extraites des documents douaniers."
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn onClick={submit}>{client ? "Enregistrer" : "Créer le client"}</Btn>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Code client">
            <input value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} />
          </Field>
          <Field label="ICE">
            <input value={ice} onChange={(e) => setIce(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Raison sociale">
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Téléphone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Déclarant attitré">
          <select value={declarantId} onChange={(e) => setDeclarantId(e.target.value)} className={selectClass}>
            {db.declarants.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Alias d'identification" hint="Un alias par ligne.">
          <Textarea value={aliases} onChange={(e) => setAliases(e.target.value)} rows={4} />
        </Field>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 accent-[var(--corporate)]"
          />
          Client actif
        </label>
      </div>
    </Modal>
  );
}
