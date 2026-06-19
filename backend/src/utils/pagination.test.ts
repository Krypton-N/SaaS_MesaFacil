import { describe, it, expect } from 'vitest';
import { getPagination, MAX_LIMIT } from './pagination';

describe('getPagination', () => {
  it('sin params devuelve limit null (todas las filas) y offset 0', () => {
    expect(getPagination({})).toEqual({ limit: null, offset: 0 });
  });

  it('respeta limit y offset válidos', () => {
    expect(getPagination({ limit: '20', offset: '40' })).toEqual({ limit: 20, offset: 40 });
  });

  it('acota el limit al máximo permitido', () => {
    expect(getPagination({ limit: '5000' }).limit).toBe(MAX_LIMIT);
  });

  it('fuerza limit mínimo de 1 y offset no negativo', () => {
    expect(getPagination({ limit: '0' }).limit).toBe(1);
    expect(getPagination({ limit: '-3' }).limit).toBe(1);
    expect(getPagination({ offset: '-10' }).offset).toBe(0);
  });

  it('ignora valores no numéricos', () => {
    expect(getPagination({ limit: 'abc', offset: 'xyz' })).toEqual({ limit: null, offset: 0 });
  });
});
