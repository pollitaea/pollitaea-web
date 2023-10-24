import { isValidPolRequest } from '$lib/common';
import querystring from 'node:querystring';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { REPRESENTATIVE_KEY } from '$env/static/private';
import { ExternalServices, type CivicInfoResponse } from '$lib/constants';

export const GET = (async ({ request }) => {
	// Chop from the `?` onwards i.e. http://localhost:5173/api/voter?address=xyz
	const requestQuery = querystring.parse(request.url.split('?')[1]).address;
	await isValidPolRequest(request, requestQuery);

	return await fetch(
		ExternalServices.RepSearch +
			'?' +
			querystring.stringify({ key: REPRESENTATIVE_KEY, address: requestQuery })
	)
		.then(async (response) => {
			const data: CivicInfoResponse = await response.json();
			console.debug('Formatting civic response');

			const civicRepsponse = {
				normalizedAddress: data.normalizedInput,
				divisions: Object.keys(data.divisions).map((division) => {
					return {
						division: data.divisions[`${division}`].name,
						office: data.divisions[`${division}`].officeIndices?.map((index) => {
							return {
								name: data.offices[index].name,
								roles: data.offices[index].roles,
								officials: data.offices[index].officialIndices.map(
									(officialIndex) => data.officials[officialIndex]
								)
							};
						})
					};
				})
			};

			console.debug('Formatted Civic Response');
			console.debug(civicRepsponse);
			return json(civicRepsponse);
		})
		.catch((err) => {
			console.log(err);
			throw error(err.status, { code: err.status, message: err.statusText });
		});
}) satisfies RequestHandler;
