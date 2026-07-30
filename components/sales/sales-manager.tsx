"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  Clipboard,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map as MapIcon,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings,
  Star,
  Trash2,
  Upload
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  MessageTemplate,
  Offer,
  Restaurant,
  RestaurantCategory,
  RestaurantPhoto,
  RestaurantStatus,
  SalesData,
  SalesTask,
  SalesUser,
  SalesUserId,
  ServicePackageTemplate
} from "@/lib/sales-types";
import type {
  RestaurantLookupCandidate,
  RestaurantLookupResponse
} from "@/lib/restaurant-lookup-types";
import {
  contactHistoryService,
  profilesService,
  photosService,
  restaurantsService,
  salesDataService,
  storageService
} from "@/lib/sales/services";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

type ViewMode =
  | "dashboard"
  | "restaurants"
  | "form"
  | "detail"
  | "visit"
  | "finish"
  | "tour"
  | "tasks"
  | "pipeline"
  | "statistics"
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

type TaskItem = {
  assigned_to: SalesUserId;
  due_at: string;
  id: string;
  restaurant: Restaurant;
  source: "restaurant" | "task";
  task?: SalesTask;
  title: string;
};

const storageKey = "dinevio-sales-manager-data";
const draftKey = "dinevio-sales-manager-restaurant-draft";

const defaultData: SalesData = {
  contact_history: [],
  message_templates: [],
  offers: [],
  package_templates: initialPackageTemplates,
  restaurant_photos: [],
  restaurants: [],
  sales_settings: [],
  tasks: [],
  tour_stops: [],
  tours: [],
  users: salesUsers
};

