import { defineInterface } from '@directus/extensions-sdk'
import InterfaceComponent from './interface.vue'

export default defineInterface({
	id: 'slug',
	name: 'Slug',
	icon: 'box',
	description: 'Slug',
	types: ['string'],
	component: InterfaceComponent,
	options: ({ collection }) => [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'template',
			type: 'string',
			name: '$t:template',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				required: true,
				options: {
					collectionName: collection,
					font: 'monospace',
					placeholder: '{{ title }}-{{ id }}',
				},
			},
		},
		{
			field: 'prefix',
			type: 'string',
			name: '$t:prefix',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				required: true,
				options: {
					collectionName: collection,
					font: 'monospace',
					placeholder: 'http://example.com/',
				},
			},
		},
	],
})
