import { error } from '@sveltejs/kit';
import { HttpCodes } from './constants';
import { supabase } from './supabaseClient';

/**
 * Validates Pol requests
 * @param request
 * @returns result of auth validation
 */
export const isValidPolRequest = async (request: Request) => {
	const requestId = request.headers.get('id');
	if (requestId === null || (await supabase.auth.admin.getUserById(requestId)).data === null) {
		throw error(HttpCodes.UNAUTHORIZED, {
			code: HttpCodes.UNAUTHORIZED,
			message: 'Invalid user'
		});
	}
};

export const isValidId = (id: string | null) => {
	//741c60de-f658-4978-b363-d7aa24101261
	return (
		id !== null &&
		id.length === 36 &&
		id.includes('-', 8) &&
		id.includes('-', 13) &&
		id.includes('-', 18) &&
		id.includes('-', 23)
	);
};
