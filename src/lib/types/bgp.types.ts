export interface BgpSummaryPeer {
	hostname: string;
	neighbor: string;
	remoteAs: number;
	state: string;
	prefixesReceived: number;
	lastChange: string;
	flapCount: number;
}

export interface BgpSessionEvent {
	timestamp: string;
	state: string;
	message: string;
	prefixesReceived: number;
}

export interface BgpNeighborDetail {
	hostname: string;
	neighbor: string;
	remoteAs: number;
	state: string;
	prefixesReceived: number;
	lastChange: string;
	flapCount: number;
	history: BgpSessionEvent[];
}
