import { describe, expect, it } from 'vitest';
import contentDefault from '../sections/content-default';
import dataList from '../sections/data-list';
import sectionSchemas from '../index';


describe('shared section schema meta', () => {
  it('defines content-default meta field names', () => {
    expect(contentDefault.meta?.fields).toEqual([
      'remove_margin',
      'remove_outline_on_images',
      'content_align',
      'url_justify',
      'layout_direction',
      'width_preset',
      'content_order',
      'button_type',
    ]);
  });

  it('defines data-list meta field names', () => {
    expect(dataList.meta?.fields).toContain('closed_on_initial');
  });

  it('keeps meta field names available through readSectionSchemas registry', () => {
    expect(sectionSchemas['content-default']?.meta?.fields).toContain('width_preset');
    expect(sectionSchemas['data-list']?.meta?.fields).toContain('closed_on_initial');
  });

  it('preserves literal typing for meta field names', () => {
    type ContentDefaultMetaField = typeof contentDefault.meta.fields[number];
    const typedField: ContentDefaultMetaField = 'width_preset';
    expect(typedField).toBe('width_preset');
  });

  it('defines recursive data-list child section group schema', () => {
    expect(dataList.data.childSections).toMatchObject({
      type: 'sectionGroup',
      order: 2,
      many: true,
    });

    expect(dataList.data.childSections.data?.gallery).toMatchObject({
      type: 'gallery',
      order: 1,
    });
  });

  it('preserves nested data slot typing', () => {
    type ChildSectionSlots = NonNullable<typeof dataList.data.childSections.data>;
    const nestedGalleryType: ChildSectionSlots['gallery']['type'] = 'gallery';
    expect(nestedGalleryType).toBe('gallery');
  });
});
