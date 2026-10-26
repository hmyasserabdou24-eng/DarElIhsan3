# 🔒 SECURITY RULES — OBLIGATOIRE POUR TOUT CODE GÉNÉRÉ (PACK SÉCURITÉ VIBE CODER)

Tu génères du code pour le projet **Dar El Ihsan (دار الإحسان)** — portail éducatif, espace parents (`parent.html`), tableau de bord administratif (`manage.html`, `admin.html`), vérification QR (`qr.html`) et backend **Supabase** (PostgreSQL + RLS + Auth + Storage + Edge Functions `index.ts` avec Zod) déployable sur **Netlify** / **GitHub Pages**.

TOUT code que tu produis DOIT respecter strictement les **14 règles suivantes**. Avant de proposer du code, vérifie mentalement chaque règle. Si une règle est violée, corrige avant de répondre.

---

## 1. INPUT VALIDATION
- Toujours valider les inputs utilisateur :
  - Côté serveur / Edge Functions (`index.ts`) : validation stricte avec **Zod** (`z.discriminatedUnion`, `z.string().email()`, `z.string().uuid()`, regex téléphone, etc.).
  - Côté client (`de-core.js`) : validation systématique via `DE.clean()`, `DE.isEmail()`, `DE.isPhone()`, `DE.isDate()`, `DE.isUuid()`, `DE.safeUrl()`.
  - Côté base de données : contraintes `CHECK` strictes sur chaque table et validation dans les fonctions RPC.
