import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// The standalone deliverable is intentionally independent of the starter app.
const html = readFileSync('/mnt/documents/live-weather_v3.html', 'utf8');
const script = html.split('<script>')[1]?.split('</script>')[0];
if (!script) throw new Error('Weather script missing');
const sceneScript = script.slice(script.indexOf('const WMO='), script.indexOf('/* ---------- clock'));
const scene = runInNewContext(`${sceneScript}; selectScene`) as (c: {
  weather_code: number; temperature_2m: number; wind_speed_10m: number; is_day: number;
}) => { theme: string; kind: string };

describe('condition-responsive weather scenes', () => {
  it('changes the sunny design as temperature increases', () => {
    const sunny = { weather_code: 0, wind_speed_10m: 8, is_day: 1 };
    expect(scene({ ...sunny, temperature_2m: 24 }).theme).toBe('clear');
    expect(scene({ ...sunny, temperature_2m: 33 }).theme).toBe('hot');
    expect(scene({ ...sunny, temperature_2m: 41 }).theme).toBe('extreme');
  });
  it.each([[45, 'fog'], [63, 'rain'], [73, 'snow'], [95, 'storm']])(
    'preserves weather effects for code %i', (weather_code, kind) => {
      expect(scene({ weather_code: Number(weather_code), temperature_2m: 20, wind_speed_10m: 8, is_day: 1 }).kind).toBe(kind);
    },
  );
  it('uses a wind scene for strong wind rather than a calm sun', () => {
    expect(scene({ weather_code: 0, temperature_2m: 24, wind_speed_10m: 45, is_day: 1 }).kind).toBe('wind');
  });
  it('retains the moon scene at night even in hot weather', () => {
    expect(scene({ weather_code: 0, temperature_2m: 41, wind_speed_10m: 8, is_day: 0 }).theme).toBe('night');
  });
});