import { describe, it, expect } from 'vitest';
import { generateHeadingId, generateUniqueHeadingId } from '../utils/generateHeadingId';

describe('generateHeadingId', () => {
  it('converts text to lowercase', () => {
    expect(generateHeadingId('Setup')).toBe('setup');
    expect(generateHeadingId('API Reference')).toBe('api-reference');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateHeadingId('getting started')).toBe('getting-started');
    expect(generateHeadingId('this is a test')).toBe('this-is-a-test');
  });

  it('removes special characters', () => {
    expect(generateHeadingId("What's New?")).toBe('whats-new');
    expect(generateHeadingId('Getting Started!')).toBe('getting-started');
    expect(generateHeadingId('Hello @World #Test')).toBe('hello-world-test');
  });

  it('collapses multiple hyphens', () => {
    expect(generateHeadingId('one   two')).toBe('one-two');
    expect(generateHeadingId('test - example')).toBe('test-example');
  });

  it('trims hyphens from ends', () => {
    expect(generateHeadingId(' leading space')).toBe('leading-space');
    expect(generateHeadingId('trailing space ')).toBe('trailing-space');
    expect(generateHeadingId('  both sides  ')).toBe('both-sides');
  });

  it('handles empty or whitespace-only input', () => {
    expect(generateHeadingId('')).toBe('');
    expect(generateHeadingId('   ')).toBe('');
  });

  it('preserves numbers', () => {
    expect(generateHeadingId('Step 1')).toBe('step-1');
    expect(generateHeadingId('Version 2.0')).toBe('version-20');
  });

  it('handles complex real-world examples', () => {
    expect(generateHeadingId('# Setup')).toBe('setup');
    expect(generateHeadingId('## API Reference')).toBe('api-reference');
    expect(generateHeadingId('### Getting Started!')).toBe('getting-started');
    expect(generateHeadingId("## What's New?")).toBe('whats-new');
  });
});

describe('generateUniqueHeadingId', () => {
  it('returns original ID when no duplicates exist', () => {
    const usedIds = new Set<string>();
    expect(generateUniqueHeadingId('setup', usedIds)).toBe('setup');
  });

  it('appends -1 for first duplicate', () => {
    const usedIds = new Set(['setup']);
    expect(generateUniqueHeadingId('setup', usedIds)).toBe('setup-1');
  });

  it('appends -2 for second duplicate', () => {
    const usedIds = new Set(['setup', 'setup-1']);
    expect(generateUniqueHeadingId('setup', usedIds)).toBe('setup-2');
  });

  it('handles multiple sequential duplicates', () => {
    const usedIds = new Set(['intro', 'intro-1', 'intro-2', 'intro-3']);
    expect(generateUniqueHeadingId('intro', usedIds)).toBe('intro-4');
  });

  it('adds generated ID to usedIds set', () => {
    const usedIds = new Set<string>();
    generateUniqueHeadingId('test', usedIds);
    expect(usedIds.has('test')).toBe(true);

    generateUniqueHeadingId('test', usedIds);
    expect(usedIds.has('test-1')).toBe(true);
  });

  it('handles empty base ID', () => {
    const usedIds = new Set<string>();
    // Empty ID should still work (edge case)
    expect(generateUniqueHeadingId('', usedIds)).toBe('');
  });
});
