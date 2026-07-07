# 🍝 Las Pastas de Orlando — Sistema Local (Standalone)

Bienvenido al **paquete local** de **Las Pastas de Orlando**, tu sistema ERP de producción de pastas + página de ventas.

Este paquete te permite **ejecutar todo el sistema en tu propia computadora** sin necesidad de estar conectado a internet, y **sincronizar los datos a la nube (Turso)** cuando tengas conexión disponible. Es ideal para uso en el local comercial, en ferias, o como respaldo offline del sistema online.

> 💡 **Funciona en Windows (10 o superior) y en Linux (Fedora 38 o superior).** No requiere conexión a internet para operar en modo LOCAL.

---

## ⚡ Quick Start (resumen en 3 pasos)

Si ya tenés Node.js instalado y estás apurado, esto es todo lo que necesitás:

1. **Descomprimir** el paquete en una carpeta fija (por ejemplo `C:\laspastasdeorlando\` en Windows o `~/laspastasdeorlando/` en Linux).
2. **Activar modo LOCAL** (la primera vez):
   - Windows: ejecutá `scripts\switch-mode.bat local`
   - Linux: ejecutá `./scripts/switch-mode.sh local`
3. **Iniciar el sistema**:
   - Windows: doble click en `scripts\start-windows.bat`
   - Linux: `./scripts/start-linux.sh`

Abrí el navegador en 👉 **http://localhost:3000**

> 📖 Si nunca usaste este sistema, te recomendamos leer la sección [📥 Instalación](#-instalación-en-windows) completa para tu sistema operativo.

---

## 📑 Tabla de contenidos

1. [🍝 Descripción general](#-las-pastas-de-orlando--sistema-local-standalone)
2. [⚡ Quick Start](#-quick-start-resumen-en-3-pasos)
3. [📦 ¿Qué incluye este paquete?](#-qué-incluye-este-paquete)
4. [✨ Características principales](#-características-principales)
5. [📋 Requisitos previos](#-requisitos-previos)
6. [📥 Instalación en Windows](#-instalación-en-windows)
7. [📥 Instalación en Linux Fedora](#-instalación-en-linux-fedora)
8. [⚙️ Configuración inicial](#️-configuración-inicial)
9. [🔄 Cambiar entre modo LOCAL y ONLINE](#-cambiar-entre-modo-local-y-online)
10. [☁️ Configurar Turso (modo online)](#️-configurar-turso-modo-online)
11. [🔄 Sincronizar datos (Local ↔ Turso)](#-sincronizar-datos-local--turso)
12. [💾 Backups](#-backups)
13. [🚀 Uso diario](#-uso-diario)
14. [🔐 Seguridad](#-seguridad)
15. [🛠️ Solución de problemas](#️-solución-de-problemas)
16. [📞 Soporte](#-soporte)
17. [📄 Licencia](#-licencia)

---

## 📦 ¿Qué incluye este paquete?

Al descomprimir el paquete vas a encontrar la siguiente estructura de carpetas y archivos:

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `server.js` | Archivo | Punto de entrada del servidor Next.js (standalone). Es lo que arranca el sistema. |
| `package.json` | Archivo | Dependencias mínimas necesarias para ejecutar el sistema en runtime. |
| `.env` | Archivo | Archivo de entorno **activo**. Se genera desde `.env.local` o `.env.online`. No editar a mano. |
| `.env.local` | Archivo | Configuración para el modo **LOCAL** (SQLite en `dev.db`). Ya viene configurado. |
| `.env.online` | Archivo | Plantilla de configuración para el modo **ONLINE** (Turso). Hay que editarla con tus credenciales. |
| `dev.db` | Archivo | Base de datos **SQLite local**. Acá se guardan todos tus datos (productos, ventas, clientes, etc.). |
| `README.md` | Archivo | Este documento. |
| `/public` | Carpeta | Imágenes y archivos estáticos (logos, fotos de productos, etc.). |
| `/src` | Carpeta | **Código fuente** de la aplicación (respaldo de emergencia). No es necesario para usar el sistema, pero permite reconstruirlo o correrlo en modo desarrollo si se rompe el build standalone. |
| `/data` | Carpeta | Backups automáticos y manuales de la base de datos. |
| `/scripts` | Carpeta | Scripts de arranque, cambio de modo y sincronización. |
| `/scripts/start-windows.bat` | Script | Inicia el sistema en **Windows** (doble click). |
| `/scripts/start-linux.sh` | Script | Inicia el sistema en **Linux**. |
| `/scripts/switch-mode.bat` | Script | Cambia entre modo LOCAL y ONLINE en **Windows**. |
| `/scripts/switch-mode.sh` | Script | Cambia entre modo LOCAL y ONLINE en **Linux**. |
| `/scripts/sync-db.bat` | Script | **Sincronización bidireccional** en **Windows**: `push` (Local → Turso) o `pull` (Turso → Local). |
| `/scripts/sync-db.sh` | Script | **Sincronización bidireccional** en **Linux**: `push` (Local → Turso) o `pull` (Turso → Local). |
| `/scripts/sync-db.js` | Script | Lógica Node.js compartida por `sync-db.sh` y `sync-db.bat`. No se ejecuta directamente. |
| `/scripts/sync-to-turso.bat` | Script | ⚠️ *Alias* backward-compat para `sync-db.bat push` (Local → Turso). |
| `/scripts/sync-to-turso.sh` | Script | ⚠️ *Alias* backward-compat para `sync-db.sh push` (Local → Turso). |
| `/scripts/backup-local.sh` | Script | Genera un backup manual de la base local (Linux). |

> 📝 **Nota:** Los archivos `.env`, `.env.local` y `.env.online` pueden estar ocultos en algunos exploradores de archivos. En Windows, activá "Elementos ocultos" en la pestaña Ver. En Linux, usá `ls -la`.

---

## ✨ Características principales

- 🖥️ **100% offline:** funciona sin internet usando una base de datos SQLite local (`dev.db`).
- ☁️ **Modo online opcional:** podés conectarte a una base de datos en la nube (Turso) cuando quieras.
- 🔄 **Sincronización bidireccional:** pasá datos del local a la nube (`push`) o bajá datos de la nube al local (`pull`) con un solo comando.
- 💾 **Backups automáticos:** antes de cada sincronización (en cualquier dirección) se genera un backup de seguridad en `/data`.
- 🪟 **Multiplataforma:** scripts dedicados para Windows (`.bat`) y Linux (`.sh`).
- 🚀 **Arranque simple:** un solo comando (o doble click) pone el sistema en marcha.
- 🔄 **Detección automática de modo:** el sistema detecta si estás en LOCAL u ONLINE según la URL de la base de datos.
- 🧩 **Sin dependencias externas:** los scripts de sincronización usan `@libsql/client` ya incluido en el paquete, no requieren instalar el CLI de Turso.
- 🛟 **Respaldos de emergencia:** el paquete incluye el código fuente (`src/`) y la base de datos local, permitiendo reconstruir el sistema completo desde cero.
- 🍃 **Ligero:** necesita menos de 500 MB de disco y 2 GB de RAM.
- 🔐 **Autenticación:** el panel de administración requiere usuario y contraseña.

---

## 📋 Requisitos previos

Antes de instalar el sistema, asegurate de cumplir con los requisitos para tu sistema operativo:

### 🪟 Windows

| Requisito | Detalle |
|-----------|---------|
| Sistema operativo | Windows 10 o superior (64 bits) |
| Node.js | Versión **18 o superior** — descargá de https://nodejs.org (versión LTS recomendada) |
| Memoria RAM | 2 GB libres |
| Espacio en disco | 500 MB disponibles |
| Navegador | Chrome, Firefox, Edge o similar (actualizado) |

### 🐧 Linux (Fedora)

| Requisito | Detalle |
|-----------|---------|
| Sistema operativo | Fedora 38 o superior |
| Node.js | Versión **18 o superior** — se instala con `sudo dnf install -y nodejs` |
| Memoria RAM | 2 GB libres |
| Espacio en disco | 500 MB disponibles |
| Navegador | Firefox, Chrome o similar |

### ✅ Cómo verificar que Node.js está instalado

Abrí una terminal (en Windows: tecla `Win + R`, escribí `cmd` y Enter; en Linux: abrí la terminal) y ejecutá:

```bash
node --version
```

Si Node.js está instalado correctamente, vas a ver algo como:

```
v20.11.1
```

> ⚠️ Si ves el error **"node no se reconoce como un comando interno o externo"** (Windows) o **"command not found"** (Linux), significa que Node.js no está instalado. Descargalo e instalalo desde https://nodejs.org (Windows) o ejecutá `sudo dnf install -y nodejs` (Fedora).

---

## 📥 Instalación en Windows

Seguí estos pasos en orden:

### 1️⃣ Descargar el paquete

Descargá el archivo `laspastasdeorlando-local.zip` a tu carpeta de Descargas.

### 2️⃣ Descomprimir el paquete

1. Abrí el Explorador de archivos y andá a la carpeta de Descargas.
2. Hacé click derecho sobre `laspastasdeorlando-local.zip`.
3. Seleccioná **"Extraer todo..."**.
4. Elegí como destino `C:\laspastasdeorlando\` (creá la carpeta si no existe).
5. Click en **Extraer**.

> 📁 *Captura sugerida:* Ventana de "Extraer todo" mostrando la ruta `C:\laspastasdeorlando\` seleccionada.

Al terminar, deberías tener la carpeta `C:\laspastasdeorlando\laspastasdeorlando-local\` con los archivos `server.js`, `package.json`, etc.

### 3️⃣ Verificar que Node.js está instalado

1. Presioná `Win + R`, escribí `cmd` y presioná Enter.
2. En la ventana negra que se abre, escribí:

   ```bash
   node --version
   ```

3. Si aparece `v20.x.x` (o cualquier número `v18` o mayor), está todo bien.
4. Si aparece un error, descargá Node.js desde https://nodejs.org e instalá la versión **LTS**. Aceptá todas las opciones por defecto durante la instalación.

### 4️⃣ Configurar el archivo `.env`

La primera vez que usás el sistema, necesitás activar el modo LOCAL:

1. Abrí la carpeta `C:\laspastasdeorlando\laspastasdeorlando-local\scripts\` en el Explorador.
2. Hacé doble click en `switch-mode.bat`.
3. Cuando te pregunte el modo, escribí `local` y presioná Enter.
4. Vas a ver un mensaje confirmando que se activó el modo LOCAL.

> 📖 Más detalles en la sección [⚙️ Configuración inicial](#️-configuración-inicial).

### 5️⃣ Iniciar el sistema

1. En la misma carpeta `scripts\`, hacé doble click en `start-windows.bat`.
2. Se abre una ventana negra (terminal) con mensajes del servidor. **No la cierres** mientras uses el sistema.
3. Cuando veas el mensaje `Ready in xxx ms` o similar, el sistema está corriendo.

> 📁 *Captura sugerida:* Ventana de CMD mostrando `> Ready on http://localhost:3000`.

### 6️⃣ Abrir el navegador

Abrí tu navegador (Chrome, Firefox, Edge) y andá a:

```
http://localhost:3000
```

 vas a ver la página principal del sistema. Para acceder al panel de administración, andá a:

```
http://localhost:3000/admin/login
```

Ingresá con el email `admin@pastasorlando.com` y la contraseña que se configuró al sembrar la base de datos.

### ❌ Errores comunes en Windows

| Problema | Solución |
|----------|----------|
| `'node' no se reconoce como un comando interno o externo` | Node.js no está instalado o no se agregó al PATH. Descargalo de https://nodejs.org (versión LTS) e instalalo. Si ya lo instalaste, **cerrá y volvé a abrir** la ventana de CMD. |
| `No se encuentra server.js` | Estás ejecutando el script desde la carpeta incorrecta. Asegurate de ejecutarlo desde `C:\laspastasdeorlando\laspastasdeorlando-local\scripts\`. |
| `El puerto 3000 ya está en uso` | Otra aplicación está usando ese puerto. Cerrala, o cambiá `PORT=3001` en el archivo `.env`. |
| La ventana de CMD se cierra solo | Hubo un error y la ventana se cerró antes de que puedas leerlo. Abrí CMD manualmente, navegá hasta la carpeta y ejecutá `start-windows.bat` desde ahí. |
| El navegador muestra "No se puede acceder al sitio" | El servidor no está corriendo. Verificá que la ventana de CMD con `start-windows.bat` esté abierta. |

---

## 📥 Instalación en Linux Fedora

Seguí estos pasos en orden:

### 1️⃣ Descargar el paquete

Descargá el archivo `laspastasdeorlando-local.tar.gz` a tu carpeta de Descargas (o donde prefieras).

### 2️⃣ Descomprimir el paquete

Abrí una terminal y ejecutá:

```bash
mkdir -p ~/laspastasdeorlando
tar -xzf ~/Descargas/laspastasdeorlando-local.tar.gz -C ~/laspastasdeorlando
```

> 📝 Si descargaste el archivo en otra ubicación, ajustá la ruta del comando `tar`.

Al terminar, deberías tener la carpeta `~/laspastasdeorlando/laspastasdeorlando-local/` con los archivos `server.js`, `package.json`, etc.

### 3️⃣ Instalar Node.js (si no lo tenés)

Verificá si Node.js está instalado:

```bash
node --version
```

Si no está instalado, ejecutá:

```bash
sudo dnf install -y nodejs
```

Verificá la instalación:

```bash
node --version
```

Deberías ver algo como `v20.x.x` (cualquier versión `v18` o superior sirve).

### 4️⃣ Dar permisos a los scripts

Los scripts `.sh` necesitan permiso de ejecución. Desde la raíz del paquete:

```bash
cd ~/laspastasdeorlando/laspastasdeorlando-local
chmod +x scripts/*.sh
```

### 5️⃣ Configurar el archivo `.env`

Activá el modo LOCAL (la primera vez):

```bash
./scripts/switch-mode.sh local
```

Vas a ver un mensaje confirmando que se activó el modo LOCAL.

### 6️⃣ Iniciar el sistema

```bash
./scripts/start-linux.sh
```

Cuando veas el mensaje `Ready on http://localhost:3000`, el sistema está corriendo. **No cierres la terminal** mientras lo usás.

### 7️⃣ Abrir el navegador

Abrí tu navegador y andá a:

```
http://localhost:3000
```

Para acceder al panel de administración:

```
http://localhost:3000/admin/login
```

Ingresá con el email `admin@pastasorlando.com` y la contraseña que se configuró al sembrar la base de datos.

### ❌ Errores comunes en Linux

| Problema | Solución |
|----------|----------|
| `bash: ./scripts/start-linux.sh: Permission denied` | Faltan permisos de ejecución. Ejecutá `chmod +x scripts/*.sh`. |
| `node: command not found` | Node.js no está instalado. Ejecutá `sudo dnf install -y nodejs`. |
| `No such file or directory: server.js` | Estás en la carpeta incorrecta. Hacé `cd ~/laspastasdeorlando/laspastasdeorlando-local` y volvé a intentar. |
| `Error: listen EADDRINUSE: address already in use :::3000` | Otra aplicación está usando el puerto 3000. Cerrala o cambiá `PORT=3001` en `.env`. |
| El script se corta con `\r` o `$'\r'` | El archivo tiene finales de línea Windows (CRLF). Ejecutá `dos2unix scripts/*.sh` o `sed -i 's/\r$//' scripts/*.sh`. |

---

## ⚙️ Configuración inicial

Toda la configuración del sistema se maneja a través del archivo `.env`. Este archivo **no se edita a mano** normalmente: se genera automáticamente copiando `.env.local` (modo offline) o `.env.online` (modo online) usando los scripts `switch-mode`.

### 📂 Archivos de entorno

| Archivo | Uso |
|---------|-----|
| `.env.local` | Plantilla de configuración para el modo **LOCAL** (SQLite). Ya viene configurada y lista para usar. |
| `.env.online` | Plantilla de configuración para el modo **ONLINE** (Turso). Hay que editarla con tus credenciales antes de usarla. |
| `.env` | Archivo **activo** que el sistema lee al arrancar. Se genera al ejecutar `switch-mode.sh local` o `switch-mode.sh online`. |

### 🚀 Primera configuración (modo LOCAL)

Si es la primera vez que usás el sistema, simplemente ejecutá:

- **Linux:** `./scripts/switch-mode.sh local`
- **Windows:** hacé doble click en `scripts\switch-mode.bat` y elegí `local`

Esto copia `.env.local` a `.env` y el sistema queda listo para arrancar.

### 📋 Variables de entorno importantes

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Ruta a la base de datos. Si empieza con `file:` usa SQLite local; si empieza con `libsql://` usa Turso online. | `file:./dev.db` (local) o `libsql://pastas-orlando-xxx.turso.io` (online) |
| `DATABASE_AUTH_TOKEN` | Token de acceso a Turso. **Solo se usa en modo ONLINE.** | `eyJhbGciOi...` |
| `NEXTAUTH_SECRET` | Clave secreta para firmar las sesiones. **Debería ser única** por instalación. | Cadena aleatoria de 32+ caracteres |
| `NEXTAUTH_URL` | URL base del sistema. En local siempre es `http://localhost:3000`. | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | URL pública del sistema (igual que la anterior en modo local). | `http://localhost:3000` |
| `PORT` | Puerto donde escucha el servidor (por defecto `3000`). | `3000` |
| `SMTP_HOST` | Servidor de correo saliente (opcional, para enviar emails). | `smtp.gmail.com` |
| `SMTP_USER` | Usuario del correo saliente. | `tuemail@gmail.com` |
| `SMTP_PASS` | Contraseña del correo saliente. | `tu-contraseña-de-aplicacion` |
| `ADMIN_EMAIL` | Email de contacto del administrador. | `admin@pastasorlando.com` |
| `ADMIN_WHATSAPP` | Número de WhatsApp del administrador (con código de país, sin +). | `5491100000000` |

### 🔑 Cómo generar un `NEXTAUTH_SECRET` seguro

Si querés regenerar la clave secreta (recomendado en producción), abrí una terminal y ejecutá:

```bash
openssl rand -base64 32
```

> 💡 En Windows, `openssl` no viene instalado por defecto. Podés usar Git Bash (incluido con Git for Windows) que sí lo trae, o usar un generador online confiable.

El comando devuelve una cadena aleatoria como:

```
K7m9P2xQ8vR4nL6sT1yW3zA0bC5dE7fG==
```

Copiala y pegala en tu archivo `.env.local` o `.env.online` en la línea `NEXTAUTH_SECRET=...`.

> ⚠️ **Nunca compartas tu `NEXTAUTH_SECRET`.** Es la clave que firma las sesiones de los usuarios. Si alguien la obtiene, podría falsificar accesos.

---

## 🔄 Cambiar entre modo LOCAL y ONLINE

El sistema soporta dos modos de operación:

| Característica | 🖥️ Modo LOCAL | ☁️ Modo ONLINE |
|----------------|---------------|-----------------|
| Base de datos | SQLite (`dev.db` local) | Turso (nube) |
| Necesita internet | ❌ No | ✅ Sí |
| Velocidad | 🚀 Muy rápida | 🌐 Depende de la conexión |
| Multiusuario | ❌ No (una sola PC) | ✅ Sí (varias PCs conectadas a la misma base) |
| Backup automático | ✅ Antes de cada sync | ☁️ En la nube de Turso |
| Ideal para | Uso offline, ferias, respaldo | Trabajo en equipo, acceso remoto |

### 🔄 Cambiar a modo LOCAL

- **Linux:**
  ```bash
  ./scripts/switch-mode.sh local
  ```
- **Windows:** hacé doble click en `scripts\switch-mode.bat` y elegí `local`.

### ☁️ Cambiar a modo ONLINE

> ⚠️ Antes de cambiar a modo ONLINE, asegurate de haber configurado `.env.online` con tus credenciales de Turso (ver la sección [☁️ Configurar Turso](#️-configurar-turso-modo-online)).

- **Linux:**
  ```bash
  ./scripts/switch-mode.sh online
  ```
- **Windows:** hacé doble click en `scripts\switch-mode.bat` y elegí `online`.

### 🔄 Reiniciar después de cambiar de modo

**Después de cambiar de modo, SIEMPRE hay que reiniciar el sistema** para que tome la nueva configuración:

1. Cerrá la ventana de terminal donde está corriendo el servidor (Ctrl+C en Linux, o cerrá la ventana en Windows).
2. Volvé a ejecutar `start-linux.sh` o `start-windows.bat`.

> 💡 El sistema detecta automáticamente el modo según el valor de `DATABASE_URL`:
> - Empieza con `file:` → modo LOCAL (SQLite)
> - Empieza con `libsql://` o `http` → modo ONLINE (Turso)

---

## ☁️ Configurar Turso (modo online)

Turso es un servicio gratuito de base de datos en la nube basado en SQLite. Te permite tener tus datos accesibles desde cualquier lugar con internet.

### 📝 Paso a paso

#### 1️⃣ Crear una cuenta en Turso

Andá a 👉 **https://turso.tech** y creá una cuenta gratuita (no requiere tarjeta de crédito).

#### 2️⃣ Crear una base de datos

Instalá el CLI de Turso (una sola vez):

- **Linux:**
  ```bash
  curl -sSfL https://get.tur.so/install.sh | bash
  ```
- **Windows (PowerShell):**
  ```powershell
  irm https://get.tur.so/install.ps1 | iex
  ```

Iniciá sesión:

```bash
turso auth login
```

Creá la base de datos:

```bash
turso db create pastas-orlando
```

#### 3️⃣ Obtener la URL de la base de datos

```bash
turso db show pastas-orlando --url
```

Esto devuelve algo como:

```
libsql://pastas-orlando-TU-USUARIO.turso.io
```

Anotá esta URL.

#### 4️⃣ Crear un token de acceso

```bash
turso db tokens create pastas-orlando
```

Esto devuelve una cadena larga como:

```
eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

Anotá este token. **No lo compartas con nadie.**

#### 5️⃣ Editar el archivo `.env.online`

Abrí el archivo `.env.online` con un editor de texto (Notepad, Gedit, VS Code, etc.) y reemplazá las líneas correspondientes:

```env
DATABASE_URL=libsql://pastas-orlando-TU-USUARIO.turso.io
DATABASE_AUTH_TOKEN=TU-TOKEN-AQUI
```

> 💡 Dejá los demás valores (`NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, etc.) como están. La URL de Turso y el token son los únicos campos críticos.

#### 6️⃣ Activar modo ONLINE

- **Linux:**
  ```bash
  ./scripts/switch-mode.sh online
  ```
- **Windows:** hacé doble click en `scripts\switch-mode.bat` y elegí `online`.

#### 7️⃣ Reiniciar el sistema

Cerrá el servidor (Ctrl+C) y volvé a iniciarlo con `start-linux.sh` o `start-windows.bat`.

> ⚠️ **La primera vez que cambies a modo ONLINE**, es probable que la base de datos de Turso esté vacía. Necesitás sincronizar tus datos locales a Turso (ver la siguiente sección [🔄 Sincronizar datos (Local ↔ Turso)](#-sincronizar-datos-local--turso)).

---

## 🔄 Sincronizar datos (Local ↔ Turso)

> 🚨 **ESTA ES LA SECCIÓN MÁS IMPORTANTE.** Lela con atención antes de ejecutar cualquier comando.

La sincronización copia **TODOS** los datos (productos, ventas, clientes, recetas, etc.) entre tu base local (`dev.db`) y la base de datos de Turso en la nube. Podés hacerlo en **dos direcciones**:

| Dirección | Comando | Qué hace | Cuándo usarla |
|-----------|---------|----------|---------------|
| **`push`** | `./scripts/sync-db.sh push` | Local → Turso (sobrescribe la nube) | Cuando trabajaste offline y querés subir tus datos a la nube. Es la operación típica la primera vez que activás modo ONLINE. |
| **`pull`** | `./scripts/sync-db.sh pull` | Turso → Local (sobrescribe el local) | Cuando trabajaron otros usuarios en la nube y querés bajar esos datos a tu PC. También para restaurar tu local desde la nube si perdiste datos. |

> 💡 **Backward-compat:** si ya venías usando el script anterior `sync-to-turso.sh` (o `.bat`), seguís pudiendo usarlo: es un *alias* que ejecuta `sync-db.sh push` (mismo comportamiento de siempre).

### ⚠️ Advertencias importantes

> ⚠️ **ADVERTENCIA 1 — Sobrescritura total:** Tanto `push` como `pull` **SOBREESCRIBEN** completamente los datos del destino. Para cada tabla, primero **BORRA** todo lo que haya del lado destino y luego **INSERTA** los datos del lado origen. Si tenías datos diferentes del lado destino, **se van a perder**.

> ⚠️ **ADVERTENCIA 2 — No es "merge":** La sincronización **no combina** datos. Es un reemplazo completo tabla por tabla. Si alguien carga una venta en la nube y vos hacés `push` desde tu local sin esa venta, la venta de la nube **se borra**.

> ⚠️ **ADVERTENCIA 3 — No sincronices en uso:** **NO sincronices mientras otros usuarios estén usando activamente la base de datos del lado destino.** El borrado e inserción de tablas puede causar errores en sus sesiones. Avisá a todos antes de sincronizar.

> ⚠️ **ADVERTENCIA 4 — `pull` pide confirmación:** Como `pull` sobrescribe tu `dev.db` local, el script te pide confirmar escribiendo `si` antes de continuar. Para omitir la confirmación (p. ej. en scripts automatizados), usá `--yes` o `-y`.

> 💡 **Antes de sincronizar, el sistema crea automáticamente un backup de tu `dev.db`** en la carpeta `data/`. Si algo sale mal, podés restaurar desde ahí (ver sección [💾 Backups](#-backups)).

### 📋 Pasos para sincronizar

#### 1️⃣ Asegurarte de estar en modo ONLINE

La sincronización **solo funciona si el sistema está configurado para usar Turso** (necesita las credenciales de la nube para conectarse). Cambiá a modo ONLINE ejecutando:

- **Linux:**
  ```bash
  ./scripts/switch-mode.sh online
  ```
- **Windows:** hacé doble click en `switch-mode.bat` y elegí `online`.

> ❌ Si ejecutás el script de sincronización estando en modo LOCAL, te va a mostrar un error pidiéndote que cambies a modo ONLINE primero. Esto es porque en modo LOCAL no hay credenciales de Turso disponibles.

> 💡 **¿Por qué hay que estar en modo ONLINE incluso para `pull`?** Porque el script necesita leer las credenciales de Turso (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`) del archivo `.env` activo, y esas credenciales solo están presentes cuando estás en modo ONLINE. Una vez terminada la sincronización podés volver a modo LOCAL con `./scripts/switch-mode.sh local` si querés seguir trabajando offline.

#### 2️⃣ Ejecutar el script de sincronización

##### 🔄 `push` — Subir datos del local a la nube

- **Linux:**
  ```bash
  ./scripts/sync-db.sh push
  ```
- **Windows:** hacé doble click en `scripts\sync-db.bat` y elegí `push`, o desde CMD:
  ```bat
  scripts\sync-db.bat push
  ```

> ℹ️ También podés usar el nombre anterior: `./scripts/sync-to-turso.sh` (Linux) o `scripts\sync-to-turso.bat` (Windows). Hacen exactamente lo mismo (`sync-db push`).

##### 🔄 `pull` — Bajar datos de la nube al local

- **Linux:**
  ```bash
  ./scripts/sync-db.sh pull
  ```
  Te va a pedir confirmación:
  ```
  ⚠️  ADVERTENCIA: pull va a SOBREESCRIBIR tu dev.db local
  con los datos que estén en Turso. Los datos locales actuales
  se van a borrar (antes se hace un backup automático).

  ¿Confirmás que querés sobrescribir el local con Turso? (escribí 'si' para confirmar):
  ```
  Escribí `si` y Enter para continuar. Cualquier otra cosa cancela la operación.

- **Windows:** hacé doble click en `scripts\sync-db.bat` y elegí `pull`, o desde CMD:
  ```bat
  scripts\sync-db.bat pull
  ```

> ⚡ Para omitir la confirmación (automatización): `./scripts/sync-db.sh pull --yes` (Linux) o `scripts\sync-db.bat pull --yes` (Windows).

#### 3️⃣ ¿Qué hace el script automáticamente?

El script ejecuta estos pasos sin que tengas que hacer nada:

1. ✅ Verifica que Node.js esté instalado y que exista `dev.db`.
2. ✅ Verifica que estés en modo ONLINE (que `DATABASE_URL` empiece con `libsql://` o `http`).
3. ✅ Si es `pull`, pide confirmación interactiva (salvo `--yes`).
4. ✅ Crea un **backup automático** de `dev.db` en la carpeta `data/` con el nombre `backup-YYYYMMDD-HHMMSS.db`.
5. ✅ Lee todas las tablas de usuario del **origen** (excluye `sqlite_%`, `_prisma_%`, `__drizzle_%`).
6. ✅ Si es `pull` y alguna tabla no existe en el destino, la **crea automáticamente** replicando el schema original (`CREATE TABLE` + índices). Así funciona aunque el `dev.db` esté vacío.
7. ✅ Se conecta a Turso usando las credenciales de `.env`.
8. ✅ Para cada tabla:
   - Borra todos los registros existentes en el **destino** (`DELETE FROM tabla`).
   - Inserta los registros del **origen** en lotes de 100 filas (`INSERT INTO tabla ...`).
   - Muestra el progreso tabla por tabla.
9. ✅ Verifica el resultado contando los registros de `ProductoTerminado` en el destino.

#### 4️⃣ Revisar el resultado

Al terminar, vas a ver un mensaje de este estilo:

```
============================================
  🔄 Sincronización bidireccional Local ↔ Turso
============================================
  Dirección: push
  (Local SQLite → Turso, sobrescribe la nube)

  ✅ Paso 1: Node.js detectado (v20.11.1)
  ✅ Paso 2: Base de datos local encontrada (dev.db)
  ✅ Paso 3: .env en modo ONLINE (Turso)
  ✅ Paso 4: Backup creado: data/backup-20260106-153012.db

  🔄 Paso 5: Sincronizando tablas...
  --------------------------------------------
  📋 Tablas encontradas en origen (local): 67
  ✅ ProductoTerminado: 86 filas
  ✅ Venta: 1247 filas
  ✅ Cliente: 312 filas
  ...
  --------------------------------------------
  📊 Resumen: 67 sincronizadas, 0 omitidas, 0 fallidas, 8543 filas totales.

  ✅ Sincronización push completada: 67/67 tablas.
  📦 ProductoTerminado: 86 filas en Turso.
  --------------------------------------------

============================================
  ✅ Sincronización completada con éxito
  Backup disponible en: data/backup-20260106-153012.db
============================================
```

Si ves **`✅ Sincronización completada con éxito`**, todo salió bien.

> 🎉 **Después de `push`:** tus datos están en la nube y podés acceder desde otras PCs configuradas con las mismas credenciales de Turso.
>
> 🎉 **Después de `pull`:** tu `dev.db` local tiene los datos de la nube. Podés volver a modo LOCAL con `./scripts/switch-mode.sh local` y seguir trabajando offline con los datos actualizados.

### ❌ ¿Qué hacer si la sincronización falla?

Si el script muestra un error, revisá en este orden:

1. **Conexión a internet:** verificá que tengas internet navegando a cualquier página web.
2. **Credenciales de Turso en `.env`:** abrí el archivo `.env` (o `.env.online`) y confirmá que `DATABASE_URL` y `DATABASE_AUTH_TOKEN` (o `TURSO_AUTH_TOKEN`) sean correctos. Si copiaste el token mal, vas a ver un error `unauthorized`.
3. **Modo activo:** ejecutá `switch-mode.sh online` de nuevo para asegurarte de que el `.env` activo sea el de Turso.
4. **Base local válida (para `push`):** verificá que `dev.db` exista y tenga datos (peso mayor a algunos KB).
5. **Backup previo:** si la sincronización se cortó a mitad de camino, los datos del lado destino pueden haber quedado incompletos. Para `push`, reintentá la sincronización (es idempotente). Para `pull`, restaurá tu base local desde el último backup en `data/` (ver sección [💾 Backups](#-backups)) y volvé a intentar.

> 💡 El script guarda el backup **antes** de hacer cualquier modificación, así que tu base local está siempre a salvo. Lo peor que puede pasar es:
> - En `push`: que Turso quede con datos parciales. Solución: reintentar `push`.
> - En `pull`: que tu `dev.db` quede con datos parciales. Solución: restaurar desde el backup de `data/` y reintentar `pull`.

### 🧪 Casos de uso típicos

| Situación | Qué hacer |
|-----------|-----------|
| **Primera vez que activás modo ONLINE** (Turso vacío) | `sync-db.sh push` — subí todos tus datos locales a la nube. |
| **Trabajaste offline varios días y querés subir novedades** | `sync-db.sh push` — sobrescribe la nube con tus datos locales. |
| **Otra PC cargó datos en la nube y querés tenerlos en tu local** | `sync-db.sh pull` — bajá los datos de la nube a tu `dev.db`. |
| **Se rompió tu `dev.db` y querés restaurarlo desde la nube** | `sync-db.sh pull` — restaurá desde el último estado de Turso. |
| **Querés migrar a una PC nueva** | 1. Instalá el paquete en la PC nueva. 2. Configurá `.env.online` con las mismas credenciales. 3. `switch-mode.sh online`. 4. `sync-db.sh pull`. 5. `switch-mode.sh local`. |
| **Hiciste cambios en la nube y en el local, y no sabés cuál prevalece** | 🚨 Decidí cuál es la "verdad" y hacé `push` o `pull` en esa dirección. **Nunca** intentes combinar manualmente: la sincronización es reemplazo total, no merge. |

---

## 💾 Backups

Los backups son copias de seguridad de tu base de datos local. Son tu red de seguridad ante cualquier problema.

### 🤖 Backups automáticos

El sistema genera un backup **automáticamente** antes de cada sincronización (tanto `push` como `pull`). Estos backups se guardan en la carpeta `data/` con el formato:

```
backup-YYYYMMDD-HHMMSS.db
```

Por ejemplo: `backup-20260106-153012.db` (6 de enero de 2026, 15:30:12).

### ✋ Backups manuales

#### En Linux

Ejecutá el script dedicado:

```bash
./scripts/backup-local.sh
```

El script genera:
- Una copia de `dev.db` en `data/backup-YYYYMMDD-HHMMSS.db`.
- Si tenés `sqlite3` CLI instalado, también genera un dump SQL `data/backup-YYYYMMDD-HHMMSS.sql`.

#### En Windows

No hay script dedicado, pero podés hacer un backup manual así:

1. Detené el sistema (Ctrl+C en la ventana de CMD).
2. Abrí el Explorador de archivos y andá a la carpeta del paquete.
3. Copiá el archivo `dev.db`.
4. Pegalo en la carpeta `data\`.
5. Renombralo con la fecha, por ejemplo: `backup-20260106.db`.
6. Volvé a iniciar el sistema.

### 🔄 Restaurar un backup

Si perdiste datos o algo se rompió, podés restaurar desde un backup:

1. **Detené el sistema** (Ctrl+C en la terminal, o cerrá la ventana).
2. Andá a la carpeta `data/` y buscá el backup que querés restaurar.
3. Copiá ese archivo a la raíz del paquete.
4. Renombralo como `dev.db` (sobreescribiendo el archivo existente).
5. Volvé a iniciar el sistema con `start-linux.sh` o `start-windows.bat`.

> ⚠️ Al restaurar un backup, **se pierden todos los cambios realizados después** de la fecha del backup. Por eso es importante hacer backups frecuentes.

### 📅 Recomendaciones

- ✅ Hacé un backup **antes** de cualquier operación importante: importaciones masivas, cambios de esquema, migraciones.
- ✅ Hacé un backup al menos **una vez por semana** si usás el sistema a diario.
- ✅ Guardá copias de los backups en otra ubicación (pendrive, disco externo, nube) por si la PC falla.
- ✅ Borrá los backups muy antiguos de `data/` para no llenar el disco.

---

## 🚀 Uso diario

Una vez instalado y configurado, el uso del sistema es muy simple.

### ▶️ Iniciar el sistema

- **Windows:** doble click en `scripts\start-windows.bat`
- **Linux:** `./scripts/start-linux.sh`

Se abre una ventana de terminal que **debe quedar abierta** mientras uses el sistema.

### ⏹️ Detener el sistema

- Hacé click en la ventana de terminal y presioná **`Ctrl + C`**.
- O simplemente **cerrá la ventana** de la terminal.

### 🌐 Acceder al sistema

| URL | Para qué sirve |
|-----|----------------|
| `http://localhost:3000` | Página principal (landing pública, catálogo, etc.) |
| `http://localhost:3000/admin/login` | Panel de administración (requiere usuario y contraseña) |

### 👤 Acceso al panel admin

- **Email:** `admin@pastasorlando.com`
- **Contraseña:** la que se configuró al sembrar la base de datos.

> 🔐 Por seguridad, **cambiá la contraseña del admin** la primera vez que entres. Ver sección [🔐 Seguridad](#-seguridad).

### 💾 Persistencia de datos

El sistema **recuerda tus datos entre reinicios**. Todos los productos, ventas, clientes, etc. se guardan automáticamente en `dev.db`. No necesitás "guardar" nada al cerrar.

> 💡 Igual, recomendamos hacer backups periódicos (ver [💾 Backups](#-backups)).

---

## 🔐 Seguridad

Seguí estas recomendaciones para mantener tu sistema seguro:

- 🔑 **Cambiar el `NEXTAUTH_SECRET`** del archivo `.env.local` por una clave única generada con `openssl rand -base64 32`. No uses la clave del ejemplo.
- 👤 **Cambiar la contraseña del usuario admin** la primera vez que entres al panel de administración.
- 🔒 **No compartir el archivo `.env`** con nadie. Contiene credenciales sensibles (tokens de Turso, contraseñas de email, secretos).
- 💾 **Hacer backups periódicos** de `dev.db`. Al menos uno por semana si usás el sistema a diario.
- 🛡️ **El sistema solicita autenticación** para acceder al panel admin. No desactivés esta protección.
- ☁️ **Si usás modo online, protegé el token de Turso.** Si alguien lo obtiene, puede acceder a tu base de datos en la nube.
- 🚫 **No expongas el sistema directamente a internet** sin un proxy/reverse proxy con HTTPS. El sistema está pensado para uso local o detrás de un proxy seguro.
- 🔄 **Rotá el token de Turso** si sospechás que se filtró: `turso db tokens invalidate <token> && turso db tokens create pastas-orlando`.
- 💻 **Bloqueá la pantalla** de tu PC cuando te alejes, especialmente si estás en un local con clientes.

---

## 🛠️ Solución de problemas

### ❓ Preguntas frecuentes

| Problema | Solución |
|----------|----------|
| **El navegador muestra "No se puede acceder al sitio"** | Verificá que el sistema esté corriendo (la ventana de terminal abierta con `start-windows.bat` o `start-linux.sh`). Si no está abierta, iniciá el sistema. |
| **Error: `node` no se reconoce como un comando** | Instalá Node.js 18 o superior desde https://nodejs.org (Windows) o ejecutá `sudo dnf install -y nodejs` (Fedora). |
| **El puerto 3000 ya está en uso** | Cerrá otras aplicaciones que puedan usar ese puerto (otros servidores, Skype, etc.). Si el problema persiste, editá el archivo `.env` y cambiá `PORT=3000` por `PORT=3001` (luego accedé a `http://localhost:3001`). |
| **No puedo sincronizar a Turso** | Verificá tres cosas: (1) conexión a internet, (2) credenciales correctas en `.env.online`, (3) haber ejecutado `switch-mode.sh online` antes de sincronizar. |
| **Se borraron mis datos** | Restaurá desde el último backup en `data/`. Ver sección [💾 Backups](#-backups) → "Restaurar un backup". |
| **El sistema va lento** | Cerrá otras aplicaciones que estén consumiendo RAM. Verificá que tengas al menos 2 GB libres. Si la base de datos es muy grande, considerá archivar datos antiguos. |
| **Las imágenes no cargan** | Verificá que la carpeta `/public` exista y contenga las imágenes. Si falta alguna, restablecela desde el paquete original. |
| **Olvidé la contraseña del admin** | Contactá al desarrollador. La contraseña se establece al sembrar la base de datos y se guarda hasheada en `dev.db`. |
| **El sistema se cierra solo al arrancar** | Abrí la terminal manualmente y ejecutá el script desde ahí para ver el error antes de que se cierre la ventana. |
| **Error `EADDRINUSE` en consola** | Hay otro proceso usando el puerto 3000. Cambiá `PORT` en `.env` o cerrá el otro proceso. |
| **Los acentos se ven mal (Ã¡, Ã©, etc.)** | Es un problema de codificación. En Windows, ejecutá `chcp 65001` antes del script. Los scripts `.bat` ya lo hacen automáticamente. |
| **Turso devuelve `unauthorized`** | El token en `.env.online` es incorrecto o está vencido. Generá uno nuevo con `turso db tokens create pastas-orlando`. |
| **La sincronización se corta a mitad** | Probablemente sea un problema de conexión intermitente. Tu base local está a salva (hay backup previo). Volvé a ejecutar el script. |
| **`pull` me pide confirmación y no puedo automatizarlo** | Usá `--yes` o `-y`: `./scripts/sync-db.sh pull --yes` (Linux) o `scripts\sync-db.bat pull --yes` (Windows). |
| **`pull` falla con "no se pudo limpiar (¿falta tabla?)"** | El schema del `dev.db` local está desactualizado respecto al de Turso. El script intenta crear las tablas faltantes automáticamente; si aún así falla, borrá `dev.db` y volvé a intentarlo (el backup previo te protege). |
| **Hice `pull` y perdí datos locales que no estaban en la nube** | 🚨 Es el comportamiento esperado (la sincronización es reemplazo total, no merge). Restaurá desde el backup en `data/` que se creó antes del `pull` y combiná manualmente lo que necesites. |

### 🆘 Si nada de esto funciona

1. Hacé un backup de `dev.db` (copialo a otra carpeta).
2. Anotá el mensaje de error exacto que ves en la terminal.
3. Contactá al desarrollador (ver sección [📞 Soporte](#-soporte)).

---

## 📞 Soporte

Este es un **sistema privado** desarrollado exclusivamente para **Las Pastas de Orlando**. No es un producto de uso público.

### 📧 Contacto técnico

Para cualquier problema técnico, error, o consulta sobre el funcionamiento del sistema, contactá al desarrollador:

- 📧 Por email al desarrollador a cargo.
- 📲 Por WhatsApp al número de contacto proporcionado al instalar el sistema.

> 💡 Cuando reportes un problema, **incluí siempre**:
> - El mensaje de error exacto (puede hacer una captura de pantalla).
> - El sistema operativo que estás usando (Windows o Linux).
> - Qué estabas haciendo cuando ocurrió el error.
> - La fecha y hora aproximada del problema.

### 📦 Reinstalación

Si el sistema se rompe y no podés repararlo, podés reinstalarlo:

1. Hacé un backup de `dev.db` y de la carpeta `data/` (por si acaso).
2. Guardá el paquete original `laspastasdeorlando-local.zip` (o `.tar.gz`) en un lugar seguro.
3. Borra la carpeta del paquete.
4. Descomprimí el paquete original en una nueva carpeta.
5. Restaurá tu `dev.db` desde el backup.
6. Listo. El sistema vuelve a funcionar con tus datos.

> 🗂️ **Recomendación:** guardá el paquete `.zip` o `.tar.gz` original en una carpeta de respaldo (pendrive, disco externo, nube). Si la PC se rompe, vas a poder reinstalar todo en otra computadora.

---

## 📄 Licencia

**Proyecto privado — laspastasdeorlando © 2026. Todos los derechos reservados.**

Este software y su código fuente son propiedad exclusiva de **Las Pastas de Orlando**. Su uso, copia, modificación o distribución está restringido al ámbito interno de la organización.

Queda prohibida cualquier redistribución, venta o uso comercial del sistema sin autorización expresa por escrito.

---

> 🍝 **¡Listo!** Con esta guía deberías poder instalar, configurar y usar el sistema Las Pastas de Orlando en tu PC sin problemas. Si encontrás algún error en esta guía, reportalo al desarrollador para que pueda corregirlo.
>
> ¡Buenas pastas y buenas ventas! 🍝✨
