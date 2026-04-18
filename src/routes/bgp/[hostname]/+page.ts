import type { PageLoad } from './$types.js';

export const load: PageLoad = ({ params, url }) => {
	return {
		hostname: params.hostname,
		neighbor: url.searchParams.get('neighbor')
	};
};
