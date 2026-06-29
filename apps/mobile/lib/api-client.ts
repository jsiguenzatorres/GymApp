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

export const memberApi = {
  getMe: (token: string) => apiClient.get<MemberProfile>('/api/v1/members/me', token),
  getMyStats: (token: string) => apiClient.get<MemberHomeStats>('/api/v1/members/me/stats', token),
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

export const nutritionApi = {
  getMyPlans: (memberId: string, token: string) =>
    apiClient.get<NutritionPlan[]>(`/api/v1/nutrition-plans?memberId=${memberId}`, token),
  getDiary: (memberId: string, date: string, token: string) =>
    apiClient.get<DiaryDay>(`/api/v1/members/${memberId}/food-diary?date=${date}`, token),
  aiSuggest: (planId: string, memberId: string, context: string, token: string) =>
    apiClient.post<{ suggestion: string }>(
      '/api/v1/nutrition/ai-suggest',
      { planId, memberId, context },
      token,
    ),
};

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
    product: { name: string };
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
