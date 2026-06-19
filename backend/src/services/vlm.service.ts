/**
 * VLM Service — Extracción de menú con IA (LM Studio)
 *
 * Se conecta a un modelo de visión (VLM) servido localmente por LM Studio
 * mediante su API compatible con OpenAI (`/chat/completions`).
 *
 * Recibe la foto de un menú impreso (data URL en base64) y devuelve la lista
 * de platillos detectados. Si LM Studio no está disponible, la función lanza
 * un error que la ruta traduce a un 502 con un mensaje claro.
 */

import { env } from '../config/env';

export interface ExtractedDish {
  name: string;
  description: string;
  price: number;
  suggested_category: string;
}

const SYSTEM_PROMPT = `Eres un asistente que extrae el menú de un restaurante a partir de la foto de una carta impresa.
Responde ÚNICAMENTE con un arreglo JSON válido. NO razones, NO expliques, NO uses bloques de código.
Tu respuesta debe EMPEZAR con el carácter [ y TERMINAR con ] — nada de texto antes o después.
Cada elemento debe tener exactamente estas llaves:
- "name": nombre del platillo (string)
- "description": descripción corta o ingredientes (string, "" si no hay)
- "price": precio numérico sin símbolos de moneda (number, 0 si no se distingue)
- "suggested_category": categoría sugerida como "Entradas", "Platos Fuertes", "Bebidas" o "Postres" (string)
Ejemplo exacto de formato: [{"name":"Tacos al pastor","description":"3 piezas con piña","price":75,"suggested_category":"Platos Fuertes"}]`;

/**
 * Extrae el arreglo de platillos del texto crudo devuelto por el modelo.
 *
 * Es una función pura (sin red) para poder probarla con unit tests. Tolera que
 * el modelo envuelva el JSON en bloques markdown (```json), agregue prosa
 * alrededor, o use llaves en español (nombre/descripcion/precio/categoria).
 */
export function parseVlmResponse(content: string): ExtractedDish[] {
  if (!content || typeof content !== 'string') return [];

  let text = content.trim();

  // 1) Si viene envuelto en ```json ... ``` quedarnos con el interior
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();

  // 2) Intentar parsear el arreglo/objeto JSON completo
  let list: unknown[] | null = null;
  const tryParse = (s: string): boolean => {
    try {
      const parsed = JSON.parse(s);
      list = Array.isArray(parsed)
        ? parsed
        : ((parsed?.dishes ?? parsed?.platillos) as unknown[] | undefined) ?? null;
      return Array.isArray(list);
    } catch {
      return false;
    }
  };

  if (!tryParse(text)) {
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (!arrMatch || !tryParse(arrMatch[0])) {
      // 3) Fallback robusto: el JSON puede venir truncado (el modelo se quedó
      //    sin tokens) o envuelto en razonamiento/prosa. Recuperamos cada
      //    objeto plano { ... } por separado y descartamos el último si quedó
      //    incompleto (sin llave de cierre).
      const objectMatches = text.match(/\{[^{}]*\}/g);
      list = (objectMatches ?? [])
        .map((m) => {
          try {
            return JSON.parse(m);
          } catch {
            return null;
          }
        })
        .filter((o): o is Record<string, unknown> => o !== null);
    }
  }

  if (!list || !Array.isArray(list)) return [];

  return list
    .map((raw) => {
      const d = (raw ?? {}) as Record<string, unknown>;
      return {
        name: String(d.name ?? d.nombre ?? '').trim(),
        description: String(d.description ?? d.descripcion ?? '').trim(),
        price: parsePrice(d.price ?? d.precio),
        suggested_category: String(
          d.suggested_category ?? d.categoria ?? d.category ?? 'Sin categoría'
        ).trim(),
      };
    })
    .filter((d) => d.name.length > 0);
}

/**
 * Construye la URL de `/chat/completions` a partir de LM_STUDIO_URL,
 * tolerando que la base incluya o no el prefijo `/v1`
 * (ej. "http://localhost:1234" y "http://localhost:1234/v1" funcionan igual).
 */
export function buildChatUrl(base: string): string {
  const trimmed = base.replace(/\/+$/, '');
  const withVersion = /\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/v1`;
  return `${withVersion}/chat/completions`;
}

function chatCompletionsUrl(): string {
  return buildChatUrl(env.LM_STUDIO_URL);
}

/**
 * Extrae un precio numérico de valores como 120, "$120", "$15-$20" o "120 MXN".
 * Devuelve el primer número encontrado, o 0 si no hay ninguno.
 */
export function parsePrice(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const match = String(value ?? '').match(/\d+(?:[.,]\d+)?/);
  return match ? parseFloat(match[0].replace(',', '.')) : 0;
}

/**
 * Envía la imagen del menú al VLM de LM Studio y devuelve los platillos extraídos.
 *
 * @param imageDataUrl - imagen en formato data URL (ej. "data:image/jpeg;base64,...")
 * @throws Error si no se puede contactar a LM Studio o responde con error
 */
export async function extractDishesFromImage(imageDataUrl: string): Promise<ExtractedDish[]> {
  const requestBody: Record<string, unknown> = {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extrae todos los platillos visibles en esta carta. Responde solo con el arreglo JSON.' },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    stream: false,
  };

  // Solo enviamos `model` si está configurado explícitamente. Si no, LM Studio
  // usa el modelo de visión actualmente cargado (enviar un id inexistente
  // provoca un HTTP 400).
  if (env.LM_STUDIO_MODEL) {
    requestBody.model = env.LM_STUDIO_MODEL;
  }

  const response = await fetch(chatCompletionsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`LM Studio respondió con estado ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data?.choices?.[0]?.message?.content ?? '';
  return parseVlmResponse(content);
}
