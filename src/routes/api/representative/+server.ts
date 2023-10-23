import { isValidPolRequest } from '$lib/common';
import querystring from 'node:querystring';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { REPRESENTATIVE_KEY } from '$env/static/private';
import { ExternalServices } from '$lib/constants';

export const GET = (async ({ request }) => {
	const requestQuery = querystring.parse(request.url.split('?')[1]).address;
	await isValidPolRequest(request, requestQuery);
	console.log(
		'Request\n' +
			ExternalServices.RepSearch +
			'?' +
			querystring.stringify({ key: REPRESENTATIVE_KEY, address: requestQuery })
	);

	return await fetch(
		ExternalServices.RepSearch +
			'?' +
			querystring.stringify({ key: REPRESENTATIVE_KEY, address: requestQuery })
	)
		.then(async (response) => {
			const data = await response.json();
			console.log(data);
			return json(data);
		})
		.catch((err) => {
			console.log(err);
			throw error(err.status, { code: err.status, message: err.statusText });
		});
}) satisfies RequestHandler;
