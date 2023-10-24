export const HttpCodes = {
	GOOD_UPDATE: 202,
	BADREQUEST: 400,
	UNAUTHORIZED: 401,
	OH_NAH: 403,
	INTERNALERROR: 500
};

export const ExternalServices = {
	RepSearch: 'https://www.googleapis.com/civicinfo/v2/representatives',
	VoterInfo: 'https://www.googleapis.com/civicinfo/v2/voterinfo'
};

type Address = {
	line1: string;
	city: string;
	state: string;
	zip: string;
};

type Official = {
	name: string;
	address?: Address[];
	party?: string;
	phones?: string[];
	urls?: string[];
	photoUrl?: string;
	emails?: string[];
	channels?: {
		type: string;
		id: string;
	}[];
};

type Division = {
	name: string;
	officeIndices?: number[];
};

type Office = {
	name: string;
	divisionId: string;
	levels: string[];
	roles: string[];
	officialIndices: number[];
};

export type CivicInfoResponse = {
	normalizedInput: Address;
	kind: string;
	divisions: {
		[key: string]: Division;
	};
	offices: Office[];
	officials: Official[];
};

type Election = {
	id: string;
	name: string;
	electionDay: string;
	ocdDivisionId: string;
};

type PollingLocation = {
	address: {
		locationName: string;
		line1: string;
		city: string;
		state: string;
		zip: string;
	};
	pollingHours: string;
	startDate: string;
	endDate: string;
	sources: [
		{
			name: string;
			official: boolean;
		}
	];
};

type StateElectionInfo = {
	name: string;
	electionAdministrationBody: {
		name: string;
		electionInfoUrl: string;
		electionRegistrationUrl: string;
		electionRegistrationConfirmationUrl: string;
		absenteeVotingInfoUrl: string;
		ballotInfoUrl: string;
		physicalAddress: {
			locationName: string;
			line1: string;
			city: string;
			state: string;
			zip: string;
		};
	};
	sources: [
		{
			name: string;
			official: boolean;
		}
	];
};

export type VoterInfoResponse = {
	election: Election;
	normalizedInput: Address;
	pollingLocations: PollingLocation[];
	earlyVoteSites: PollingLocation[];
	state: StateElectionInfo[];
};
