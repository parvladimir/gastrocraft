"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Clipboard,
  Download,
  ExternalLink,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings,
  Trash2,
  Upload
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  contactTypes,
  demoOptions,
  initialPackageTemplates,
  offerStatuses,
  restaurantCategories,
  restaurantStatuses,
  salesUsers,
  statusClassNames
} from "@/data/sales-config";
import type {
  ContactActionType,
  ContactHistoryEntry,
  ContactType,
  DemoId,
  Offer,
  Restaurant,
  RestaurantCategory,
  RestaurantStatus,
  SalesData,
  SalesUser,
  SalesUserId,
  ServicePackageTemplate
} from "@/lib/sales-types";

type ViewMode =
  | "dashboard"
  | "restaurants"
  | "form"
  | "detail"
  | "visit"
  | "finish"
  | "tour"
  | "tasks"
  | "more"
  | "import";

type RestaurantDraft = Omit<
  Restaurant,
  "archived" | "created_at" | "created_by" | "id" | "updated_at" | "updated_by"
>;

type VisitResult =
  | "Kein Interesse"
  | "Später erneut kontaktieren"
  | "Interesse vorhanden"
  | "Demo per WhatsApp senden"
  | "Angebot erstellen"
  | "Neuer Termin vereinbart";

const storageKey = "dinevio-sales-manager-data";
const sessionKey = "dinevio-sales-manager-session";
const draftKey = "dinevio-sales-manager-restaurant-draft";

const defaultData: SalesData = {
  contact_history: [],
  offers: [],
  package_templates: initialPackageTemplates,
  restaurants: [],
  tour_stops: [],
  tours: [],
  users: salesUsers
};

const emptyDraft: RestaurantDraft = {
  category: "",
  city: "",
  contact_person: "",
  contact_position: "",
  email: "",
  instagram: "",
  interest_level: null,
  name: "",
  next_contact_at: "",
  next_contact_type: "",
  notes: "",
  phone: "",
  planned_visit_at: "",
  postal_code: "",
  responsible_user_id: "andrii",
  selected_demo: "none",
  status: "Neu",
  street: "",
  website: ""
};

const visitResults: VisitResult[] = [
  "Kein Interesse",
  "Später erneut kontaktieren",
  "Interesse vorhanden",
  "Demo per WhatsApp senden",
  "Angebot erstellen",
  "Neuer Termin vereinbart"
];

const resultStatusMap: Record<VisitResult, RestaurantStatus> = {
  "Angebot erstellen": "Interessiert",
  "Demo per WhatsApp senden": "Demo gesendet",
  "Interesse vorhanden": "Interessiert",
  "Kein Interesse": "Abgelehnt",
  "Neuer Termin vereinbart": "Besuch geplant",
  "Später erneut kontaktieren": "Rückruf"
};

const contactPersonTypes = [
  "Inhaber",
  "Geschäftsführer",
  "Mitarbeiter",
  "Niemand erreicht",
  "Sonstige Person"
];

const summaryStats: Array<{
  label: string;
  predicate: (restaurant: Restaurant) => boolean;
}> = [
  { label: "Alle Restaurants", predicate: () => true },
  { label: "Heute geplant", predicate: (restaurant) => isSameDay(restaurant.planned_visit_at) },
  { label: "Besucht", predicate: (restaurant) => restaurant.status === "Besucht" },
  { label: "Interessiert", predicate: (restaurant) => restaurant.status === "Interessiert" },
  { label: "Rückruf notwendig", predicate: (restaurant) => restaurant.status === "Rückruf" },
  { label: "Angebot gesendet", predicate: (restaurant) => restaurant.status === "Angebot gesendet" },
  { label: "Kunde gewonnen", predicate: (restaurant) => restaurant.status === "Kunde gewonnen" },
  { label: "Abgelehnt", predicate: (restaurant) => restaurant.status === "Abgelehnt" }
];