- Validation côté client (UX) **ET** côté serveur (sécurité).
- Limites strictes : taille, format, regex sur chaque champ.
- Rejeter les payloads malformés ou trop gros (`MAX_BODY = 10_000` sur l'Edge Function `admin-users`, `< 1MB` sur `site_content`).

## 2. XSS PROTECTION
- **JAMAIS** utiliser `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, ou `dangerouslySetInnerHTML`.
- Toujours construire le DOM via `DE.h()` et insérer tout texte via `textContent` ou `document.createTextNode()`.
- Échapper et filtrer toutes les URLs via `DE.safeUrl()` (uniquement `https:`, `blob:`, ou `#`).
- Aucune injection HTML brute depuis la base de données ou les paramètres d'URL.

## 3. SQL INJECTION
- **TOUJOURS** utiliser l'API REST paramétrée de Supabase ou les appels RPC (`supabase.rpc()` / `C.rpc()`) avec paramètres typés.
- **JAMAIS** de SQL raw concaténé avec des inputs utilisateur.
- Toutes les fonctions PostgreSQL `SECURITY DEFINER` doivent fixer explicitement leur `search_path` (`SET search_path = public`).

## 4. SECRETS MANAGEMENT
- **JAMAIS** hardcoder une API key privée, un token, un mot de passe, ou `service_role` dans le code source, les fichiers SQL ou Excel.
- Toutes les clés sensibles de test ou d'administration vont dans `.env` (jamais commité) ou dans `supabase secrets`.
- `.env`, `*.pem`, `*.key`, et tout export contenant des identifiants parents (`*حسابات_الأولياء*.xlsx`, `*parent-accounts*.sql`) doivent rester dans `.gitignore`.
- `SUPABASE_SERVICE_ROLE_KEY` est utilisé **UNIQUEMENT** côté serveur (dans l'Edge Function `index.ts` via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`).
- Le front-end (`cms-config.js`) utilise **UNIQUEMENT** la clé publique `anon` / `publishable` (`sb_publishable_...`).

## 5. SUPABASE RLS (CRITIQUE)
- **RLS ACTIVÉE sur 100% des tables**, sans aucune exception (`admins`, `admin_audit`, `rate_limits`, `site_content`, `site_content_history`, `branches`, `sections`, `children`, `parent_profiles`, `parent_children`, `progress_reports`, `appointments`, `messages`, `message_reads`, `documents`, `educational_programs`, `registration_codes`).
- Policies explicites pour `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Tables internes sensibles (`admins`, `admin_audit`, `rate_limits`, `registration_codes`) : RLS activée sans policy publique (accès 100% bloqué en direct, uniquement via fonctions `SECURITY DEFINER` vérifiant `is_admin()`, `can_manage_families()`, ou `is_owner()`).
- Tables publiques (`site_content` publié, `branches`, `sections`) : `SELECT` restreint aux lignes publiées/actives.
- Tables liées aux enfants/parents : isolation stricte via `can_read_child(child_id)` et `auth.uid() = parent_id` (`USING (auth.uid() = user_id)`).
- Tester chaque table avec `node --env-file=.env rls-tests.mjs` et en navigation privée avant chaque déploiement.

## 6. RATE LIMITING
- Auth endpoints : max 5 tentatives / 15 min par IP (configuré dans Supabase Auth Rate Limits).
- Formulaires & fonctions sensibles : limitation par base de données via `public.rate_limit_hit(p_key, p_max, p_window_seconds)` (ex. `admin-users` limité à 30 req/min par acteur, `redeem_registration_code` limité contre le brute-force).
- API publiques : max 60 req / min par IP.
- Retourner **HTTP 429** (`محاولات كثيرة. انتظر دقيقة.`) quand la limite est dépassée.

## 7. AUTHENTICATION
- Utiliser **Supabase Auth** exclusivement (pas d'auth custom).
- Inscription publique désactivée (`Allow new users to sign up = OFF`) : création de comptes uniquement sur invitation admin (`inviteUserByEmail`) ou code d'inscription à usage unique.
- Politique de mot de passe stricte : minimum 10 caractères côté client (`DE.pwProblem`) et minimum 8 caractères côté SQL (`users-setup.sql` / `08-fix-audit-and-admin-delete.sql`), avec au moins **1 majuscule**, **1 minuscule** et **1 chiffre** (max 72 octets).
- MFA (TOTP) supporté et obligatoire pour les comptes administrateurs (`03-enforce-mfa.sql`).
- Sessions : stockées uniquement dans `sessionStorage` pour les portails sensibles (`parent.js`, `manage.js`) avec déconnexion automatique après 30 minutes d'inactivité (`DE.idle`).

## 8. CORS
- CORS restrictif dans les Edge Functions (`index.ts`) : **UNIQUEMENT** les domaines autorisés listés dans `ALLOWED_ORIGINS` (ex. domaine de production Netlify / GitHub Pages).
- **Jamais** `Access-Control-Allow-Origin: *` en production.
- Rejeter avec `HTTP 403` toute requête `Origin` non autorisée.

## 9. CSP & SECURITY HEADERS
- `Content-Security-Policy` stricte dans `netlify.toml` **et** dans les balises `<meta http-equiv="Content-Security-Policy">` de chaque fichier HTML (`script-src 'self'` sans `unsafe-inline` ni `unsafe-eval`, `connect-src 'self' https://qgjddtylriqdwvpihvmi.supabase.co`).
- Headers obligatoires dans `netlify.toml` :
  - `Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"`
  - `X-Frame-Options = "DENY"` (et `SAMEORIGIN` uniquement sur `/index.html` pour l'aperçu CMS interne)
  - `X-Content-Type-Options = "nosniff"`
  - `Referrer-Policy = "strict-origin-when-cross-origin"` (`no-referrer` sur les pages d'administration et portail parents)
  - `Permissions-Policy = "camera=(), microphone=(), geolocation=()"`

## 10. ERROR HANDLING
- **JAMAIS** exposer de stack trace, code `SQLSTATE`, ou message technique brut de PostgreSQL/Supabase à l'utilisateur.
- Traduire toutes les erreurs via `DE.friendly(status, raw, code)` côté client et retourner des messages génériques propres côté Edge Function (`index.ts`).
- Conserver les logs détaillés uniquement côté serveur (`logDiag` dans `index.ts` avec masquage automatique des emails et filtrage des tokens/secrets).

## 11. FILE UPLOADS
- Valider systématiquement avec `DE.checkFile()` :
  - Extension autorisée (`.pdf`, `.jpg`, `.png`, `.webp` — `.svg`, `.html`, `.exe` strictement interdits).
  - Type MIME déclaré **ET** signature binaire réelle (**magic bytes** via `sniff()`).
  - Rejet des fichiers PDF contenant du code actif (`/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile`, `/RichMedia`).
- Limite de taille stricte : **5 MB** (`5242880` octets) par défaut pour `private-docs`.
- Stocker dans **Supabase Storage** (`private-docs` non public) avec policies RLS (`can_read_private_object`).
- Renommer tous les fichiers avec un **UUID aléatoire** (`DE.objectPath(childId, ext)` → `children/<child_uuid>/<random_uuid>.<ext>`), sans jamais utiliser le nom de fichier fourni par l'utilisateur.

## 12. LOGGING & MONITORING
- Logger toutes les actions sensibles dans la table `public.admin_audit` (invitations parents/admins, désactivation de comptes, publication du site, suppression d'enfants, réémission de QR codes, purge d'audit).
- Logs techniques côté serveur uniquement (`admin_audit` + Supabase Edge Function Logs via `logDiag`).
- Aucune donnée sensible (mots de passe, tokens JWT, clés) dans les logs.

## 13. DEPENDENCIES
- Front-end 100% autonome (Zero NPM / Zero CDN JS externe) pour éliminer les attaques Supply Chain.
- Edge Functions : uniquement `@supabase/supabase-js@2` et `zod@3` en versions épinglées.
- Exécuter systématiquement `node local-tests.mjs` et `node test-phase5.mjs` avant chaque déploiement.

## 14. DEPLOY CHECKLIST
Avant tout déploiement en production, vérifier :
- [ ] RLS active et testée sur toutes les tables (`node --env-file=.env rls-tests.mjs`)
- [ ] Tests locaux de sécurité 100% verts (`node local-tests.mjs` & `node test-phase5.mjs`)
- [ ] Variables d'environnement (`ALLOWED_ORIGINS`, `SITE_URL`) configurées sur Supabase Secrets / Netlify
- [ ] `.env` jamais commité (`git log --all --oneline | grep -i env` vide)
- [ ] Rate limiting actif sur Supabase Auth et sur les RPC / Edge Functions
- [ ] CSP et Security Headers configurés dans `netlify.toml` et dans les `<meta>` HTML
- [ ] Backups Supabase activés
- [ ] Test en navigation privée (Incognito) : aucune donnée sensible accessible sans authentification

---

### RÈGLE FINALE
Si tu génères du code qui ne respecte pas une de ces 14 règles, signale-le explicitement et propose immédiatement une version conforme. **La sécurité n'est jamais négociable.**

---

# 🛡️ UNIVERSAL WEB SECURITY SKILLS (10 DEFENSIVE AUDIT & REMEDIATION SKILLS)

En complément des 14 règles ci-dessus, tout code, migration SQL ou modification d'architecture pour **Dar El Ihsan** doit respecter les contrôles des 10 compétences **Universal Web Security Skills** :

1. **`security-orchestrator`** : Ne jamais exécuter d'opérations destructrices sur la base de production, toujours préserver un plan de rollback (`CREATE OR REPLACE FUNCTION` idempotent), et vérifier chaque correctif par un test automatisé reproductible.
2. **`secure-code-review`** : Tracer chaque entrée non fiable de la source jusqu'à l'opération sensible ; zéro `innerHTML`, zéro concaténation SQL, validation stricte des schémas (Zod + contraintes SQL).
3. **`auth-access-control`** :
   - Toute authentification (administrateurs, éducatrices, parents) passe **exclusivement** par **Supabase Auth** (`C.signIn`).
   - **Interdiction absolue** de stocker des mots de passe en clair (`pwVal`, `setupKey`) dans `_portal_meta` ou `sessionStorage`, ou d'effectuer une vérification locale de mot de passe côté navigateur (`matchEducatorDirectAuth` interdit).
   - **Interdiction absolue** de passer un mot de passe ou secret dans l'URL (`?k=...`).
4. **`api-database-security`** :
   - La ligne `published` de `public.site_content` étant lisible par `anon`, la fonction `public.publish_content()` doit **toujours** supprimer la clé `_portal_meta` (`select (data - '_portal_meta') into d`) avant publication.
   - Ne jamais dupliquer les tables `children` ou `progress_reports` dans `site_content` (`children_cache` et `reports_cache` interdits).
5. **`secrets-config-security`** :
   - Aucun fichier contenant des mots de passe parents en clair (`compact_setup.sql`, `07-create-parent-accounts.sql`, `حسابات_الأولياء.xlsx`) ne doit être présent dans le dépôt Git.
   - CORS strict sur `index.ts` (rejet `HTTP 403` pour toute origine hors `ALLOWED_ORIGINS`).
6. **`file-upload-storage-security`** :
   - Validation stricte des fichiers (`DE.checkFile` : extension + MIME + magic bytes + détection JS actif dans PDF + max 5 MB + chemin UUID aléatoire dans `private-docs`).
   - **Minimisation des données QR publiques (`qr.html` / `public_child_card`)** : ne jamais exposer `disability` (nature du handicap) sur l'endpoint public `public_child_card`, et n'exposer `dob` / `section` que si `qr_show_extra` est explicitement activé.
7. **`frontend-web-security`** : CSP stricte sans `unsafe-inline` pour `script-src`, protection anti-clickjacking (`X-Frame-Options = "DENY"`), et nettoyage immédiat des paramètres sensibles d'URL via `history.replaceState`.
8. **`dependency-supply-chain`** : Zéro dépendance NPM/CDN dans le front-end ; versions épinglées (`@supabase/supabase-js@2`, `zod@3`) dans l'Edge Function.
9. **`security-testing`** : Exécuter systématiquement `node local-tests.mjs` (53 tests) et `node test-phase5.mjs` (27 tests) après chaque modification.
10. **`incident-readiness`** : Journalisation systématique dans `public.admin_audit` et `logDiag` (sans jamais journaliser de mots de passe, tokens ou données médicales).
