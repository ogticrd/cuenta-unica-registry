import { describe, expect, it } from 'vitest';

import { unwrap } from '@/common/helpers/unwrap';
import { localizeString } from '@/common/helpers/localize-string';
import es from '@/dictionaries/es.json';

describe('unwrap', () => {
  it('throws localized low confidence message values from failed responses', async () => {
    const response = new Response(
      JSON.stringify({ message: 'errors.liveness.lowConfidence' }),
      {
        status: 403,
        headers: { 'content-type': 'application/json' },
      },
    );

    await expect(unwrap(response)).rejects.toThrow(
      'errors.liveness.lowConfidence',
    );
    expect(localizeString(es, 'errors.liveness.lowConfidence')).toBe(
      'La prueba de vida no ha sido exitosa. Verifique las instrucciones e intente nuevamente.',
    );
  });

  it('throws localized no match message values from failed responses', async () => {
    const response = new Response(
      JSON.stringify({ message: 'errors.liveness.noMatch' }),
      {
        status: 404,
        headers: { 'content-type': 'application/json' },
      },
    );

    await expect(unwrap(response)).rejects.toThrow('errors.liveness.noMatch');
    expect(localizeString(es, 'errors.liveness.noMatch')).toBe(
      'No se ha podido validar su identidad con la JCE. Intente nuevamente o actualice su foto en la JCE.',
    );
  });

  it('preserves existing error field precedence', async () => {
    const response = new Response(
      JSON.stringify({
        error: 'errors.liveness.noMatch',
        message: 'errors.liveness.lowConfidence',
      }),
      {
        status: 404,
        headers: { 'content-type': 'application/json' },
      },
    );

    await expect(unwrap(response)).rejects.toThrow('errors.liveness.noMatch');
  });
});
