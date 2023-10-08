import { error, json, type RequestHandler } from '@sveltejs/kit';
import { SECRET } from '$env/static/private';
import { HttpCodes } from '$lib/constants';
import { supabase } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

/**
 * @alias Get api secret
 * @returns secret: encoded secret used to confirm requests
 */
export const GET = (() => {
	return json({
		secret: SECRET
	});
}) satisfies RequestHandler;

/**
 * @description Handle supabase user creation
 */
export const POST = (async ({ request }) => {
	const payload = await isValidAuthRequest(request);

	if (!payload) {
		throw error(HttpCodes.BADREQUEST, {
			code: HttpCodes.BADREQUEST,
			message: 'Invalid signup request'
		});
	}

	return supabase.auth.admin
		.createUser({
			email: payload.email,
			password: payload.password,
			phone: payload.phone,
			user_metadata: {
				username: payload.username,
				full_name: payload.fName + ' ' + payload.lName
			}
		})
		.then((res) => {
			if (res.error?.status) {
				throw error(res.error.status || HttpCodes.BADREQUEST, {
					code: res.error.status || HttpCodes.BADREQUEST,
					message: res.error.message
				});
			} else if (res.data?.user) {
				return json(
					{
						username: res.data.user.user_metadata.username,
						created_at: res.data.user.created_at,
						email_confirm: res.data.user.email_confirmed_at != null
					},
					{ status: 201, statusText: 'Account Created' }
				);
			} else {
				throw error(HttpCodes.INTERNALERROR, {
					code: HttpCodes.INTERNALERROR,
					message: 'Error during account creation'
				});
			}
		})
		.catch((err) => {
			console.log(err);

			throw error(HttpCodes.INTERNALERROR, {
				code: HttpCodes.INTERNALERROR,
				message: 'Error during account creation'
			});
		});
}) satisfies RequestHandler;

/**
 * @description Handle supabase user updates
 */
export const PUT = (async ({ request }) => {
	const payload = await isValidUpdateRequest(request);

	if (!payload) {
		throw error(HttpCodes.BADREQUEST, {
			code: HttpCodes.BADREQUEST,
			message: 'Invalid update request'
		});
	}

	const {
		data: { user },
		error: userErr
	} = await supabase.auth.admin.getUserById(payload.id);

	if (!user || userErr?.message) {
		throw error(HttpCodes.UNAUTHORIZED, {
			code: HttpCodes.UNAUTHORIZED,
			message: 'Invalid user'
		});
	}

	await handleUsernameUpdate(user, payload);
	await handleEmailUpdate(user, payload);

	return json('Profile Updated', { status: HttpCodes.GOOD_UPDATE });
}) satisfies RequestHandler;

/**
 * Validates sign up request
 * @param request
 * @returns result of auth validation
 */
const isValidAuthRequest = async (request: Request) => {
	const payload = await request.json();
	if (
		payload.secret !== SECRET ||
		payload.secret == null ||
		payload.email == null ||
		payload.username == null ||
		payload.password == null ||
		payload.phone == null ||
		payload.fName == null ||
		payload.lName == null
	) {
		return null;
	} else return payload;
};

/**
 * Validates account update request
 * @param request
 * @returns result of auth validation
 */
const isValidUpdateRequest = async (request: Request) => {
	const payload = await request.json();
	if (
		payload.secret !== SECRET ||
		payload.secret == null ||
		payload.email == null ||
		payload.username == null ||
		payload.id == null
	) {
		return null;
	} else return payload;
};

/**
 * Handle username update
 * @param request
 * @returns result of auth validation
 */
const handleUsernameUpdate = async (user: User, payload: { username: any; email: any }) => {
	console.log('Searching for usernames');

	const matchingUsers = await supabase
		.from('profiles')
		.select('*')
		.ilike('username', `'%${payload.username}%'`);
	console.log('matchingUsers');
	console.log(matchingUsers);

	if (matchingUsers.count) {
		console.log('Usernames found');
		throw error(HttpCodes.OH_NAH, {
			code: HttpCodes.OH_NAH,
			message: 'Username already in use'
		});
	} else {
		console.log('Updating profile based on textsearch');
		const updResults = await supabase
			.from('profiles')
			.update({ username: payload.username }, {})
			.eq('id', user.id);
		if (updResults.status <= 300) {
			supabase.auth.admin.updateUserById(user.id, {
				email: user.email,
				user_metadata: {
					username: payload.username
				}
			});
		} else {
			console.log("Status didn't match");
			console.debug(updResults);

			throw error(updResults.status, {
				code: updResults.status,
				message: 'Error during profile update'
			});
		}
	}
};

/**
 * Handle email update
 * @param user
 * @param payload
 */
const handleEmailUpdate = async (user: User, payload: { username: any; email: any }) => {
	if (user.email !== payload.email) {
		supabase.auth.admin
			.generateLink({
				type: 'email_change_current',
				email: user.email || '',
				newEmail: payload.email
			})
			.then(() =>
				supabase.auth.admin
					.updateUserById(user.id, {
						email: payload.email,
						email_confirm: false,
						user_metadata: {
							username: payload.username
						}
					})
					.then(async (res) => {
						if (res.error?.message) {
							await supabase.from('logs').insert({
								performed_by: 'SERVICE',
								performed_on: user.id,
								log_text: `Failed to update email, ${res.error.message}`,
								log_date: new Date().toISOString().toLocaleLowerCase()
							});
							throw error(res.error.status || HttpCodes.INTERNALERROR, {
								code: res.error.status || HttpCodes.INTERNALERROR,
								message: res.error.message
							});
						}
					})
					.catch((err) => {
						throw error(HttpCodes.INTERNALERROR, err.message);
					})
			)
			.catch((err) => {
				throw error(HttpCodes.INTERNALERROR, err.message);
			});
	} else {
		console.log('No email change needed');
	}
};
