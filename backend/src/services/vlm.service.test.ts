import { describe, it, expect } from 'vitest';
import { parseVlmResponse, parsePrice, buildChatUrl } from './vlm.service';

describe('buildChatUrl — normaliza el prefijo /v1 de LM Studio', () => {
  it('agrega /v1 si la base no lo trae', () => {
    expect(buildChatUrl('http://localhost:1234')).toBe('http://localhost:1234/v1/chat/completions');
  });
  it('respeta la base que ya incluye /v1', () => {
    expect(buildChatUrl('http://localhost:1234/v1')).toBe('http://localhost:1234/v1/chat/completions');
  });
  it('ignora barras finales sobrantes', () => {
    expect(buildChatUrl('http://localhost:1234/v1/')).toBe('http://localhost:1234/v1/chat/completions');
  });
});

describe('parsePrice — precios que devuelve el VLM', () => {
  it('acepta números directos', () => {
    expect(parsePrice(120)).toBe(120);
  });
  it('extrae el número de strings con símbolo de moneda', () => {
    expect(parsePrice('$120')).toBe(120);
    expect(parsePrice('120 MXN')).toBe(120);
  });
  it('toma el primer número en rangos', () => {
    expect(parsePrice('$15-$20')).toBe(15);
  });
  it('soporta decimales con punto o coma', () => {
    expect(parsePrice('$95.50')).toBe(95.5);
    expect(parsePrice('95,50')).toBe(95.5);
  });
  it('devuelve 0 si no hay número', () => {
    expect(parsePrice('mkt')).toBe(0);
    expect(parsePrice(undefined)).toBe(0);
  });
});

describe('parseVlmResponse — parseo de la salida del VLM', () => {
  it('parsea un arreglo JSON directo', () => {
    const raw = '[{"name":"Tacos","description":"3 pzas","price":75,"suggested_category":"Platos Fuertes"}]';
    const dishes = parseVlmResponse(raw);
    expect(dishes).toHaveLength(1);
    expect(dishes[0]).toEqual({
      name: 'Tacos',
      description: '3 pzas',
      price: 75,
      suggested_category: 'Platos Fuertes',
    });
  });

  it('extrae el JSON cuando viene envuelto en un bloque markdown ```json', () => {
    const raw = 'Claro, aquí están:\n```json\n[{"name":"Agua de jamaica","price":35}]\n```';
    const dishes = parseVlmResponse(raw);
    expect(dishes).toHaveLength(1);
    expect(dishes[0].name).toBe('Agua de jamaica');
    expect(dishes[0].price).toBe(35);
    expect(dishes[0].suggested_category).toBe('Sin categoría');
  });

  it('soporta llaves en español (nombre/descripcion/precio/categoria)', () => {
    const raw = '[{"nombre":"Flan","descripcion":"casero","precio":"60","categoria":"Postres"}]';
    const dishes = parseVlmResponse(raw);
    expect(dishes[0]).toEqual({
      name: 'Flan',
      description: 'casero',
      price: 60,
      suggested_category: 'Postres',
    });
  });

  it('acepta un objeto con la llave dishes', () => {
    const raw = '{"dishes":[{"name":"Sopa"}]}';
    expect(parseVlmResponse(raw)).toHaveLength(1);
  });

  it('descarta elementos sin nombre', () => {
    const raw = '[{"name":""},{"name":"Pizza"},{"description":"sin nombre"}]';
    const dishes = parseVlmResponse(raw);
    expect(dishes).toHaveLength(1);
    expect(dishes[0].name).toBe('Pizza');
  });

  it('devuelve arreglo vacío ante texto no parseable o vacío', () => {
    expect(parseVlmResponse('lo siento, no pude leer la imagen')).toEqual([]);
    expect(parseVlmResponse('')).toEqual([]);
  });

  it('recupera platillos de un JSON truncado (modelo cortado por límite de tokens)', () => {
    // Arreglo sin cerrar y último objeto incompleto (finish_reason: length)
    const raw = '[{"name":"Trompo","price":29},{"name":"Res","price":55},{"name":"Chicharr';
    const dishes = parseVlmResponse(raw);
    expect(dishes).toHaveLength(2);
    expect(dishes.map((d) => d.name)).toEqual(['Trompo', 'Res']);
  });

  it('recupera platillos aunque el modelo agregue razonamiento alrededor', () => {
    const raw =
      'Section 1: Bebidas. Voy a estructurar los datos.\n' +
      '{"name":"Coca","price":"$39","suggested_category":"Bebidas"}\n' +
      'Luego el postre:\n' +
      '{"name":"Flan","price":65}\n' +
      'Final.';
    const dishes = parseVlmResponse(raw);
    expect(dishes).toHaveLength(2);
    expect(dishes[0]).toMatchObject({ name: 'Coca', price: 39 });
    expect(dishes[1]).toMatchObject({ name: 'Flan', price: 65 });
  });
});
