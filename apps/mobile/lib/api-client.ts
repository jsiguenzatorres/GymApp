const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Registered by _layout.tsx on app start — auto-refresh on 401
let _tokenRefresher: (() => Promise<string | null>) | null = null;
export function setTokenRefresher(fn: () => Promise<string | null>) {
  _tokenRefresher = fn;
}

async function rawFetch<T>(path: string, options: RequestInit, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(body.message ?? `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

async function request<T>(
  path: string,
  options: RequestInit,
  accessToken?: string,
  skipRefresh = false,
): Promise<T> {
  try {
    return await rawFetch<T>(path, options, accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !skipRefresh && _tokenRefresher) {
      const newToken = await _tokenRefresher();
      if (newToken) return rawFetch<T>(path, options, newToken);
    }
    throw err;
  }
}

export const apiClient = {
  post: <T>(path: string, body: unknown, token?: string, skipRefresh = false) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token, skipRefresh),

  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET' }, token),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),

  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, token),

  delete: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }, token),
};

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    gymId?: string;
    firstName?: string;
    lastName?: string;
    twoFaEnabled: boolean;
  };
}

export const authApi = {
  login: (email: string, password: string, totp?: string) =>
    apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password, totp }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh',
      { refreshToken },
      undefined,
      true, // skipRefresh — avoid infinite loop
    ),

  me: (token: string) => apiClient.get<LoginResponse['user']>('/api/v1/auth/me', token),
};

export interface MemberProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string | null;
  status: string;
  risk_score?: number;
  user: { email: string; last_login_at?: string };
  memberships: Array<{
    id: string;
    status: string;
    start_date: string;
    end_date: string;
    type: { name: string; price: number; duration_days: number };
  }>;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  blocks: Array<{
    id: string;
    name: string;
    block_type: string;
    sort_order: number;
    exercises: Array<{
      id: string;
      sets: number;
      reps_min: number;
      reps_max: number;
      rest_seconds: number;
      sort_order: number;
      exercise: { id: string; name: string; muscle_groups: string[] };
    }>;
  }>;
}

export interface WorkoutSession {
  id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  plan: { name: string } | null;
}

export interface PersonalRecord {
  id: string;
  value: number;
  unit: string;
  achieved_at: string;
  exercise: { name: string };
}

export interface QrCodePayload {
  qrPayload: string;
  expiresAt: string;
}

export interface MemberHomeStats {
  member_id: string;
  streak_days: number;
  sessions_this_week: number;
  sessions_week_goal: number;
  points_lifetime: number;
  points_balance: number;
  last_session_at: string | null;
  last_pr: {
    value: string | number;
    unit: string;
    achieved_at: string;
    exercise: { name: string };
  } | null;
  next_planned_workout: {
    plan_name: string;
    day_name: string | null;
    day_number: number | null;
  } | null;
}

export interface VolumeWeeklyResponse {
  weekly: Array<{ week_start: string; sessions: number; volume_kg: number; sets: number }>;
  this_week_volume_kg: number;
  last_week_volume_kg: number;
  trend_pct: number | null;
  avg_volume_kg: number;
  top_exercises: Array<{ id: string; name: string; volume_kg: number; sets: number }>;
}

export interface ProgressPhoto {
  id: string;
  member_id: string;
  url: string;
  category: 'FRONT' | 'SIDE' | 'BACK' | 'CUSTOM';
  weight_kg: string | number | null;
  note: string | null;
  taken_at: string;
  created_at: string;
}

export type AddonTier = 'BASIC' | 'PRO' | 'ELITE';
export interface MemberAddon {
  id: string;
  type: 'NUTRITION';
  tier: AddonTier;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  starts_at: string;
  ends_at: string | null;
  price_paid: string | number | null;
  currency: string;
  notes: string | null;
}
export interface MyAddonsResponse {
  addons: MemberAddon[];
  effective: { nutrition_tier: AddonTier };
}

export const memberApi = {
  getMe: (token: string) => apiClient.get<MemberProfile>('/api/v1/members/me', token),
  getMyStats: (token: string) => apiClient.get<MemberHomeStats>('/api/v1/members/me/stats', token),
  getMyAddons: (token: string) =>
    apiClient.get<MyAddonsResponse>('/api/v1/members/me/addons', token),
  getMyVolumeWeekly: (token: string, weeks = 8) =>
    apiClient.get<VolumeWeeklyResponse>(`/api/v1/members/me/volume-weekly?weeks=${weeks}`, token),
  listMyProgressPhotos: (token: string) =>
    apiClient.get<ProgressPhoto[]>('/api/v1/members/me/progress-photos', token),
  uploadMyProgressPhoto: (
    token: string,
    body: {
      image: string;
      category?: 'FRONT' | 'SIDE' | 'BACK' | 'CUSTOM';
      weight_kg?: number;
      note?: string;
      taken_at?: string;
    },
  ) => apiClient.post<ProgressPhoto>('/api/v1/members/me/progress-photos', body, token),
  deleteMyProgressPhoto: (token: string, id: string) =>
    apiClient.delete<void>(`/api/v1/members/me/progress-photos/${id}`, undefined, token),
  uploadAvatar: (token: string, imageDataUri: string) =>
    apiClient.post<{ id: string; avatar_url: string }>(
      '/api/v1/members/me/avatar',
      { image: imageDataUri },
      token,
    ),
  getProgressPdfUrl: (month?: string) =>
    `${API_URL}/api/v1/members/me/progress-pdf${month ? `?month=${month}` : ''}`,
  getPlans: (memberId: string, token: string) =>
    apiClient.get<WorkoutPlan[]>(`/api/v1/members/${memberId}/plans`, token),
  getSessions: (memberId: string, token: string) =>
    apiClient.get<{ data: WorkoutSession[] }>(
      `/api/v1/members/${memberId}/workout-sessions`,
      token,
    ),
  getPRs: (memberId: string, token: string) =>
    apiClient.get<PersonalRecord[]>(`/api/v1/members/${memberId}/personal-records`, token),
};

export const accessApi = {
  getMyQr: (token: string) => apiClient.get<QrCodePayload>('/api/v1/access/my-qr', token),
};

export const zeusApi = {
  chat: (message: string, token: string, memberId?: string) =>
    apiClient.post<{ reply: string }>('/api/v1/workout/zeus/chat', { message, memberId }, token),
};

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  stock: number;
  sku?: string;
  image_url?: string;
  is_active: boolean;
  category_id: string;
  category?: { name: string };
}

export interface NutritionPlan {
  id: string;
  name: string;
  goal: string;
  kcal_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_active: boolean;
  notes?: string;
  member: { id: string; first_name: string; last_name: string };
}

export interface DiaryEntry {
  id: string;
  meal_type: string;
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  food_item: { name: string; brand?: string };
}

export interface DiaryDay {
  entries: DiaryEntry[];
  totals: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
}

export const marketplaceApi = {
  getCategories: (token: string) =>
    apiClient.get<ProductCategory[]>('/api/v1/product-categories', token),
  getProducts: (token: string, categoryId?: string) =>
    apiClient.get<Product[]>(
      `/api/v1/products${categoryId ? `?categoryId=${categoryId}` : ''}`,
      token,
    ),
  createOrder: (
    token: string,
    body: { items: { productId: string; quantity: number }[]; notes?: string },
  ) => apiClient.post<{ id: string; status: string }>('/api/v1/marketplace-orders', body, token),
  identifyByPhoto: (token: string, image: string, mimeType: string) =>
    apiClient.post<{
      identified: { name: string; brand?: string } | null;
      matches: Array<{
        id: string;
        name: string;
        price: string;
        confidence: number;
        description?: string;
      }>;
    }>('/api/v1/products/by-photo', { image, mimeType }, token),
};

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  barcode?: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  is_verified: boolean;
  source?: string | null;
}

export interface DiaryRangeDay {
  date: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  entries: number;
}
export interface DiaryRange {
  daily: DiaryRangeDay[];
  days_with_logs: number;
  avg_kcal: number;
  range_start: string;
  range_end: string;
}

export const nutritionApi = {
  getMyPlans: (memberId: string, token: string) =>
    apiClient.get<NutritionPlan[]>(`/api/v1/nutrition-plans?memberId=${memberId}`, token),
  getDiary: (memberId: string, date: string, token: string) =>
    apiClient.get<DiaryDay>(`/api/v1/members/${memberId}/food-diary?date=${date}`, token),
  getDiaryRange: (memberId: string, token: string, days = 30) =>
    apiClient.get<DiaryRange>(`/api/v1/members/${memberId}/food-diary/range?days=${days}`, token),
  searchFoodItems: (token: string, search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient.get<FoodItem[]>(`/api/v1/food-items${q}`, token);
  },
  logFood: (
    token: string,
    memberId: string,
    body: {
      food_item_id: string;
      plan_id?: string;
      date: string; // YYYY-MM-DD
      meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
      quantity_g: number;
      notes?: string;
    },
  ) =>
    apiClient.post<DiaryDay['entries'][number]>(
      `/api/v1/members/${memberId}/food-diary`,
      body,
      token,
    ),
  deleteDiaryEntry: (token: string, entryId: string) =>
    apiClient.delete<void>(`/api/v1/food-diary/${entryId}`, undefined, token),
  aiSuggest: (planId: string, memberId: string, context: string, token: string) =>
    apiClient.post<{ suggestion: string }>(
      '/api/v1/nutrition/ai-suggest',
      { planId, memberId, context },
      token,
    ),
  analyzePhoto: (token: string, imageDataUri: string) =>
    apiClient.post<PhotoAnalyzeResponse>(
      '/api/v1/nutrition/photo-analyze',
      { image: imageDataUri },
      token,
    ),
  generateRecipe: (token: string, ingredients: string[], preferences?: string) =>
    apiClient.post<RecipeGenResponse>(
      '/api/v1/nutrition/recipes/generate',
      { ingredients, preferences },
      token,
    ),
  generateShoppingList: (token: string, memberId: string) =>
    apiClient.post<ShoppingListResponse>(
      '/api/v1/nutrition/shopping-list/generate',
      { memberId },
      token,
    ),
  findByBarcode: (token: string, code: string) =>
    apiClient.get<BarcodeLookupResponse>(`/api/v1/food-items/by-barcode/${code}`, token),
  logFromText: (token: string, memberId: string, text: string) =>
    apiClient.post<TextLogResponse>('/api/v1/nutrition/log-from-text', { memberId, text }, token),
  adaptiveAnalysis: (token: string, memberId: string) =>
    apiClient.post<AdaptiveAnalysisResponse>(
      '/api/v1/nutrition/adaptive-analysis',
      { memberId },
      token,
    ),
  adaptiveApply: (
    token: string,
    body: { memberId: string; target_kcal_delta?: number; target_protein_g_delta?: number },
  ) => apiClient.post('/api/v1/nutrition/adaptive-apply', body, token),
};

// ─── Health Data API ───────────────────────────────────────────────────────
export type HealthKind = 'WEIGHT' | 'WATER' | 'SLEEP' | 'STEPS' | 'HEART_RATE' | 'HRV';

export interface HealthEntry {
  id: string;
  kind: HealthKind;
  value: number | string;
  unit: string;
  recorded_at: string;
  notes?: string | null;
}

export interface HealthSummary {
  latest: Partial<Record<HealthKind, { value: number; recorded_at: string; unit: string }>>;
  weight_trend: { latest: number; previous: number; delta_kg: number; days_between: number } | null;
  water_avg_ml_7d: number;
  total_entries_30d: number;
}

export const healthDataApi = {
  log: (token: string, body: { kind: HealthKind; value: number; unit?: string; notes?: string }) =>
    apiClient.post<HealthEntry>('/api/v1/me/health-data', body, token),
  list: (token: string, kind?: HealthKind, days = 30) =>
    apiClient.get<HealthEntry[]>(
      `/api/v1/me/health-data?days=${days}${kind ? `&kind=${kind}` : ''}`,
      token,
    ),
  summary: (token: string) => apiClient.get<HealthSummary>('/api/v1/me/health-data/summary', token),
  delete: (token: string, id: string) => apiClient.delete(`/api/v1/me/health-data/${id}`, token),
};

// ─── Notification Preferences API ─────────────────────────────────────────
export type NotifKind =
  | 'MEAL_REMINDER_BREAKFAST'
  | 'MEAL_REMINDER_LUNCH'
  | 'MEAL_REMINDER_DINNER'
  | 'WATER_HOURLY'
  | 'WORKOUT_REMINDER'
  | 'STREAK_AT_RISK';

export interface NotifPref {
  id: string;
  kind: NotifKind;
  enabled: boolean;
  time_of_day: string | null;
}

export interface ZeusResponse {
  response: string;
  isStub?: boolean;
  error?: boolean;
}

export const workoutApi = {
  zeusChat: (token: string, message: string, memberId?: string) =>
    apiClient.post<ZeusResponse>('/api/v1/workout/zeus/chat', { message, memberId }, token),
};

// ─── Membership self-service (E3) ───────────────────────────────────────
export interface MembershipType {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  duration_days: number;
  billing_frequency: string;
  max_freezes: number;
  max_freeze_days: number;
}

// ─── Credit en cuenta (E5) ──────────────────────────────────────────────
export interface CreditTransaction {
  id: string;
  kind: 'CHARGE' | 'PAYMENT' | 'USE' | 'REFUND';
  amount_usd: string | number;
  balance_after: string | number;
  note: string | null;
  related_order_id: string | null;
  created_at: string;
}

export interface LastOrderWithItems {
  id: string;
  status: string;
  total: string | number;
  created_at: string;
  items: Array<{
    id: string;
    quantity: number;
    unit_price: string | number;
    subtotal: string | number;
    product: {
      id: string;
      name: string;
      price: string | number;
      image_url: string | null;
      is_active: boolean;
      stock: number;
    };
  }>;
}

export const creditApi = {
  getMyBalance: (token: string) =>
    apiClient.get<{ balance_usd: number }>('/api/v1/me/credit', token),
  getMyHistory: (token: string, limit = 30) =>
    apiClient.get<CreditTransaction[]>(`/api/v1/me/credit/history?limit=${limit}`, token),
  getMyLastOrders: (token: string, limit = 5) =>
    apiClient.get<LastOrderWithItems[]>(`/api/v1/me/marketplace/last-orders?limit=${limit}`, token),
};

export const membershipApi = {
  requestFreeze: (token: string, body: { duration_days: number; reason?: string }) =>
    apiClient.post<{ message: string; freezeEndsAt: string }>(
      '/api/v1/members/me/membership/request-freeze',
      body,
      token,
    ),
  requestCancel: (token: string, reason: string) =>
    apiClient.post<{ message: string }>(
      '/api/v1/members/me/membership/request-cancel',
      { reason },
      token,
    ),
  typesAvailable: (token: string) =>
    apiClient.get<MembershipType[]>('/api/v1/members/me/membership/types-available', token),
  requestChange: (token: string, body: { new_type_id: string; reason?: string }) =>
    apiClient.post<{
      message: string;
      requested_type: { id: string; name: string; price: number };
    }>('/api/v1/members/me/membership/request-change', body, token),
};

export const notifPrefsApi = {
  list: (token: string) => apiClient.get<NotifPref[]>('/api/v1/me/notification-prefs', token),
  seed: (token: string) =>
    apiClient.post<NotifPref[]>('/api/v1/me/notification-prefs/seed', {}, token),
  upsert: (token: string, body: { kind: NotifKind; enabled: boolean; time_of_day?: string }) =>
    apiClient.put<NotifPref>('/api/v1/me/notification-prefs', body, token),
};

// ─── Monthly Box API (D-22) ──────────────────────────────────────────────
export interface MonthlyBox {
  id: string;
  month: string;
  title: string;
  description: string | null;
  contents: Array<{ name: string; brand?: string; quantity: number; qty_unit?: string }>;
  cover_url: string | null;
  delivery_date: string | null;
}

export interface BoxRequest {
  id: string;
  status: 'REQUESTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  delivery_address: string | null;
  notes: string | null;
  requested_at: string;
  delivered_at: string | null;
}

export interface MonthlyBoxResponse {
  box: MonthlyBox | null;
  my_request: BoxRequest | null;
  tier: 'BASIC' | 'PRO' | 'ELITE';
}

export const monthlyBoxApi = {
  getCurrent: (token: string) => apiClient.get<MonthlyBoxResponse>('/api/v1/me/monthly-box', token),
  request: (token: string, body: { delivery_address?: string; notes?: string }) =>
    apiClient.post<BoxRequest>('/api/v1/me/monthly-box/request', body, token),
};

export interface AdaptiveAnalysisResponse {
  success: boolean;
  error?: string;
  plan_id?: string;
  current_targets?: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  progress?: {
    weight_change_kg: number | null;
    sessions_28d: number;
    adherence_pct: number;
    avg_kcal: number;
  };
  analysis?: {
    verdict: 'on_track' | 'needs_adjustment' | 'needs_complete_review';
    headline: string;
    diagnosis: string;
    adjustments: {
      target_kcal_delta: number;
      target_protein_g_delta: number;
      rationale: string;
    };
    recommendations: string[];
    next_review_in_days: number;
  };
  generated_at?: string;
}

export interface BarcodeLookupResponse {
  found: boolean;
  source?: 'local' | 'openfoodfacts';
  item?: FoodItem;
  error?: string;
}

export interface TextLogResponse {
  success: boolean;
  items: Array<{ name: string; grams: number; meal_type: string }>;
  registered: Array<{ name: string; grams: number; kcal: number; matched: boolean }>;
  note?: string;
  error?: string;
}

export interface PhotoAnalyzeItem {
  name: string;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
export interface PhotoAnalyzeResponse {
  success: boolean;
  items: PhotoAnalyzeItem[];
  totals: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  confidence: 'low' | 'medium' | 'high';
  note: string;
  error?: string;
}

export interface Recipe {
  title: string;
  description: string;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  ingredients: Array<{ name: string; quantity: string; notes?: string }>;
  steps: string[];
  macros_per_serving: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  tips: string[];
}
export interface RecipeGenResponse {
  success: boolean;
  recipe: Recipe | null;
  error?: string;
}

export interface ShoppingListResponse {
  success: boolean;
  estimated_cost_usd?: number;
  categories: Array<{
    name: string;
    items: Array<{ name: string; quantity: string; purpose?: string }>;
  }>;
  tips: string[];
  error?: string;
}

export const sessionApi = {
  getDetail: (token: string, sessionId: string) =>
    apiClient.get<{
      id: string;
      status: string;
      started_at: string;
      finished_at?: string;
      duration_seconds?: number;
      perceived_effort?: number;
      notes?: string;
      plan: { name: string } | null;
      sets: Array<{
        id: string;
        set_number: number;
        reps?: number;
        weight_kg?: number;
        exercise: { name: string };
      }>;
    }>(`/api/v1/workout-sessions/${sessionId}`, token),

  start: (
    token: string,
    body: { memberId: string; planId?: string; planDayId?: string; name?: string },
  ) =>
    apiClient.post<{ id: string; status: string; started_at: string }>(
      '/api/v1/workout-sessions',
      body,
      token,
    ),

  logSet: (
    token: string,
    sessionId: string,
    body: {
      exerciseId: string;
      setNumber: number;
      reps?: number;
      weightKg?: number;
      notes?: string;
    },
  ) => apiClient.post<{ id: string }>(`/api/v1/workout-sessions/${sessionId}/sets`, body, token),

  finish: (token: string, sessionId: string, body: { notes?: string; perceivedEffort?: number }) =>
    apiClient.patch<{ id: string; status: string; finished_at: string }>(
      `/api/v1/workout-sessions/${sessionId}/finish`,
      body,
      token,
    ),
};

// ─── ARIA ────────────────────────────────────────────────────────────────────

export const ariaApi = {
  chat: (message: string, token: string, memberId?: string) =>
    apiClient.post<{ reply: string }>('/api/v1/aria/chat', { message, memberId }, token),
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface MarketplaceOrder {
  id: string;
  status: string;
  total_amount: string;
  created_at: string;
  items: Array<{
    id: string;
    quantity: number;
    unit_price: string;
    product: { id?: string; name: string };
  }>;
}

export const ordersApi = {
  getMyOrders: (token: string, page = 1) =>
    apiClient.get<{ data: MarketplaceOrder[]; total: number }>(
      `/api/v1/marketplace-orders?page=${page}&limit=20`,
      token,
    ),
};

// ─── Access log ───────────────────────────────────────────────────────────────

export interface AccessLog {
  id: string;
  result: string;
  method: string;
  created_at: string;
}

export const accessLogApi = {
  getMyLogs: (memberId: string, token: string, page = 1) =>
    apiClient.get<{ data: AccessLog[]; total: number }>(
      `/api/v1/access/members/${memberId}/logs?page=${page}&limit=30`,
      token,
    ),
};

// ─── Password reset (public) ──────────────────────────────────────────────────

export const passwordApi = {
  requestReset: (email: string) =>
    apiClient.post<void>('/api/v1/auth/password/reset-request', { email }),

  reset: (token: string, newPassword: string) =>
    apiClient.post<void>('/api/v1/auth/password/reset', { token, newPassword }),
};

// ─── Profile update ───────────────────────────────────────────────────────────

export const profileApi = {
  update: (
    memberId: string,
    token: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ) => apiClient.patch<MemberProfile>(`/api/v1/members/${memberId}`, data, token),
};

// ─── Push notifications / FCM tokens ─────────────────────────────────────────

export const pushApi = {
  registerToken: (token: string, platform: 'ios' | 'android', accessToken: string) =>
    apiClient.post<void>('/api/v1/notifications/device-token', { token, platform }, accessToken),

  removeToken: (token: string, accessToken: string) =>
    apiClient.delete<void>('/api/v1/notifications/device-token', { token }, accessToken),
};

// ─── Gym Info ─────────────────────────────────────────────────────────────────

export interface GymProfile {
  id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  social_links?: { instagram?: string; facebook?: string; twitter?: string };
  operating_hours?: GymOperatingHoursMap;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export type GymOperatingHoursMap = Partial<
  Record<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    DayHours
  >
>;

export interface OperatingHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  bio?: string;
  specialties?: string[];
  is_active: boolean;
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const gymApi = {
  getProfile: (accessToken: string) =>
    apiClient.get<GymProfile>('/api/v1/gym/profile', accessToken),
  getHours: async (accessToken: string): Promise<OperatingHours[]> => {
    const map = await apiClient.get<GymOperatingHoursMap>(
      '/api/v1/gym/operating-hours',
      accessToken,
    );
    return Object.entries(map ?? {}).map(([day, h]) => ({
      day_of_week: DAY_NAME_TO_NUMBER[day] ?? 0,
      open_time: h?.open ?? '',
      close_time: h?.close ?? '',
      is_closed: h?.closed ?? false,
    }));
  },
  getStaff: (accessToken: string) => apiClient.get<StaffMember[]>('/api/v1/staff', accessToken),
};

// ─── Exercises ────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups?: string[];
  secondary_muscles?: string[];
  equipment?: string[];
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  instructions?: string;
  video_url?: string | null;
  image_urls?: string[];
}

export interface ExerciseHistorySession {
  session_id: string;
  date: string;
  sets: Array<{
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    is_pr: boolean;
  }>;
  total_volume: number;
}

export interface WeightSuggestion {
  has_history: boolean;
  suggested_weight_kg: number | null;
  last_weight_kg: number | null;
  last_reps: number | null;
  last_date: string | null;
  reason: string;
}

export interface ExerciseSubstitute {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty: string | null;
  image_urls: string[];
}

export const exercisesApi = {
  list: (accessToken: string, params?: { search?: string; muscleGroup?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.muscleGroup) qs.set('muscleGroup', params.muscleGroup);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<Exercise[]>(`/api/v1/exercises${query}`, accessToken);
  },
  getById: (accessToken: string, id: string) =>
    apiClient.get<Exercise>(`/api/v1/exercises/${id}`, accessToken),
  getHistory: (accessToken: string, id: string, limit = 5) =>
    apiClient.get<ExerciseHistorySession[]>(
      `/api/v1/exercises/${id}/history?limit=${limit}`,
      accessToken,
    ),
  getSuggestion: (accessToken: string, id: string) =>
    apiClient.get<WeightSuggestion>(`/api/v1/exercises/${id}/suggestion`, accessToken),
  getSubstitutes: (accessToken: string, id: string, limit = 8) =>
    apiClient.get<ExerciseSubstitute[]>(
      `/api/v1/exercises/${id}/substitutes?limit=${limit}`,
      accessToken,
    ),
};

// ─── Schedule / Classes ───────────────────────────────────────────────────────

export interface ClassType {
  id: string;
  name: string;
  color: string;
  duration_minutes: number;
  difficulty?: string;
}

export interface SessionWithMeta {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  capacity: number;
  room?: string;
  class_type: ClassType;
  trainer?: { first_name: string; last_name: string };
  enrolled_count: number;
  waitlist_count: number;
  is_full: boolean;
  my_enrollment?: { id: string; status: 'ENROLLED' | 'WAITLIST' | 'CANCELLED' } | null;
}

export interface MyClassEnrollment {
  id: string;
  status: 'ENROLLED' | 'WAITLIST';
  enrolled_at: string;
  scheduled_at: string;
  room?: string;
  class_name: string;
  class_color: string;
  class_duration_minutes: number;
  trainer_first_name?: string | null;
  trainer_last_name?: string | null;
  session_id: string;
}

// ─── Gamificación ─────────────────────────────────────────────────────────────

export interface MemberStats {
  balance: number;
  lifetime: number;
  level: {
    name: string;
    color: string;
    emoji: string;
    nextName: string | null;
    nextThreshold: number | null;
    progress: number;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    created_at: string;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string;
    earned_at: string;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  member_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  points_lifetime: number;
  level_name: string;
  level_emoji: string;
  level_color: string;
}

export const gamificationApi = {
  getMyStats: (token: string) => apiClient.get<MemberStats>('/api/v1/gamification/my-stats', token),
  getLeaderboard: (token: string) =>
    apiClient.get<LeaderboardEntry[]>('/api/v1/gamification/leaderboard', token),
};

export const classesApi = {
  getSessions: (token: string, startDate: string, endDate: string) =>
    apiClient.get<SessionWithMeta[]>(
      `/api/v1/schedule/sessions?startDate=${startDate}&endDate=${endDate}`,
      token,
    ),
  getMyEnrollments: (token: string) =>
    apiClient.get<MyClassEnrollment[]>('/api/v1/schedule/my-enrollments', token),
  enroll: (token: string, sessionId: string) =>
    apiClient.post<{ id: string; status: string }>(
      `/api/v1/schedule/sessions/${sessionId}/enroll`,
      {},
      token,
    ),
  cancelEnrollment: (token: string, sessionId: string) =>
    apiClient.delete<void>(`/api/v1/schedule/sessions/${sessionId}/enroll`, undefined, token),
};