const emptyDraft: RestaurantDraft = {
  category: "",
  city: "",
  contact_person: "",
  contact_position: "",
  digital_presence: null,
  email: "",
  facebook: "",
  generated_demo_at: "",
  google_maps_url: "",
  google_rating: null,
  google_review_count: null,
  house_number: "",
  instagram: "",
  interest_level: null,
  latitude: "",
  longitude: "",
  name: "",
  next_contact_at: "",
  next_contact_type: "",
  notes: "",
  opening_hours: [],
  phone: "",
  photos: [],
  planned_visit_at: "",
  postal_code: "",
  responsible_user_id: "andrii",
  selected_demo: "none",
  status: "Neu",
  street: "",
  custom_demo_slug: "",
  custom_demo_url: "",
  tiktok: "",
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

const offerStatusLabels: Record<Offer["status"], string> = {
  accepted: "Angenommen",
  draft: "Entwurf",
  expired: "Abgelaufen",
  generated: "PDF erstellt",
  rejected: "Abgelehnt",
  sent: "Gesendet",
  Angenommen: "Angenommen",
  Abgelehnt: "Abgelehnt",
  Entwurf: "Entwurf",
  Gesendet: "Gesendet"
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

export function SalesManager({ initialView = "dashboard" }: { initialView?: ViewMode } = {}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const supabaseConfig = getSupabaseConfig();
  const [data, setData] = useState<SalesData>(defaultData);
  const [currentUserId, setCurrentUserId] = useState<SalesUserId | null>(null);
  const [dataError, setDataError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [hasLocalMigrationData, setHasLocalMigrationData] = useState(false);
  const [lastSyncError, setLastSyncError] = useState("");
  const [migrationSkipped, setMigrationSkipped] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<ViewMode>(initialView);
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
    let active = true;

    async function loadSupabaseData() {
      if (!supabaseConfig.isConfigured || !supabase) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setDataError("");

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (!user) {
        router.replace("/sales/login");
        return;
      }

      const profileResult = await profilesService.getCurrentProfile(supabase);

      if (!active) {
        return;
      }

      if (profileResult.error || !profileResult.data) {
        setDataError(profileResult.error ?? "Profil konnte nicht geladen werden.");
        setDataLoading(false);
        return;
      }

      const salesDataResult = await salesDataService.load(supabase);

      if (!active) {
        return;
      }

      if (salesDataResult.error || !salesDataResult.data) {
        setDataError(salesDataResult.error ?? "Daten konnten nicht geladen werden.");
        setDataLoading(false);
        return;
      }

      setCurrentUserId(profileResult.data.id);
      setData({
        ...salesDataResult.data,
        users: mergeUsers(salesDataResult.data.users, profileResult.data)
      });
      setHasLocalMigrationData(hasLegacyLocalSalesData());
      setDataLoading(false);
    }

    loadSupabaseData();

    const { data: authListener } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          router.replace("/sales/login");
        }
      }) ?? { data: { subscription: null } };

    return () => {
      active = false;
      authListener.subscription?.unsubscribe();
    };
  }, [router, supabase, supabaseConfig.isConfigured]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const reloadSalesData = useCallback(
    async (message = "") => {
      if (!supabase || !currentUser) {
        return;
      }

      const result = await salesDataService.load(supabase);

      if (result.error || !result.data) {
        setLastSyncError(result.error ?? "Daten konnten nicht geladen werden.");
        return;
      }

      setData({
        ...result.data,
        users: mergeUsers(result.data.users, currentUser)
      });

      if (message) {
        setToast(message);
      }
    },
    [currentUser, supabase]
  );

  useEffect(() => {
    if (!supabase || !currentUserId) {
      return;
    }

    const channel = supabase
      .channel("sales-manager-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurants" },
        () => reloadSalesData("Die Daten wurden von einem anderen Benutzer aktualisiert.")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_history" },
        () => reloadSalesData("Kontaktverlauf wurde aktualisiert.")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tours" },
        () => reloadSalesData("Touren wurden aktualisiert.")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers" },
        () => reloadSalesData("Angebote wurden aktualisiert.")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => reloadSalesData("Aufgaben wurden aktualisiert.")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_photos" },
        () => reloadSalesData("Fotos wurden aktualisiert.")
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, reloadSalesData, supabase]);

  async function logout() {
    await supabase?.auth.signOut();
    setCurrentUserId(null);
    setSelectedRestaurantId("");
    setView("dashboard");
    router.replace("/sales/login");
  }

  function updateData(updater: (currentData: SalesData) => SalesData) {
    setData((currentData) => {
      const nextData = updater(currentData);
      void persistSalesData(nextData);
      return nextData;
    });
  }

  async function persistSalesData(nextData: SalesData) {
    if (!supabase) {
      return;
    }

    setSyncing(true);
    const result = await salesDataService.saveSnapshot(supabase, nextData);
    setSyncing(false);

    if (result.error) {
      setLastSyncError(result.error);
      return;
    }

    setLastSyncError("");
  }

  async function saveRestaurant(draft: RestaurantDraft, editingId = "") {
    if (!currentUser) {
      return false;
    }

    if (!supabase) {
      setLastSyncError("Supabase ist nicht konfiguriert.");
      return false;
    }

    const now = new Date().toISOString();

    if (editingId) {
      const currentRestaurant = data.restaurants.find((restaurant) => restaurant.id === editingId);
      const updateResult = await restaurantsService.update(supabase, editingId, {
        ...draft,
        updated_at: now,
        updated_by: currentUser.id
      });

      if (updateResult.error || !updateResult.data) {
        setLastSyncError(updateResult.error || "Die Datenbankaktion konnte nicht abgeschlossen werden.");
        return false;
      }

      let historyEntry: ContactHistoryEntry | null = null;

      if (currentRestaurant && currentRestaurant.status !== draft.status) {
        const historyResult = await contactHistoryService.create(
          supabase,
          createHistoryEntry({
            action_type: "Status geändert",
            next_contact_at: draft.next_contact_at,
            new_status: draft.status,
            note: "Restaurant aktualisiert.",
            old_status: currentRestaurant.status,
            restaurant_id: editingId,
            user_id: currentUser.id
          })
        );

        if (historyResult.error) {
          setLastSyncError(historyResult.error);
        } else {
          historyEntry = historyResult.data;
        }
      }

      setData((currentData) => ({
        ...currentData,
        contact_history: historyEntry
          ? [...currentData.contact_history, historyEntry]
          : currentData.contact_history,
        restaurants: currentData.restaurants.map((restaurant) =>
          restaurant.id === editingId ? updateResult.data : restaurant
        )
      }));
      setLastSyncError("");
      setToast("Gespeichert");
      setSelectedRestaurantId(editingId);
      setView("detail");
      return true;
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

    const duplicateResult = await restaurantsService.findDuplicate(supabase, restaurant);

    if (duplicateResult.error) {
      setLastSyncError(duplicateResult.error);
      return false;
    }

    if (duplicateResult.data) {
      setToast("Möglicher Duplikat gefunden");
      setSelectedRestaurantId(duplicateResult.data.id);
      setView("detail");
      return true;
    }

    const createResult = await restaurantsService.create(supabase, restaurant);

    if (createResult.error || !createResult.data) {
      setLastSyncError(createResult.error || "Die Datenbankaktion konnte nicht abgeschlossen werden.");
      return false;
    }

    const historyResult = await contactHistoryService.create(
      supabase,
      createHistoryEntry({
        action_type: "Restaurant erstellt",
        new_status: createResult.data.status,
        note: "Restaurant wurde angelegt.",
        restaurant_id: createResult.data.id,
        user_id: currentUser.id
      })
    );

    if (historyResult.error) {
      setLastSyncError(historyResult.error);
    } else {
      setLastSyncError("");
    }

    setData((currentData) => ({
      ...currentData,
      contact_history: historyResult.data
        ? [...currentData.contact_history, historyResult.data]
        : currentData.contact_history,
      restaurants: [...currentData.restaurants, createResult.data]
    }));
    window.localStorage.removeItem(draftKey);
    setToast("Restaurant gespeichert");
    setSelectedRestaurantId(createResult.data.id);
    setView("detail");
    return true;
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

    if (payload.nextContactAt) {
      updateData((currentData) => {
        const taskType = mapContactTypeToTaskType(payload.nextContactType);
        const duplicateTask = currentData.tasks.some(
          (task) =>
            task.restaurant_id === selectedRestaurant.id &&
            task.due_at === payload.nextContactAt &&
            task.task_type === taskType &&
            task.status !== "cancelled"
        );

        if (duplicateTask) {
          return currentData;
        }

        const task = createTaskFromNextContact({
          currentUserId: currentUser.id,
          nextContactAt: payload.nextContactAt,
          nextContactType: payload.nextContactType,
          restaurant: selectedRestaurant
        });

        return {
          ...currentData,
          contact_history: [
            ...currentData.contact_history,
            createHistoryEntry({
              action_type: "Aufgabe erstellt",
              next_contact_at: payload.nextContactAt,
              note: `Aufgabe erstellt: ${task.title}.`,
              restaurant_id: selectedRestaurant.id,
              task_id: task.id,
              user_id: currentUser.id
            })
          ],
          tasks: [...currentData.tasks, task]
        };
      });
    }

    setToast("Besuch gespeichert");
    setView("detail");
  }

  function createWhatsappMessage(restaurant: Restaurant, template: "afterVisit" | "reminder") {
    const demoLink = getRestaurantDemoUrl(restaurant);
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

  async function generateAutomaticDemo(restaurantId: string) {
    setLastSyncError("");

    try {
      const response = await fetch("/api/sales/demo-pages", {
        body: JSON.stringify({ restaurantId }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as {
        demoUrl?: string;
        message?: string;
        restaurant?: Partial<Restaurant>;
      };

      if (!response.ok || !payload.restaurant) {
        setLastSyncError(payload.message ?? "Automatisches Demo konnte nicht erstellt werden.");
        return;
      }

      updateData((currentData) => ({
        ...currentData,
        restaurants: currentData.restaurants.map((restaurant) =>
          restaurant.id === restaurantId
            ? {
                ...restaurant,
                ...payload.restaurant
              }
            : restaurant
        )
      }));
      setToast("Automatisches Demo erstellt");

      if (payload.demoUrl) {
        window.open(payload.demoUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setLastSyncError("Automatisches Demo konnte nicht erstellt werden.");
    }
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

  function exportBackup() {
    const backup = JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        schema_version: 1,
        source: "dinevio-sales-manager",
        data
      },
      null,
      2
    );
    const blob = new Blob([backup], { type: "application/json;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dinevio-sales-backup-${todayInputValue()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    setToast("Backup erstellt");
  }

  function restoreBackup(file: File) {
    const reader = new FileReader();

    reader.addEventListener("load", async () => {
      try {
        const payload = JSON.parse(String(reader.result)) as Partial<{
          data: Partial<SalesData>;
          source: string;
        }>;
        const backupData = payload.data ?? payload;
        const restoredData = mergeSalesData(backupData as Partial<SalesData>);
        const result = supabase
          ? await salesDataService.saveSnapshot(supabase, restoredData)
          : { error: "Supabase ist nicht konfiguriert." };

        if (result.error) {
          setLastSyncError(result.error);
          return;
        }

        setData(restoredData);
        setSelectedRestaurantId("");
        setEditingRestaurantId("");
        setView("dashboard");
        setToast("Backup wiederhergestellt");
      } catch {
        setToast("Backup konnte nicht gelesen werden");
      }
    });

    reader.readAsText(file);
  }

  function clearLegacyLocalData() {
    if (!window.confirm("Lokale alte Sales-Daten von diesem Gerät löschen?")) {
      return;
    }

    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem("supabaseMigrationCompleted");
    window.localStorage.removeItem("supabaseMigrationDismissed");
    setHasLocalMigrationData(false);
    setMigrationSkipped(true);
    setToast("Lokale Daten gelöscht");
  }

  async function migrateLegacyLocalData() {
    if (!supabase || !currentUser) {
      return;
    }

    const storedData = window.localStorage.getItem(storageKey);

    if (!storedData) {
      setHasLocalMigrationData(false);
      return;
    }

    try {
      const legacyData = remapLegacyUserIds(
        mergeSalesData(JSON.parse(storedData) as Partial<SalesData>),
        data.users,
        currentUser.id
      );
      const existingKeys = new Set(data.restaurants.map(createRestaurantDuplicateKey));
      const importedRestaurantIds = new Set<string>();
      let skippedRestaurants = 0;

      const restaurantsToImport = legacyData.restaurants.filter((restaurant) => {
        const key = createRestaurantDuplicateKey(restaurant);

        if (existingKeys.has(key)) {
          skippedRestaurants += 1;
          return false;
        }

        existingKeys.add(key);
        importedRestaurantIds.add(restaurant.id);
        return true;
      });
      const historyToImport = legacyData.contact_history.filter((entry) =>
        importedRestaurantIds.has(entry.restaurant_id)
      );
      const toursToImport = legacyData.tours;
      const tourIds = new Set(toursToImport.map((tour) => tour.id));
      const stopsToImport = legacyData.tour_stops.filter(
        (stop) => tourIds.has(stop.tour_id) && importedRestaurantIds.has(stop.restaurant_id)
      );
      const offersToImport = legacyData.offers.filter((offer) =>
        importedRestaurantIds.has(offer.restaurant_id)
      );
      const photosToImport = legacyData.restaurant_photos.filter((photo) =>
        importedRestaurantIds.has(photo.restaurant_id)
      );
      const tasksToImport = legacyData.tasks.filter((task) =>
        importedRestaurantIds.has(task.restaurant_id)
      );
      const nextData: SalesData = {
        ...data,
        contact_history: [...data.contact_history, ...historyToImport],
        offers: [...data.offers, ...offersToImport],
        package_templates: data.package_templates,
        restaurant_photos: [...data.restaurant_photos, ...photosToImport],
        restaurants: [...data.restaurants, ...restaurantsToImport],
        tasks: [...data.tasks, ...tasksToImport],
        tour_stops: [...data.tour_stops, ...stopsToImport],
        tours: [...data.tours, ...toursToImport],
        users: data.users
      };
      const result = await salesDataService.saveSnapshot(supabase, nextData);

      if (result.error) {
        setLastSyncError(result.error);
        return;
      }

      setData(nextData);
      window.localStorage.setItem("supabaseMigrationCompleted", new Date().toISOString());
      setHasLocalMigrationData(false);
      setMigrationSkipped(true);
      setToast(
        `Datenübertragung abgeschlossen: ${restaurantsToImport.length} Restaurants, ${historyToImport.length} Kontakte, ${toursToImport.length} Touren, ${skippedRestaurants} Duplikate übersprungen`
      );
    } catch {
      setLastSyncError("Lokale Daten konnten nicht übertragen werden.");
    }
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

  if (!supabaseConfig.isConfigured) {
    return (
      <SalesTechnicalState
        title="Supabase ist nicht konfiguriert."
        text={`Fehlende Variablen: ${supabaseConfig.missing.join(", ")}`}
      />
    );
  }

  if (dataLoading) {
    return <SalesTechnicalState title="Daten werden geladen …" text="Sales Manager wird vorbereitet." />;
  }

  if (dataError) {
    return (
      <SalesTechnicalState
        title="Daten konnten nicht geladen werden."
        text={dataError}
        action={<button className={goldButtonClassName} onClick={() => window.location.reload()} type="button">Erneut versuchen</button>}
      />
    );
  }

  if (!currentUser) {
    router.replace("/sales/login");
    return <SalesTechnicalState title="Sitzung wird geprüft …" text="Weiterleitung zur Anmeldung." />;
  }

  return (
    <div className="min-h-screen bg-midnight pb-24 text-warm-white">
      <SalesTopBar currentUser={currentUser} onLogout={logout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {lastSyncError ? (
          <div className="mb-4 rounded border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {lastSyncError}
          </div>
        ) : null}
        {syncing ? (
          <div className="mb-4 rounded border border-premium-gold/25 bg-premium-gold/10 px-4 py-3 text-sm text-premium-gold">
            Wird gespeichert …
          </div>
        ) : null}
        {hasLocalMigrationData && !migrationSkipped ? (
          <LocalMigrationNotice
            onDismiss={() => setMigrationSkipped(true)}
            onHidePermanently={() => {
              window.localStorage.setItem("supabaseMigrationDismissed", "true");
              setMigrationSkipped(true);
            }}
            onMigrate={migrateLegacyLocalData}
          />
        ) : null}
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
            onOpenRestaurant={(id) => {
              setSelectedRestaurantId(id);
              setEditingRestaurantId("");
              setView("detail");
            }}
            onSave={(draft) => saveRestaurant(draft, editingRestaurantId)}
            restaurants={restaurants}
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
            onGenerateDemo={() => generateAutomaticDemo(selectedRestaurant.id)}
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
            data={data}
            restaurants={restaurants}
            users={data.users}
            onOpenRestaurant={(id) => {
              setSelectedRestaurantId(id);
              setView("detail");
            }}
          />
        ) : null}

        {view === "pipeline" ? (
          <PipelineView
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

        {view === "statistics" ? (
          <StatisticsView data={data} restaurants={restaurants} />
        ) : null}

        {view === "more" ? (
          <MoreView
            currentUser={currentUser}
            data={data}
            onBackup={exportBackup}
            onClearLegacyData={clearLegacyLocalData}
            onExport={exportCsv}
            onImport={() => setView("import")}
            onRestore={restoreBackup}
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
        taskCount={getDueTasks(restaurants, data.tasks).length}
        view={view}
        onView={setView}
      />
    </div>
  );
}

function SalesTechnicalState({
  action,
  text,
  title
}: {
  action?: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-midnight px-4 py-10 text-warm-white">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#101a2c] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
          DINEVIO Sales Manager
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </main>
  );
}

function LocalMigrationNotice({
  onDismiss,
  onHidePermanently,
  onMigrate
}: {
  onDismiss: () => void;
  onHidePermanently: () => void;
  onMigrate: () => void;
}) {
  return (
    <div className="mb-5 rounded-lg border border-premium-gold/35 bg-[#101a2c] p-5">
      <p className="font-heading text-xl font-semibold">Lokale Daten gefunden</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        Auf diesem Gerät wurden lokale Sales-Daten gefunden. Möchten Sie diese
        Daten in die gemeinsame Datenbank übertragen?
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button className={goldButtonClassName} type="button" onClick={onMigrate}>
          Jetzt übertragen
        </button>
        <button className={outlineButtonClassName} type="button" onClick={onDismiss}>
          Später
        </button>
        <button className={outlineButtonClassName} type="button" onClick={onHidePermanently}>
          Nicht mehr anzeigen
        </button>
      </div>
    </div>
  );
}

export function LegacyLocalLoginScreen({
  onLogin
}: {
  onLogin: (email: string, password: string) => boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
  const dueTasks = getDueTasks(restaurants, data.tasks);
  const nextTasks = getNextSevenDayTasks(restaurants, data.tasks);

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
  onOpenRestaurant,
  onSave,
  restaurants,
  users
}: {
  currentUser: SalesUser;
  initialDraft: RestaurantDraft | null;
  isEditing: boolean;
  onCancel: () => void;
  onOpenRestaurant: (id: string) => void;
  onSave: (draft: RestaurantDraft) => Promise<boolean>;
  restaurants: Restaurant[];
  users: SalesUser[];
}) {
  const [draft, setDraft] = useState<RestaurantDraft>(() => {
    if (initialDraft) {
      return initialDraft;
    }

    if (typeof window !== "undefined" && !isEditing) {
      const storedDraft = window.localStorage.getItem(draftKey);

      if (storedDraft) {
        return normalizeRestaurantDraft(JSON.parse(storedDraft) as Partial<RestaurantDraft>);
      }
    }

    return {
      ...emptyDraft,
      responsible_user_id: currentUser.id
    };
  });
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupCandidates, setLookupCandidates] = useState<RestaurantLookupCandidate[]>([]);
  const [postalCodeWarning, setPostalCodeWarning] = useState("");
  const [duplicateRestaurant, setDuplicateRestaurant] = useState<Restaurant | null>(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState("");
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

  async function loadRestaurantInformation() {
    if (lookupBusy) {
      return;
    }

    const query = lookupQuery.trim();

    if (query.length < 3) {
      setLookupError("Bitte geben Sie einen Google Maps Link oder Restaurantnamen ein.");
      return;
    }

    setLookupBusy(true);
    setLookupError("");
    setPostalCodeWarning("");
    setDuplicateRestaurant(null);
    setLookupCandidates([]);

    try {
      const response = await fetch("/api/sales/restaurant-lookup", {
        body: JSON.stringify({ query }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as RestaurantLookupResponse;

      if (!response.ok || payload.status === "error" || payload.status === "not_found") {
        setLookupError(payload.message ?? "Informationen konnten nicht geladen werden.");
        return;
      }

      if (payload.candidates.length > 1) {
        setLookupCandidates(payload.candidates);
        return;
      }

      if (payload.candidates[0]) {
        applyLookupCandidate(payload.candidates[0]);
      }
    } catch {
      setLookupError("Informationen konnten nicht geladen werden.");
    } finally {
      setLookupBusy(false);
    }
  }

  function applyLookupCandidate(candidate: RestaurantLookupCandidate) {
    const duplicate = findDuplicateRestaurant(candidate, restaurants);

    setDuplicateRestaurant(duplicate);
    setPostalCodeWarning(candidate.postal_code ? "" : "PLZ konnte nicht eindeutig bestimmt werden.");
    setLookupCandidates([]);
    setLookupError("");
    setDraft((currentDraft) => ({
      ...currentDraft,
      category: candidate.category || currentDraft.category,
      city: candidate.city,
      digital_presence: candidate.presence,
      email: candidate.email,
      facebook: candidate.facebook,
      google_maps_url: candidate.google_maps_url,
      google_rating: candidate.google_rating,
      google_review_count: candidate.google_review_count,
      house_number: candidate.house_number,
      instagram: candidate.instagram,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      name: candidate.name,
      opening_hours: candidate.opening_hours,
      phone: candidate.phone,
      photos: candidate.photo_urls,
      postal_code: candidate.postal_code,
      selected_demo:
        candidate.suggested_demo !== "none" ? candidate.suggested_demo : currentDraft.selected_demo,
      street: candidate.street,
      tiktok: candidate.tiktok,
      website: candidate.website
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    const saved = await onSave({
      ...draft,
      city: draft.city.trim(),
      contact_person: draft.contact_person.trim(),
      contact_position: draft.contact_position.trim(),
      email: draft.email.trim(),
      facebook: draft.facebook.trim(),
      google_maps_url: draft.google_maps_url.trim(),
      house_number: draft.house_number.trim(),
      instagram: draft.instagram.trim(),
      latitude: draft.latitude.trim(),
      longitude: draft.longitude.trim(),
      name: draft.name.trim(),
      notes: draft.notes.trim(),
      phone: draft.phone.trim(),
      postal_code: draft.postal_code.trim(),
      street: draft.street.trim(),
      tiktok: draft.tiktok.trim(),
      website: draft.website.trim(),
      status: draft.planned_visit_at && draft.status === "Neu" ? "Besuch geplant" : draft.status
    });

    if (!saved) {
      setSaving(false);
    }
  }

  function useCurrentLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Standort konnte nicht bestimmt werden.");
      return;
    }

    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationBusy(false);
        const latitude = position.coords.latitude.toFixed(7);
        const longitude = position.coords.longitude.toFixed(7);

        if (!window.confirm(`Aktuellen Standort übernehmen?\nBreitengrad: ${latitude}\nLängengrad: ${longitude}`)) {
          return;
        }

        setDraft((currentDraft) => ({
          ...currentDraft,
          latitude,
          location_accuracy: position.coords.accuracy
            ? `${Math.round(position.coords.accuracy)} m`
            : "browser",
          location_updated_at: new Date().toISOString(),
          longitude
        }));
      },
      () => {
        setLocationBusy(false);
        setLocationError("Standortzugriff wurde abgelehnt oder ist nicht verfügbar.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000
      }
    );
  }

  function inferLocationFromAddress() {
    const mapsUrl = getMapsUrl({
      ...emptyDraft,
      ...draft,
      archived: false,
      created_at: "",
      created_by: currentUser.id,
      id: "",
      updated_at: "",
      updated_by: currentUser.id
    });
    updateField("google_maps_url", mapsUrl);
    setLocationError("Adresse wurde als Google-Maps-Link vorbereitet. Koordinaten können anschließend manuell ergänzt oder per aktuellem Standort gesetzt werden.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <SectionHeader
        eyebrow={isEditing ? "Restaurant bearbeiten" : "Neues Restaurant"}
        title={isEditing ? "Daten aktualisieren." : "Restaurant hinzufügen."}
        text="Die wichtigsten Informationen sind für die Nutzung unterwegs optimiert."
      />

      <div className="rounded-xl border border-premium-gold/35 bg-[#101a2c] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
              Restaurant automatisch finden
            </p>
            <label className="mt-4 block text-sm font-semibold" htmlFor="restaurant-lookup">
              Google Maps Link oder Restaurantname
            </label>
            <input
              id="restaurant-lookup"
              value={lookupQuery}
              onChange={(event) => setLookupQuery(event.target.value)}
              className={inputClassName}
              placeholder={"https://maps.app.goo.gl/...\noder\nRhodos Grill Marl"}
              type="text"
            />
          </div>
          <button
            className={goldButtonClassName}
            disabled={lookupBusy}
            onClick={loadRestaurantInformation}
            type="button"
          >
            {lookupBusy ? (
              <>
                <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" />
                Informationen werden geladen
              </>
            ) : (
              "Informationen laden"
            )}
          </button>
        </div>

        {lookupError ? (
          <p className="mt-4 rounded border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-sm leading-6 text-orange-100">
            {lookupError}
          </p>
        ) : null}

        {postalCodeWarning ? (
          <p className="mt-4 rounded border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-sm leading-6 text-orange-100">
            {postalCodeWarning}
          </p>
        ) : null}

        {duplicateRestaurant ? (
          <div className="mt-4 rounded-lg border border-premium-gold/35 bg-midnight/65 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-heading text-lg font-semibold">Möglicher Duplikat gefunden</p>
                <p className="mt-1 text-sm text-slate-400">
                  {duplicateRestaurant.name} · {formatAddress(duplicateRestaurant)}
                </p>
              </div>
              <button
                className={outlineButtonClassName}
                onClick={() => onOpenRestaurant(duplicateRestaurant.id)}
                type="button"
              >
                Bestehenden Eintrag öffnen
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {lookupCandidates.length > 0 ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-midnight/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-white/12 bg-[#101a2c] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
                  Mehrere Ergebnisse
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold">Restaurant auswählen</h2>
              </div>
              <button
                aria-label="Auswahl schließen"
                className={iconButtonClassName}
                onClick={() => setLookupCandidates([])}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {lookupCandidates.map((candidate) => (
                <div key={`${candidate.source}-${candidate.id}`} className="rounded-lg border border-white/10 bg-midnight/55 p-4">
                  <div className="flex gap-4">
                    {candidate.image_url ? (
                      <Image
                        alt={`Vorschau von ${candidate.name}`}
                        className="h-20 w-24 shrink-0 rounded object-cover"
                        height={80}
                        src={candidate.image_url}
                        width={96}
                      />
                    ) : (
                      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded border border-white/10 text-premium-gold">
                        <Search aria-hidden="true" className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-lg font-semibold">{candidate.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {formatCandidateAddress(candidate) || "Keine Adresse"}
                      </p>
                      {candidate.google_rating ? (
                        <p className="mt-2 inline-flex items-center gap-1 text-sm text-premium-gold">
                          <Star aria-hidden="true" className="h-4 w-4" />
                          {candidate.google_rating.toFixed(1)}
                          {candidate.google_review_count ? ` · ${candidate.google_review_count} Bewertungen` : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    className={`${goldButtonClassName} mt-4 w-full sm:w-auto`}
                    onClick={() => applyLookupCandidate(candidate)}
                    type="button"
                  >
                    Auswählen
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

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
          <TextField label="Hausnummer" value={draft.house_number} onChange={(value) => updateField("house_number", value)} />
          <TextField label="PLZ" value={draft.postal_code} onChange={(value) => updateField("postal_code", value)} />
          <TextField label="Ort" value={draft.city} onChange={(value) => updateField("city", value)} />
          <TextField label="Telefon" value={draft.phone} onChange={(value) => updateField("phone", value)} type="tel" />
          <TextField label="E-Mail" value={draft.email} onChange={(value) => updateField("email", value)} type="email" />
          <TextField label="Webseite" value={draft.website} onChange={(value) => updateField("website", value)} type="url" />
          <TextField label="Instagram" value={draft.instagram} onChange={(value) => updateField("instagram", value)} />
          <TextField label="Facebook" value={draft.facebook} onChange={(value) => updateField("facebook", value)} />
          <TextField label="TikTok" value={draft.tiktok} onChange={(value) => updateField("tiktok", value)} />
          <TextField label="Ansprechpartner" value={draft.contact_person} onChange={(value) => updateField("contact_person", value)} />
          <TextField label="Position des Ansprechpartners" value={draft.contact_position} onChange={(value) => updateField("contact_position", value)} />
          <TextField label="Google Rating" value={draft.google_rating?.toString() ?? ""} onChange={(value) => updateField("google_rating", value ? Number(value) : null)} type="number" />
          <TextField label="Anzahl Bewertungen" value={draft.google_review_count?.toString() ?? ""} onChange={(value) => updateField("google_review_count", value ? Number(value) : null)} type="number" />
          <DateTimeField label="Geplanter Besuch" value={draft.planned_visit_at} onChange={(value) => updateField("planned_visit_at", value)} />
          <SelectField label="Verantwortlich" value={draft.responsible_user_id} onChange={(value) => updateField("responsible_user_id", value as SalesUserId)} options={users.map((user) => user.id)} labels={Object.fromEntries(users.map((user) => [user.id, user.name]))} />
          <SelectField label="Demo" value={draft.selected_demo} onChange={(value) => updateField("selected_demo", value as DemoId)} options={["none", "schnellundlecker", "schlemmerhus", "rhodosgrill", "custom"]} labels={Object.fromEntries(Object.entries(demoOptions).map(([id, demo]) => [id, demo.label]))} />
          <SelectField label="Status" value={draft.status} onChange={(value) => updateField("status", value as RestaurantStatus)} options={restaurantStatuses} />
        </div>
        <div className="mt-6 rounded-lg border border-white/10 bg-midnight/45 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold">Standort</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Koordinaten für Navigation, Tourenplanung und spätere Umkreissuche.
              </p>
            </div>
            {draft.latitude && draft.longitude ? (
              <span className="rounded border border-premium-gold/35 px-3 py-2 text-xs font-semibold text-premium-gold">
                Standort gespeichert
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <TextField label="Latitude" value={draft.latitude} onChange={(value) => updateField("latitude", value)} />
            <TextField label="Longitude" value={draft.longitude} onChange={(value) => updateField("longitude", value)} />
            <TextField label="Google Maps Link" value={draft.google_maps_url} onChange={(value) => updateField("google_maps_url", value)} type="url" />
          </div>
          {draft.latitude && draft.longitude ? (
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Breitengrad: {draft.latitude} · Längengrad: {draft.longitude}
            </p>
          ) : null}
          {locationError ? (
            <p className="mt-3 rounded border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
              {locationError}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button className={outlineButtonClassName} type="button" onClick={inferLocationFromAddress}>
              Standort aus Adresse ermitteln
            </button>
            <button className={outlineButtonClassName} type="button" onClick={useCurrentLocation} disabled={locationBusy}>
              {locationBusy ? "Standort wird ermittelt ..." : "Aktuellen Standort verwenden"}
            </button>
            <a
              className={outlineButtonClassName}
              href={getMapsUrl({
                ...emptyDraft,
                ...draft,
                archived: false,
                created_at: "",
                created_by: currentUser.id,
                id: "",
                updated_at: "",
                updated_by: currentUser.id
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              In Google Maps öffnen
            </a>
          </div>
        </div>

        <label className="mt-4 block text-sm font-semibold" htmlFor="restaurant-opening-hours">
          Öffnungszeiten
        </label>
        <textarea
          id="restaurant-opening-hours"
          value={draft.opening_hours.join("\n")}
          onChange={(event) => updateField("opening_hours", event.target.value.split("\n").filter(Boolean))}
          className={`${inputClassName} min-h-28 py-3`}
        />
        <label className="mt-4 block text-sm font-semibold" htmlFor="restaurant-photo-urls">
          Foto-URLs
        </label>
        <textarea
          id="restaurant-photo-urls"
          value={draft.photos.join("\n")}
          onChange={(event) => updateField("photos", event.target.value.split("\n").filter(Boolean))}
          className={`${inputClassName} min-h-24 py-3`}
        />
        <PresenceAnalysisPanel presence={draft.digital_presence} />
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

function PresenceAnalysisPanel({
  presence
}: {
  presence: RestaurantDraft["digital_presence"];
}) {
  if (!presence) {
    return null;
  }

  const items = [
    { label: "Offizielle Website", value: presence.has_website },
    { label: "HTTPS", value: presence.has_https },
    { label: "Online-Menü", value: presence.has_online_menu },
    { label: "Instagram-Link", value: presence.has_instagram },
    { label: "Facebook-Link", value: presence.has_facebook },
    { label: "Online-Reservierung", value: presence.has_online_booking },
    { label: "Mobile Version", value: presence.has_mobile_viewport }
  ];

  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-midnight/45 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-lg font-semibold">Online-Analyse</p>
          <p className="mt-1 text-sm text-slate-400">
            Schneller Überblick für das Gespräch vor Ort.
          </p>
        </div>
        <div className="rounded border border-premium-gold/45 px-3 py-2 text-sm font-semibold text-premium-gold">
          {presence.score} / 100
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-slate-300">
            {item.value ? (
              <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-premium-gold" />
            ) : (
              <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
            )}
            <span>{item.label}: {formatPresenceValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RestaurantDetailView({
  currentUser,
  data,
  onArchive,
  onBack,
  onCopy,
  onEdit,
  onGenerateDemo,
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
  onGenerateDemo: () => void;
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
  const demoUrl = getRestaurantDemoUrl(restaurant);
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
              <span>Erstellt von {getUserName(data.users, restaurant.created_by)}</span>
              <span>Zuletzt bearbeitet von {getUserName(data.users, restaurant.updated_by)}</span>
            </div>
          </div>
          <button className={goldButtonClassName} type="button" onClick={onStartVisit}>
            Besuch starten
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionLink href={`tel:${restaurant.phone}`} icon={<Phone />} label="Anrufen" disabled={!restaurant.phone} />
          <ActionLink href={restaurant.phone ? `https://wa.me/${normalizePhone(restaurant.phone)}` : ""} icon={<MessageCircle />} label="WhatsApp" external disabled={!restaurant.phone} />
          <ActionLink href={getMapsUrl(restaurant)} icon={<MapIcon />} label="Navigation" external disabled={!hasNavigationTarget(restaurant)} />
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

        <PresenceAnalysisPanel presence={restaurant.digital_presence} />

        {showDemoChooser ? (
          <div className="mt-5 rounded-lg border border-premium-gold/30 bg-midnight/50 p-4">
            <p className="font-heading text-lg font-semibold">Demo auswählen</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Automatisches Demo aus aktuellen Restaurantdaten erstellen oder eine bestehende Konzeptdemo öffnen.
            </p>
            <button className={`${goldButtonClassName} mt-4 w-full sm:w-auto`} type="button" onClick={onGenerateDemo}>
              Automatisches Demo erstellen
            </button>
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

      <RestaurantPhotosPanel
        currentUser={currentUser}
        data={data}
        onUpdateData={onUpdateData}
        restaurant={restaurant}
      />

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
  data,
  onOpenRestaurant,
  restaurants,
  users
}: {
  data: SalesData;
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
      <TaskPanel title="Heute und überfällig" tasks={getDueTasks(restaurants, data.tasks)} users={users} onOpenRestaurant={onOpenRestaurant} />
      <TaskPanel title="Nächste sieben Tage" tasks={getNextSevenDayTasks(restaurants, data.tasks)} users={users} onOpenRestaurant={onOpenRestaurant} />
    </div>
  );
}

function PipelineView({
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
  const columns: RestaurantStatus[] = [
    "Neu",
    "Besuch geplant",
    "Besucht",
    "Interessiert",
    "Demo gesendet",
    "Angebot gesendet",
    "Kunde gewonnen",
    "Abgelehnt"
  ];

  function moveRestaurant(restaurantId: string, nextStatus: RestaurantStatus) {
    onUpdateData((currentData) => {
      const restaurant = currentData.restaurants.find((candidate) => candidate.id === restaurantId);

      if (!restaurant || restaurant.status === nextStatus) {
        return currentData;
      }

      return {
        ...currentData,
        contact_history: [
          ...currentData.contact_history,
          createHistoryEntry({
            action_type: "Status geändert",
            new_status: nextStatus,
            note: `Status in Pipeline geändert: ${restaurant.status} → ${nextStatus}.`,
            old_status: restaurant.status,
            restaurant_id: restaurant.id,
            user_id: currentUser.id
          })
        ],
        restaurants: currentData.restaurants.map((candidate) =>
          candidate.id === restaurantId
            ? {
                ...candidate,
                status: nextStatus,
                updated_at: new Date().toISOString(),
                updated_by: currentUser.id
              }
            : candidate
        )
      };
    });
  }

  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Pipeline"
        title="Sales Pipeline."
        text="Restaurants nach aktuellem Status verschieben und Fortschritt sichtbar machen."
      />
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1120px] grid-cols-8 gap-3">
          {columns.map((status) => {
            const columnRestaurants = restaurants.filter((restaurant) => restaurant.status === status);

            return (
              <div
                key={status}
                className="rounded-lg border border-white/10 bg-[#101a2c] p-3"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const restaurantId = event.dataTransfer.getData("text/plain");
                  moveRestaurant(restaurantId, status);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-heading text-sm font-semibold">{status}</h2>
                  <span className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400">
                    {columnRestaurants.length}
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  {columnRestaurants.map((restaurant) => {
                    const offer = data.offers.find((candidate) => candidate.restaurant_id === restaurant.id);
                    const overdueTask = getTaskItems([restaurant], data.tasks).some((task) => isOverdue(task.due_at));

                    return (
                      <button
                        key={restaurant.id}
                        draggable
                        type="button"
                        onClick={() => onOpenRestaurant(restaurant.id)}
                        onDragStart={(event) => event.dataTransfer.setData("text/plain", restaurant.id)}
                        className={`rounded border p-3 text-left text-sm transition-colors hover:border-premium-gold/45 ${
                          overdueTask ? "border-red-400/35 bg-red-500/10" : "border-white/10 bg-midnight/45"
                        }`}
                      >
                        <p className="font-semibold text-warm-white">{restaurant.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{restaurant.city || "-"}</p>
                        <p className="mt-2 text-xs text-premium-gold">
                          Interesse: {restaurant.interest_level ?? "-"} · {getUserName(data.users, restaurant.responsible_user_id)}
                        </p>
                        {offer ? (
                          <p className="mt-1 text-xs text-slate-400">
                            Angebot: {offer.setup_price || "-"} / {offer.monthly_price || "-"}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatisticsView({
  data,
  restaurants
}: {
  data: SalesData;
  restaurants: Restaurant[];
}) {
  const wonOffers = data.offers.filter((offer) => offer.status === "accepted" || offer.status === "Angenommen");
  const sentOffers = data.offers.filter((offer) => offer.status === "sent" || offer.status === "Gesendet");
  const summary = [
    { label: "Alle Restaurants", value: restaurants.length },
    { label: "Neue Restaurants", value: restaurants.filter((restaurant) => restaurant.status === "Neu").length },
    { label: "Durchgeführte Besuche", value: restaurants.filter((restaurant) => restaurant.status === "Besucht").length },
    { label: "Interessiert", value: restaurants.filter((restaurant) => restaurant.status === "Interessiert").length },
    { label: "Demo gesendet", value: restaurants.filter((restaurant) => restaurant.status === "Demo gesendet").length },
    { label: "Angebote gesendet", value: sentOffers.length },
    { label: "Kunden gewonnen", value: restaurants.filter((restaurant) => restaurant.status === "Kunde gewonnen").length },
    { label: "Überfällige Aufgaben", value: getDueTasks(restaurants, data.tasks).filter((task) => isOverdue(task.due_at)).length }
  ];
  const funnel = [
    { label: "Neue Restaurants", value: restaurants.length },
    { label: "Besucht", value: restaurants.filter((restaurant) => ["Besucht", "Interessiert", "Demo gesendet", "Angebot gesendet", "Kunde gewonnen"].includes(restaurant.status)).length },
    { label: "Interessiert", value: restaurants.filter((restaurant) => ["Interessiert", "Demo gesendet", "Angebot gesendet", "Kunde gewonnen"].includes(restaurant.status)).length },
    { label: "Angebot gesendet", value: restaurants.filter((restaurant) => ["Angebot gesendet", "Kunde gewonnen"].includes(restaurant.status)).length },
    { label: "Kunde gewonnen", value: restaurants.filter((restaurant) => restaurant.status === "Kunde gewonnen").length }
  ];
  const setupRevenue = wonOffers.reduce((sum, offer) => sum + parseCurrencyValue(offer.setup_price), 0);
  const monthlyRevenue = wonOffers.reduce((sum, offer) => sum + parseCurrencyValue(offer.monthly_price), 0);
  const potentialMonthlyRevenue = data.offers
    .filter((offer) => ["draft", "generated", "sent", "Entwurf", "Gesendet"].includes(offer.status))
    .reduce((sum, offer) => sum + parseCurrencyValue(offer.monthly_price), 0);

  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Statistik"
        title="Vertrieb im Überblick."
        text="Aktuelle Kennzahlen, Conversion und offene Potenziale."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className={panelClassName}>
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 font-heading text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className={panelClassName}>
          <h2 className="font-heading text-xl font-semibold">Conversion Funnel</h2>
          <div className="mt-5 grid gap-3">
            {funnel.map((step, index) => {
              const previous = index === 0 ? step.value : funnel[index - 1].value;
              const total = funnel[0].value || 1;

              return (
                <div key={step.label} className="rounded border border-white/10 bg-midnight/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{step.label}</p>
                    <p className="text-premium-gold">{step.value}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatPercent(step.value, previous)} vom vorherigen Schritt · {formatPercent(step.value, total)} gesamt
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        <div className={panelClassName}>
          <h2 className="font-heading text-xl font-semibold">Umsatz</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <MetricRow label="Einmalige Verkäufe" value={`${setupRevenue.toLocaleString("de-DE")} €`} />
            <MetricRow label="Monatliche Verträge" value={`${monthlyRevenue.toLocaleString("de-DE")} €`} />
            <MetricRow label="Potenzial monatlich" value={`${potentialMonthlyRevenue.toLocaleString("de-DE")} €`} />
            <MetricRow label="Angebote angenommen" value={String(wonOffers.length)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MoreView({
  currentUser,
  data,
  onBackup,
  onClearLegacyData,
  onExport,
  onImport,
  onRestore,
  onUpdateData
}: {
  currentUser: SalesUser;
  data: SalesData;
  onBackup: () => void;
  onClearLegacyData: () => void;
  onExport: () => void;
  onImport: () => void;
  onRestore: (file: File) => void;
  onUpdateData: (updater: (currentData: SalesData) => SalesData) => void;
}) {
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<{
    contacts: number;
    offers: number;
    restaurants: number;
    tours: number;
  } | null>(null);

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
        <a className={outlineButtonClassName} href="/sales/pipeline">
          Pipeline öffnen
        </a>
        <a className={outlineButtonClassName} href="/sales/statistik">
          Statistik öffnen
        </a>
      </div>
      <div className={panelClassName}>
        <h2 className="font-heading text-xl font-semibold">Datensicherung</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Vollständiges Backup für Restaurants, Kontaktverlauf, Touren, Angebote
          und Paketvorlagen. Wichtig, solange die Daten noch lokal gespeichert
          werden.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button className={outlineButtonClassName} type="button" onClick={onBackup}>
            <Download aria-hidden="true" className="h-4 w-4" />
            Vollständiges Backup herunterladen
          </button>
          <button
            className={outlineButtonClassName}
            type="button"
            disabled={currentUser.role !== "admin"}
            onClick={() => backupInputRef.current?.click()}
          >
            <Upload aria-hidden="true" className="h-4 w-4" />
            {currentUser.role === "admin" ? "Backup wiederherstellen" : "Restore nur für Admin"}
          </button>
        </div>
        {backupPreview && backupFile ? (
          <div className="mt-4 rounded border border-premium-gold/30 bg-midnight/45 p-4 text-sm text-slate-300">
            <p className="font-heading text-lg font-semibold text-warm-white">Backup-Vorschau</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <span>{backupPreview.restaurants} Restaurants</span>
              <span>{backupPreview.contacts} Kontakte</span>
              <span>{backupPreview.tours} Touren</span>
              <span>{backupPreview.offers} Angebote</span>
            </div>
            <button
              className={`${goldButtonClassName} mt-4`}
              type="button"
              onClick={() => {
                if (window.confirm("Backup in die gemeinsame Datenbank importieren?")) {
                  onRestore(backupFile);
                  setBackupFile(null);
                  setBackupPreview(null);
                }
              }}
            >
              Import bestätigen
            </button>
          </div>
        ) : null}
        <button
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded border border-red-400/35 px-4 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/10"
          type="button"
          onClick={onClearLegacyData}
        >
          Alte lokale Daten löschen
        </button>
        <input
          ref={backupInputRef}
          accept="application/json"
          className="sr-only"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              const reader = new FileReader();
              reader.addEventListener("load", () => {
                try {
                  const payload = JSON.parse(String(reader.result)) as Partial<{
                    data: Partial<SalesData>;
                  }>;
                  const backupData = (payload.data ?? payload) as Partial<SalesData>;

                  setBackupFile(file);
                  setBackupPreview({
                    contacts: backupData.contact_history?.length ?? 0,
                    offers: backupData.offers?.length ?? 0,
                    restaurants: backupData.restaurants?.length ?? 0,
                    tours: backupData.tours?.length ?? 0
                  });
                } catch {
                  window.alert("Backup konnte nicht gelesen werden.");
                }
              });
              reader.readAsText(file);
            }

            event.target.value = "";
          }}
        />
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
      <MessageTemplatesPanel currentUser={currentUser} data={data} onUpdateData={onUpdateData} />
    </div>
  );
}

function MessageTemplatesPanel({
  currentUser,
  data,
  onUpdateData
}: {
  currentUser: SalesUser;
  data: SalesData;
  onUpdateData: (updater: (currentData: SalesData) => SalesData) => void;
}) {
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [draft, setDraft] = useState<MessageTemplate | null>(null);
  const activeTemplates = data.message_templates.filter((template) => template.is_active);

  function startNewTemplate() {
    const now = new Date().toISOString();
    setEditingTemplateId("new");
    setDraft({
      body: "Hallo {{contact_person}},\n\nhier ist der Link:\n{{demo_link}}\n\nViele Grüße\n{{user_name}}\nDINEVIO",
      category: "custom",
      channel: "whatsapp",
      created_at: now,
      created_by: currentUser.id,
      id: createId(),
      is_active: true,
      name: "Neuer Vorlage",
      subject: "",
      updated_at: now,
      updated_by: currentUser.id
    });
  }

  function editTemplate(template: MessageTemplate) {
    setEditingTemplateId(template.id);
    setDraft(template);
  }

  function saveTemplate() {
    if (!draft) {
      return;
    }

    const nextTemplate = {
      ...draft,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id
    };

    onUpdateData((currentData) => ({
      ...currentData,
      message_templates: currentData.message_templates.some((template) => template.id === nextTemplate.id)
        ? currentData.message_templates.map((template) =>
            template.id === nextTemplate.id ? nextTemplate : template
          )
        : [...currentData.message_templates, nextTemplate]
    }));
    setEditingTemplateId("");
    setDraft(null);
  }

  function duplicateTemplate(template: MessageTemplate) {
    const now = new Date().toISOString();
    onUpdateData((currentData) => ({
      ...currentData,
      message_templates: [
        ...currentData.message_templates,
        {
          ...template,
          created_at: now,
          created_by: currentUser.id,
          id: createId(),
          name: `${template.name} Kopie`,
          updated_at: now,
          updated_by: currentUser.id
        }
      ]
    }));
  }

  function archiveTemplate(templateId: string) {
    onUpdateData((currentData) => ({
      ...currentData,
      message_templates: currentData.message_templates.map((template) =>
        template.id === templateId
          ? {
              ...template,
              is_active: false,
              updated_at: new Date().toISOString(),
              updated_by: currentUser.id
            }
          : template
      )
    }));
  }

  return (
    <div className={panelClassName}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Nachrichtenvorlagen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            WhatsApp- und E-Mail-Texte mit Variablen wie {"{{restaurant_name}}"} oder {"{{demo_link}}"}.
          </p>
        </div>
        <button className={goldButtonClassName} type="button" onClick={startNewTemplate}>
          Vorlage erstellen
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        {activeTemplates.length === 0 ? <EmptyState text="Noch keine aktiven Vorlagen vorhanden." /> : null}
        {activeTemplates.map((template) => (
          <div key={template.id} className="rounded border border-white/10 bg-midnight/35 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-heading text-lg font-semibold">{template.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {template.channel} · {template.category || "custom"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={outlineButtonClassName} type="button" onClick={() => editTemplate(template)}>
                  Bearbeiten
                </button>
                <button className={outlineButtonClassName} type="button" onClick={() => duplicateTemplate(template)}>
                  Duplizieren
                </button>
                <button className="inline-flex min-h-11 items-center justify-center rounded border border-red-400/35 px-3 text-sm font-semibold text-red-200" type="button" onClick={() => archiveTemplate(template.id)}>
                  Archivieren
                </button>
              </div>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded bg-black/20 p-3 text-xs leading-5 text-slate-300">
              {renderMessageTemplatePreview(template)}
            </pre>
          </div>
        ))}
      </div>

      {draft ? (
        <div className="mt-5 rounded-lg border border-premium-gold/30 bg-midnight/55 p-4">
          <p className="font-heading text-lg font-semibold">
            {editingTemplateId === "new" ? "Neue Vorlage" : "Vorlage bearbeiten"}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
            <TextField label="Betreff" value={draft.subject} onChange={(value) => setDraft({ ...draft, subject: value })} />
            <SelectField label="Kanal" value={draft.channel} onChange={(value) => setDraft({ ...draft, channel: value as MessageTemplate["channel"] })} options={["whatsapp", "email", "sms", "internal"]} />
            <SelectField label="Kategorie" value={draft.category} onChange={(value) => setDraft({ ...draft, category: value as MessageTemplate["category"] })} options={["first_contact", "after_visit", "demo", "reminder", "offer", "follow_up", "appointment", "rejection", "custom"]} />
          </div>
          <label className="mt-4 block text-sm font-semibold">Text</label>
          <textarea
            value={draft.body}
            onChange={(event) => setDraft({ ...draft, body: event.target.value })}
            className={`${inputClassName} min-h-44 py-3`}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button className={goldButtonClassName} type="button" onClick={saveTemplate}>
              Vorlage speichern
            </button>
            <button className={outlineButtonClassName} type="button" onClick={() => setDraft(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      ) : null}
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

function RestaurantPhotosPanel({
  currentUser,
  data,
  onUpdateData,
  restaurant
}: {
  currentUser: SalesUser;
  data: SalesData;
  onUpdateData: (updater: (currentData: SalesData) => SalesData) => void;
  restaurant: Restaurant;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const photos = data.restaurant_photos
    .filter((photo) => photo.restaurant_id === restaurant.id)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || b.created_at.localeCompare(a.created_at));

  useEffect(() => {
    let active = true;

    async function loadSignedUrls() {
      if (!supabase || photos.length === 0) {
        setPreviewUrls({});
        return;
      }

      const entries = await Promise.all(
        photos.map(async (photo) => {
          const result = await photosService.createSignedUrl(supabase, photo.storage_path);
          return [photo.id, result.data ?? ""] as const;
        })
      );

      if (active) {
        setPreviewUrls(Object.fromEntries(entries.filter(([, url]) => Boolean(url))));
      }
    }

    void loadSignedUrls();

    return () => {
      active = false;
    };
  }, [photos, supabase]);

  async function uploadPhotos(files: FileList | null) {
    if (!files || !supabase || uploading) {
      return;
    }

    const acceptedFiles = Array.from(files).filter((file) => {
      const supported = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      const validSize = file.size <= 10 * 1024 * 1024;
      return supported && validSize;
    });

    if (acceptedFiles.length !== files.length) {
      setError("Einige Fotos wurden übersprungen. Erlaubt sind JPG, PNG, WebP bis 10 MB.");
    } else {
      setError("");
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    setUploading(true);

    for (const [fileIndex, file] of acceptedFiles.entries()) {
      const photoId = createId();
      const safeFileName = file.name.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
      const storagePath = `${restaurant.id}/${photoId}-${safeFileName}`;
      const uploadResult = await photosService.uploadFile(supabase, storagePath, file);

      if (uploadResult.error || !uploadResult.data) {
        setError(uploadResult.error ?? "Foto konnte nicht hochgeladen werden.");
        continue;
      }

      const now = new Date().toISOString();
      const photo: RestaurantPhoto = {
        caption: "",
        created_at: now,
        file_name: file.name,
        file_size: file.size,
        id: photoId,
        is_primary: photos.length === 0 && fileIndex === 0,
        mime_type: file.type,
        photo_type: "facade",
        restaurant_id: restaurant.id,
        storage_path: uploadResult.data,
        uploaded_by: currentUser.id
      };
      const createResult = await photosService.create(supabase, photo);

      if (createResult.error || !createResult.data) {
        setError(createResult.error ?? "Foto konnte nicht gespeichert werden.");
        continue;
      }

      onUpdateData((currentData) => ({
        ...currentData,
        contact_history: [
          ...currentData.contact_history,
          createHistoryEntry({
            action_type: "Foto hochgeladen",
            note: `Foto hochgeladen: ${file.name}.`,
            restaurant_id: restaurant.id,
            user_id: currentUser.id
          })
        ],
        restaurant_photos: [...currentData.restaurant_photos, createResult.data]
      }));
    }

    setUploading(false);
  }

  function setPrimaryPhoto(photoId: string) {
    onUpdateData((currentData) => ({
      ...currentData,
      restaurant_photos: currentData.restaurant_photos.map((photo) =>
        photo.restaurant_id === restaurant.id
          ? {
              ...photo,
              is_primary: photo.id === photoId
            }
          : photo
      )
    }));
  }

  async function removePhoto(photo: RestaurantPhoto) {
    if (!supabase || !window.confirm("Foto wirklich löschen?")) {
      return;
    }

    const result = await photosService.remove(supabase, photo);

    if (result.error) {
      setError(result.error);
      return;
    }

    onUpdateData((currentData) => ({
      ...currentData,
      contact_history: [
        ...currentData.contact_history,
        createHistoryEntry({
          action_type: "Foto gelöscht",
          note: `Foto gelöscht: ${photo.file_name || photo.storage_path}.`,
          restaurant_id: restaurant.id,
          user_id: currentUser.id
        })
      ],
      restaurant_photos: currentData.restaurant_photos.filter((candidate) => candidate.id !== photo.id)
    }));
  }

  return (
    <div className={panelClassName}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Fotos</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Fassaden, Innenraum, Speisekarte oder Logo direkt vom Telefon hochladen.
          </p>
        </div>
        <button
          className={goldButtonClassName}
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera aria-hidden="true" className="h-4 w-4" />
          {uploading ? "Fotos werden hochgeladen ..." : "Fotos hinzufügen"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="sr-only"
        multiple
        type="file"
        onChange={(event) => {
          void uploadPhotos(event.target.files);
          event.target.value = "";
        }}
      />
      {error ? (
        <p className="mt-4 rounded border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
          {error}
        </p>
      ) : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {photos.length === 0 ? <EmptyState text="Noch keine Fotos vorhanden." /> : null}
        {photos.map((photo) => {
          const previewUrl = previewUrls[photo.id];

          return (
            <div key={photo.id} className="rounded-lg border border-white/10 bg-midnight/40 p-3">
              {previewUrl ? (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Image
                    alt={`Foto von ${restaurant.name}`}
                    className="aspect-[4/3] w-full rounded object-cover"
                    height={240}
                    src={previewUrl}
                    width={320}
                  />
                </a>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded border border-white/10 text-premium-gold">
                  <ImageIcon aria-hidden="true" className="h-6 w-6" />
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={outlineButtonClassName} type="button" onClick={() => setPrimaryPhoto(photo.id)}>
                  {photo.is_primary ? "Hauptfoto" : "Als Hauptfoto"}
                </button>
                <button className="inline-flex min-h-11 items-center justify-center rounded border border-red-400/35 px-3 text-sm font-semibold text-red-200" type="button" onClick={() => void removePhoto(photo)}>
                  Löschen
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
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
      status: "draft",
      updated_at: new Date().toISOString(),
      valid_until: "",
    }
  );
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPdfUrl() {
      if (!supabase || !offer.pdf_storage_path) {
        setPdfUrl("");
        return;
      }

      const result = await storageService.createSignedUrl(supabase, "offers", offer.pdf_storage_path, 60 * 15);

      if (active) {
        setPdfUrl(result.data ?? "");
      }
    }

    void loadPdfUrl();

    return () => {
      active = false;
    };
  }, [offer.pdf_storage_path, supabase]);

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
          nextOffer.status === "sent"
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
          nextOffer.status === "sent"
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

  async function generatePdf() {
    saveOffer();
    setPdfBusy(true);
    setPdfError("");

    try {
      const response = await fetch(`/api/sales/offers/${offer.id}/pdf`, {
        body: JSON.stringify({ offer }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as {
        message?: string;
        offer?: Partial<Offer>;
      };

      if (!response.ok || !payload.offer) {
        setPdfError(payload.message ?? "PDF konnte nicht erstellt werden.");
        return;
      }

      const nextOffer = {
        ...offer,
        ...payload.offer
      };
      setOffer(nextOffer);
      onUpdateData((currentData) => ({
        ...currentData,
        offers: currentData.offers.some((candidate) => candidate.id === nextOffer.id)
          ? currentData.offers.map((candidate) =>
              candidate.id === nextOffer.id ? nextOffer : candidate
            )
          : [...currentData.offers, nextOffer]
      }));
    } catch {
      setPdfError("PDF konnte nicht erstellt werden.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className={panelClassName}>
      <h2 className="font-heading text-xl font-semibold">Angebot</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SelectField label="Paket" value={offer.package_name} onChange={(value) => updateField("package_name", value)} options={data.package_templates.map((packageTemplate) => packageTemplate.name)} />
        <SelectField label="Status" value={offer.status} onChange={(value) => updateField("status", value as Offer["status"])} options={offerStatuses} labels={offerStatusLabels} />
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
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <button className={outlineButtonClassName} type="button" onClick={generatePdf} disabled={pdfBusy}>
          <FileText aria-hidden="true" className="h-4 w-4" />
          {pdfBusy ? "PDF wird erstellt ..." : "PDF erstellen"}
        </button>
        <button className={outlineButtonClassName} type="button" onClick={() => onCopy(pdfUrl || "PDF noch nicht erstellt")} disabled={!pdfUrl}>
          <Clipboard aria-hidden="true" className="h-4 w-4" />
          Link kopieren
        </button>
        {pdfUrl ? (
          <>
            <a className={outlineButtonClassName} href={pdfUrl} target="_blank" rel="noopener noreferrer">
              PDF ansehen
            </a>
            <a className={outlineButtonClassName} href={pdfUrl} download>
              PDF herunterladen
            </a>
          </>
        ) : null}
      </div>
      {pdfError ? (
        <p className="mt-3 rounded border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
          {pdfError}
        </p>
      ) : null}
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
  tasks: TaskItem[];
  title: string;
  users: SalesUser[];
}) {
  return (
    <div className={panelClassName}>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {tasks.length === 0 ? <EmptyState text="Keine offenen Aufgaben." /> : null}
        {tasks.map((task) => {
          const overdue = isOverdue(task.due_at);
          const restaurant = task.restaurant;

          return (
            <button
              key={`${title}-${task.id}`}
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
                    {task.title}: {formatDateTime(task.due_at)}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {getUserName(users, task.assigned_to)}
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
  return <TextField label={label} onChange={onChange} type="datetime-local" value={toDateTimeLocalValue(value)} />;
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
    message_templates: partialData.message_templates ?? [],
    offers: partialData.offers ?? [],
    package_templates: partialData.package_templates ?? initialPackageTemplates,
    restaurant_photos: partialData.restaurant_photos ?? [],
    restaurants: (partialData.restaurants ?? []).map(normalizeRestaurant),
    sales_settings: partialData.sales_settings ?? [],
    tasks: partialData.tasks ?? [],
    tour_stops: partialData.tour_stops ?? [],
    tours: partialData.tours ?? [],
    users: partialData.users ?? salesUsers
  };
}

function hasLegacyLocalSalesData() {
  if (typeof window === "undefined") {
    return false;
  }

  if (
    window.localStorage.getItem("supabaseMigrationCompleted") ||
    window.localStorage.getItem("supabaseMigrationDismissed")
  ) {
    return false;
  }

  const storedData = window.localStorage.getItem(storageKey);

  if (!storedData) {
    return false;
  }

  try {
    const dataToCheck = JSON.parse(storedData) as Partial<SalesData>;
    return Boolean(
      dataToCheck.restaurants?.length ||
        dataToCheck.contact_history?.length ||
        dataToCheck.tours?.length ||
        dataToCheck.offers?.length ||
        dataToCheck.tasks?.length ||
        dataToCheck.restaurant_photos?.length
    );
  } catch {
    return false;
  }
}

function mergeUsers(users: SalesUser[], currentUser: SalesUser) {
  return users.some((user) => user.id === currentUser.id)
    ? users
    : [...users, currentUser].sort((a, b) => a.name.localeCompare(b.name));
}

function remapLegacyUserIds(
  legacyData: SalesData,
  users: SalesUser[],
  fallbackUserId: string
): SalesData {
  const findUserId = (legacyId: string) => {
    if (users.some((user) => user.id === legacyId)) {
      return legacyId;
    }

    const matchingUser = users.find((user) =>
      user.name.toLowerCase().startsWith(legacyId.toLowerCase())
    );

    return matchingUser?.id ?? fallbackUserId;
  };

  return {
    ...legacyData,
    contact_history: legacyData.contact_history.map((entry) => ({
      ...entry,
      user_id: findUserId(entry.user_id)
    })),
    offers: legacyData.offers.map((offer) => ({
      ...offer,
      created_by: findUserId(offer.created_by)
    })),
    restaurants: legacyData.restaurants.map((restaurant) => ({
      ...restaurant,
      created_by: findUserId(restaurant.created_by),
      responsible_user_id: findUserId(restaurant.responsible_user_id),
      updated_by: findUserId(restaurant.updated_by)
    })),
    restaurant_photos: legacyData.restaurant_photos.map((photo) => ({
      ...photo,
      uploaded_by: findUserId(photo.uploaded_by)
    })),
    tasks: legacyData.tasks.map((task) => ({
      ...task,
      assigned_to: findUserId(task.assigned_to),
      completed_by: task.completed_by ? findUserId(task.completed_by) : "",
      created_by: findUserId(task.created_by)
    })),
    tours: legacyData.tours.map((tour) => ({
      ...tour,
      responsible_user_id: findUserId(tour.responsible_user_id)
    })),
    users
  };
}

function createRestaurantDuplicateKey(restaurant: Restaurant) {
  return [
    restaurant.name,
    restaurant.street,
    restaurant.house_number,
    restaurant.postal_code,
    restaurant.city,
    restaurant.phone
  ]
    .map((value) => normalizeLookupText(value))
    .join("|");
}

function normalizeRestaurantDraft(partialDraft: Partial<RestaurantDraft>): RestaurantDraft {
  return {
    ...emptyDraft,
    ...partialDraft,
    digital_presence: partialDraft.digital_presence ?? null,
    google_rating: partialDraft.google_rating ?? null,
    google_review_count: partialDraft.google_review_count ?? null,
    interest_level: partialDraft.interest_level ?? null,
    opening_hours: partialDraft.opening_hours ?? [],
    photos: partialDraft.photos ?? []
  };
}

function normalizeRestaurant(restaurant: Restaurant): Restaurant {
  return {
    ...restaurant,
    ...normalizeRestaurantDraft(restaurant),
    archived: restaurant.archived,
    created_at: restaurant.created_at,
    created_by: restaurant.created_by,
    id: restaurant.id,
    updated_at: restaurant.updated_at,
    updated_by: restaurant.updated_by
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
  channel = "",
  contact_person = "",
  direction = "",
  message_template_id = "",
  message_text = "",
  metadata,
  new_status = "",
  next_contact_at = "",
  note = "",
  offer_id = "",
  old_status = "",
  restaurant_id,
  task_id = "",
  title = "",
  user_id
}: {
  action_type: ContactActionType;
  channel?: ContactHistoryEntry["channel"];
  contact_person?: string;
  direction?: ContactHistoryEntry["direction"];
  message_template_id?: string;
  message_text?: string;
  metadata?: Record<string, unknown>;
  new_status?: RestaurantStatus | "";
  next_contact_at?: string;
  note?: string;
  offer_id?: string;
  old_status?: RestaurantStatus | "";
  restaurant_id: string;
  task_id?: string;
  title?: string;
  user_id: SalesUserId;
}): ContactHistoryEntry {
  const now = new Date().toISOString();

  return {
    action_type,
    channel,
    contact_at: now,
    contact_person,
    created_at: now,
    direction,
    id: createId(),
    message_template_id,
    message_text,
    metadata,
    new_status,
    next_contact_at,
    note,
    offer_id,
    old_status,
    restaurant_id,
    task_id,
    title,
    user_id
  };
}

function createTaskFromNextContact({
  currentUserId,
  nextContactAt,
  nextContactType,
  restaurant
}: {
  currentUserId: SalesUserId;
  nextContactAt: string;
  nextContactType: ContactType | "";
  restaurant: Restaurant;
}): SalesTask {
  const now = new Date().toISOString();
  const taskType = mapContactTypeToTaskType(nextContactType);

  return {
    assigned_to: restaurant.responsible_user_id || currentUserId,
    completed_at: "",
    completed_by: "",
    created_at: now,
    created_by: currentUserId,
    description: "",
    due_at: nextContactAt,
    id: createId(),
    priority: "normal",
    related_offer_id: "",
    restaurant_id: restaurant.id,
    status: "open",
    task_type: taskType,
    title: createTaskTitle(nextContactType),
    updated_at: now
  };
}

function mapContactTypeToTaskType(contactType: ContactType | ""): SalesTask["task_type"] {
  if (contactType === "Anrufen") {
    return "call";
  }

  if (contactType === "WhatsApp") {
    return "whatsapp";
  }

  if (contactType === "Erneut besuchen") {
    return "visit";
  }

  if (contactType === "Angebot senden") {
    return "send_offer";
  }

  if (contactType === "E-Mail senden") {
    return "email";
  }

  return "follow_up";
}

function createTaskTitle(contactType: ContactType | "") {
  if (contactType === "Anrufen") {
    return "Restaurant anrufen";
  }

  if (contactType === "WhatsApp") {
    return "WhatsApp schreiben";
  }

  if (contactType === "Erneut besuchen") {
    return "Erneut besuchen";
  }

  if (contactType === "Angebot senden") {
    return "Angebot senden";
  }

  if (contactType === "E-Mail senden") {
    return "E-Mail senden";
  }

  return "Follow-up";
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
  const streetLine = [restaurant.street, restaurant.house_number].filter(Boolean).join(" ");
  return [streetLine, restaurant.postal_code, restaurant.city].filter(Boolean).join(", ");
}

function getMapsUrl(restaurant: Restaurant) {
  if (restaurant.google_maps_url) {
    return restaurant.google_maps_url;
  }

  if (restaurant.latitude && restaurant.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${restaurant.latitude},${restaurant.longitude}`
    )}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    formatAddress(restaurant) || restaurant.name
  )}`;
}

function hasNavigationTarget(restaurant: Restaurant) {
  return Boolean(
    restaurant.google_maps_url ||
      (restaurant.latitude && restaurant.longitude) ||
      formatAddress(restaurant)
  );
}

function getDemoUrl(demoId: DemoId) {
  return demoOptions[demoId]?.url ?? "";
}

function getRestaurantDemoUrl(restaurant: Restaurant) {
  if (restaurant.selected_demo === "custom" && restaurant.custom_demo_url) {
    return restaurant.custom_demo_url;
  }

  return getDemoUrl(restaurant.selected_demo);
}

function formatCandidateAddress(candidate: RestaurantLookupCandidate) {
  const streetLine = [candidate.street, candidate.house_number].filter(Boolean).join(" ");
  return [streetLine, candidate.postal_code, candidate.city].filter(Boolean).join(", ");
}

function findDuplicateRestaurant(
  candidate: RestaurantLookupCandidate,
  restaurants: Restaurant[]
) {
  const candidateName = normalizeLookupText(candidate.name);
  const candidateAddress = normalizeLookupText(formatCandidateAddress(candidate));
  const candidateLat = Number(candidate.latitude);
  const candidateLng = Number(candidate.longitude);

  return (
    restaurants.find((restaurant) => {
      const nameMatches = normalizeLookupText(restaurant.name) === candidateName;
      const addressMatches =
        Boolean(candidateAddress) && normalizeLookupText(formatAddress(restaurant)) === candidateAddress;
      const restaurantLat = Number(restaurant.latitude);
      const restaurantLng = Number(restaurant.longitude);
      const coordinateMatches =
        Number.isFinite(candidateLat) &&
        Number.isFinite(candidateLng) &&
        Number.isFinite(restaurantLat) &&
        Number.isFinite(restaurantLng) &&
        Math.abs(candidateLat - restaurantLat) < 0.00035 &&
        Math.abs(candidateLng - restaurantLng) < 0.00035;

      return (nameMatches && addressMatches) || coordinateMatches;
    }) ?? null
  );
}

function normalizeLookupText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

function formatPresenceValue(value: boolean | null) {
  if (value === null) {
    return "nicht bekannt";
  }

  return value ? "ja" : "nein";
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
  return toLocalDateKey(new Date());
}

function isSameDay(value: string) {
  if (!value) {
    return false;
  }

  return toLocalDateKey(value) === todayInputValue();
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

function toDateTimeLocalValue(value: string) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${toLocalDateKey(date)}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function toLocalDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value.slice(0, 10) : "";
  }

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join("-");
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function getDueTasks(restaurants: Restaurant[], tasks: SalesTask[]) {
  return getTaskItems(restaurants, tasks)
    .filter((task) => isSameDay(task.due_at) || isOverdue(task.due_at))
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
}

function getNextSevenDayTasks(restaurants: Restaurant[], tasks: SalesTask[]) {
  const today = startOfToday().getTime();
  const sevenDays = today + 7 * 24 * 60 * 60 * 1000;

  return getTaskItems(restaurants, tasks)
    .filter((task) => {
      const time = new Date(task.due_at).getTime();
      return time >= today && time <= sevenDays;
    })
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
}

function getTaskItems(restaurants: Restaurant[], tasks: SalesTask[]): TaskItem[] {
  const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
  const taskItems = tasks
    .filter((task) => task.status !== "completed" && task.status !== "cancelled")
    .map((task): TaskItem | null => {
      const restaurant = restaurantById.get(task.restaurant_id);

      if (!restaurant || !task.due_at) {
        return null;
      }

      return {
        assigned_to: task.assigned_to || restaurant.responsible_user_id,
        due_at: task.due_at,
        id: task.id,
        restaurant,
        source: "task",
        task,
        title: task.title || "Aufgabe"
      };
    })
    .filter((task): task is TaskItem => Boolean(task));

  const persistedTaskRestaurantIds = new Set(taskItems.map((task) => task.restaurant.id));
  const legacyItems = restaurants.flatMap((restaurant): TaskItem[] => {
    if (persistedTaskRestaurantIds.has(restaurant.id)) {
      return [];
    }

    const items: TaskItem[] = [];

    if (restaurant.next_contact_at) {
      items.push({
        assigned_to: restaurant.responsible_user_id,
        due_at: restaurant.next_contact_at,
        id: `${restaurant.id}-next-contact`,
        restaurant,
        source: "restaurant",
        title: restaurant.next_contact_type || "Nächster Kontakt"
      });
    }

    if (restaurant.planned_visit_at) {
      items.push({
        assigned_to: restaurant.responsible_user_id,
        due_at: restaurant.planned_visit_at,
        id: `${restaurant.id}-planned-visit`,
        restaurant,
        source: "restaurant",
        title: "Geplanter Besuch"
      });
    }

    return items;
  });

  return [...taskItems, ...legacyItems];
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

function renderMessageTemplatePreview(template: MessageTemplate) {
  const variables: Record<string, string> = {
    contact_person: "Herr Müller",
    demo_link: "http://schnellundlecker.dinevio.de",
    dinevio_website: "https://www.dinevio.de",
    next_contact_date: "morgen",
    offer_link: "[Angebotslink]",
    offer_number: "DV-2026-0001",
    restaurant_name: "Restaurant Beispiel",
    user_name: "DINEVIO",
    user_phone: "+49 ..."
  };

  return template.body.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_match, key: string) => variables[key] ?? "");
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-white/10 bg-midnight/35 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-warm-white">{value}</span>
    </div>
  );
}

function parseCurrencyValue(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : 0;
}

function formatPercent(value: number, base: number) {
  if (base <= 0) {
    return "0 %";
  }

  return `${((value / base) * 100).toLocaleString("de-DE", {
    maximumFractionDigits: 1
  })} %`;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