export function SalesManager() {
  const [data, setData] = useState<SalesData>(() => {
    if (typeof window === "undefined") {
      return defaultData;
    }

    const storedData = window.localStorage.getItem(storageKey);
    return storedData
      ? mergeSalesData(JSON.parse(storedData) as Partial<SalesData>)
      : defaultData;
  });
  const [currentUserId, setCurrentUserId] = useState<SalesUserId | null>(null);
  const [view, setView] = useState<ViewMode>("dashboard");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [editingRestaurantId, setEditingRestaurantId] = useState("");
  const [toast, setToast] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RestaurantStatus | "Alle">("Alle");
  const [sortBy, setSortBy] = useState<"created" | "city" | "name" | "next">("next");
  const [showDemoChooser, setShowDemoChooser] = useState(false);
  const [whatsappRestaurantId, setWhatsappRestaurantId] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState<"afterVisit" | "reminder">("afterVisit");
  const [whatsappText, setWhatsappText] = useState("");
  const [pendingWhatsappId, setPendingWhatsappId] = useState("");
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<RestaurantDraft[]>([]);

  const currentUser = data.users.find((user) => user.id === currentUserId) ?? null;
  const restaurants = data.restaurants.filter((restaurant) => !restaurant.archived);
  const selectedRestaurant =
    restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function login(email: string, password: string) {
    const user = data.users.find(
      (candidate) =>
        candidate.email.toLowerCase() === email.trim().toLowerCase() &&
        candidate.password === password
    );

    if (!user) {
      return false;
    }

    window.localStorage.setItem(sessionKey, user.id);
    setCurrentUserId(user.id);
    setView("dashboard");
    return true;
  }

  function logout() {
    window.localStorage.removeItem(sessionKey);
    setCurrentUserId(null);
    setSelectedRestaurantId("");
    setView("dashboard");
  }

  function updateData(updater: (currentData: SalesData) => SalesData) {
    setData((currentData) => updater(currentData));
  }

  function saveRestaurant(draft: RestaurantDraft, editingId = "") {
    if (!currentUser) {
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      updateData((currentData) => {
        const currentRestaurant = currentData.restaurants.find(
          (restaurant) => restaurant.id === editingId
        );
        const updatedRestaurants = currentData.restaurants.map((restaurant) =>
          restaurant.id === editingId
            ? {
                ...restaurant,
                ...draft,
                updated_at: now,
                updated_by: currentUser.id
              }
            : restaurant
        );
        const history =
          currentRestaurant && currentRestaurant.status !== draft.status
            ? [
                ...currentData.contact_history,
                createHistoryEntry({
                  action_type: "Status geändert",
                  next_contact_at: draft.next_contact_at,
                  new_status: draft.status,
                  note: "Restaurant aktualisiert.",
                  old_status: currentRestaurant.status,
                  restaurant_id: editingId,
                  user_id: currentUser.id
                })
              ]
            : currentData.contact_history;

        return {
          ...currentData,
          contact_history: history,
          restaurants: updatedRestaurants
        };
      });
      setToast("Gespeichert");
      setSelectedRestaurantId(editingId);
      setView("detail");
      return;
    }

    const restaurant: Restaurant = {
      ...draft,
      archived: false,
      created_at: now,
      created_by: currentUser.id,
      id: createId(),
      updated_at: now,
      updated_by: currentUser.id
    };

    updateData((currentData) => ({
      ...currentData,
      contact_history: [
        ...currentData.contact_history,
        createHistoryEntry({
          action_type: "Restaurant erstellt",
          new_status: restaurant.status,
          note: "Restaurant wurde angelegt.",
          restaurant_id: restaurant.id,
          user_id: currentUser.id
        })
      ],
      restaurants: [...currentData.restaurants, restaurant]
    }));
    window.localStorage.removeItem(draftKey);
    setToast("Restaurant gespeichert");
    setSelectedRestaurantId(restaurant.id);
    setView("detail");
  }

  function archiveRestaurant(restaurantId: string) {
    if (!currentUser || !window.confirm("Restaurant wirklich archivieren?")) {
      return;
    }

    updateData((currentData) => ({
      ...currentData,
      contact_history: [
        ...currentData.contact_history,
        createHistoryEntry({
          action_type: "Restaurant archiviert",
          note: "Restaurant wurde archiviert.",
          restaurant_id: restaurantId,
          user_id: currentUser.id
        })
      ],
      restaurants: currentData.restaurants.map((restaurant) =>
        restaurant.id === restaurantId
          ? {
              ...restaurant,
              archived: true,
              updated_at: new Date().toISOString(),
              updated_by: currentUser.id
            }
          : restaurant
      )
    }));
    setToast("Archiviert");
    setView("restaurants");
  }

  function patchRestaurant(
    restaurantId: string,
    patch: Partial<Restaurant>,
    history?: {
      action_type: ContactActionType;
      note: string;
    }
  ) {
    if (!currentUser) {
      return;
    }

    updateData((currentData) => {
      const oldRestaurant = currentData.restaurants.find(
        (restaurant) => restaurant.id === restaurantId
      );
      const nextRestaurants = currentData.restaurants.map((restaurant) =>
        restaurant.id === restaurantId
          ? {
              ...restaurant,
              ...patch,
              updated_at: new Date().toISOString(),
              updated_by: currentUser.id
            }
          : restaurant
      );

      return {
        ...currentData,
        contact_history:
          history && oldRestaurant
            ? [
                ...currentData.contact_history,
                createHistoryEntry({
                  action_type: history.action_type,
                  next_contact_at: patch.next_contact_at ?? oldRestaurant.next_contact_at,
                  new_status: patch.status ?? oldRestaurant.status,
                  note: history.note,
                  old_status: oldRestaurant.status,
                  restaurant_id: restaurantId,
                  user_id: currentUser.id
                })
              ]
            : currentData.contact_history,
        restaurants: nextRestaurants
      };
    });
  }

  function finishVisit(payload: {
    contactAt: string;
    contactPersonType: string;
    interestLevel: number;
    nextContactAt: string;
    nextContactType: ContactType | "";
    note: string;
    result: VisitResult;
  }) {
    if (!selectedRestaurant || !currentUser) {
      return;
    }

    const nextStatus = resultStatusMap[payload.result];
    patchRestaurant(
      selectedRestaurant.id,
      {
        interest_level: payload.interestLevel,
        next_contact_at: payload.nextContactAt,
        next_contact_type: payload.nextContactType,
        status: nextStatus
      },
      {
        action_type: "Besuch durchgeführt",
        note: [
          `Gespräch geführt mit: ${payload.contactPersonType}.`,
          `Ergebnis: ${payload.result}.`,
          payload.note
        ]
          .filter(Boolean)
          .join("\n")
      }
    );
    setToast("Besuch gespeichert");
    setView("detail");
  }

  function createWhatsappMessage(restaurant: Restaurant, template: "afterVisit" | "reminder") {
    const demoLink = getDemoUrl(restaurant.selected_demo);
    const recipient = restaurant.contact_person || "Name";
    const sender = currentUser?.name ?? "DINEVIO";

    if (template === "reminder") {
      return `Hallo ${recipient},

ich wollte mich kurz bezüglich unseres Gesprächs und der gezeigten Webseite melden.

Hatten Sie bereits Gelegenheit, sich die Demo noch einmal anzusehen?

Hier ist der Link:
${demoLink || "[Demo-Link]"}

Viele Grüße
${sender}
DINEVIO`;
    }

    return `Hallo ${recipient},

vielen Dank für das freundliche Gespräch.

Wie besprochen, finden Sie hier eine Live-Demo, wie ein moderner Internetauftritt für Ihr Restaurant aussehen könnte:

${demoLink || "[Demo-Link]"}

Weitere Informationen finden Sie unter:
https://www.dinevio.de

Bei Fragen können Sie sich gerne direkt bei uns melden.

Viele Grüße
${sender}
DINEVIO`;
  }

  function openWhatsappMessage(restaurant: Restaurant) {
    const phone = normalizePhone(restaurant.phone);
    const href = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(href, "_blank", "noopener,noreferrer");
    setPendingWhatsappId(restaurant.id);
  }

  function confirmWhatsappSent(sent: boolean) {
    if (sent && currentUser && pendingWhatsappId) {
      const restaurant = restaurants.find((candidate) => candidate.id === pendingWhatsappId);

      if (restaurant) {
        patchRestaurant(
          restaurant.id,
          {
            status: "Demo gesendet"
          },
          {
            action_type: "WhatsApp gesendet",
            note: "WhatsApp-Nachricht wurde als gesendet bestätigt."
          }
        );
      }
    }

    setPendingWhatsappId("");
    setWhatsappRestaurantId("");
    setWhatsappText("");
    setToast(sent ? "Versand gespeichert" : "Nicht gespeichert");
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setToast("Kopiert");
  }

  function exportCsv() {
    const rows = [
      [
        "Restaurant",
        "Adresse",
        "Ort",
        "Telefon",
        "Ansprechpartner",
        "Status",
        "Interesse",
        "Letzter Kontakt",
        "Nächster Kontakt",
        "Verantwortlich",
        "Demo",
        "Notizen"
      ],
      ...restaurants.map((restaurant) => [
        restaurant.name,
        formatAddress(restaurant),
        restaurant.city,
        restaurant.phone,
        restaurant.contact_person,
        restaurant.status,
        restaurant.interest_level?.toString() ?? "",
        getLastContact(data.contact_history, restaurant.id),
        formatDateTime(restaurant.next_contact_at),
        getUserName(data.users, restaurant.responsible_user_id),
        demoOptions[restaurant.selected_demo].label,
        restaurant.notes
      ])
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dinevio-restaurants.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function createImportPreview() {
    const rows = importText
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
    const [, ...bodyRows] = rows;
    const preview = bodyRows.map((row) => ({
      ...emptyDraft,
      city: row[2] ?? "",
      contact_person: row[4] ?? "",
      name: row[0] ?? "",
      notes: row[11] ?? "",
      phone: row[3] ?? "",
      responsible_user_id: currentUser?.id ?? "andrii",
      status: (restaurantStatuses.includes(row[5] as RestaurantStatus)
        ? row[5]
        : "Neu") as RestaurantStatus,
      street: row[1] ?? ""
    }));

    setImportPreview(preview);
  }

  function saveImportPreview() {
    importPreview.forEach((draft) => saveRestaurant(draft));
    setImportText("");
    setImportPreview([]);
    setView("restaurants");
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-midnight pb-24 text-warm-white">
      <SalesTopBar currentUser={currentUser} onLogout={logout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {view === "dashboard" ? (
          <DashboardView
            data={data}
            restaurants={restaurants}
            onAdd={() => {
              setEditingRestaurantId("");
              setView("form");
            }}
            onOpenRestaurant={(id) => {
              setSelectedRestaurantId(id);
              setView("detail");
            }}
          />
        ) : null}

        {view === "restaurants" ? (
          <RestaurantsView
            data={data}
            restaurants={restaurants}
            searchTerm={searchTerm}
            sortBy={sortBy}
            statusFilter={statusFilter}
            onAdd={() => {
              setEditingRestaurantId("");
              setView("form");
            }}
            onExport={exportCsv}
            onImport={() => setView("import")}
            onOpenRestaurant={(id) => {
              setSelectedRestaurantId(id);
              setView("detail");
            }}
            onSearch={setSearchTerm}
            onSort={setSortBy}
            onStatusFilter={setStatusFilter}
          />
        ) : null}

        {view === "form" ? (
          <RestaurantForm
            currentUser={currentUser}
            initialDraft={
              editingRestaurantId
                ? restaurantToDraft(
                    restaurants.find((restaurant) => restaurant.id === editingRestaurantId)
                  )
                : null
            }
            isEditing={Boolean(editingRestaurantId)}
            users={data.users}
            onCancel={() => {
              setView(editingRestaurantId ? "detail" : "restaurants");
              setEditingRestaurantId("");
            }}
            onSave={(draft) => saveRestaurant(draft, editingRestaurantId)}
          />
        ) : null}

        {view === "detail" && selectedRestaurant ? (
          <RestaurantDetailView
            currentUser={currentUser}
            data={data}
            restaurant={selectedRestaurant}
            showDemoChooser={showDemoChooser}
            onArchive={() => archiveRestaurant(selectedRestaurant.id)}
            onBack={() => setView("restaurants")}
            onCopy={copyText}
            onEdit={() => {
              setEditingRestaurantId(selectedRestaurant.id);
              setView("form");
            }}
            onOpenWhatsapp={(template) => {
              setWhatsappRestaurantId(selectedRestaurant.id);
              setWhatsappTemplate(template);
              setWhatsappText(createWhatsappMessage(selectedRestaurant, template));
            }}
            onPatch={patchRestaurant}
            onShowDemoChooser={setShowDemoChooser}
            onStartVisit={() => setView("visit")}
            onUpdateData={updateData}
          />
        ) : null}

        {view === "visit" && selectedRestaurant ? (
          <VisitModeView
            restaurant={selectedRestaurant}
            onBack={() => setView("detail")}
            onFinish={() => setView("finish")}
          />
        ) : null}

        {view === "finish" && selectedRestaurant ? (
          <FinishVisitView
            restaurant={selectedRestaurant}
            onCancel={() => setView("visit")}
            onSave={finishVisit}
          />
        ) : null}

        {view === "tour" ? (
          <TourView
            currentUser={currentUser}
            data={data}
            restaurants={restaurants}
            onOpenRestaurant={(id) => {
              setSelectedRestaurantId(id);
              setView("detail");
            }}
            onUpdateData={updateData}
          />
        ) : null}

        {view === "tasks" ? (
          <TasksView
            restaurants={restaurants}
            users={data.users}
            onOpenRestaurant={(id) => {
              setSelectedRestaurantId(id);
              setView("detail");
            }}
          />
        ) : null}

        {view === "more" ? (
          <MoreView
            data={data}
            onExport={exportCsv}
            onImport={() => setView("import")}
            onUpdateData={updateData}
          />
        ) : null}

        {view === "import" ? (
          <ImportView
            importPreview={importPreview}
            importText={importText}
            onBack={() => setView("restaurants")}
            onChange={setImportText}
            onPreview={createImportPreview}
            onSave={saveImportPreview}
          />
        ) : null}
      </main>

      {whatsappRestaurantId ? (
        <WhatsappModal
          restaurant={restaurants.find((restaurant) => restaurant.id === whatsappRestaurantId)}
          template={whatsappTemplate}
          text={whatsappText}
          onChange={setWhatsappText}
          onClose={() => setWhatsappRestaurantId("")}
          onOpen={(restaurant) => openWhatsappMessage(restaurant)}
        />
      ) : null}

      {pendingWhatsappId ? (
        <ConfirmDialog
          title="Wurde die Nachricht gesendet?"
          text="Nur nach Bestätigung wird der Versand im Kontaktverlauf gespeichert."
          onNo={() => confirmWhatsappSent(false)}
          onYes={() => confirmWhatsappSent(true)}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded border border-premium-gold/30 bg-[#101a2c] px-4 py-3 text-sm font-semibold text-premium-gold shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
          {toast}
        </div>
      ) : null}

      <BottomNavigation
        taskCount={getDueTasks(restaurants).length}
        view={view}
        onView={setView}
      />
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (email: string, password: string) => boolean }) {
  const [email, setEmail] = useState("andrii@dinevio.local");
  const [password, setPassword] = useState("dinevio");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!onLogin(email, password)) {
      setError("Login fehlgeschlagen. Bitte Zugangsdaten prüfen.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-midnight px-4 py-10 text-warm-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-white/10 bg-[#101a2c] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)]"
      >
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
          DINEVIO Sales Manager
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold">Anmelden</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Temporärer localStorage-Modus. Supabase-Auth kann später an dieselbe
          Datenstruktur angeschlossen werden.
        </p>

        <label className="mt-6 block text-sm font-semibold" htmlFor="sales-email">
          E-Mail
        </label>
        <input
          id="sales-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
          autoComplete="email"
          required
        />

        <label className="mt-4 block text-sm font-semibold" htmlFor="sales-password">
          Passwort
        </label>
        <input
          id="sales-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClassName}
          autoComplete="current-password"
          required
        />

        {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}

        <button className={primaryButtonClassName} type="submit">
          Anmelden
        </button>

        <div className="mt-6 rounded border border-white/10 bg-midnight/45 p-4 text-xs leading-5 text-slate-400">
          <p className="font-semibold text-slate-300">Lokale Testzugänge</p>
          <p>andrii@dinevio.local / dinevio</p>
          <p>volodymyr@dinevio.local / dinevio</p>
        </div>
      </form>
    </main>
  );
}

function SalesTopBar({
  currentUser,
  onLogout
}: {
  currentUser: SalesUser;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-midnight/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="font-heading text-lg font-semibold tracking-[0.1em]">
            DINE<span className="text-premium-gold">V</span>IO
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-gold/90">
            Sales Manager
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-400 sm:inline">
            {currentUser.name}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-11 items-center gap-2 rounded border border-white/10 px-3 text-sm font-semibold text-slate-300 transition-colors hover:border-premium-gold/50 hover:text-premium-gold"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function DashboardView({
  data,
  onAdd,
  onOpenRestaurant,
  restaurants
}: {
  data: SalesData;
  onAdd: () => void;
  onOpenRestaurant: (id: string) => void;
  restaurants: Restaurant[];
}) {
  const dueTasks = getDueTasks(restaurants);
  const nextTasks = getNextSevenDayTasks(restaurants);

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Dashboard"
        title="Heute im Blick."
        text="Kompakte Übersicht über Besuche, Rückrufe und offene Kontakte."
        action={<button className={goldButtonClassName} onClick={onAdd} type="button">+ Restaurant hinzufügen</button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className={panelClassName}>
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {restaurants.filter(stat.predicate).length}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <TaskPanel
          title="Heute zu erledigen"
          tasks={dueTasks}
          users={data.users}
          onOpenRestaurant={onOpenRestaurant}
        />
        <TaskPanel
          title="Nächste sieben Tage"
          tasks={nextTasks}
          users={data.users}
          onOpenRestaurant={onOpenRestaurant}
        />
      </div>
    </div>
  );
}

function RestaurantsView({
  data,
  onAdd,
  onExport,
  onImport,
  onOpenRestaurant,
  onSearch,
  onSort,
  onStatusFilter,
  restaurants,
  searchTerm,
  sortBy,
  statusFilter
}: {
  data: SalesData;
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenRestaurant: (id: string) => void;
  onSearch: (value: string) => void;
  onSort: (value: "created" | "city" | "name" | "next") => void;
  onStatusFilter: (value: RestaurantStatus | "Alle") => void;
  restaurants: Restaurant[];
  searchTerm: string;
  sortBy: "created" | "city" | "name" | "next";
  statusFilter: RestaurantStatus | "Alle";
}) {
  const filteredRestaurants = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return restaurants
      .filter((restaurant) => {
        const matchesStatus =
          statusFilter === "Alle" || restaurant.status === statusFilter;
        const searchable = [
          restaurant.name,
          restaurant.city,
          restaurant.street,
          restaurant.contact_person,
          restaurant.phone
        ]
          .join(" ")
          .toLowerCase();

        return matchesStatus && (!query || searchable.includes(query));
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sortBy === "city") {
          return a.city.localeCompare(b.city);
        }

        if (sortBy === "created") {
          return b.created_at.localeCompare(a.created_at);
        }

        return (a.next_contact_at || "9999").localeCompare(
          b.next_contact_at || "9999"
        );
      });
  }, [restaurants, searchTerm, sortBy, statusFilter]);

  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Restaurants"
        title="Alle Kontakte."
        text="Suchen, filtern und direkt in die Restaurantkarte springen."
        action={<button className={goldButtonClassName} onClick={onAdd} type="button">+ Restaurant hinzufügen</button>}
      />

      <div className="grid gap-3 rounded-lg border border-white/10 bg-[#101a2c] p-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          />
          <input
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Name, Ort, Straße, Kontakt oder Telefon suchen"
            className={`${inputClassName} mt-0 pl-10`}
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilter(event.target.value as RestaurantStatus | "Alle")}
          className={selectClassName}
        >
          <option>Alle</option>
          {restaurantStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => onSort(event.target.value as "created" | "city" | "name" | "next")}
          className={selectClassName}
        >
          <option value="next">Nächster Kontakt</option>
          <option value="created">Datum hinzugefügt</option>
          <option value="name">Name</option>
          <option value="city">Ort</option>
        </select>
        <div className="flex gap-2">
          <button className={outlineButtonClassName} type="button" onClick={onExport}>
            <Download aria-hidden="true" className="h-4 w-4" />
            CSV
          </button>
          <button className={outlineButtonClassName} type="button" onClick={onImport}>
            <Upload aria-hidden="true" className="h-4 w-4" />
            Import
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredRestaurants.length === 0 ? (
          <EmptyState text="Noch keine Restaurants gefunden." />
        ) : null}
        {filteredRestaurants.map((restaurant) => (
          <button
            key={restaurant.id}
            type="button"
            onClick={() => onOpenRestaurant(restaurant.id)}
            className="rounded-lg border border-white/10 bg-[#101a2c] p-4 text-left shadow-[0_12px_34px_rgba(0,0,0,0.12)] transition-[border-color,transform] hover:border-premium-gold/45 motion-safe:hover:-translate-y-0.5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold">{restaurant.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {formatAddress(restaurant) || "Keine Adresse"} ·{" "}
                  {restaurant.phone || "Keine Telefonnummer"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Ansprechpartner: {restaurant.contact_person || "-"}
                </p>
              </div>
              <StatusBadge status={restaurant.status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-400 sm:grid-cols-4">
              <span>Letzter Kontakt: {getLastContact(data.contact_history, restaurant.id) || "-"}</span>
              <span>Nächster Kontakt: {formatDateTime(restaurant.next_contact_at) || "-"}</span>
              <span>Verantwortlich: {getUserName(data.users, restaurant.responsible_user_id)}</span>
              <span>Demo: {demoOptions[restaurant.selected_demo].label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RestaurantForm({
  currentUser,
  initialDraft,
  isEditing,
  onCancel,
  onSave,
  users
}: {
  currentUser: SalesUser;
  initialDraft: RestaurantDraft | null;
  isEditing: boolean;
  onCancel: () => void;
  onSave: (draft: RestaurantDraft) => void;
  users: SalesUser[];
}) {
  const [draft, setDraft] = useState<RestaurantDraft>(() => {
    if (initialDraft) {
      return initialDraft;
    }

    if (typeof window !== "undefined" && !isEditing) {
      const storedDraft = window.localStorage.getItem(draftKey);

      if (storedDraft) {
        return JSON.parse(storedDraft) as RestaurantDraft;
      }
    }

    return {
      ...emptyDraft,
      responsible_user_id: currentUser.id
    };
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [draft, isEditing]);

  function updateField<K extends keyof RestaurantDraft>(key: K, value: RestaurantDraft[K]) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    onSave({
      ...draft,
      name: draft.name.trim(),
      status: draft.planned_visit_at && draft.status === "Neu" ? "Besuch geplant" : draft.status
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <SectionHeader
        eyebrow={isEditing ? "Restaurant bearbeiten" : "Neues Restaurant"}
        title={isEditing ? "Daten aktualisieren." : "Restaurant hinzufügen."}
        text="Die wichtigsten Informationen sind für die Nutzung unterwegs optimiert."
      />

      <div className={panelClassName}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Restaurantname *"
            value={draft.name}
            onChange={(value) => updateField("name", value)}
            required
          />
          <SelectField
            label="Kategorie"
            value={draft.category}
            onChange={(value) => updateField("category", value as RestaurantCategory | "")}
            options={["", ...restaurantCategories]}
          />
          <TextField label="Straße" value={draft.street} onChange={(value) => updateField("street", value)} />
          <TextField label="PLZ" value={draft.postal_code} onChange={(value) => updateField("postal_code", value)} />
          <TextField label="Ort" value={draft.city} onChange={(value) => updateField("city", value)} />
          <TextField label="Telefon" value={draft.phone} onChange={(value) => updateField("phone", value)} type="tel" />
          <TextField label="E-Mail" value={draft.email} onChange={(value) => updateField("email", value)} type="email" />
          <TextField label="Webseite" value={draft.website} onChange={(value) => updateField("website", value)} type="url" />
          <TextField label="Instagram" value={draft.instagram} onChange={(value) => updateField("instagram", value)} />
          <TextField label="Ansprechpartner" value={draft.contact_person} onChange={(value) => updateField("contact_person", value)} />
          <TextField label="Position des Ansprechpartners" value={draft.contact_position} onChange={(value) => updateField("contact_position", value)} />
          <DateTimeField label="Geplanter Besuch" value={draft.planned_visit_at} onChange={(value) => updateField("planned_visit_at", value)} />
          <SelectField label="Verantwortlich" value={draft.responsible_user_id} onChange={(value) => updateField("responsible_user_id", value as SalesUserId)} options={users.map((user) => user.id)} labels={Object.fromEntries(users.map((user) => [user.id, user.name]))} />
          <SelectField label="Demo" value={draft.selected_demo} onChange={(value) => updateField("selected_demo", value as DemoId)} options={Object.keys(demoOptions)} labels={Object.fromEntries(Object.entries(demoOptions).map(([id, demo]) => [id, demo.label]))} />
          <SelectField label="Status" value={draft.status} onChange={(value) => updateField("status", value as RestaurantStatus)} options={restaurantStatuses} />
        </div>
        <label className="mt-4 block text-sm font-semibold" htmlFor="restaurant-notes">
          Notizen
        </label>
        <textarea
          id="restaurant-notes"
          value={draft.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          className={`${inputClassName} min-h-36 py-3`}
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className={goldButtonClassName} disabled={saving} type="submit">
            {saving ? "Speichern ..." : "Speichern"}
          </button>
          <button className={outlineButtonClassName} type="button" onClick={onCancel}>
            Abbrechen
          </button>
        </div>
      </div>
    </form>
  );
}

function RestaurantDetailView({
  currentUser,
  data,
  onArchive,
  onBack,
  onCopy,
  onEdit,
  onOpenWhatsapp,
  onPatch,
  onShowDemoChooser,
  onStartVisit,
  onUpdateData,
  restaurant,
  showDemoChooser
}: {
  currentUser: SalesUser;
  data: SalesData;
  onArchive: () => void;
  onBack: () => void;
  onCopy: (text: string) => void;
  onEdit: () => void;
  onOpenWhatsapp: (template: "afterVisit" | "reminder") => void;
  onPatch: (
    restaurantId: string,
    patch: Partial<Restaurant>,
    history?: { action_type: ContactActionType; note: string }
  ) => void;
  onShowDemoChooser: (value: boolean) => void;
  onStartVisit: () => void;
  onUpdateData: (updater: (currentData: SalesData) => SalesData) => void;
  restaurant: Restaurant;
  showDemoChooser: boolean;
}) {
  const demoUrl = getDemoUrl(restaurant.selected_demo);
  const history = data.contact_history
    .filter((entry) => entry.restaurant_id === restaurant.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  function openDemo() {
    if (!demoUrl) {
      onShowDemoChooser(true);
      return;
    }

    window.open(demoUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-5">
      <button type="button" onClick={onBack} className="w-fit text-sm font-semibold text-premium-gold">
        ← Zurück zur Liste
      </button>

      <div className={panelClassName}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold">{restaurant.name}</h1>
              <StatusBadge status={restaurant.status} />
            </div>
            <p className="mt-3 text-slate-400">{formatAddress(restaurant) || "Keine Adresse"}</p>
            <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              <span>Kontakt: {restaurant.contact_person || "-"}</span>
              <span>Telefon: {restaurant.phone || "-"}</span>
              <span>Verantwortlich: {getUserName(data.users, restaurant.responsible_user_id)}</span>
              <span>Demo: {demoOptions[restaurant.selected_demo].label}</span>
            </div>
          </div>
          <button className={goldButtonClassName} type="button" onClick={onStartVisit}>
            Besuch starten
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionLink href={`tel:${restaurant.phone}`} icon={<Phone />} label="Anrufen" disabled={!restaurant.phone} />
          <ActionLink href={restaurant.phone ? `https://wa.me/${normalizePhone(restaurant.phone)}` : ""} icon={<MessageCircle />} label="WhatsApp" external disabled={!restaurant.phone} />
          <ActionLink href={getMapsUrl(restaurant)} icon={<Map />} label="Navigation" external disabled={!formatAddress(restaurant)} />
          <ActionLink href={restaurant.website} icon={<ExternalLink />} label="Webseite öffnen" external disabled={!restaurant.website} />
          <button className={mobileActionClassName} type="button" onClick={openDemo}>
            <ExternalLink aria-hidden="true" className="h-5 w-5" />
            Demo zeigen
          </button>
          <button className={mobileActionClassName} type="button" onClick={onEdit}>
            <FileText aria-hidden="true" className="h-5 w-5" />
            Bearbeiten
          </button>
        </div>

        {showDemoChooser ? (
          <div className="mt-5 rounded-lg border border-premium-gold/30 bg-midnight/50 p-4">
            <p className="font-heading text-lg font-semibold">Demo auswählen</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(["schnellundlecker", "schlemmerhus", "rhodosgrill"] as DemoId[]).map((demoId) => (
                <button
                  key={demoId}
                  className={outlineButtonClassName}
                  type="button"
                  onClick={() => {
                    onPatch(restaurant.id, { selected_demo: demoId }, {
                      action_type: "Status geändert",
                      note: `Demo ausgewählt: ${demoOptions[demoId].label}.`
                    });
                    window.open(demoOptions[demoId].url, "_blank", "noopener,noreferrer");
                    onShowDemoChooser(false);
                  }}
                >
                  {demoOptions[demoId].label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={panelClassName}>
          <h2 className="font-heading text-xl font-semibold">Schnellaktionen</h2>
          <div className="mt-4 grid gap-3">
            <button className={outlineButtonClassName} type="button" onClick={() => onOpenWhatsapp("afterVisit")}>
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              WhatsApp-Nachricht erstellen
            </button>
            <button className={outlineButtonClassName} type="button" onClick={() => onOpenWhatsapp("reminder")}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Erinnerung vorbereiten
            </button>
            <button className={outlineButtonClassName} type="button" onClick={() => onCopy(demoUrl || "Noch kein Demo ausgewählt")}>
              <Clipboard aria-hidden="true" className="h-4 w-4" />
              Demo-Link kopieren
            </button>
            <button className={outlineButtonClassName} type="button" onClick={() => onCopy(`${restaurant.name}\n${formatAddress(restaurant)}\n${restaurant.phone}`)}>
              <Clipboard aria-hidden="true" className="h-4 w-4" />
              Kontaktdaten kopieren
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-red-400/35 px-4 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/10" type="button" onClick={onArchive}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Archivieren
            </button>
          </div>
        </div>

        <OfferPanel
          key={restaurant.id}
          currentUser={currentUser}
          data={data}
          onCopy={onCopy}
          onUpdateData={onUpdateData}
          restaurant={restaurant}
        />
      </div>

      <div className={panelClassName}>
        <h2 className="font-heading text-xl font-semibold">Kontaktverlauf</h2>
        <div className="mt-5 grid gap-4">
          {history.length === 0 ? <EmptyState text="Noch kein Kontaktverlauf." /> : null}
          {history.map((entry) => (
            <div key={entry.id} className="border-l border-premium-gold/45 pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{entry.action_type}</p>
                <span className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {getUserName(data.users, entry.user_id)}
                {entry.old_status || entry.new_status ? ` · ${entry.old_status || "-"} → ${entry.new_status || "-"}` : ""}
              </p>
              {entry.next_contact_at ? (
                <p className="mt-1 text-sm text-premium-gold">
                  Nächster Kontakt: {formatDateTime(entry.next_contact_at)}
                </p>
              ) : null}
              {entry.note ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">{entry.note}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisitModeView({
  onBack,
  onFinish,
  restaurant
}: {
  onBack: () => void;
  onFinish: () => void;
  restaurant: Restaurant;
}) {
  return (
    <div className="grid gap-5">
      <div className={panelClassName}>
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
          Besuchsmodus
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">{restaurant.name}</h1>
        <p className="mt-2 text-slate-400">Kontakt: {restaurant.contact_person || "-"}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {(["schnellundlecker", "schlemmerhus", "rhodosgrill"] as DemoId[]).map((demoId) => (
            <a
              key={demoId}
              href={demoOptions[demoId].url}
              target="_blank"
              rel="noopener noreferrer"
              className={mobileActionClassName}
            >
              <ExternalLink aria-hidden="true" className="h-5 w-5" />
              {demoOptions[demoId].label}
            </a>
          ))}
        </div>
      </div>

      <div className={panelClassName}>
        <h2 className="font-heading text-xl font-semibold">Vorteile</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "Moderner professioneller Auftritt",
            "Optimiert für Smartphone",
            "Speisekarte und Öffnungszeiten sofort sichtbar",
            "Direkte Kontakt- und Bestellmöglichkeiten",
            "Individuelles Design statt Standard-Baukasten",
            "Persönliche Betreuung"
          ].map((benefit) => (
            <li key={benefit} className="flex gap-3 text-sm leading-6 text-slate-300">
              <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-premium-gold" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <details className={panelClassName}>
        <summary className="cursor-pointer font-heading text-xl font-semibold">
          Gesprächsleitfaden
        </summary>
        <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
          <li>1. Kurze Vorstellung.</li>
          <li>2. Aktuelle Webseite oder Online-Präsenz ansprechen.</li>
          <li>3. Passende Live-Demo zeigen.</li>
          <li>4. Vorteile für Gäste erklären.</li>
          <li>5. Interesse und nächsten Schritt klären.</li>
        </ol>
      </details>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className={outlineButtonClassName} onClick={onBack}>
          Zurück
        </button>
        <button type="button" className={goldButtonClassName} onClick={onFinish}>
          Besuch beenden
        </button>
      </div>
    </div>
  );
}

function FinishVisitView({
  onCancel,
  onSave,
  restaurant
}: {
  onCancel: () => void;
  onSave: (payload: {
    contactAt: string;
    contactPersonType: string;
    interestLevel: number;
    nextContactAt: string;
    nextContactType: ContactType | "";
    note: string;
    result: VisitResult;
  }) => void;
  restaurant: Restaurant;
}) {
  const [contactPersonType, setContactPersonType] = useState("Inhaber");
  const [result, setResult] = useState<VisitResult>("Interesse vorhanden");
  const [interestLevel, setInterestLevel] = useState(3);
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [nextContactType, setNextContactType] = useState<ContactType | "">("Anrufen");
  const [note, setNote] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      contactAt: new Date().toISOString(),
      contactPersonType,
      interestLevel,
      nextContactAt: nextDate ? `${nextDate}T${nextTime || "09:00"}` : "",
      nextContactType,
      note,
      result
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <SectionHeader
        eyebrow="Besuch beenden"
        title={restaurant.name}
        text="Ergebnis speichern und nächsten Kontakt planen."
      />
      <div className={panelClassName}>
        <SelectField label="Gespräch geführt mit" value={contactPersonType} onChange={setContactPersonType} options={contactPersonTypes} />
        <SelectField label="Ergebnis" value={result} onChange={(value) => setResult(value as VisitResult)} options={visitResults} />

        <div className="mt-5">
          <p className="text-sm font-semibold">Bewertung des Interesses</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setInterestLevel(level)}
                className={`min-h-12 rounded border text-base font-semibold ${
                  interestLevel === level
                    ? "border-premium-gold bg-premium-gold text-midnight"
                    : "border-white/10 text-slate-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">1 = kein Interesse, 5 = sehr großes Interesse</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <TextField label="Nächster Kontakt Datum" value={nextDate} onChange={setNextDate} type="date" />
          <TextField label="Uhrzeit" value={nextTime} onChange={setNextTime} type="time" />
          <SelectField label="Typ" value={nextContactType} onChange={(value) => setNextContactType(value as ContactType | "")} options={["", ...contactTypes]} />
        </div>

        <label className="mt-5 block text-sm font-semibold" htmlFor="visit-note">
          Notizen
        </label>
        <textarea
          id="visit-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={`${inputClassName} min-h-40 py-3`}
          placeholder="Kurze Gesprächsnotiz, Einwände, nächster Schritt."
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className={outlineButtonClassName} type="button" onClick={onCancel}>
            Zurück
          </button>
          <button className={goldButtonClassName} type="submit">
            Ergebnis speichern
          </button>
        </div>
      </div>
    </form>
  );
}

function TourView({
  currentUser,
  data,
  onOpenRestaurant,
  onUpdateData,
  restaurants
}: {
  currentUser: SalesUser;
  data: SalesData;
  onOpenRestaurant: (id: string) => void;
  onUpdateData: (updater: (currentData: SalesData) => SalesData) => void;
  restaurants: Restaurant[];
}) {
  const [tourDate, setTourDate] = useState(todayInputValue());
  const [responsibleUserId, setResponsibleUserId] = useState<SalesUserId>(currentUser.id);
  const [restaurantIdToAdd, setRestaurantIdToAdd] = useState("");
  const tour =
    data.tours.find(
      (candidate) =>
        candidate.tour_date === tourDate &&
        candidate.responsible_user_id === responsibleUserId &&
        candidate.status !== "Abgeschlossen"
    ) ?? null;
  const stops = tour
    ? data.tour_stops
        .filter((stop) => stop.tour_id === tour.id)
        .sort((a, b) => a.position - b.position)
    : [];

  function ensureTour() {
    if (tour) {
      return tour.id;
    }

    const id = createId();
    onUpdateData((currentData) => ({
      ...currentData,
      tours: [
        ...currentData.tours,
        {
          created_at: new Date().toISOString(),
          id,
          responsible_user_id: responsibleUserId,
          status: "Geplant",
          tour_date: tourDate
        }
      ]
    }));
    return id;
  }

  function addStop() {
    if (!restaurantIdToAdd) {
      return;
    }

    const tourId = ensureTour();
    onUpdateData((currentData) => ({
      ...currentData,
      tour_stops: [
        ...currentData.tour_stops,
        {
          id: createId(),
          position: stops.length + 1,
          restaurant_id: restaurantIdToAdd,
          status: "Geplant",
          tour_id: tourId,
          visited_at: ""
        }
      ]
    }));
    setRestaurantIdToAdd("");
  }

  function moveStop(stopId: string, direction: -1 | 1) {
    const targetIndex = stops.findIndex((stop) => stop.id === stopId);
    const swapIndex = targetIndex + direction;

    if (targetIndex < 0 || swapIndex < 0 || swapIndex >= stops.length) {
      return;
    }

    const first = stops[targetIndex];
    const second = stops[swapIndex];

    onUpdateData((currentData) => ({
      ...currentData,
      tour_stops: currentData.tour_stops.map((stop) => {
        if (stop.id === first.id) {
          return { ...stop, position: second.position };
        }
        if (stop.id === second.id) {
          return { ...stop, position: first.position };
        }
        return stop;
      })
    }));
  }

  function markVisited(stopId: string) {
    onUpdateData((currentData) => ({
      ...currentData,
      tour_stops: currentData.tour_stops.map((stop) =>
        stop.id === stopId
          ? {
              ...stop,
              status: "Besucht",
              visited_at: new Date().toISOString()
            }
          : stop
      )
    }));
  }

  function openRoute() {
    const addresses = stops
      .map((stop) => restaurants.find((restaurant) => restaurant.id === stop.restaurant_id))
      .filter(Boolean)
      .map((restaurant) => formatAddress(restaurant as Restaurant))
      .filter(Boolean);

    if (addresses.length === 0) {
      return;
    }

    const chunks = chunk(addresses, 9);
    chunks.forEach((addressChunk) => {
      const destination = addressChunk[addressChunk.length - 1];
      const waypoints = addressChunk.slice(0, -1).join("|");
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${
        waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""
      }`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Tour planen"
        title="Tagesroute vorbereiten."
        text="Für die erste Version als geordnete Liste mit Navigation und Besuchsstatus."
        action={<button className={goldButtonClassName} type="button" onClick={openRoute}>Route in Google Maps öffnen</button>}
      />
      <div className={panelClassName}>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Datum" value={tourDate} onChange={setTourDate} type="date" />
          <SelectField label="Verantwortlich" value={responsibleUserId} onChange={(value) => setResponsibleUserId(value as SalesUserId)} options={data.users.map((user) => user.id)} labels={Object.fromEntries(data.users.map((user) => [user.id, user.name]))} />
          <div>
            <label className="block text-sm font-semibold">Restaurant hinzufügen</label>
            <div className="mt-2 flex gap-2">
              <select value={restaurantIdToAdd} onChange={(event) => setRestaurantIdToAdd(event.target.value)} className={selectClassName}>
                <option value="">Auswählen</option>
                {restaurants.map((restaurant) => (
                  <option value={restaurant.id} key={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
              <button className="min-h-12 rounded bg-premium-gold px-4 text-midnight" type="button" onClick={addStop}>
                <Plus aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {stops.length === 0 ? <EmptyState text="Noch keine Stopps geplant." /> : null}
        {stops.map((stop, index) => {
          const restaurant = restaurants.find((candidate) => candidate.id === stop.restaurant_id);

          if (!restaurant) {
            return null;
          }

          return (
            <div key={stop.id} className={panelClassName}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-premium-gold">Stopp {index + 1}</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold">{restaurant.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{formatAddress(restaurant)}</p>
                  <p className="mt-1 text-sm text-slate-400">{stop.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={iconButtonClassName} type="button" onClick={() => moveStop(stop.id, -1)}>
                    <ArrowUp aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button className={iconButtonClassName} type="button" onClick={() => moveStop(stop.id, 1)}>
                    <ArrowDown aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <a className={outlineButtonClassName} href={getMapsUrl(restaurant)} target="_blank" rel="noopener noreferrer">
                  Navigation
                </a>
                <button className={outlineButtonClassName} type="button" onClick={() => onOpenRestaurant(restaurant.id)}>
                  Öffnen
                </button>
                <button className={goldButtonClassName} type="button" onClick={() => markVisited(stop.id)}>
                  Als besucht markieren
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TasksView({
  onOpenRestaurant,
  restaurants,
  users
}: {
  onOpenRestaurant: (id: string) => void;
  restaurants: Restaurant[];
  users: SalesUser[];
}) {
  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Aufgaben"
        title="Offene Kontakte."
        text="Überfällige Aufgaben, heutige Kontakte und die nächsten sieben Tage."
      />
      <TaskPanel title="Heute und überfällig" tasks={getDueTasks(restaurants)} users={users} onOpenRestaurant={onOpenRestaurant} />
      <TaskPanel title="Nächste sieben Tage" tasks={getNextSevenDayTasks(restaurants)} users={users} onOpenRestaurant={onOpenRestaurant} />
    </div>
  );
}

function MoreView({
  data,
  onExport,
  onImport,
  onUpdateData
}: {
  data: SalesData;
  onExport: () => void;
  onImport: () => void;
  onUpdateData: (updater: (currentData: SalesData) => SalesData) => void;
}) {
  function updatePackage(id: string, patch: Partial<ServicePackageTemplate>) {
    onUpdateData((currentData) => ({
      ...currentData,
      package_templates: currentData.package_templates.map((packageTemplate) =>
        packageTemplate.id === id ? { ...packageTemplate, ...patch } : packageTemplate
      )
    }));
  }

  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Mehr"
        title="Verwaltung."
        text="Export, Import und anpassbare Paketvorlagen."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <button className={outlineButtonClassName} type="button" onClick={onExport}>
          <Download aria-hidden="true" className="h-4 w-4" />
          Restaurants exportieren
        </button>
        <button className={outlineButtonClassName} type="button" onClick={onImport}>
          <Upload aria-hidden="true" className="h-4 w-4" />
          CSV importieren
        </button>
      </div>
      <div className={panelClassName}>
        <h2 className="font-heading text-xl font-semibold">Paketvorlagen</h2>
        <p className="mt-2 text-sm text-slate-400">
          Anfangswerte, die intern anpassbar sind. Preise werden hier bewusst
          nicht fest vorgegeben.
        </p>
        <div className="mt-5 grid gap-4">
          {data.package_templates.map((packageTemplate) => (
            <div key={packageTemplate.id} className="rounded border border-white/10 p-4">
              <TextField label="Paketname" value={packageTemplate.name} onChange={(value) => updatePackage(packageTemplate.id, { name: value })} />
              <label className="mt-4 block text-sm font-semibold">Beschreibung</label>
              <textarea
                value={packageTemplate.description}
                onChange={(event) => updatePackage(packageTemplate.id, { description: event.target.value })}
                className={`${inputClassName} min-h-28 py-3`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImportView({
  importPreview,
  importText,
  onBack,
  onChange,
  onPreview,
  onSave
}: {
  importPreview: RestaurantDraft[];
  importText: string;
  onBack: () => void;
  onChange: (value: string) => void;
  onPreview: () => void;
  onSave: () => void;
}) {
  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="CSV Import"
        title="Daten prüfen."
        text="Einfacher Import mit Vorschau. Die Struktur kann später für Supabase erweitert werden."
      />
      <div className={panelClassName}>
        <textarea
          value={importText}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClassName} min-h-56 py-3 font-mono text-sm`}
          placeholder="Restaurant,Adresse,Ort,Telefon,Ansprechpartner,Status,Interesse,Letzter Kontakt,Nächster Kontakt,Verantwortlich,Demo,Notizen"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button className={outlineButtonClassName} type="button" onClick={onBack}>
            Zurück
          </button>
          <button className={outlineButtonClassName} type="button" onClick={onPreview}>
            Vorschau erstellen
          </button>
          <button className={goldButtonClassName} type="button" onClick={onSave} disabled={importPreview.length === 0}>
            Vorschau speichern
          </button>
        </div>
      </div>
      {importPreview.length > 0 ? (
        <div className={panelClassName}>
          <h2 className="font-heading text-xl font-semibold">Vorschau</h2>
          <div className="mt-4 grid gap-2">
            {importPreview.map((restaurant, index) => (
              <div key={`${restaurant.name}-${index}`} className="rounded border border-white/10 p-3 text-sm">
                {restaurant.name || "Ohne Namen"} · {restaurant.city || "-"} · {restaurant.phone || "-"}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OfferPanel({
  currentUser,
  data,
  onCopy,
  onUpdateData,
  restaurant
}: {
  currentUser: SalesUser;
  data: SalesData;
  onCopy: (text: string) => void;
  onUpdateData: (updater: (currentData: SalesData) => SalesData) => void;
  restaurant: Restaurant;
}) {
  const existingOffer = data.offers.find((offer) => offer.restaurant_id === restaurant.id);
  const [offer, setOffer] = useState<Offer>(
    existingOffer ?? {
      created_at: new Date().toISOString(),
      created_by: currentUser.id,
      id: createId(),
      monthly_price: "",
      offer_date: todayInputValue(),
      package_name: data.package_templates[0]?.name ?? "",
      restaurant_id: restaurant.id,
      setup_price: "",
      special_requests: "",
      status: "Entwurf",
      updated_at: new Date().toISOString(),
      valid_until: "",
    }
  );

  function updateField<K extends keyof Offer>(key: K, value: Offer[K]) {
    setOffer((currentOffer) => ({
      ...currentOffer,
      [key]: value
    }));
  }

  function saveOffer() {
    onUpdateData((currentData) => {
      const nextOffer = {
        ...offer,
        updated_at: new Date().toISOString()
      };
      const offerExists = currentData.offers.some((candidate) => candidate.id === offer.id);

      return {
        ...currentData,
        contact_history:
          nextOffer.status === "Gesendet"
            ? [
                ...currentData.contact_history,
                createHistoryEntry({
                  action_type: "Angebot gesendet",
                  new_status: "Angebot gesendet",
                  note: "Angebot wurde gespeichert und als gesendet markiert.",
                  old_status: restaurant.status,
                  restaurant_id: restaurant.id,
                  user_id: currentUser.id
                })
              ]
            : currentData.contact_history,
        offers: offerExists
          ? currentData.offers.map((candidate) =>
              candidate.id === offer.id ? nextOffer : candidate
            )
          : [...currentData.offers, nextOffer],
        restaurants:
          nextOffer.status === "Gesendet"
            ? currentData.restaurants.map((candidate) =>
                candidate.id === restaurant.id
                  ? {
                      ...candidate,
                      status: "Angebot gesendet",
                      updated_at: new Date().toISOString(),
                      updated_by: currentUser.id
                    }
                  : candidate
              )
            : currentData.restaurants
      };
    });
  }

  return (
    <div className={panelClassName}>
      <h2 className="font-heading text-xl font-semibold">Angebot</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SelectField label="Paket" value={offer.package_name} onChange={(value) => updateField("package_name", value)} options={data.package_templates.map((packageTemplate) => packageTemplate.name)} />
        <SelectField label="Status" value={offer.status} onChange={(value) => updateField("status", value as Offer["status"])} options={offerStatuses} />
        <TextField label="Einmalige Erstellungskosten" value={offer.setup_price} onChange={(value) => updateField("setup_price", value)} />
        <TextField label="Monatliche Kosten" value={offer.monthly_price} onChange={(value) => updateField("monthly_price", value)} />
        <TextField label="Angebotsdatum" value={offer.offer_date} onChange={(value) => updateField("offer_date", value)} type="date" />
        <TextField label="Gültig bis" value={offer.valid_until} onChange={(value) => updateField("valid_until", value)} type="date" />
      </div>
      <label className="mt-4 block text-sm font-semibold">Sonderwünsche</label>
      <textarea
        value={offer.special_requests}
        onChange={(event) => updateField("special_requests", event.target.value)}
        className={`${inputClassName} min-h-28 py-3`}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button className={goldButtonClassName} type="button" onClick={saveOffer}>
          Angebot speichern
        </button>
        <button className={outlineButtonClassName} type="button" onClick={() => onCopy(createOfferText(restaurant, offer))}>
          Angebotstext kopieren
        </button>
      </div>
    </div>
  );
}

function TaskPanel({
  onOpenRestaurant,
  tasks,
  title,
  users
}: {
  onOpenRestaurant: (id: string) => void;
  tasks: Restaurant[];
  title: string;
  users: SalesUser[];
}) {
  return (
    <div className={panelClassName}>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {tasks.length === 0 ? <EmptyState text="Keine offenen Aufgaben." /> : null}
        {tasks.map((restaurant) => {
          const overdue = isOverdue(restaurant.next_contact_at);

          return (
            <button
              key={`${title}-${restaurant.id}`}
              type="button"
              onClick={() => onOpenRestaurant(restaurant.id)}
              className={`rounded border p-4 text-left transition-colors ${
                overdue
                  ? "border-red-400/35 bg-red-500/10"
                  : "border-white/10 bg-midnight/35 hover:border-premium-gold/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{restaurant.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatAddress(restaurant) || restaurant.city || "-"}
                  </p>
                  <p className={`mt-2 text-sm ${overdue ? "text-red-200" : "text-premium-gold"}`}>
                    {restaurant.next_contact_at
                      ? `Nächster Kontakt: ${formatDateTime(restaurant.next_contact_at)}`
                      : `Geplanter Besuch: ${formatDateTime(restaurant.planned_visit_at)}`}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {getUserName(users, restaurant.responsible_user_id)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WhatsappModal({
  onChange,
  onClose,
  onOpen,
  restaurant,
  template,
  text
}: {
  onChange: (value: string) => void;
  onClose: () => void;
  onOpen: (restaurant: Restaurant) => void;
  restaurant: Restaurant | undefined;
  template: "afterVisit" | "reminder";
  text: string;
}) {
  if (!restaurant) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-3 sm:place-items-center">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-[#101a2c] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-premium-gold">
          {template === "afterVisit" ? "Nach erstem Besuch" : "Erinnerung"}
        </p>
        <h2 className="mt-2 font-heading text-2xl font-semibold">
          WhatsApp-Nachricht bearbeiten
        </h2>
        <textarea
          value={text}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClassName} mt-5 min-h-72 py-3`}
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button className={outlineButtonClassName} type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button className={goldButtonClassName} type="button" onClick={() => onOpen(restaurant)}>
            WhatsApp öffnen
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  onNo,
  onYes,
  text,
  title
}: {
  onNo: () => void;
  onYes: () => void;
  text: string;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-[#101a2c] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className={outlineButtonClassName} type="button" onClick={onNo}>
            Nein
          </button>
          <button className={goldButtonClassName} type="button" onClick={onYes}>
            Ja
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNavigation({
  onView,
  taskCount,
  view
}: {
  onView: (view: ViewMode) => void;
  taskCount: number;
  view: ViewMode;
}) {
  const items: Array<{
    icon: ReactNode;
    label: string;
    target: ViewMode;
  }> = [
    { icon: <LayoutDashboard />, label: "Dashboard", target: "dashboard" },
    { icon: <Search />, label: "Restaurants", target: "restaurants" },
    { icon: <Route />, label: "Tour", target: "tour" },
    { icon: <ListChecks />, label: "Aufgaben", target: "tasks" },
    { icon: <Settings />, label: "Mehr", target: "more" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0c1424]/98 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm">
      <div className="mx-auto grid max-w-2xl grid-cols-5 gap-1">
        {items.map((item) => (
          <button
            key={item.target}
            type="button"
            onClick={() => onView(item.target)}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded text-[0.68rem] font-semibold transition-colors ${
              view === item.target
                ? "bg-premium-gold text-midnight"
                : "text-slate-400 hover:text-premium-gold"
            }`}
          >
            <span className="h-5 w-5 [&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>
            {item.label}
            {item.target === "tasks" && taskCount > 0 ? (
              <span className="absolute right-2 top-1 rounded-full bg-red-500 px-1.5 text-[0.62rem] text-white">
                {taskCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  );
}

function SectionHeader({
  action,
  eyebrow,
  text,
  title
}: {
  action?: ReactNode;
  eyebrow: string;
  text: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
          {text}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: RestaurantStatus }) {
  return (
    <span className={`w-fit rounded border px-3 py-1 text-xs font-semibold ${statusClassNames[status]}`}>
      {status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function TextField({
  label,
  onChange,
  required = false,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <label className="block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </div>
  );
}

function DateTimeField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return <TextField label={label} onChange={onChange} type="datetime-local" value={value} />;
}

function SelectField({
  label,
  labels = {},
  onChange,
  options,
  value
}: {
  label: string;
  labels?: Record<string, string>;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <label className="block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {labels[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActionLink({
  disabled,
  external = false,
  href,
  icon,
  label
}: {
  disabled?: boolean;
  external?: boolean;
  href: string;
  icon: ReactNode;
  label: string;
}) {
  if (disabled) {
    return (
      <span className={`${mobileActionClassName} cursor-not-allowed opacity-45`}>
        {icon}
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={mobileActionClassName}
    >
      {icon}
      {label}
    </a>
  );
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded border border-white/10 bg-midnight px-4 text-base text-warm-white transition-[border-color,box-shadow] duration-200 placeholder:text-slate-500 focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/25";

const selectClassName =
  "mt-2 min-h-12 w-full rounded border border-white/10 bg-midnight px-4 text-base text-warm-white transition-[border-color,box-shadow] duration-200 focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/25";

const panelClassName =
  "rounded-lg border border-white/10 bg-[#101a2c] p-4 shadow-[0_12px_34px_rgba(0,0,0,0.14)] sm:p-5";

const goldButtonClassName =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded bg-premium-gold px-5 text-base font-semibold text-midnight transition-[background-color,transform,opacity] hover:bg-[#d6b238] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClassName = `${goldButtonClassName} mt-6 w-full`;

const outlineButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded border border-premium-gold/60 px-4 text-sm font-semibold text-premium-gold transition-[background-color,border-color,transform] hover:border-premium-gold hover:bg-premium-gold/8 active:translate-y-px";

const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded border border-white/10 text-slate-300 transition-colors hover:border-premium-gold/50 hover:text-premium-gold";

const mobileActionClassName =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded border border-premium-gold/55 px-4 text-sm font-semibold text-premium-gold transition-[background-color,border-color,transform] hover:border-premium-gold hover:bg-premium-gold/8 active:translate-y-px";

function mergeSalesData(partialData: Partial<SalesData>): SalesData {
  return {
    contact_history: partialData.contact_history ?? [],
    offers: partialData.offers ?? [],
    package_templates: partialData.package_templates ?? initialPackageTemplates,
    restaurants: partialData.restaurants ?? [],
    tour_stops: partialData.tour_stops ?? [],
    tours: partialData.tours ?? [],
    users: partialData.users ?? salesUsers
  };
}

function restaurantToDraft(restaurant: Restaurant | undefined): RestaurantDraft | null {
  if (!restaurant) {
    return null;
  }

  const {
    archived,
    created_at,
    created_by,
    id,
    updated_at,
    updated_by,
    ...draft
  } = restaurant;

  void archived;
  void created_at;
  void created_by;
  void id;
  void updated_at;
  void updated_by;

  return draft;
}

function createHistoryEntry({
  action_type,
  new_status = "",
  next_contact_at = "",
  note = "",
  old_status = "",
  restaurant_id,
  user_id
}: {
  action_type: ContactActionType;
  new_status?: RestaurantStatus | "";
  next_contact_at?: string;
  note?: string;
  old_status?: RestaurantStatus | "";
  restaurant_id: string;
  user_id: SalesUserId;
}): ContactHistoryEntry {
  const now = new Date().toISOString();

  return {
    action_type,
    contact_at: now,
    created_at: now,
    id: createId(),
    new_status,
    next_contact_at,
    note,
    old_status,
    restaurant_id,
    user_id
  };
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("0")) {
    return `49${digits.slice(1)}`;
  }

  return digits;
}

function formatAddress(restaurant: Restaurant) {
  return [restaurant.street, restaurant.postal_code, restaurant.city].filter(Boolean).join(", ");
}

function getMapsUrl(restaurant: Restaurant) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    formatAddress(restaurant) || restaurant.name
  )}`;
}

function getDemoUrl(demoId: DemoId) {
  return demoOptions[demoId]?.url ?? "";
}

function getUserName(users: SalesUser[], userId: SalesUserId) {
  return users.find((user) => user.id === userId)?.name ?? userId;
}

function formatDateTime(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined
  }).format(new Date(value));
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function isSameDay(value: string) {
  if (!value) {
    return false;
  }

  return value.slice(0, 10) === todayInputValue();
}

function isOverdue(value: string) {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() < startOfToday().getTime();
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDueTasks(restaurants: Restaurant[]) {
  return restaurants
    .filter((restaurant) => {
      const hasVisitToday = isSameDay(restaurant.planned_visit_at);
      const hasNextContactToday = isSameDay(restaurant.next_contact_at);
      const overdue = isOverdue(restaurant.next_contact_at);
      return hasVisitToday || hasNextContactToday || overdue;
    })
    .sort((a, b) => (a.next_contact_at || a.planned_visit_at).localeCompare(b.next_contact_at || b.planned_visit_at));
}

function getNextSevenDayTasks(restaurants: Restaurant[]) {
  const today = startOfToday().getTime();
  const sevenDays = today + 7 * 24 * 60 * 60 * 1000;

  return restaurants
    .filter((restaurant) => {
      if (!restaurant.next_contact_at) {
        return false;
      }

      const time = new Date(restaurant.next_contact_at).getTime();
      return time >= today && time <= sevenDays;
    })
    .sort((a, b) => a.next_contact_at.localeCompare(b.next_contact_at));
}

function getLastContact(history: ContactHistoryEntry[], restaurantId: string) {
  return (
    history
      .filter((entry) => entry.restaurant_id === restaurantId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at
  );
}

function createOfferText(restaurant: Restaurant, offer: Offer) {
  return [
    `Angebot für ${restaurant.name}`,
    "",
    `Paket: ${offer.package_name || "-"}`,
    `Einmalige Erstellungskosten: ${offer.setup_price || "-"}`,
    `Monatliche Kosten: ${offer.monthly_price || "-"}`,
    `Angebotsdatum: ${offer.offer_date || "-"}`,
    `Gültig bis: ${offer.valid_until || "-"}`,
    "",
    "Sonderwünsche:",
    offer.special_requests || "-",
    "",
    "DINEVIO"
  ].join("\n");
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
