import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // eslint-plugin-react-hooks v7's "recommended" config bundles the full
      // React Compiler rule set (purity, immutability, set-state-in-effect,
      // ...), which assumes code was written for the compiler. This codebase
      // wasn't, and those rules flag intentional patterns (e.g. Math.random()
      // in render for particle-effect games) as errors. We keep only the two
      // long-established hook-correctness rules instead of the full bundle.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // tsconfig.json bu aşamada bilinçli olarak `noImplicitAny: false` ile
      // strict-mode migration'ı dışarıda bırakıyor (bkz. AŞAMA 3 kapsamı).
      // no-explicit-any'i error tutmak aynı kararla çelişir ve ~100 çağrı
      // sitesinde yalnızca lint'i geçirmek için mekanik "any" imzaları
      // yazmayı gerektirir — gerçek bir bug yakalamaz. Tutarlılık için kapalı;
      // gelecekteki bir strict-mode geçişinde birlikte yeniden açılmalı.
      "@typescript-eslint/no-explicit-any": "off",
      // Bir parametrenin yalnızca imza/tip uyumu için var olduğu ve kasıtlı
      // olarak kullanılmadığı durumlar için (bkz. test dosyalarındaki mock
      // fonksiyon imzaları) "_" öneki standart bir konvansiyondur.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
);
