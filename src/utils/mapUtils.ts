// import L from 'leaflet'
// import { search } from 'nominatim-browser'

// // Fix Leaflet default icon path issues
// delete L.Icon.Default.prototype._getIconUrl
// L.Icon.Default.mergeOptions({
// 	iconRetinaUrl:
// 		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
// 	iconUrl:
// 		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
// 	shadowUrl:
// 		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
// })

// export async function searchLocation(query: string) {
// 	try {
// 		const results = await search({ q: query })
// 		if (results.length > 0) {
// 			return {
// 				lat: parseFloat(results[0].lat),
// 				lng: parseFloat(results[0].lon),
// 			}
// 		}
// 		return null
// 	} catch (error) {
// 		console.error('Error searching location:', error)
// 		return null
// 	}
// }

// export function calculateDistance(
// 	lat1: number,
// 	lon1: number,
// 	lat2: number,
// 	lon2: number
// ): number {
// 	const R = 6371 // Radio de la Tierra en kilómetros
// 	const dLat = toRad(lat2 - lat1)
// 	const dLon = toRad(lon2 - lon1)
// 	const a =
// 		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
// 		Math.cos(toRad(lat1)) *
// 			Math.cos(toRad(lat2)) *
// 			Math.sin(dLon / 2) *
// 			Math.sin(dLon / 2)
// 	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
// 	return R * c
// }

// function toRad(degrees: number): number {
// 	return degrees * (Math.PI / 180)
// }

import L from 'leaflet'
import { search } from 'nominatim-browser'

// Fix Leaflet default icon path issues
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
	iconUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
	shadowUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export async function searchLocation(query: string) {
	try {
		const results = await search({ q: query })
		if (results.length > 0) {
			return {
				lat: parseFloat(results[0].lat),
				lng: parseFloat(results[0].lon),
			}
		}
		return null
	} catch (error) {
		console.error('Error searching location:', error)
		return null
	}
}

export function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371 // Radio de la Tierra en kilómetros
	const dLat = toRad(lat2 - lat1)
	const dLon = toRad(lon2 - lon1)
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

function toRad(degrees: number): number {
	return degrees * (Math.PI / 180)
}
