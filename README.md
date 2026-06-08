# Lunaria

Tu espacio cultural íntimo. React Native + Expo + Supabase.

## Setup en 5 pasos

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd lunaria
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Base de datos

Ejecuta `lunaria_schema_v2.sql` en el SQL Editor de tu proyecto Supabase.

### 4. Fuentes

Descarga las fuentes y colócalas en `assets/fonts/`:
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display): Regular (400), Medium (500)
- [DM Sans](https://fonts.google.com/specimen/DM+Sans): Regular (400), Medium (500)

Nombres exactos requeridos:
```
PlayfairDisplay-Regular.ttf
PlayfairDisplay-Medium.ttf
DMSans-Regular.ttf
DMSans-Medium.ttf
```

### 5. Ejecutar

```bash
npx expo start --android
```

## Estructura del proyecto

```
src/
├── navigation/     # RootNavigator, AuthStack, MainTabs
├── screens/        # Una carpeta por módulo
├── components/     # Componentes reutilizables (ui/ + por módulo)
├── store/          # Estado global con Zustand
├── services/       # Llamadas a Supabase (nunca en los screens)
├── hooks/          # Hooks personalizados
├── lib/            # supabase.ts (cliente único)
├── theme/          # colors, typography, spacing, borderRadius
├── types/          # models.ts, navigation.ts
├── utils/          # formatDate, compressImage, buildLumiContext
└── constants/      # Valores constantes del dominio

supabase/
└── functions/lumi/ # Edge Function para Claude API
```

## Variables de entorno para la Edge Function

En Supabase Dashboard → Edge Functions → lumi → Secrets:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Convenciones

- Screens: `NombreScreen.tsx` (PascalCase + sufijo Screen)
- Components: `NombreComponente.tsx` (PascalCase)
- Stores: `useNombreStore.ts` (camelCase + prefijo use)
- Services: `nombreService.ts` (camelCase + sufijo Service)
- Hooks: `useNombre.ts` (camelCase + prefijo use)
- Imports: siempre con alias `@/` — nunca rutas relativas `../../`
