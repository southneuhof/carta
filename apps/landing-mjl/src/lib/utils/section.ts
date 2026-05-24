import prisma from '$lib/utils/prisma';
import type { Section, SectionGroup, Content, Gallery } from '@prisma/client';

type StructureItem = {
  type: 'content' | 'gallery' | 'section' | 'sectionGroup';
  order: number;
  config: {
    fields?: string[];
    info?: {
      name?: string;
      description?: string;
    }
    meta?: Record<string, any>;
    structure?: StructureItem[];
    sectionGroupStructure?: StructureItem[];
  }
}

type SectionConfig = {
  meta?: Record<string, any>;
  structure: StructureItem[];
}

export async function buildSectionStructure(parentSection: Section, config: SectionConfig) {
  // Then process the structure
  for (const item of config.structure) {
    switch (item.type) {
      case 'content':
        await prisma.content.create({
          data: {
            order: item.order,
            section_id: parentSection.id
          }
        });
        break;

      case 'gallery':
        await prisma.gallery.create({
          data: {
            order: item.order,
            section_id: parentSection.id
          }
        });
        break;

      case 'section':
        if (item.config.structure) {
          const childSection = await prisma.section.create({
            data: {
              name: item.config.info?.name || `Child of ${parentSection.name}`,
              order: item.order,
              parent_section_id: parentSection.id,
              meta: item.config.meta?.defaultValues
            }
          });
          // Recursively build children with new config structure
          await buildSectionStructure(childSection, {
            structure: item.config.structure 
          });
        }
        break;

      case 'sectionGroup':
        if (item.config.structure) {
          await prisma.sectionGroup.create({
            data: {
              order: item.order,
              parent_section_id: parentSection.id,
            }
          });
        }
        break;
    }
  }
}

export async function copySectionGroupContent(
	source_id: string,
	destination_id: string,
	{ clearDestination = true } = {}
) {
	const idMap = new Map<string, string>();
	idMap.set(source_id, destination_id);

	if (clearDestination) {
		const destSections = await prisma.section.findMany({
			where: { section_group_id: destination_id }
		});

		for (const section of destSections) {
			await prisma.content.deleteMany({ where: { section_id: section.id } });

			const galleries = await prisma.gallery.findMany({ where: { section_id: section.id } });
			for (const gallery of galleries) {
				await prisma.content.deleteMany({ where: { gallery_id: gallery.id } });
				await prisma.gallery.delete({ where: { id: gallery.id } });
			}
		}

		await prisma.section.deleteMany({ where: { section_group_id: destination_id } });
	}

	async function copyNestedSectionGroup(group: SectionGroup, newParentSectionId: string) {
		const { id: oldGroupId, parent_section_id, ...groupData } = group;
		const newGroup = await prisma.sectionGroup.create({
			data: {
				...groupData,
				parent_section_id: newParentSectionId
			}
		});
		idMap.set(oldGroupId, newGroup.id);

		const sectionsToCopy = await prisma.section.findMany({
			where: {
				section_group_id: group.id,
				parent_section_id: null
			}
		});

		for (const section of sectionsToCopy) {
			await copySection(section, newGroup.id, null);
		}
	}

	async function copySection(
		section: Section,
		newSectionGroupId: string | null = null,
		parentSectionId: string | null = null
	) {
		const {
			id: oldSectionId,
			section_group_id,
			parent_section_id,
			...sectionData
		} = section;
		const newSection = await prisma.section.create({
			data: {
				...(sectionData as any),
				section_group_id: newSectionGroupId,
				parent_section_id: parentSectionId
			}
		});
		idMap.set(oldSectionId, newSection.id);

		// Copy contents not in a gallery
		const contents = await prisma.content.findMany({
			where: { section_id: oldSectionId, gallery_id: null }
		});
		for (const content of contents) {
			const { id: oldContentId, section_id, gallery_id, ...contentData } = content;
			const newContent = await prisma.content.create({
				data: {
					...(contentData as any),
					section_id: newSection.id
				}
			});
			idMap.set(oldContentId, newContent.id);
		}

		// Copy galleries and their contents
		const galleries = await prisma.gallery.findMany({ where: { section_id: oldSectionId } });
		for (const gallery of galleries) {
			const { id: oldGalleryId, section_id, ...galleryData } = gallery;
			const newGallery = await prisma.gallery.create({
				data: {
					...galleryData,
					section_id: newSection.id
				}
			});
			idMap.set(oldGalleryId, newGallery.id);

			const galleryContents = await prisma.content.findMany({
				where: { gallery_id: oldGalleryId }
			});
			for (const gContent of galleryContents) {
				const {
					id: oldGContentId,
					section_id: gContentSectionId,
					gallery_id: gContentGalleryId,
					...gContentData
				} = gContent;
				const newGContent = await prisma.content.create({
					data: {
						...(gContentData as any),
						gallery_id: newGallery.id
					}
				});
				idMap.set(oldGContentId, newGContent.id);
			}
		}

		// Copy child section groups
		const childSectionGroups = await prisma.sectionGroup.findMany({
			where: { parent_section_id: oldSectionId }
		});

		for (const group of childSectionGroups) {
			await copyNestedSectionGroup(group, newSection.id);
		}

		// Copy child sections recursively
		const childSections = await prisma.section.findMany({
			where: { parent_section_id: oldSectionId }
		});
		for (const child of childSections) {
			await copySection(child, null, newSection.id);
		}
	}

	const sourceSections = await prisma.section.findMany({
		where: {
			section_group_id: source_id,
			parent_section_id: null
		}
	});

	for (const section of sourceSections) {
		await copySection(section, destination_id, null);
	}

	return idMap;
}