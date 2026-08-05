# ⚽ AI Football Assistant — MRCA Solutions

**Asistente de Inteligencia Artificial Futbolística & Procesamiento de Cédulas Arbitrales**

Desarrollado por **MRCA Solutions**.

---

## 📌 Descripción del Sistema
Plataforma web profesional para gestión y análisis deportivo automatizado mediante Inteligencia Artificial:
- **Director Técnico & Analista Táctico IA**: Generación de alineaciones, análisis estadístico (xG, posesión), tácticas y planes de entrenamiento con **Google Gemini 2.5/1.5/2.0 Flash**.
- **Procesamiento de Cédulas Arbitrales (Visión Artificial)**: Extracción estructurada de actas arbitrales (goles, tarjetas, incidencias) utilizando capacidades multimodales con **Pydantic (`response_schema`)**.
- **Persistencia en Supabase**: Guardado automático de reportes arbitrales y perfiles de usuarios en PostgreSQL.
- **Ciberseguridad & Autenticación JWT**: Registro e inicio de sesión integrados a Supabase Auth, protegiendo todos los endpoints con cabeceras `Authorization: Bearer <token>`.

---

## 🛠️ Stack Tecnológico
- **Backend**: FastAPI, Python 3.10+, Uvicorn.
- **IA**: SDK Oficial `google-genai` (Soporte completo para claves de Google GenAI).
- **Base de Datos & Auth**: Supabase (PostgreSQL) + Supabase Auth.
- **Frontend**: HTML5, CSS3 (Efectos 3D, Glassmorphism, Canvas de Partículas), JavaScript ES6.

---

## 🔒 Arquitectura de Ciberseguridad
- **Acceso Protegido**: Los endpoints `/api/v1/futbol/chat` y `/api/v1/futbol/vision/cedulas` requieren autenticación.
- **Protección de Datos**: Las contraseñas se gestionan de forma segura a través de los estándares de cifrado de Supabase.
- **Resiliencia de API**: Bucle de fallback de modelos de IA con manejo de límites de tasa (*429 Rate Limit Retry*).

---

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/football-ai-assistant.git
cd football-ai-assistant
```

### 2. Crear entorno virtual e instalar dependencias
```bash
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar variables de entorno
Copia `.env.example` a `.env` y coloca tus credenciales:
```bash
cp .env.example .env
```

### 4. Iniciar la aplicación
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Abre en tu navegador: **`http://localhost:8000`**

---

## 🎓 Evaluación Académica
Proyecto preparado para evaluación académica por el **Prof. Marcial Jesús Martínez Blas**.

**MRCA Solutions © 2026**
