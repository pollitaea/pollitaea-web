import { isValidPolRequest } from '$lib/common';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET = (async ({request}) => {
	console.debug(request.headers.get("id"));
	
	await isValidPolRequest(request)

	return json("Successful request")
}) satisfies RequestHandler;
