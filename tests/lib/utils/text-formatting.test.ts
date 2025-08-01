import { formatMenuItemName } from '@/lib/utils/text-formatting';

describe('formatMenuItemName', () => {
  it('should split at Czech prepositions (1-2 letter words)', () => {
    const result = formatMenuItemName('Hovězí guláš s knedlíkem');
    expect(result.bold).toBe('Hovězí guláš');
    expect(result.rest).toBe('s knedlíkem');
  });

  it('should split at first short word within 4 words', () => {
    const result = formatMenuItemName('Smažený sýr s hranolkami');
    expect(result.bold).toBe('Smažený sýr');
    expect(result.rest).toBe('s hranolkami');
  });

  it('should default to first 2 words if no preposition found', () => {
    const result = formatMenuItemName('Grilovaná zelenina');
    expect(result.bold).toBe('Grilovaná zelenina');
    expect(result.rest).toBe('');
  });

  it('should handle single word items', () => {
    const result = formatMenuItemName('Polévka');
    expect(result.bold).toBe('Polévka');
    expect(result.rest).toBe('');
  });

  it('should handle empty strings', () => {
    const result = formatMenuItemName('');
    expect(result.bold).toBe('');
    expect(result.rest).toBe('');
  });

  it('should split at two-letter prepositions', () => {
    const result = formatMenuItemName('Kuře na grilu');
    expect(result.bold).toBe('Kuře');
    expect(result.rest).toBe('na grilu');
  });

  it('should handle multiple prepositions by using the first one', () => {
    const result = formatMenuItemName('Ryba s bramborem a salátem');
    expect(result.bold).toBe('Ryba');
    expect(result.rest).toBe('s bramborem a salátem');
  });

  it('should default to 2 words for longer items without prepositions', () => {
    const result = formatMenuItemName('Velmi dlouhý název jídla který nemá předložky');
    expect(result.bold).toBe('Velmi dlouhý');
    expect(result.rest).toBe('název jídla který nemá předložky');
  });

  it('should handle items that start with a preposition', () => {
    const result = formatMenuItemName('S máslem pečený chléb');
    expect(result.bold).toBe('');
    expect(result.rest).toBe('S máslem pečený chléb');
  });
});