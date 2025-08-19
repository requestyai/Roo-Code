const REQUESTY_BASE_URL = "https://router.requesty.ai/v1"

type URLType = "router" | "app" | "api"

const replaceCname = (baseUrl: string, type: URLType): string => {
	if (type === "router") {
		return baseUrl
	} else {
		return baseUrl.replace("router", type).replace("v1", "")
	}
}

export const toRequestyServiceUrl = (baseUrl?: string, service: URLType = "router"): string => {
	let url = replaceCname(baseUrl ?? REQUESTY_BASE_URL, service)

	try {
		return new URL(url).toString()
	} catch (error) {
		// If the provided baseUrl is invalid, fall back to the default
		console.warn(`Invalid base URL "${baseUrl}", falling back to default`)
		return new URL(replaceCname(REQUESTY_BASE_URL, service)).toString()
	}
}
