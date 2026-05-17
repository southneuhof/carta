import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { PageTranslation } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import { requireRoleScopedAccess } from '$lib/app/api/authorization';
import prisma from '$lib/utils/prisma';
import { exception } from '$lib/utils/response';

export async function requirePageTranslationAccess(event: RequestEvent, input: Record<string, any>) {
	const id = input.id ?? input.page_translation_id;
	if (!id) return;

	const record = await prisma.pageTranslation.findUnique({
		where: { id: String(id) },
		select: {
			page: {
				select: {
					menuItem: {
						select: {
							allowedRoles: {
								select: { id: true },
							},
						},
					},
				},
			},
		},
	});

	if (!record?.page?.menuItem) throw exception('Record not found', 404);
	requireRoleScopedAccess(
		event.locals,
		record.page.menuItem.allowedRoles.map((role) => role.id),
	);
}

export default {
	verify: {
		allow: true,
		permission: 'verify-page',
		authorize: requirePageTranslationAccess,
		by: 'id',
		stateField: 'status_code',
		initialState: 'DRAFT',
		states: ['DRAFT', 'REVIEW', 'PUBLISHED'],
		transitions: {
			MARK_AS_UNDONE: {
				from: 'REVIEW',
				to: 'DRAFT'
			},
			MARK_AS_DONE: {
				from: 'DRAFT',
				to: 'REVIEW'
			},
			APPROVE: {
				from: 'DRAFT',
				to: 'PUBLISHED'
			},
			REVISE: {
				from: 'DRAFT',
				to: 'DRAFT'
			},
			RESET: {
				from: 'DRAFT',
				to: 'PUBLISHED'
			}
		},
		lifecycle: {
			async main(body, locals, where) {
				const { action } = body;

				if (!where) throw new Error('A "where" clause must be provided for this operation.');

				if (action === 'MARK_AS_UNDONE') {
					const record = await prisma.pageTranslation.findUnique({ where: where as any });
					if (!record) throw new Error('Record not found.');
					return await prisma.pageTranslation.update({
						where: where as any,
						data: {
							status_code: 'DRAFT',
						}
					});
				}

				if (action === 'MARK_AS_DONE') {
					const record = await prisma.pageTranslation.findUnique({ where: where as any });
					if (!record) throw new Error('Record not found.');
					return await prisma.pageTranslation.update({
						where: where as any,
						data: {
							status_code: 'REVIEW',
						}
					});
				}

				if (action === 'APPROVE') {
					const record = await prisma.pageTranslation.findUnique({ where: where as any });
					if (!record) throw new Error('Record not found.');

					if (!record.live_for_id) {
						// Not linked to a published page, just promote this draft
						return await prisma.pageTranslation.update({
							where: where as any,
							data: {
								status_code: 'PUBLISHED',
								live_for_id: null
							}
						});
					}

					// Linked to a published page, do the full swap
					return await prisma.$transaction(async (tx) => {
						await tx.pageTranslation.delete({ where: { id: record.live_for_id! } });
						return await tx.pageTranslation.update({
							where: where as any,
							data: {
								status_code: 'PUBLISHED',
								live_for_id: null
							}
						});
					});
				} else if (action === 'REVISE') {
					// For revision, we just return the record unchanged.
					// The log with the description is created by the generic handler.
					const record = await prisma.pageTranslation.findUnique({ where: where as any });
					if (!record) throw new Error('Record not found');
					return record;
				} else if (action === 'RESET') {
					// Delete the current Draft/Review record, so that it goes back to the current published
					// ONLY DELETE if there is a published record
					const current = await prisma.pageTranslation.findFirst({ where: { ...where } });
					if (!current?.live_for_id) throw new Error('Tidak ada halaman yang sudah dipublish untuk menggantikan halaman ini');
					const published = await prisma.pageTranslation.findFirst({ where: { id: current.live_for_id } });
					if (!published) throw new Error('Tidak ada halaman yang sudah dipublish untuk menggantikan halaman ini');
					else await prisma.pageTranslation.delete({ where: where as any });
					return {};
				}

				return {};
			}
		}
	}
} satisfies ModelConfig<PageTranslation>; 
