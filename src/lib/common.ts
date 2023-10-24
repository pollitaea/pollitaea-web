import { error } from '@sveltejs/kit';
import { HttpCodes } from './constants';
import { supabase } from './supabaseClient';

/**
 * Validates Pol requests
 * @param request Request recieved from client
 * @throws error if invalid
 */
export const isValidPolRequest = async (
	request: Request,
	address: string | string[] | undefined
) => {
	const requestId = request.headers.get('id');
	if (address === undefined) {
		throw error(HttpCodes.BADREQUEST, {
			code: HttpCodes.BADREQUEST,
			message: 'No address provided'
		});
	} else if (
		!isValidId(requestId) ||
		(await supabase.auth.admin.getUserById(requestId)).data === null
	) {
		throw error(HttpCodes.UNAUTHORIZED, {
			code: HttpCodes.UNAUTHORIZED,
			message: 'Invalid user'
		});
	}
};

/**
 * Validates if id provided is valid
 * @param id string recieved from client
 * @returns boolean
 */
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
