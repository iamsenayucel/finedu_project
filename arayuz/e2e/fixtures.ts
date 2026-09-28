// Deterministic E2E kullanıcıları — accounts/management/commands/seed_e2e.py
// ile birebir eşleşmeli. Tek kaynak burada: yeni bir test bu dosyadan import
// eder, kullanıcı bilgilerini kendi içinde tekrar tanımlamaz.
export const E2E_PASSWORD = "E2ePassw0rd!123";

export const USERS = {
  admin: { username: "e2e_admin", password: E2E_PASSWORD },
  teacher: { username: "e2e_teacher", password: E2E_PASSWORD },
  // Ön anketi tamamlanmış — dashboard/unit/game testleri bunu kullanır.
  student: { username: "e2e_student", password: E2E_PASSWORD },
  // Ön anketi TAMAMLANMAMIŞ — yalnızca pre-survey gate testinde kullanılır.
  studentPreSurvey: { username: "e2e_student_presurvey", password: E2E_PASSWORD },
};
