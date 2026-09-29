import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Calendar,
  Check,
  Clock3,
  DollarSign,
  Edit3,
  Home,
  KanbanSquare,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { supabase } from './lib/supabase'

type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost'

type LeadSource =
  | 'WhatsApp'
  | 'Instagram'
  | 'Referral'
  | 'Website'
  | 'Other'

type Lead = {
  id: string
  user_id: string
  name: string
  phone: string
  opportunity: string
  value: number
  status: LeadStatus
  follow_up: string
  notes: string
  source: LeadSource
  created_at: string
}

const statuses: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
]

const sources: LeadSource[] = [
  'WhatsApp',
  'Instagram',
  'Referral',
  'Website',
  'Other',
]

function getLocalDateString() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().split('T')[0]
}

function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')

  if (digits.startsWith('0')) {
    return `234${digits.slice(1)}`
  }

  if (digits.startsWith('234')) {
    return digits
  }

  return digits
}

function formatCurrency(value: number) {
  return `₦${Number(value || 0).toLocaleString('en-NG')}`
}

function formatDate(date: string) {
  if (!date) return '-'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isToday(date: string) {
  return date === getLocalDateString()
}

function isOverdue(date: string) {
  return date < getLocalDateString()
}

function getWhatsAppUrl(phone: string, name: string) {
  const normalized = normalizeWhatsAppPhone(phone)
  const message = encodeURIComponent(
    `Hi ${name}, just following up on our conversation. Let me know if you're still interested.`,
  )

  return `https://wa.me/${normalized}?text=${message}`
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    New: 'bg-slate-100 text-slate-700',
    Contacted: 'bg-blue-100 text-blue-700',
    Interested: 'bg-cyan-100 text-cyan-700',
    Proposal: 'bg-purple-100 text-purple-700',
    Negotiation: 'bg-amber-100 text-amber-700',
    Won: 'bg-emerald-100 text-emerald-700',
    Lost: 'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        {...props}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${props.className || ''}`}
      />
    </label>
  )
}

function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        {children}
      </select>
    </label>
  )
}

function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <textarea
        {...props}
        className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  )
}

function AddLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (lead: Lead) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [opportunity, setOpportunity] = useState('')
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<LeadStatus>('New')
  const [followUp, setFollowUp] = useState(getLocalDateString())
  const [source, setSource] = useState<LeadSource>('WhatsApp')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !phone.trim() || !opportunity.trim()) {
      setError('Name, phone and opportunity are required.')
      return
    }

    if (!followUp) {
      setError('Please choose a follow-up date.')
      return
    }

    const numericValue = Number(value || 0)

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setError('Value must be a valid non-negative number.')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Your session has expired. Please sign in again.')
      setSaving(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('leads')
      .insert({
        user_id: user.id,
        name: name.trim(),
        phone: phone.trim(),
        opportunity: opportunity.trim(),
        value: numericValue,
        status,
        follow_up: followUp,
        notes: notes.trim(),
        source,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    onCreated(data as Lead)
    onClose()
  }

  return (
    <Modal title="Add lead" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Name"
          placeholder="e.g. Sarah Johnson"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Phone"
          placeholder="e.g. 08012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          label="Opportunity"
          placeholder="e.g. Website design"
          value={opportunity}
          onChange={(e) => setOpportunity(e.target.value)}
        />

        <Input
          label="Expected value"
          type="number"
          min="0"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>

          <Select
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource)}
          >
            {sources.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </div>

        <Input
          label="Next follow-up"
          type="date"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
        />

        <Textarea
          label="Notes"
          placeholder="Add useful context about this lead..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Add lead'}
          {!saving && <Plus size={17} />}
        </button>
      </form>
    </Modal>
  )
}

function EditLeadModal({
  lead,
  onClose,
  onUpdated,
}: {
  lead: Lead
  onClose: () => void
  onUpdated: (lead: Lead) => void
}) {
  const [name, setName] = useState(lead.name)
  const [phone, setPhone] = useState(lead.phone)
  const [opportunity, setOpportunity] = useState(lead.opportunity)
  const [value, setValue] = useState(String(lead.value))
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [followUp, setFollowUp] = useState(lead.follow_up)
  const [source, setSource] = useState<LeadSource>(lead.source)
  const [notes, setNotes] = useState(lead.notes)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !phone.trim() || !opportunity.trim()) {
      setError('Name, phone and opportunity are required.')
      return
    }

    if (!followUp) {
      setError('Please choose a follow-up date.')
      return
    }

    const numericValue = Number(value || 0)

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setError('Value must be a valid non-negative number.')
      return
    }

    setSaving(true)

    const { data, error: updateError } = await supabase
      .from('leads')
      .update({
        name: name.trim(),
        phone: phone.trim(),
        opportunity: opportunity.trim(),
        value: numericValue,
        status,
        follow_up: followUp,
        notes: notes.trim(),
        source,
      })
      .eq('id', lead.id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    onUpdated(data as Lead)
    onClose()
  }

  return (
    <Modal title="Edit lead" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          label="Opportunity"
          value={opportunity}
          onChange={(e) => setOpportunity(e.target.value)}
        />

        <Input
          label="Expected value"
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>

          <Select
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource)}
          >
            {sources.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </div>

        <Input
          label="Next follow-up"
          type="date"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save changes'}
          {!saving && <Check size={17} />}
        </button>
      </form>
    </Modal>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  description: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
          <Icon size={18} />
        </div>
      </div>

      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  )
}

