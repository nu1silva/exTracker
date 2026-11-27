import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HealthStatus } from '../src/HealthStatus.tsx';

describe('HealthStatus', () => {
  it('shows a waiting message while the check runs', () => {
    expect(renderToStaticMarkup(<HealthStatus isPending error={null} data={undefined} />)).toContain('Checking the API');
  });

  it('shows the API and database status', () => {
    const html = renderToStaticMarkup(
      <HealthStatus isPending={false} error={null} data={{ status: 'ok', database: 'up' }} />,
    );
    expect(html).toContain('<dt>API</dt><dd>ok</dd>');
    expect(html).toContain('<dt>Database</dt><dd>up</dd>');
  });

  it('shows the error when the API cannot be reached', () => {
    const html = renderToStaticMarkup(
      <HealthStatus isPending={false} error={new Error('HTTP 502')} data={undefined} />,
    );
    expect(html).toContain('Cannot reach the API: HTTP 502');
  });
});
