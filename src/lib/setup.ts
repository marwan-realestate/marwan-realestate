const env = (key: string, fallback: string) => (process.env[key] || "").trim() || fallback;

/**
 * بيانات حساب المالك عند أول تشغيل فقط.
 * يمكن تغييرها من ملف البيئة (ADMIN_NAME / ADMIN_EMAIL / ADMIN_PHONE / ADMIN_PASSWORD)
 * أو تغيير كلمة المرور لاحقاً من لوحة التحكم ← إعدادات الموقع ← تغيير كلمة المرور.
 */
export const INITIAL_OWNER = {
  name: env("ADMIN_NAME", "محمد مروان"),
  email: env("ADMIN_EMAIL", "owner@marwan.local"),
  phone: env("ADMIN_PHONE", "01110189255"),
  password: env("ADMIN_PASSWORD", "Marwan#0189255"),
};