function LeadRow({
  lead,
  compact = false,
  onEdit,
  onDelete,
}: {
  lead: Lead
  compact?: boolean
  onEdit: (lead: Lead) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
        {lead.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {lead.name}
          </p>
          <StatusBadge status={lead.status} />
        </div>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {lead.opportunity}
        </p>

        {!compact && (
          <p className="mt-1 text-xs text-slate-400">
            Follow-up: {formatDate(lead.follow_up)}
          </p>
        )}
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-slate-900">
          {formatCurrency(lead.value)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <a
          href={getWhatsAppUrl(lead.phone, lead.name)}
          target="_blank"
          rel="noreferrer"
          title="WhatsApp"
          className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
        >
          <MessageCircle size={17} />
        </a>

        <button
          type="button"
          onClick={() => onEdit(lead)}
          title="Edit"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <Edit3 size={17} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(lead.id)}
          title="Delete"
          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  )
}

function Dashboard({
  leads,
  onAddLead,
  onEdit,
  onDelete,
}: {
  leads: Lead[]
  onAddLead: () => void
  onEdit: (lead: Lead) => void
  onDelete: (id: string) => void
}) {
  const today = leads.filter(
    (lead) => isToday(lead.follow_up) && lead.status !== 'Won' && lead.status !== 'Lost',
  )

  const overdue = leads.filter(
    (lead) =>
      isOverdue(lead.follow_up) &&
      lead.status !== 'Won' &&
      lead.status !== 'Lost',
  )

  const potentialValue = leads
    .filter((lead) => lead.status !== 'Won' && lead.status !== 'Lost')
    .reduce((sum, lead) => sum + Number(lead.value || 0), 0)

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const wonThisMonth = leads
    .filter((lead) => {
      if (lead.status !== 'Won') return false

      const created = new Date(lead.created_at)

      return (
        created.getMonth() === currentMonth &&
        created.getFullYear() === currentYear
      )
    })
    .reduce((sum, lead) => sum + Number(lead.value || 0), 0)

  const recent = [...leads]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay on top of the people who matter to your business.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddLead}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={17} />
          Add lead
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Follow up today"
          value={today.length}
          icon={Clock3}
          description="Leads waiting for attention"
        />

        <StatCard
          label="Overdue"
          value={overdue.length}
          icon={Calendar}
          description="Follow-ups you missed"
        />

        <StatCard
          label="Potential value"
          value={formatCurrency(potentialValue)}
          icon={DollarSign}
          description="Open opportunities"
        />

        <StatCard
          label="Won this month"
          value={formatCurrency(wonThisMonth)}
          icon={Check}
          description="Closed opportunities"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Follow up today
              </h2>
              <p className="text-xs text-slate-400">
                Don't let good leads go cold.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {today.length}
            </span>
          </div>

          <div className="space-y-2">
            {today.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                You're all caught up for today.
              </div>
            ) : (
              today.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  compact
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Overdue follow-ups
              </h2>
              <p className="text-xs text-slate-400">
                These leads need your attention.
              </p>
            </div>

            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              {overdue.length}
            </span>
          </div>

          <div className="space-y-2">
            {overdue.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No overdue follow-ups.
              </div>
            ) : (
              overdue.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  compact
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-900">Recent leads</h2>
          <p className="text-xs text-slate-400">
            Your latest opportunities.
          </p>
        </div>

        <div className="space-y-2">
          {recent.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <Users className="mx-auto mb-2 text-slate-300" size={30} />
              <p className="text-sm font-medium text-slate-700">
                No leads yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Add your first lead to get started.
              </p>
            </div>
          ) : (
            recent.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function LeadsPage({
  leads,
  onAddLead,
  onEdit,
  onDelete,
}: {
  leads: Lead[]
  onAddLead: () => void
  onEdit: (lead: Lead) => void
  onDelete: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        lead.name.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.opportunity.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' || lead.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [leads, search, statusFilter])

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all your opportunities in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddLead}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={17} />
          Add lead
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
        >
          <option value="All">All statuses</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Users className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="font-medium text-slate-700">No leads found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          filtered.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

function PipelinePage({
  leads,
  onEdit,
  onDelete,
}: {
  leads: Lead[]
  onEdit: (lead: Lead) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
        <p className="mt-1 text-sm text-slate-500">
          See where every opportunity stands.
        </p>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max gap-4">
          {statuses.map((status) => {
            const columnLeads = leads.filter((lead) => lead.status === status)

            return (
              <div
                key={status}
                className="w-[280px] rounded-2xl bg-slate-50 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {status}
                    </span>

                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                      {columnLeads.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {columnLeads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs text-slate-400">
                      No leads
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        compact
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FollowUpsPage({
  leads,
  onEdit,
  onDelete,
}: {
  leads: Lead[]
  onEdit: (lead: Lead) => void
  onDelete: (id: string) => void
}) {
  const activeLeads = leads.filter(
    (lead) => lead.status !== 'Won' && lead.status !== 'Lost',
  )

  const sorted = [...activeLeads].sort((a, b) =>
    a.follow_up.localeCompare(b.follow_up),
  )

  const overdue = sorted.filter((lead) => isOverdue(lead.follow_up))
  const upcoming = sorted.filter((lead) => !isOverdue(lead.follow_up))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
        <p className="mt-1 text-sm text-slate-500">
          Never lose a customer because you forgot to follow up.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-slate-900">Overdue</h2>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
            {overdue.length}
          </span>
        </div>

        <div className="space-y-2">
          {overdue.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No overdue follow-ups.
            </div>
          ) : (
            overdue.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-slate-900">Upcoming</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {upcoming.length}
          </span>
        </div>

        <div className="space-y-2">
          {upcoming.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No upcoming follow-ups.
            </div>
          ) : (
            upcoming.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function SettingsPage({ email }: { email: string }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your FollowUp workspace.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-3">
            <User size={20} className="text-slate-700" />
          </div>

          <div>
            <p className="font-semibold text-slate-900">Account</p>
            <p className="text-sm text-slate-500">{email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <DollarSign size={20} className="text-slate-600" />

          <div>
            <p className="font-semibold text-slate-900">Current plan</p>
            <p className="text-sm text-slate-500">
              Free plan. Pro is ₦2,500/month.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileNavigation({
  activePage,
  setActivePage,
}: {
  activePage: string
  setActivePage: (page: string) => void
}) {
  const items = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
    { id: 'follow-ups', label: 'Follow-ups', icon: Clock3 },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon
          const active = activePage === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition ${
                active
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function App() {
  const [user, setUser] = useState<{
    id: string
    email?: string
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showAuth, setShowAuth] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

useEffect(() => {
  if (!showAuth) return

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setShowAuth(false)
      setAuthError('')
      setAuthMessage('')
    }
  }

  window.addEventListener('keydown', handleEscape)

  return () => {
    window.removeEventListener('keydown', handleEscape)
  }
}, [showAuth])

  const [activePage, setActivePage] = useState('dashboard')
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [dataError, setDataError] = useState('')

  const [showAddLead, setShowAddLead] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  useEffect(() => {
    let mounted = true

    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (mounted) {
        setUser(user)
        setLoading(false)
      }
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadLeads()
    }
  }, [user])

  async function loadLeads() {
    setLeadsLoading(true)
    setDataError('')

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('follow_up', { ascending: true })

    if (error) {
      setDataError(error.message)
      setLeadsLoading(false)
      return
    }

    setLeads((data || []) as Lead[])
    setLeadsLoading(false)
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()

    setAuthError('')
    setAuthMessage('')
    setAuthLoading(true)

    if (!email.trim() || !password) {
      setAuthError('Email and password are required.')
      setAuthLoading(false)
      return
    }

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        setAuthError(error.message)
      } else {
        setAuthMessage(
          'Account created. Check your email if confirmation is required.',
        )
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setAuthError(error.message)
      }
    }

    setAuthLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setLeads([])
   setActivePage('dashboard')
  }

  async function deleteLead(id: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this lead? This cannot be undone.',
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      window.alert(error.message)
      return
    }

    setLeads((currentLeads) =>
      currentLeads.filter((lead) => lead.id !== id),
    )

    if (editingLead?.id === id) {
      setEditingLead(null)
    }
  }

  function handleLeadCreated(lead: Lead) {
    setLeads((current) =>
      [...current, lead].sort((a, b) =>
        a.follow_up.localeCompare(b.follow_up),
      ),
    )
  }

  function handleLeadUpdated(updated: Lead) {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === updated.id ? updated : lead,
      ),
    )
  }

  function navigate(page: string) {
    setActivePage(page)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="text-sm text-slate-500">Loading FollowUp...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950">
                <ArrowRight size={19} />
              </div>
              <span className="font-bold">FollowUp</span>
            </div>

            <button
  type="button"
  onClick={() => {
    setAuthError('')
    setAuthMessage('')
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
    setShowAuth(true)
  }}
  className="text-sm text-slate-300 hover:text-white"
>
              {authMode === 'signin' ? 'Create account' : 'Sign in'}
            </button>
          </header>

          <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Simple follow-up CRM
              </div>

              <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">
                Never lose a customer because you forgot to follow up.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400 sm:text-lg">
                Track leads, remember follow-ups and contact prospects through
                WhatsApp without the complexity of a traditional CRM.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setShowAuth(true) }}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
                >
                  Get started
                </button>

                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setShowAuth(true) }}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
                >
                  Sign in
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl">
              <div className="rounded-2xl bg-white p-4 text-slate-900">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Today's follow-ups</p>
                    <p className="text-xs text-slate-400">
                      Stay on top of your opportunities
                    </p>
                  </div>

                  <Clock3 size={20} className="text-slate-400" />
                </div>

                <div className="space-y-2">
                  {[
                    ['Sarah Johnson', 'Website design', '₦180,000'],
                    ['Amara Okafor', 'Social media management', '₦75,000'],
                    ['David Cole', 'Landing page', '₦120,000'],
                  ].map(([name, opportunity, value]) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold">
                        {name.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {name}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {opportunity}
                        </p>
                      </div>

                      <p className="text-xs font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pb-3 text-center text-xs text-slate-600">
            Simple. Focused. Built for people who sell.
          </div>
        </div>

        {showAuth && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    onClick={() => {
      setAuthError('')
      setAuthMessage('')
      setShowAuth(false)
    }}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            {authMode === 'signin'
              ? 'Welcome back'
              : 'Create your account'}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {authMode === 'signin'
              ? 'Sign in to your FollowUp workspace.'
              : 'Start managing your follow-ups today.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAuthError('')
            setAuthMessage('')
            setShowAuth(false)
          }}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {authError && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {authError}
          </div>
        )}

        {authMessage && (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {authMessage}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          autoComplete={
            authMode === 'signin'
              ? 'current-password'
              : 'new-password'
          }
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={authLoading}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {authLoading
            ? 'Please wait...'
            : authMode === 'signin'
              ? 'Sign in'
              : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setAuthError('')
          setAuthMessage('')
          setAuthMode(
            authMode === 'signin'
              ? 'signup'
              : 'signin',
          )
        }}
        className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-900"
      >
        {authMode === 'signin'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </div>
  </div>
)}
      </div>
    )
  }

  function renderPage() {
    if (activePage === 'leads') {
      return (
        <LeadsPage
          leads={leads}
          onAddLead={() => setShowAddLead(true)}
          onEdit={setEditingLead}
          onDelete={deleteLead}
        />
      )
    }

    if (activePage === 'pipeline') {
      return (
        <PipelinePage
          leads={leads}
          onEdit={setEditingLead}
          onDelete={deleteLead}
        />
      )
    }

    if (activePage === 'follow-ups') {
      return (
        <FollowUpsPage
          leads={leads}
          onEdit={setEditingLead}
          onDelete={deleteLead}
        />
      )
    }

    if (activePage === 'settings') {
      return <SettingsPage email={user?.email || ''} />
    }

    return (
      <Dashboard
        leads={leads}
        onAddLead={() => setShowAddLead(true)}
        onEdit={setEditingLead}
        onDelete={deleteLead}
      />
    )
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
    { id: 'follow-ups', label: 'Follow-ups', icon: Clock3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ArrowRight size={18} />
            </div>

            <span className="font-bold text-slate-900">FollowUp</span>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activePage === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <div className="mb-2 rounded-xl bg-slate-50 p-3">
              <p className="truncate text-xs font-medium text-slate-700">
                {user.email}
              </p>
              <p className="mt-1 text-xs text-slate-400">Free plan</p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white lg:hidden">
              <ArrowRight size={18} />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {activePage === 'dashboard'
                  ? 'Dashboard'
                  : activePage === 'follow-ups'
                    ? 'Follow-ups'
                    : activePage.charAt(0).toUpperCase() +
                      activePage.slice(1)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddLead(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">Add lead</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          {dataError && (
            <div className="mb-5 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{dataError}</span>

              <button
                type="button"
                onClick={loadLeads}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {leadsLoading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                <p className="text-sm text-slate-500">Loading leads...</p>
              </div>
            </div>
          ) : (
            renderPage()
          )}
        </main>
      </div>

      <MobileNavigation
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onCreated={handleLeadCreated}
        />
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onUpdated={handleLeadUpdated}
        />
      )}
    </div>
  )
}

export default App