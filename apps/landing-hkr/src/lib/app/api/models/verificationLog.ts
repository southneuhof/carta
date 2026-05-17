import type { ModelConfig } from '@southneuhof/landing-sveltekit-framework/types';
import type { VerificationLog } from '@prisma/client';

export default {
	allow: false, // Disallow all operations by default
	list: {
		allow: true,
    filterableBy: ['model', 'data_id'],
		fields: ['id', 'action', 'description', 'verifier_id', 'created_at', 'model', 'data_id'],
		fieldsForeign: {
			verifier: {
				fields: ['name', 'email']
			}
		},
		orderBy: {
			created_at: 'desc'
		}
	},
} as ModelConfig<VerificationLog>; 