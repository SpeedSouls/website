const config = {
	server: {
		type: 'meilisearch',
		host: 'http://localhost:7700',
		key: 'MASTER_KEY',
	},
	reindexOnStart: false,
	batchLimit: 100,
	collections: {
		pages: {
			// filter: {
			// 	status: 'published',
			// },
			fields: ['title', 'body', 'slug'],
			transform: (item, { flattenObject, striptags }) => {
				return {
					...flattenObject(item),
					body: striptags(item.body),
				};
			},
		},
	},
};

module.exports = config;
