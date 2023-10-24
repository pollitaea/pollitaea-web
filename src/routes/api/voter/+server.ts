import { isValidPolRequest } from '$lib/common';
import querystring from 'node:querystring';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { REPRESENTATIVE_KEY } from '$env/static/private';
import { ExternalServices, type VoterInfoResponse } from '$lib/constants';

export const GET = (async ({ request }) => {
	// Chop from the `?` onwards i.e. http://localhost:5173/api/voter?address=xyz
	const requestQuery = querystring.parse(request.url.split('?')[1]).address;
	await isValidPolRequest(request, requestQuery);

	return await fetch(
		ExternalServices.VoterInfo +
			'?' +
			querystring.stringify({ key: REPRESENTATIVE_KEY, address: requestQuery })
	)
		.then(async (response) => {
			const data: VoterInfoResponse = await response.json();
			console.debug('Formatting voter response');

			const voterInfoResponse = {
				normalizedAddress: data.normalizedInput,
				election: data.election,
				otherElections: data.otherElections,
				// Find polling locations with any official sources
				pollingLocations: data.pollingLocations.filter((pollLocation) =>
					pollLocation.sources.find((item) => item.official)
				),
				earlyVoteSites: data.earlyVoteSites.filter((pollLocation) =>
					pollLocation.sources.find((item) => item.official)
				),
				state: data.state
			};

			console.debug('Formatted Voter Info Response');
			console.debug(voterInfoResponse);
			return json(voterInfoResponse);
		})
		.catch((err) => {
			console.log(err);
			throw error(err.status, { code: err.status, message: err.statusText });
		});
}) satisfies RequestHandler;
